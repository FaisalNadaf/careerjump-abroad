import { PROGRAMMES } from "./programmes";

export const INDUSTRIES = [
	"Information Technology",
	"Banking & Financial Services",
	"Consulting",
	"Healthcare",
	"Manufacturing",
	"Education",
	"Retail & E-commerce",
	"Marketing & Advertising",
	"Telecommunications",
	"Government & Public Sector",
	"Entrepreneurship",
	"Other",
] as const;

export const EXPERIENCE = [
	"0–2 years",
	"3–5 years",
	"6–10 years",
	"11–15 years",
	"16+ years",
] as const;

export const CAREER_GOALS = [
	"Move into Leadership",
	"Get Promoted",
	"Change Career Direction",
	"Strengthen Business & Strategic Skills",
	"Grow My Business",
	"Gain International Exposure",
] as const;

export const PROGRAMME_OPTIONS = [
	...PROGRAMMES.map((p) => p.formOption),
	"Other",
	"Not Sure Yet",
];

export const REGIONS = [
	"United States",
	"United Kingdom",
	"Europe",
	"Singapore",
	"Australia",
	"Canada",
	"Ireland",
	"Other",
	"Open to Any Country",
] as const;

export const LEARNING_FORMATS = [
	"Online",
	"Hybrid",
	"Short Campus Immersion or International Residency",
	"Open to Different Formats",
] as const;

export const BUDGETS = [
	"₹1–3 Lakh",
	"₹3–5 Lakh",
	"₹5–10 Lakh",
	"Above ₹10 Lakh",
	"Not Sure Yet",
] as const;

export const START_TIMELINES = [
	"Within 3 Months",
	"3–6 Months",
	"6–12 Months",
	"More Than 12 Months",
	"Just Exploring",
] as const;

export const FUNDING = [
	"Self-Funded",
	"Employer-Sponsored",
	"Partially Employer-Sponsored",
	"Would Explore Financing Options",
	"Undecided",
] as const;
