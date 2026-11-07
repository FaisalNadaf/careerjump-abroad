import { DEFAULT_COUNTRY_ISO, findCountry } from "../../data/countryCodes";
import {
	BUDGETS,
	CAREER_GOALS,
	EXPERIENCE,
	FUNDING,
	INDUSTRIES,
	LEARNING_FORMATS,
	PROGRAMME_OPTIONS,
	REGIONS,
	START_TIMELINES,
} from "../../data/waitlistOptions";
import { createSubmissionId, type WaitlistPayload } from "../../services/waitlist";

export interface WaitlistValues {
	fullName: string;
	email: string;
	phoneCountry: string;
	phoneNumber: string;
	location: string;
	designation: string;
	company: string;
	industry: string;
	industryOther: string;
	experience: string;
	careerGoal: string;
	programme: string;
	programmeOther: string;
	region: string;
	regionOther: string;
	learningFormat: string;
	budget: string;
	startTimeline: string;
	funding: string;
	consent: boolean;
}

/** Validation unit. "phone" covers phoneCountry + phoneNumber. */
export type FieldName =
	| Exclude<keyof WaitlistValues, "phoneCountry" | "phoneNumber">
	| "phone";

export type FieldErrors = Partial<Record<FieldName, string>>;

export const INITIAL_VALUES: WaitlistValues = {
	fullName: "",
	email: "",
	phoneCountry: DEFAULT_COUNTRY_ISO,
	phoneNumber: "",
	location: "",
	designation: "",
	company: "",
	industry: "",
	industryOther: "",
	experience: "",
	careerGoal: "",
	programme: "",
	programmeOther: "",
	region: "",
	regionOther: "",
	learningFormat: "",
	budget: "",
	startTimeline: "",
	funding: "",
	consent: false,
};

export const CONSENT_LABEL =
	"I consent to receive CareerJump Waitlist updates regarding Programme Information.";

/* ------------------------------------------------------------------ */
/* Field configuration                                                 */
/* ------------------------------------------------------------------ */

interface BaseField {
	name: FieldName;
	label: string;
	required?: boolean;
	/** Occupy the full row on wide layouts. */
	full?: boolean;
}

export interface TextFieldConfig extends BaseField {
	kind: "text" | "email";
	name: Exclude<FieldName, "phone" | "consent">;
	placeholder: string;
	autoComplete: string;
	maxLength: number;
}

export interface SelectFieldConfig extends BaseField {
	kind: "select";
	name: Exclude<FieldName, "phone" | "consent">;
	options: readonly string[];
	/** Optional free-text field revealed when "Other" is chosen. */
	otherField?: "industryOther" | "programmeOther" | "regionOther";
	otherLabel?: string;
}

export interface PhoneFieldConfig extends BaseField {
	kind: "phone";
	name: "phone";
}

export interface CheckboxFieldConfig extends BaseField {
	kind: "checkbox";
	name: "consent";
}

export type FieldConfig =
	| TextFieldConfig
	| SelectFieldConfig
	| PhoneFieldConfig
	| CheckboxFieldConfig;

export interface StepConfig {
	id: string;
	title: string;
	description: string;
	fields: FieldConfig[];
}

/*
 * Required fields follow the brief: Full Name, Email, Phone, Location,
 * Designation and Consent. Set `required: true` on any other field to make it
 * mandatory; validation and indicators update automatically.
 */
export const STEPS: StepConfig[] = [
	{
		id: "professional",
		title: "Professional Information",
		description: "Tell us about yourself and your current role.",
		fields: [
			{
				kind: "text",
				name: "fullName",
				label: "Full Name",
				placeholder: "e.g. Priya Sharma",
				autoComplete: "name",
				maxLength: 100,
				required: true,
			},
			{
				kind: "email",
				name: "email",
				label: "Email Address",
				placeholder: "name@company.com",
				autoComplete: "email",
				maxLength: 254,
				required: true,
			},
			{
				kind: "phone",
				name: "phone",
				label: "Phone Number / WhatsApp Number",
				required: true,
				full: true,
			},
			{
				kind: "text",
				name: "location",
				label: "Current Location",
				placeholder: "City, Country",
				autoComplete: "address-level2",
				maxLength: 120,
				required: true,
			},
			{
				kind: "text",
				name: "designation",
				label: "Current Designation",
				placeholder: "e.g. Senior Manager",
				autoComplete: "organization-title",
				maxLength: 120,
				required: true,
			},
			{
				kind: "text",
				name: "company",
				label: "Current Employer / Company Name",
				placeholder: "Company name",
				autoComplete: "organization",
				maxLength: 120,
			},
			{
				kind: "select",
				name: "industry",
				label: "Industry or Functional Area",
				options: INDUSTRIES,
				otherField: "industryOther",
				otherLabel: "Your industry or functional area",
			},
			{
				kind: "select",
				name: "experience",
				label: "Years of Professional Experience",
				options: EXPERIENCE,
			},
		],
	},
	{
		id: "preferences",
		title: "Career & Programme Preferences",
		description: "Help us understand what you want to achieve next.",
		fields: [
			{
				kind: "select",
				name: "careerGoal",
				label: "Primary Career Goal",
				options: CAREER_GOALS,
				full: true,
			},
			{
				kind: "select",
				name: "programme",
				label: "Preferred Programme or Subject",
				options: PROGRAMME_OPTIONS,
				otherField: "programmeOther",
				otherLabel: "Programme or subject you’re interested in",
				full: true,
			},
			{
				kind: "select",
				name: "region",
				label: "Preferred Country or Region",
				options: REGIONS,
				otherField: "regionOther",
				otherLabel: "Preferred country or region",
			},
			{
				kind: "select",
				name: "learningFormat",
				label: "Preferred Learning Format",
				options: LEARNING_FORMATS,
			},
		],
	},
	{
		id: "planning",
		title: "Programme Planning & Consent",
		description: "A few planning details so we can share the most relevant options.",
		fields: [
			{
				kind: "select",
				name: "budget",
				label: "Indicative Programme Budget",
				options: BUDGETS,
			},
			{
				kind: "select",
				name: "startTimeline",
				label: "Expected Start Timeline",
				options: START_TIMELINES,
			},
			{
				kind: "select",
				name: "funding",
				label: "Funding Preference",
				options: FUNDING,
				full: true,
			},
			{
				kind: "checkbox",
				name: "consent",
				label: CONSENT_LABEL,
				required: true,
				full: true,
			},
		],
	},
];

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[A-Za-z]{2,}$/;
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u;

/*
 * Values that start like a spreadsheet formula (CWE-1236). The waitlist is
 * stored in Google Sheets, where such text can execute as a formula. This is
 * defence in depth only: the backend must neutralise these values too.
 */
const FORMULA_START = /^[=+\-@\t\r]/;
const FORMULA_MESSAGE = "Please don’t start this answer with =, +, - or @.";
const startsLikeFormula = (value: string) => FORMULA_START.test(value.trim());

/** Normalise a national number: strip formatting, a pasted country code and trunk 0. */
export function normalisePhone(iso: string, raw: string): string {
	const { dial } = findCountry(iso);
	const dialDigits = dial.replace(/\D/g, "");
	let digits = raw.replace(/\D/g, "");
	const trimmed = raw.trim();

	if (trimmed.startsWith("+") && digits.startsWith(dialDigits)) {
		digits = digits.slice(dialDigits.length);
	} else if (digits.startsWith(`00${dialDigits}`)) {
		digits = digits.slice(dialDigits.length + 2);
	} else if (iso === "IN" && digits.length === 12 && digits.startsWith("91")) {
		digits = digits.slice(2);
	}
	if (iso !== "IT" && digits.startsWith("0")) digits = digits.replace(/^0+/, "");
	return digits;
}

function validatePhone(values: WaitlistValues): string | undefined {
	if (!values.phoneNumber.trim()) return "Please enter your phone or WhatsApp number.";
	if (/[^\d\s()+.-]/.test(values.phoneNumber)) {
		return "Use digits only. Spaces and dashes are fine.";
	}
	const iso = values.phoneCountry;
	const digits = normalisePhone(iso, values.phoneNumber);
	const dialDigits = findCountry(iso).dial.replace(/\D/g, "");

	if (iso === "IN") {
		return /^[6-9]\d{9}$/.test(digits)
			? undefined
			: "Enter a valid 10-digit Indian mobile number.";
	}
	if (dialDigits === "1") {
		return /^[2-9]\d{9}$/.test(digits) ? undefined : "Enter a valid 10-digit phone number.";
	}
	if (digits.length < 6 || digits.length + dialDigits.length > 15) {
		return "Enter a valid phone number for the selected country code.";
	}
	return undefined;
}

function findField(name: FieldName): FieldConfig | undefined {
	for (const step of STEPS) {
		const f = step.fields.find((x) => x.name === name);
		if (f) return f;
	}
	return undefined;
}

export function validateField(name: FieldName, values: WaitlistValues): string | undefined {
	const config = findField(name);
	const required = config?.required ?? false;

	switch (name) {
		case "fullName": {
			const v = values.fullName.trim();
			if (!v) return "Please enter your full name.";
			if (v.length < 2) return "Name must be at least 2 characters.";
			if (!NAME_RE.test(v)) return "Please use letters only (spaces, dots, hyphens and apostrophes are fine).";
			return undefined;
		}
		case "email": {
			const v = values.email.trim();
			if (!v) return "Please enter your email address.";
			if (!EMAIL_RE.test(v) || startsLikeFormula(v)) {
				return "Enter a valid email address, e.g. name@company.com.";
			}
			return undefined;
		}
		case "phone":
			return validatePhone(values);
		case "location":
			if (values.location.trim().length < 2) return "Please enter your current city or location.";
			return startsLikeFormula(values.location) ? FORMULA_MESSAGE : undefined;
		case "designation":
			if (values.designation.trim().length < 2) return "Please enter your current designation.";
			return startsLikeFormula(values.designation) ? FORMULA_MESSAGE : undefined;
		case "consent":
			return values.consent
				? undefined
				: "Please tick this box to receive waitlist updates. It’s required to join.";
		case "industryOther":
		case "programmeOther":
		case "regionOther":
			return startsLikeFormula(values[name]) ? FORMULA_MESSAGE : undefined;
		default: {
			const v = values[name];
			if (required && typeof v === "string" && !v.trim()) {
				return config?.kind === "select" ? "Please choose an option." : "This field is required.";
			}
			if (typeof v === "string" && startsLikeFormula(v)) return FORMULA_MESSAGE;
			return undefined;
		}
	}
}

/** Fields to validate on a step, including any "Please specify" field that is showing. */
export function stepFieldNames(stepIndex: number, values: WaitlistValues): FieldName[] {
	const names: FieldName[] = [];
	for (const field of STEPS[stepIndex].fields) {
		names.push(field.name);
		if (field.kind === "select" && field.otherField && values[field.name] === "Other") {
			names.push(field.otherField);
		}
	}
	return names;
}

export function validateStep(stepIndex: number, values: WaitlistValues): FieldErrors {
	const errors: FieldErrors = {};
	for (const name of stepFieldNames(stepIndex, values)) {
		const message = validateField(name, values);
		if (message) errors[name] = message;
	}
	return errors;
}

/** DOM id of the control that should receive focus for a field. */
export const controlId = (name: FieldName) =>
	name === "phone" ? "wl-phoneNumber" : `wl-${name}`;

/* ------------------------------------------------------------------ */
/* Payload                                                             */
/* ------------------------------------------------------------------ */

/** Anti-abuse signals for the backend to score; the browser never blocks on them. */
export interface SubmissionSignals {
	/** Hidden decoy field; humans leave it empty. */
	honeypot: string;
	/** When the visitor first interacted with the form (ms since epoch), or 0. */
	startedAt: number;
}

export function buildPayload(
	values: WaitlistValues,
	submissionId = createSubmissionId(),
	signals: SubmissionSignals = { honeypot: "", startedAt: 0 },
): WaitlistPayload {
	const country = findCountry(values.phoneCountry);
	const national = normalisePhone(values.phoneCountry, values.phoneNumber);
	const other = (choice: string, text: string) => (choice === "Other" ? text.trim() : "");

	return {
		submission_id: submissionId,
		submitted_at: new Date().toISOString(),
		source: "careerjump-international-executive-education",
		page_url: window.location.href,
		name: values.fullName.trim(),
		email: values.email.trim(),
		phone: `${country.dial} ${national}`,
		phone_country_code: country.dial,
		phone_country: country.name,
		location: values.location.trim(),
		designation: values.designation.trim(),
		company: values.company.trim(),
		industry: values.industry,
		industry_other: other(values.industry, values.industryOther),
		years: values.experience,
		goal: values.careerGoal,
		programme: values.programme,
		programme_other: other(values.programme, values.programmeOther),
		region: values.region,
		region_other: other(values.region, values.regionOther),
		format: values.learningFormat,
		budget: values.budget,
		timeline: values.startTimeline,
		funding: values.funding,
		consent: "Yes",
		consent_text: CONSENT_LABEL,
		hp: signals.honeypot,
		elapsed_ms: signals.startedAt ? Date.now() - signals.startedAt : 0,
	};
}
