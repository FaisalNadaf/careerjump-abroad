export interface Benefit {
	title: string;
	text: string;
	/** Self-explanatory label shown vertically on the collapsed panel. */
	label: string;
	image: { name: string; alt: string };
}

export const BENEFITS: Benefit[] = [
	{
		title: "Earn Global University Credentials & Alumni Status",
		text: "Learn with internationally recognised universities and, where eligible, join their global alumni community.",
		label: "Global Credentials & Alumni Status",
		image: {
			name: "graduates-with-diplomas",
			alt: "Two graduates in caps and gowns holding their diplomas",
		},
	},
	{
		title: "Develop Skills for Leadership & Promotions",
		text: "Sharpen the strategic thinking, decision-making and executive presence that senior roles demand.",
		label: "Leadership & Promotions",
		image: {
			name: "leader-presenting-to-team",
			alt: "Business leader presenting a strategy to her team",
		},
	},
	{
		title: "Network with Global Professionals & Leaders",
		text: "Exchange ideas with experienced peers, faculty and industry leaders from around the world.",
		label: "Global Professional Network",
		image: {
			name: "professionals-networking-event",
			alt: "Business professionals in conversation at a networking event",
		},
	},
	{
		title: "Prepare for International Career Opportunities",
		text: "Build the global perspective and cross-cultural confidence to work across markets.",
		label: "International Career Opportunities",
		image: {
			name: "business-traveller-airport",
			alt: "Business traveller with luggage checking the time at an airport",
		},
	},
	{
		title: "Learn AI, Data Analytics & Future-Ready Skills",
		text: "Apply AI and data to real business decisions, without stepping away from your role.",
		label: "AI, Data & Future-Ready Skills",
		image: {
			name: "executive-reviewing-data-screen",
			alt: "Executive reviewing data and analytics on a large screen",
		},
	},
];
