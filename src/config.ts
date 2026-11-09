/** Runtime configuration, sourced from Vite environment variables. */
export const WAITLIST_ENDPOINT = (import.meta.env.VITE_WAITLIST_ENDPOINT ?? "").trim();

/** Official website of Cubiccode Digital Media LLP (linked from cubiccode.org). */
export const CUBICCODE_URL = "https://cubiccode.in/";

/** Public contact address shown in the footer. */
export const CONTACT_EMAIL = "communication@careerjump.co.in";

/** Prefix a path inside /public with the configured base URL. */
export const asset = (path: string) =>
	`${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
