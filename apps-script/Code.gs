/** @OnlyCurrentDoc */
/**
 * CareerJump waitlist → Google Sheets.
 *
 * Paste this file into the Apps Script editor of the Google Sheet that should
 * hold the waitlist (Extensions → Apps Script), run `setup` once, then deploy
 * it as a web app. Full steps: docs/waitlist-backend.md.
 *
 * @OnlyCurrentDoc limits the script to the spreadsheet it is attached to.
 */

const CONFIG = {
  SHEET_NAME: "Waitlist",
  /** Submissions that look automated land here instead of being discarded. */
  FLAGGED_SHEET_NAME: "Waitlist (flagged)",
  /** A human can't finish the 3-step form faster than this. */
  MIN_ELAPSED_MS: 3000,
  MAX_FIELD_LENGTH: 500,
  MAX_BODY_BYTES: 20000,
  VERSION: "2026-11-08",
};

/** [payload key, column header]. Rows are written by header, so columns can be reordered or added. */
const COLUMNS = [
  ["received_at", "Received At"],
  ["name", "Full Name"],
  ["email", "Email"],
  ["phone", "Phone / WhatsApp"],
  ["phone_country", "Phone Country"],
  ["location", "Current Location"],
  ["designation", "Designation"],
  ["company", "Company"],
  ["industry", "Industry"],
  ["industry_other", "Industry (Other)"],
  ["years", "Experience"],
  ["goal", "Career Goal"],
  ["programme", "Programme"],
  ["programme_other", "Programme (Other)"],
  ["region", "Preferred Region"],
  ["region_other", "Region (Other)"],
  ["format", "Learning Format"],
  ["budget", "Budget"],
  ["timeline", "Start Timeline"],
  ["funding", "Funding"],
  ["consent", "Consent"],
  ["consent_text", "Consent Text"],
  ["submission_id", "Submission ID"],
  ["submitted_at", "Submitted At (Browser)"],
  ["page_url", "Page URL"],
  ["source", "Source"],
];

const FLAGGED_COLUMNS = COLUMNS.concat([
  ["flag_reason", "Flag Reason"],
  ["elapsed_ms", "Time to Complete (ms)"],
  ["hp", "Decoy Field"],
]);

const REQUIRED_FIELDS = ["name", "email", "phone", "location", "designation"];
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[A-Za-z]{2,}$/;
const SUBMISSION_ID_RE = /^[A-Za-z0-9-]{8,64}$/;

/* ------------------------------------------------------------------ */
/* Web app entry points                                                */
/* ------------------------------------------------------------------ */

/** Receives a registration from the website. Always answers with JSON. */
function doPost(e) {
  const body = (e && e.postData && e.postData.contents) || "";
  if (body.length > CONFIG.MAX_BODY_BYTES) {
    return json_({ result: "error", message: "Request is too large." });
  }

  let data;
  try {
    data = JSON.parse(body);
  } catch (err) {
    return json_({ result: "error", message: "Request body must be JSON." });
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return json_({ result: "error", message: "Request body must be a JSON object." });
  }

  const problem = validate_(data);
  if (problem) return json_({ result: "error", message: problem });

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    return json_({ result: "error", message: "The server is busy. Please try again." });
  }
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // The website resends the same submission_id when a visitor retries.
    if (alreadyStored_(ss, data.submission_id)) {
      return json_({ result: "success", duplicate: true });
    }

    const flag = flagReason_(data);
    const sheet = flag
      ? ensureSheet_(ss, CONFIG.FLAGGED_SHEET_NAME, FLAGGED_COLUMNS)
      : ensureSheet_(ss, CONFIG.SHEET_NAME, COLUMNS);
    const record = Object.assign({}, data, { received_at: new Date(), flag_reason: flag });

    appendRecord_(sheet, record, flag ? FLAGGED_COLUMNS : COLUMNS);
    return json_({ result: "success" });
  } catch (err) {
    // Details go to the Executions log only, never to the public response.
    console.error("doPost failed", err && err.stack ? err.stack : err);
    return json_({ result: "error", message: "The registration could not be saved." });
  } finally {
    lock.releaseLock();
  }
}

/** Health check: open the /exec URL in a browser to confirm this script is deployed. */
function doGet() {
  return json_({ ok: true, service: "careerjump-waitlist", version: CONFIG.VERSION });
}

/* ------------------------------------------------------------------ */
/* Run these from the editor                                           */
/* ------------------------------------------------------------------ */

/** Run once: creates the tabs and header rows, and triggers the permission prompt. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  [
    [CONFIG.SHEET_NAME, COLUMNS],
    [CONFIG.FLAGGED_SHEET_NAME, FLAGGED_COLUMNS],
  ].forEach(([name, columns]) => {
    const sheet = ensureSheet_(ss, name, columns);
    sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight("bold").setBackground("#e8eef7");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, sheet.getLastColumn());
  });
  console.log(`Ready. Registrations will be saved to "${CONFIG.SHEET_NAME}" in "${ss.getName()}".`);
}

/** Optional: writes one clearly marked test row. Delete it from the sheet afterwards. */
function testSubmission() {
  const response = doPost({
    postData: {
      contents: JSON.stringify({
        submission_id: Utilities.getUuid(),
        submitted_at: new Date().toISOString(),
        source: "apps-script-editor-test",
        page_url: "",
        name: "Test Submission",
        email: "test@example.com",
        phone: "+91 9876543210",
        phone_country_code: "+91",
        phone_country: "India",
        location: "Test City",
        designation: "Test Designation",
        consent: "Yes",
        consent_text: "Test row created from the Apps Script editor.",
        hp: "",
        elapsed_ms: 60000,
      }),
    },
  });
  console.log(response.getContent());
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Returns an error message for the visitor, or "" when the payload is acceptable. */
function validate_(data) {
  const missing = REQUIRED_FIELDS.filter(
    (key) => typeof data[key] !== "string" || !data[key].trim(),
  );
  if (missing.length) return `Missing required fields: ${missing.join(", ")}.`;
  if (!EMAIL_RE.test(data.email.trim())) return "Invalid email address.";
  if (data.consent !== "Yes") return "Consent is required.";
  if (typeof data.submission_id !== "string" || !SUBMISSION_ID_RE.test(data.submission_id)) {
    return "Invalid submission id.";
  }
  return "";
}

/** Why a submission looks automated, or "" when it looks human. */
function flagReason_(data) {
  if (String(data.hp || "").trim()) return "Hidden decoy field was filled in";
  const elapsed = Number(data.elapsed_ms);
  // 0 means "not measured", which is not treated as suspicious.
  if (elapsed > 0 && elapsed < CONFIG.MIN_ELAPSED_MS) return "Form completed in under 3 seconds";
  return "";
}

/** Gets (or creates) a tab and adds any missing headers to the end of row 1. */
function ensureSheet_(ss, name, columns) {
  const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  const headers = headerRow_(sheet);
  const missing = columns.map(([, header]) => header).filter((h) => !headers.includes(h));
  if (missing.length) {
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
  }
  return sheet;
}

function headerRow_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (!lastColumn) return [];
  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
}

/** Appends one row, placing each value under its header. Unknown columns stay blank. */
function appendRecord_(sheet, record, columns) {
  const keyByHeader = {};
  columns.forEach(([key, header]) => (keyByHeader[header] = key));
  const row = headerRow_(sheet).map((header) =>
    keyByHeader[header] ? toCell_(record[keyByHeader[header]]) : "",
  );
  sheet.appendRow(row);
}

/** True when a submission with this id is already in either tab. */
function alreadyStored_(ss, submissionId) {
  return [CONFIG.SHEET_NAME, CONFIG.FLAGGED_SHEET_NAME].some((name) => {
    const sheet = ss.getSheetByName(name);
    if (!sheet || sheet.getLastRow() < 2) return false;
    const column = headerRow_(sheet).indexOf("Submission ID") + 1;
    if (!column) return false;
    return Boolean(
      sheet
        .getRange(2, column, sheet.getLastRow() - 1, 1)
        .createTextFinder(submissionId)
        .matchEntireCell(true)
        .findNext(),
    );
  });
}

/**
 * Converts a value for storage. Text that starts with = + - @ (or a tab or
 * carriage return) gets a leading apostrophe so Sheets stores it as plain text
 * instead of running it as a formula (CWE-1236). Phone numbers such as
 * "+91 98765 43210" are stored as text for the same reason.
 */
function toCell_(value) {
  if (value instanceof Date || typeof value === "number") return value;
  const text = value == null ? "" : String(value).trim().slice(0, CONFIG.MAX_FIELD_LENGTH);
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}

function json_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
