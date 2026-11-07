export interface Programme {
	id: string;
	/** Two-digit display number, e.g. "01". */
	number: string;
	/** Specialisation, e.g. "AI & Business Transformation". */
	subject: string;
	/** Card title as shown in the catalogue. */
	title: string;
	/** Matching option in the waitlist form's "Preferred Programme" dropdown. */
	formOption: string;
	category: string;
	image: { name: string; alt: string };
	featured?: boolean;
}

const RAW: Array<Omit<Programme, "number" | "title" | "formOption">> = [
	{
		id: "ai-business-transformation",
		subject: "AI & Business Transformation",
		category: "AI & Strategy",
		featured: true,
		image: {
			name: "team-reviewing-ai-dashboard",
			alt: "Team reviewing an AI-driven business dashboard on a large screen",
		},
	},
	{
		id: "generative-agentic-ai-leaders",
		subject: "Generative AI & Agentic AI for Leaders",
		category: "Generative AI",
		featured: true,
		image: {
			name: "professional-using-ai-tool",
			alt: "Professional working with an AI application on a laptop",
		},
	},
	{
		id: "data-analytics-ai",
		subject: "Data Analytics & AI",
		category: "Data & Analytics",
		image: {
			name: "analysts-discussing-charts",
			alt: "Analysts discussing data trends on a chart board",
		},
	},
	{
		id: "data-science-ai",
		subject: "Data Science & AI",
		category: "Data Science",
		image: {
			name: "code-on-laptop",
			alt: "Data science code on a laptop screen",
		},
	},
	{
		id: "business-analytics-ai",
		subject: "Business Analytics & AI",
		category: "Business Analytics",
		image: {
			name: "analysing-bar-charts",
			alt: "Colleagues analysing business performance bar charts",
		},
	},
	{
		id: "product-management-leadership-growth",
		subject: "Product Management, Leadership & Growth",
		category: "Product & Growth",
		image: {
			name: "product-roadmap-whiteboard",
			alt: "Product manager mapping a product roadmap on a whiteboard",
		},
	},
	{
		id: "strategic-leadership-general-management",
		subject: "Strategic Leadership & General Management",
		category: "Leadership",
		image: {
			name: "senior-executive-boardroom",
			alt: "Senior executive leading his team in a boardroom",
		},
	},
	{
		id: "digital-marketing-ai-growth",
		subject: "Digital Marketing, AI & Growth Strategy",
		category: "Marketing & Growth",
		image: {
			name: "social-media-marketing-plan",
			alt: "Social media marketing plan on a desk",
		},
	},
	{
		id: "finance-business-strategy-ai",
		subject: "Finance, Business Strategy & AI",
		category: "Finance & Strategy",
		image: {
			name: "financial-charts-analysis",
			alt: "Financial charts examined with a magnifying glass and calculator",
		},
	},
	{
		id: "strategic-hrm-ai",
		subject: "Strategic Human Resource Management & AI",
		category: "People & HR",
		image: {
			name: "hiring-interview",
			alt: "HR manager interviewing a candidate in a modern office",
		},
	},
];

export const PROGRAMMES: Programme[] = RAW.map((p, i) => ({
	...p,
	number: String(i + 1).padStart(2, "0"),
	title: `Executive Program in ${p.subject}`,
	formOption: `Executive Programme in ${p.subject}`,
}));
