import { WAITLIST_ENDPOINT } from "../config";

/**
 * Payload sent to the waitlist backend. Keys of fields that existed in the
 * original CareerJump form are kept unchanged (name, email, phone, location,
 * years, industry, goal, programme, programme_other, region, region_other,
 * format, budget, timeline, funding, consent) so existing sheet mappings keep
 * working. See docs/waitlist-backend.md for the full contract.
 */
export interface WaitlistPayload {
	submission_id: string;
	submitted_at: string;
	source: string;
	page_url: string;
	name: string;
	email: string;
	phone: string;
	phone_country_code: string;
	phone_country: string;
	location: string;
	designation: string;
	company: string;
	industry: string;
	industry_other: string;
	years: string;
	goal: string;
	programme: string;
	programme_other: string;
	region: string;
	region_other: string;
	format: string;
	budget: string;
	timeline: string;
	funding: string;
	consent: "Yes";
	consent_text: string;
	/** Hidden decoy field: non-empty means an automated submission. */
	hp: string;
	/** Time from first interaction to submit; very small values suggest a bot. */
	elapsed_ms: number;
}

export type WaitlistErrorKind =
	| "config"
	| "network"
	| "timeout"
	| "server"
	| "rejected"
	| "unconfirmed";

export class WaitlistSubmissionError extends Error {
	readonly kind: WaitlistErrorKind;
	readonly status?: number;

	constructor(kind: WaitlistErrorKind, message: string, status?: number) {
		super(message);
		this.name = "WaitlistSubmissionError";
		this.kind = kind;
		this.status = status;
	}
}

const TIMEOUT_MS = 20_000;
const SUCCESS_WORDS = new Set(["success", "ok", "created", "saved"]);
const ERROR_WORDS = new Set(["error", "fail", "failed", "failure", "invalid"]);

type Json = Record<string, unknown>;

/** Interpret a JSON acknowledgement. Returns true/false, or null when it is silent. */
function readAck(body: Json): boolean | null {
	if (body.ok === false || body.success === false || body.error) return false;
	for (const key of ["result", "status"] as const) {
		const v = body[key];
		if (typeof v === "string") {
			const word = v.toLowerCase();
			if (ERROR_WORDS.has(word)) return false;
			if (SUCCESS_WORDS.has(word)) return true;
		}
	}
	if (body.ok === true || body.success === true) return true;
	return null;
}

/**
 * Submit a waitlist registration.
 *
 * Resolves only when the backend's response can be read and does not report a
 * failure. Uses Content-Type text/plain so the request is a CORS "simple
 * request" (no preflight), which Google Apps Script web apps accept.
 */
export async function submitWaitlist(
	payload: WaitlistPayload,
	endpoint: string = WAITLIST_ENDPOINT,
): Promise<void> {
	if (!endpoint) {
		throw new WaitlistSubmissionError(
			"config",
			"Waitlist endpoint is not configured (VITE_WAITLIST_ENDPOINT).",
		);
	}

	const controller = new AbortController();
	const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

	let response: Response;
	try {
		response = await fetch(endpoint, {
			method: "POST",
			headers: { "Content-Type": "text/plain;charset=utf-8" },
			body: JSON.stringify(payload),
			redirect: "follow",
			credentials: "omit",
			cache: "no-store",
			signal: controller.signal,
		});
	} catch (err) {
		if (controller.signal.aborted) {
			throw new WaitlistSubmissionError("timeout", "The request timed out.");
		}
		// Offline, DNS failure, or a response the browser may not read (CORS).
		throw new WaitlistSubmissionError(
			"network",
			err instanceof Error ? err.message : "Network request failed.",
		);
	} finally {
		window.clearTimeout(timer);
	}

	if (!response.ok) {
		throw new WaitlistSubmissionError(
			"server",
			`Server responded with ${response.status}.`,
			response.status,
		);
	}

	const text = (await response.text().catch(() => "")).trim();
	const contentType = response.headers.get("content-type") ?? "";

	// 1. Structured JSON acknowledgement (preferred contract).
	if (contentType.includes("json") || /^[{[]/.test(text)) {
		let body: unknown;
		try {
			body = JSON.parse(text);
		} catch {
			throw new WaitlistSubmissionError("unconfirmed", "Unreadable JSON response.");
		}
		if (body && typeof body === "object" && !Array.isArray(body)) {
			const ack = readAck(body as Json);
			if (ack === false) {
				const msg = (body as Json).message ?? (body as Json).error;
				throw new WaitlistSubmissionError(
					"rejected",
					typeof msg === "string" ? msg : "The submission was rejected.",
				);
			}
		}
		return; // JSON without an error flag = deliberate acknowledgement.
	}

	// 2. Apps Script returning nothing: the script ran to completion.
	if (/script completed but did not return anything/i.test(text)) return;

	// 3. Plain-text acknowledgement such as "OK" or "Success".
	if (SUCCESS_WORDS.has(text.toLowerCase().replace(/[.!]$/, ""))) return;

	// Anything else (e.g. an Apps Script HTML error page served with 200) is not
	// proof that the registration was stored.
	throw new WaitlistSubmissionError(
		"unconfirmed",
		"The server response did not confirm the registration.",
	);
}

/** User-facing copy for each failure type. Entered answers are always kept. */
export function describeSubmitError(err: unknown): string {
	const kind = err instanceof WaitlistSubmissionError ? err.kind : "network";
	switch (kind) {
		case "config":
			return "Registrations can’t be accepted right now because the waitlist service isn’t configured. Please try again later.";
		case "timeout":
			return "The server took too long to respond. Your answers are saved, so please try again.";
		case "server":
		case "unconfirmed":
			return "We couldn’t confirm your registration. Your answers are saved, so please try again in a moment.";
		case "rejected":
			return "Your registration couldn’t be accepted. Please check your details and try again.";
		default:
			return "We couldn’t reach the server. Please check your connection and try again. Your answers are saved.";
	}
}

/** RFC 4122 v4 id; falls back when crypto.randomUUID is unavailable (non-secure origins). */
export function createSubmissionId(): string {
	// randomUUID only exists in secure contexts (https / localhost).
	if (typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	bytes[6] = (bytes[6] & 0x0f) | 0x40;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;
	const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
