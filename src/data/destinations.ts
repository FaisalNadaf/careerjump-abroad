export interface Destination {
	id: string;
	name: string;
	/** City shown in the footage, used as an accurate caption. */
	city: string;
	/** Matching option in the waitlist form's "Preferred Country or Region" dropdown. */
	formOption: string;
}

export const DESTINATIONS: Destination[] = [
	{ id: "united-states", name: "United States", city: "New York", formOption: "United States" },
	{ id: "united-kingdom", name: "United Kingdom", city: "London", formOption: "United Kingdom" },
	{ id: "europe", name: "Europe", city: "Paris", formOption: "Europe" },
	{ id: "singapore", name: "Singapore", city: "Marina Bay", formOption: "Singapore" },
	{ id: "australia", name: "Australia", city: "Sydney", formOption: "Australia" },
	{ id: "canada", name: "Canada", city: "Vancouver", formOption: "Canada" },
	{ id: "ireland", name: "Ireland", city: "Dublin", formOption: "Ireland" },
];
