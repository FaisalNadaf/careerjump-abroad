# Waitlist backend contract

The waitlist form (`src/components/waitlist/`) submits through
`src/services/waitlist.ts` to a Google Apps Script web app that saves each
registration as a row in a Google Sheet. The script lives in
[`apps-script/Code.gs`](../apps-script/Code.gs); setup steps are
[below](#google-sheet-setup).

| Variable                 | Required | Purpose                                                |
| ------------------------ | -------- | ------------------------------------------------------ |
| `VITE_WAITLIST_ENDPOINT` | yes      | Web app `/exec` URL that receives registrations (HTTP `POST`). |
| `VITE_SITE_URL`          | no       | Production origin; enables canonical, absolute OG URLs and sitemap.xml. |

`.env.example` still holds the web app URL from the original CareerJump page.
That script is live but is **not** `apps-script/Code.gs`, and it isn't known
which fields it stores. Replace the URL with your own deployment.
`npm run check:waitlist` tells you which script the URL points at.

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

`apps-script/Code.gs` stores every key above except `phone_country_code` (already
part of `phone`), `hp` and `elapsed_ms`; the last two are stored only on the
flagged tab. The original form's `status` field no longer exists.

The browser also rejects free-text answers that start with `=`, `+`, `-` or `@`
(spreadsheet formula injection), but that check can be bypassed, so the script
neutralises these values itself (`toCell_()`). `phone` legitimately starts with
`+` (for example `+91 9876543210`), so it is stored as text the same way.

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

## Google Sheet setup

The backend is [`apps-script/Code.gs`](../apps-script/Code.gs). It runs as you,
attached to one Google Sheet, and can only open that spreadsheet
(`@OnlyCurrentDoc`). Setup takes about five minutes.

### 1. Create the Sheet and add the script

1. Create a new Google Sheet ([sheets.new](https://sheets.new)) with the Google
   account that should own the waitlist, and name it, for example,
   *CareerJump Waitlist*.
2. Open **Extensions → Apps Script**. Name the project (for example
   *CareerJump Waitlist API*).
3. Replace everything in the editor's `Code.gs` with the contents of
   `apps-script/Code.gs`, then save (Ctrl+S).
4. Optional: in **Project Settings**, tick *Show "appsscript.json" manifest file
   in editor*, and replace that file with `apps-script/appsscript.json`. It sets
   the time zone to Asia/Kolkata and pins the single permission the script needs.

### 2. Run `setup` once

1. Choose `setup` in the function menu next to **Run**, and click **Run**.
2. Google asks for permission: **Review permissions →** choose your account. If
   you see *"Google hasn't verified this app"*, click **Advanced → Go to
   CareerJump Waitlist API (unsafe)**. This is your own script. Then **Allow**.
   The only access requested is to the spreadsheet the script is attached to.
3. Two tabs now exist with header rows: **Waitlist** and **Waitlist (flagged)**.
4. Optional: run `testSubmission` to add one test row to **Waitlist**, then
   delete that row.

### 3. Deploy as a web app

1. **Deploy → New deployment →** gear icon **→ Web app**.
2. Set **Execute as: Me** and **Who has access: Anyone**. "Anyone" lets the
   website post without visitors signing in to Google; the script still runs
   only as you, against this one Sheet.
3. Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).

### 4. Connect the website

1. Put the URL in `.env`:

   ```
   VITE_WAITLIST_ENDPOINT=https://script.google.com/macros/s/<deployment id>/exec
   ```

2. Run `npm run check:waitlist`. It should print
   `✓ Connected to the CareerJump waitlist script`.
3. Restart `npm run dev`, submit the form, and check the new row in the Sheet.
4. For production, set the same variable in your hosting platform and rebuild.
   The Content-Security-Policy's `connect-src` is generated from it at build time.

### Changing the script later

Edit the code, then **Deploy → Manage deployments →** pencil icon **→ Version:
New version → Deploy**. The `/exec` URL stays the same. Choosing **New
deployment** instead creates a new URL, which you would then have to put in
`.env` and your host.

### What gets saved

| Tab | Contents |
| --- | --- |
| **Waitlist** | One row per registration: *Received At* (Google's server time), every form answer, *Submission ID*, the browser timestamp, page URL and source. |
| **Waitlist (flagged)** | Submissions that look automated (decoy field filled in, or the form finished in under 3 seconds), with the reason. They are kept, not dropped, so a real person is never lost. Check this tab now and then. |

- Rows are matched to columns **by header name**, so you can reorder columns or
  add your own (for example *Called?* or *Notes*) without breaking anything. Don't
  rename the script's headers: a renamed header is treated as missing and added
  again at the end.
- Retries are stored once: the site resends the same `submission_id`, and the
  script skips ids that are already in either tab.
- Text is capped at 500 characters per field, and values that start like a
  formula are stored as plain text.
- The script rejects requests that have no name, email, phone, location or
  designation, have an invalid email, lack consent, or exceed 20 KB.
- Failures are logged under **Executions** in the Apps Script editor. Visitors
  only see a generic error, and their answers stay in the form so they can retry.

### Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `check:waitlist` says *"has no doGet"* | The URL points at a different script (such as the original page's), or the deployment still serves an old version. Use the URL from step 3, or publish a **New version**. |
| `check:waitlist` mentions a sign-in | **Who has access** isn't *Anyone*. Edit the deployment. |
| The form says it couldn't confirm the registration | Open **Executions** in the Apps Script editor and read the failed run's log. |
| Code changes have no effect | A new version wasn't deployed. See *Changing the script later*. |
| A registration is missing from **Waitlist** | Look in **Waitlist (flagged)**. |

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
**Script properties**, never in a `VITE_*` variable). `UrlFetchApp` also needs
`https://www.googleapis.com/auth/script.external_request` added to `oauthScopes`
in `appsscript.json`.
