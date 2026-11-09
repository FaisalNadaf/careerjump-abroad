export interface Destination {
	id: string;
	name: string;
	/** Matching option in the waitlist form's "Preferred Country or Region" dropdown. */
	formOption: string;
}

export const DESTINATIONS: Destination[] = [
	{ id: "united-states", name: "United States of America", formOption: "United States" },
	{ id: "united-kingdom", name: "United Kingdom", formOption: "United Kingdom" },
	{ id: "europe", name: "Europe", formOption: "Europe" },
	{ id: "singapore", name: "Singapore", formOption: "Singapore" },
	{ id: "australia", name: "Australia", formOption: "Australia" },
	{ id: "canada", name: "Canada", formOption: "Canada" },
	{ id: "ireland", name: "Ireland", formOption: "Ireland" },
];
