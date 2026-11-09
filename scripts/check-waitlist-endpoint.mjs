/**
 * Confirms VITE_WAITLIST_ENDPOINT points at the CareerJump Apps Script
 * (apps-script/Code.gs) by calling its doGet health check. Writes nothing.
 *
 *   npm run check:waitlist
 */
import { loadEnv } from "vite";

/** Returns null on success, or the reason the check failed. */
async function check() {
	const mode = process.argv[2] ?? "development";
	const endpoint = (loadEnv(mode, process.cwd(), "VITE_").VITE_WAITLIST_ENDPOINT ?? "").trim();

	if (!endpoint) return "VITE_WAITLIST_ENDPOINT is empty. Add the web app URL to .env.";
	if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint)) {
		console.warn("! The URL doesn't look like an Apps Script web app (…/macros/s/<id>/exec).");
	}

	let response;
	try {
		response = await fetch(endpoint, { redirect: "follow", signal: AbortSignal.timeout(20_000) });
	} catch (err) {
		return `Could not reach the endpoint: ${err.message}`;
	}

	const text = await response.text();
	let body = null;
	try {
		body = JSON.parse(text);
	} catch {
		/* not JSON: handled below */
	}

	if (body?.service === "careerjump-waitlist") {
		console.log(`✓ Connected to the CareerJump waitlist script (version ${body.version}).`);
		return null;
	}
	if (/Script function not found: doGet/i.test(text)) {
		return (
			"The URL is a live Apps Script, but not apps-script/Code.gs (it has no doGet). " +
			"Deploy Code.gs and put its /exec URL in .env, or publish a new version of this deployment."
		);
	}
	if (/accounts\.google\.com|ServiceLogin/i.test(response.url + text.slice(0, 2000))) {
		return 'Google asked for a sign-in. Set the deployment\'s "Who has access" to "Anyone".';
	}
	return `Unexpected response (HTTP ${response.status}). Check the URL and the deployment.`;
}

const problem = await check();
if (problem) {
	console.error(`✗ ${problem}`);
	// exitCode instead of process.exit(): exiting with fetch sockets open crashes Node on Windows.
	process.exitCode = 1;
}
