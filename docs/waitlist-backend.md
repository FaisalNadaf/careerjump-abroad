# Waitlist backend contract

The waitlist form (`src/components/waitlist/`) submits through
`src/services/waitlist.ts`. No backend lives in this repository; the endpoint is
configured with an environment variable.

| Variable                 | Required | Purpose                                                |
| ------------------------ | -------- | ------------------------------------------------------ |
| `VITE_WAITLIST_ENDPOINT` | yes      | URL that receives registrations (HTTP `POST`).         |
| `VITE_SITE_URL`          | no       | Production origin; enables canonical + absolute OG URLs. |

`.env` is pre-filled with the Google Apps Script web app that the original
CareerJump page already used:

```
https://script.google.com/macros/s/AKfycbyi2omsmehJy3nhKKffTYy0dWYXJo1uzz991517KFiG318ZV_84J6YHUaiiDTr_4cazrA/exec
```

If the variable is empty, the form still opens but shows a clear "service isn't
configured" error on submit. It never pretends to succeed.

## Request

- Method: `POST`
- Header: `Content-Type: text/plain;charset=utf-8`. This makes it a CORS "simple
  request" with no preflight, which Apps Script cannot answer.
- Body: a JSON string.

```jsonc
{
  "submission_id": "8f0c…",            // UUID, unique per registration attempt; reused on retries
  "submitted_at": "2026-11-07T06:30:00.000Z",
  "source": "careerjump-international-executive-education",
  "page_url": "https://…",

  // Step 1 — Professional Information
  "name": "Priya Sharma",               // required
  "email": "priya@company.com",         // required, validated
  "phone": "+91 9876543210",            // required, normalised "<dial> <national number>"
  "phone_country_code": "+91",
  "phone_country": "India",
  "location": "Bengaluru, India",       // required
  "designation": "Senior Manager",      // required
  "company": "Acme Corp",
  "industry": "Consulting",
  "industry_other": "",                 // only when industry = "Other"
  "years": "6–10 years",

  // Step 2 — Career & Programme Preferences
  "goal": "Move into Leadership",
  "programme": "Executive Programme in Data Science & AI",
  "programme_other": "",
  "region": "United Kingdom",
  "region_other": "",
  "format": "Hybrid",

  // Step 3 — Programme Planning & Consent
  "budget": "₹3–5 Lakh",
  "timeline": "3–6 Months",
  "funding": "Employer-Sponsored",
  "consent": "Yes",                     // always "Yes": submission is blocked without consent
  "consent_text": "I consent to receive CareerJump Waitlist updates regarding Programme Information.",

  // Anti-abuse signals (the browser never blocks on these; the backend decides)
  "hp": "",                             // hidden decoy field: humans leave it empty
  "elapsed_ms": 48210                   // first interaction to submit; bots are near 0
}
```

Keys shared with the original form keep their old names (`name`, `email`, `phone`,
`location`, `years`, `industry`, `goal`, `programme`, `programme_other`, `region`,
`region_other`, `format`, `budget`, `timeline`, `funding`, `consent`), so an existing
sheet mapping keeps working.

**New keys the current script may not store yet:** `designation`, `company`,
`industry_other`, `phone_country_code`, `phone_country`, `submission_id`,
`submitted_at`, `source`, `page_url`, `consent_text`, `hp`, `elapsed_ms`. The
original form's `status` field no longer exists.

The browser also rejects free-text answers that start with `=`, `+`, `-` or `@`
(spreadsheet formula injection), but that check can be bypassed, so the backend
must neutralise these values itself (see `sanitize()` below). Note that `phone`
legitimately starts with `+` (for example `+91 9876543210`), so it must be
stored as text, which `sanitize()` does.

## Response: when the form shows success

The form shows its success screen only when it can read the response and the
response confirms the save:

| Response                                                          | Result           |
| ----------------------------------------------------------------- | ---------------- |
| 2xx JSON such as `{"result":"success"}`, `{"status":"ok"}`, `{"ok":true}` | ✅ success |
| 2xx JSON with no error flag                                       | ✅ success        |
| 2xx JSON with `result/status: "error"`, `ok:false`, or `error`    | ❌ error shown    |
| Apps Script "The script completed but did not return anything."   | ✅ success        |
| 2xx plain text `OK` / `Success`                                   | ✅ success        |
| 2xx HTML (for example an Apps Script error page)                  | ❌ error shown    |
| Non-2xx status, network/CORS failure, or no reply within 20 s     | ❌ error shown    |

On any error, every answer stays in the form, the visitor can retry, and the
same `submission_id` is sent again so the backend can drop duplicates.

> The original page posted with `mode: "no-cors"`. That made the response
> unreadable, so it showed "You're on the list" even when saving failed. The new
> form no longer does that.

## Reference Google Apps Script

If the current script doesn't return JSON, or doesn't store the new fields,
replace its `doPost` with the version below. Then choose **Deploy → Manage
deployments → Edit → New version**, keeping access set to "Anyone", so the
`/exec` URL stays the same.

```js
const SHEET_NAME = "Waitlist";
const COLUMNS = [
  "submitted_at", "submission_id", "name", "email", "phone", "phone_country_code",
  "phone_country", "location", "designation", "company", "industry", "industry_other",
  "years", "goal", "programme", "programme_other", "region", "region_other", "format",
  "budget", "timeline", "funding", "consent", "consent_text", "source", "page_url",
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents);
    if (!data.name || !data.email || data.consent !== "Yes") {
      return json({ result: "error", message: "Missing required fields" });
    }

    // Bot signals: decoy filled in, or submitted implausibly fast. Answer
    // "success" so bots learn nothing, but don't store the row.
    if (data.hp || (typeof data.elapsed_ms === "number" && data.elapsed_ms < 3000)) {
      return json({ result: "success" });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) sheet.appendRow(COLUMNS);

    // Idempotency: ignore retries of a submission that was already stored.
    const idCol = COLUMNS.indexOf("submission_id") + 1;
    if (sheet.getLastRow() > 1) {
      const ids = sheet.getRange(2, idCol, sheet.getLastRow() - 1, 1).getValues().flat();
      if (ids.includes(data.submission_id)) return json({ result: "success", duplicate: true });
    }

    sheet.appendRow(COLUMNS.map((key) => sanitize(data[key])));
    return json({ result: "success" });
  } catch (err) {
    return json({ result: "error", message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Stop spreadsheet formula injection (CWE-1236): text starting with = + - @
// (or a tab / carriage return) is stored as plain text.
function sanitize(value) {
  const s = value == null ? "" : String(value).slice(0, 500);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function json(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
```

## Using a different backend

Any HTTPS endpoint works if it:

1. accepts `POST` with a `text/plain` body containing the JSON above,
2. sends `Access-Control-Allow-Origin` for the site's origin, or `*`, on every
   response, including redirects, and
3. returns a 2xx JSON acknowledgement such as `{"result":"success"}`.

## Stronger bot protection (recommended before launch)

The decoy field and timing signal stop simple bots. For determined abuse, add a
CAPTCHA such as Cloudflare Turnstile or Google reCAPTCHA: render the widget in
the form, send its token in the payload, and verify it in `doPost` with
`UrlFetchApp` against the provider's verification endpoint before storing the
row. This needs a site key (public) and a secret key (keep it in Apps Script
**Script properties**, never in a `VITE_*` variable).
