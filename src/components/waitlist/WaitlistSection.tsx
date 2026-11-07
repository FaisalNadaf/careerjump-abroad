import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { usePrefersReducedMotion } from "../../hooks/useMediaQuery";
import { createSubmissionId, describeSubmitError, submitWaitlist } from "../../services/waitlist";
import { Button } from "../Button";
import { AlertCircle, Check, ChevronLeft, Info } from "../Icon";
import { CheckboxField, PhoneField, SelectField, TextField } from "./Fields";
import {
	INITIAL_VALUES,
	STEPS,
	buildPayload,
	controlId,
	validateField,
	stepFieldNames,
	validateStep,
	type FieldConfig,
	type FieldErrors,
	type FieldName,
	type WaitlistValues,
} from "./schema";
import { useWaitlistRequest } from "./WaitlistContext";
import "./WaitlistSection.css";

type Status = "idle" | "submitting" | "success" | "error";
type StringKey = Exclude<keyof WaitlistValues, "consent">;

const LAST_STEP = STEPS.length - 1;
const DISCLAIMER = "Waitlist registration does not guarantee admission, a seat or alumni status.";
const STRING_KEYS = Object.keys(INITIAL_VALUES).filter((k) => k !== "consent") as StringKey[];
const FIELD_NAMES: FieldName[] = [
	...STEPS.flatMap((s) => s.fields.map((f) => f.name)),
	"industryOther",
	"programmeOther",
	"regionOther",
];

/** Inline, multi-step waitlist form. Every "Join the Waitlist" CTA scrolls here. */
export function WaitlistSection() {
	const request = useWaitlistRequest();
	const reducedMotion = usePrefersReducedMotion();
	const behavior: ScrollBehavior = reducedMotion ? "auto" : "smooth";

	const cardRef = useRef<HTMLDivElement>(null);
	const mainRef = useRef<HTMLDivElement>(null);
	const stepHeadingRef = useRef<HTMLHeadingElement>(null);
	const successHeadingRef = useRef<HTMLHeadingElement>(null);
	const inFlight = useRef(false);
	const submissionId = useRef(createSubmissionId());
	const pendingFocus = useRef(false);
	const stepRef = useRef(0);

	const [values, setValues] = useState<WaitlistValues>(INITIAL_VALUES);
	const latest = useRef(values);
	// Anti-abuse signals sent to the backend (never used to block in the browser).
	const [honeypot, setHoneypot] = useState("");
	const startedAt = useRef(0);
	const [errors, setErrors] = useState<FieldErrors>({});
	const [step, setStep] = useState(0);
	const [direction, setDirection] = useState<"forward" | "back">("forward");
	const [status, setStatus] = useState<Status>("idle");
	const [submitError, setSubmitError] = useState("");
	const [announcement, setAnnouncement] = useState("");
	const [selection, setSelection] = useState("");

	const submitting = status === "submitting";
	const succeeded = status === "success";

	/* ---------------- value + validation helpers ---------------- */

	const setField = useCallback(<K extends keyof WaitlistValues>(key: K, value: WaitlistValues[K]) => {
		if (!startedAt.current) startedAt.current = Date.now();
		const next = { ...latest.current, [key]: value };
		latest.current = next;
		setValues(next);
		const unit: FieldName =
			key === "phoneCountry" || key === "phoneNumber" ? "phone" : (key as FieldName);
		// Live re-validation only for fields that have already been flagged.
		setErrors((prev) => {
			if (!(unit in prev)) return prev;
			const message = validateField(unit, next);
			return prev[unit] === message ? prev : { ...prev, [unit]: message };
		});
		setSubmitError("");
	}, []);

	const changeHandlers = useMemo(() => {
		const map = {} as Record<StringKey, (v: string) => void>;
		for (const key of STRING_KEYS) map[key] = (v: string) => setField(key, v);
		return map;
	}, [setField]);

	const onConsentChange = useCallback((checked: boolean) => setField("consent", checked), [setField]);

	const blurHandlers = useMemo(() => {
		const map = {} as Record<FieldName, () => void>;
		for (const name of FIELD_NAMES) {
			map[name] = () => {
				const value = name === "phone" ? latest.current.phoneNumber : latest.current[name];
				// Don't nag about empty fields the visitor simply tabbed through.
				if (typeof value === "string" && !value.trim()) return;
				const message = validateField(name, latest.current);
				setErrors((prev) => (prev[name] === message ? prev : { ...prev, [name]: message }));
			};
		}
		return map;
	}, []);

	const focusControl = useCallback(
		(name: FieldName) => {
			requestAnimationFrame(() => {
				const el = document.getElementById(controlId(name));
				el?.focus({ preventScroll: true });
				el?.scrollIntoView({ block: "center", behavior });
			});
		},
		[behavior],
	);

	/** Validate one step, publish its errors, and return the first invalid field. */
	const checkStep = useCallback((index: number): FieldName | null => {
		const names = stepFieldNames(index, latest.current);
		const stepErrors = validateStep(index, latest.current);
		setErrors((prev) => {
			const next = { ...prev };
			for (const name of names) next[name] = stepErrors[name];
			return next;
		});
		const invalid = names.filter((n) => stepErrors[n]);
		if (invalid.length) {
			setAnnouncement(
				invalid.length === 1
					? "One field needs your attention."
					: `${invalid.length} fields need your attention.`,
			);
			return invalid[0];
		}
		return null;
	}, []);

	/* ---------------- navigation + scrolling ---------------- */

	/** Bring the form column into view if its top is off screen (e.g. after a long step). */
	const revealMain = useCallback(() => {
		const main = mainRef.current;
		if (!main) return;
		const top = main.getBoundingClientRect().top;
		if (top < 0 || top > window.innerHeight * 0.45) main.scrollIntoView({ block: "start", behavior });
	}, [behavior]);

	const goToStep = useCallback((next: number) => {
		setDirection(next > stepRef.current ? "forward" : "back");
		stepRef.current = next;
		setStep(next);
		setSubmitError("");
		setAnnouncement(`Step ${next + 1} of ${STEPS.length}: ${STEPS[next].title}`);
		pendingFocus.current = true;
	}, []);

	useEffect(() => {
		if (!pendingFocus.current) return;
		pendingFocus.current = false;
		revealMain();
		stepHeadingRef.current?.focus({ preventScroll: true });
	}, [step, revealMain]);

	useEffect(() => {
		if (!succeeded) return;
		revealMain();
		successHeadingRef.current?.focus({ preventScroll: true });
	}, [succeeded, revealMain]);

	// A CTA anywhere on the page: apply any preselection, then scroll to the form.
	useEffect(() => {
		if (!request) return;
		const { programme, region } = request.prefill ?? {};
		if (programme || region) {
			const next = { ...latest.current };
			if (programme) next.programme = programme;
			if (region) next.region = region;
			latest.current = next;
			setValues(next);
			setErrors((prev) => {
				const copy = { ...prev };
				if (programme) delete copy.programme;
				if (region) delete copy.region;
				return copy;
			});
			setSelection(programme ?? region ?? "");
		}
		cardRef.current?.scrollIntoView({ block: "start", behavior });
		const t = window.setTimeout(
			() => {
				const target = succeeded ? successHeadingRef.current : stepHeadingRef.current;
				target?.focus({ preventScroll: true });
			},
			reducedMotion ? 0 : 600,
		);
		return () => window.clearTimeout(t);
		// Intentionally keyed to new open requests only.
	}, [request]);

	/* ---------------- submit ---------------- */

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (submitting || inFlight.current) return;

		if (step < LAST_STEP) {
			const invalid = checkStep(step);
			if (invalid) focusControl(invalid);
			else goToStep(step + 1);
			return;
		}

		// Final step: re-check every step in case earlier answers changed.
		for (let i = 0; i < STEPS.length; i++) {
			const invalid = checkStep(i);
			if (invalid) {
				if (i !== step) goToStep(i);
				focusControl(invalid);
				return;
			}
		}

		inFlight.current = true;
		setStatus("submitting");
		setSubmitError("");
		setAnnouncement("Submitting your registration…");
		try {
			await submitWaitlist(
				buildPayload(latest.current, submissionId.current, {
					honeypot,
					startedAt: startedAt.current,
				}),
			);
			setStatus("success");
			setAnnouncement("Registration received. Thank you for joining the CareerJump Founding Waitlist.");
		} catch (err) {
			console.error("[waitlist] Submission failed:", err);
			const message = describeSubmitError(err);
			setStatus("error");
			setSubmitError(message);
			setAnnouncement(message);
		} finally {
			inFlight.current = false;
		}
	};

	const registerAnother = () => {
		latest.current = INITIAL_VALUES;
		setValues(INITIAL_VALUES);
		setErrors({});
		setSelection("");
		setStatus("idle");
		submissionId.current = createSubmissionId();
		goToStep(0);
	};

	/* ---------------- rendering ---------------- */

	const renderField = (f: FieldConfig) => {
		const error = errors[f.name];
		switch (f.kind) {
			case "text":
			case "email":
				return (
					<TextField
						key={f.name}
						id={controlId(f.name)}
						type={f.kind}
						label={f.label}
						value={values[f.name] as string}
						placeholder={f.placeholder}
						autoComplete={f.autoComplete}
						maxLength={f.maxLength}
						required={f.required}
						full={f.full}
						error={error}
						onChange={changeHandlers[f.name as StringKey]}
						onBlur={blurHandlers[f.name]}
					/>
				);
			case "select": {
				const showOther = f.otherField && values[f.name] === "Other";
				return (
					<Fragment key={f.name}>
						<SelectField
							id={controlId(f.name)}
							label={f.label}
							value={values[f.name] as string}
							options={f.options}
							required={f.required}
							full={f.full}
							error={error}
							onChange={changeHandlers[f.name as StringKey]}
							onBlur={blurHandlers[f.name]}
						/>
						{showOther && f.otherField && (
							<TextField
								id={controlId(f.otherField)}
								type="text"
								label={f.otherLabel ?? "Please specify"}
								value={values[f.otherField]}
								placeholder="Please specify"
								autoComplete="off"
								maxLength={120}
								full={f.full}
								onChange={changeHandlers[f.otherField]}
								error={errors[f.otherField]}
								onBlur={blurHandlers[f.otherField]}
							/>
						)}
					</Fragment>
				);
			}
			case "phone":
				return (
					<PhoneField
						key="phone"
						label={f.label}
						country={values.phoneCountry}
						number={values.phoneNumber}
						required={f.required}
						error={error}
						onCountryChange={changeHandlers.phoneCountry}
						onNumberChange={changeHandlers.phoneNumber}
						onBlur={blurHandlers.phone}
					/>
				);
			case "checkbox":
				return (
					<CheckboxField
						key="consent"
						label={f.label}
						checked={values.consent}
						required={f.required}
						error={error}
						onChange={onConsentChange}
					/>
				);
		}
	};

	const current = STEPS[step];
	const firstName = values.fullName.trim().split(/\s+/)[0] ?? "";

	return (
		<section id="waitlist" className="section waitlist" aria-labelledby="wl-title">
			<div className="container">
				<div className="wl" ref={cardRef} data-step={succeeded ? "done" : step}>
					<aside className="wl__aside">
						<div className="wl__intro">
							<p className="wl__eyebrow">Waitlist Form</p>
							<h2 id="wl-title" className="wl__title">
								Join the Founding Waitlist for Priority Access to Upcoming International Executive
								Programs.
							</h2>
							{selection && !succeeded && (
								<p className="wl__selection">
									<Check size={16} />
									<span>
										Selected: <strong>{selection}</strong>
									</span>
								</p>
							)}
							<p id="wl-disclaimer" className="wl__disclaimer">
								<Info size={16} />
								<span>{DISCLAIMER}</span>
							</p>
						</div>

						<ol className="wl__steps" aria-label="Form steps">
							{STEPS.map((s, i) => {
								const state = succeeded || i < step ? "done" : i === step ? "current" : "todo";
								const content = (
									<>
										<span className="wl__steps-dot">
											{state === "done" ? <Check size={14} /> : i + 1}
										</span>
										<span className="wl__steps-text">
											<span className="wl__steps-k">Step {i + 1}</span>
											<span className="wl__steps-t">{s.title}</span>
										</span>
									</>
								);
								return (
									<li
										key={s.id}
										className={`wl__steps-item is-${state}`}
										aria-current={state === "current" ? "step" : undefined}>
										{state === "done" && !succeeded && !submitting ? (
											<button
												type="button"
												className="wl__steps-btn"
												onClick={() => goToStep(i)}
												aria-label={`Go back to step ${i + 1}: ${s.title}`}>
												{content}
											</button>
										) : (
											<span className="wl__steps-btn">{content}</span>
										)}
									</li>
								);
							})}
						</ol>
					</aside>

					<div className="wl__main" ref={mainRef}>
						<div className="wl__progress" aria-hidden="true">
							<span className="wl__progress-label">
								{succeeded ? "Registration complete" : `Step ${step + 1} of ${STEPS.length}`}
							</span>
							<span className="wl__progress-track">
								<span
									className="wl__progress-fill"
									style={{ transform: `scaleX(${succeeded ? 1 : (step + 1) / STEPS.length})` }}
								/>
							</span>
						</div>

						{succeeded ? (
							<div className="wl__body wl__success">
								<span className="wl__success-badge" aria-hidden="true">
									<Check size={28} />
								</span>
								<p className="wl__step-count">Registration received</p>
								<h3 ref={successHeadingRef} tabIndex={-1} className="wl__success-title">
									Thank you{firstName ? `, ${firstName}` : ""}. You’re on the CareerJump Founding
									Waitlist.
								</h3>
								<p className="wl__success-text">
									We’ve received your registration. Our team will reach out to{" "}
									<strong>{values.email.trim()}</strong> with priority programme announcements and
									early access to enrolment opportunities when programmes launch.
								</p>
								<p className="wl__note">
									<Info size={16} />
									<span>{DISCLAIMER}</span>
								</p>
								<button type="button" className="wl__link" onClick={registerAnother}>
									Register another person
								</button>
							</div>
						) : (
							<form
								className="wl__form"
								noValidate
								onSubmit={handleSubmit}
								aria-labelledby="wl-step-title"
								aria-describedby="wl-disclaimer">
								<div className="wl__body">
									<fieldset key={step} className="wl__step" data-dir={direction} disabled={submitting}>
										<legend className="sr-only">{current.title}</legend>
										<header className="wl__step-head">
											<p className="wl__step-count">
												Step {step + 1} of {STEPS.length}
											</p>
											<h3
												id="wl-step-title"
												ref={stepHeadingRef}
												tabIndex={-1}
												className="wl__step-title">
												{current.title}
											</h3>
											<p className="wl__step-desc">
												{current.description}
												{current.fields.some((f) => f.required) && (
													<>
														{" "}
														<span className="wl__req-note">
															Fields marked <span aria-hidden="true">*</span>
															<span className="sr-only">with an asterisk</span> are required.
														</span>
													</>
												)}
											</p>
										</header>
										<div className="wl__grid">{current.fields.map(renderField)}</div>
										{step === LAST_STEP && (
											<p className="wl__note">
												<Info size={16} />
												<span>{DISCLAIMER}</span>
											</p>
										)}
									</fieldset>
								</div>

								{/* Decoy for bots: hidden from people and assistive tech, left empty by humans. */}
								<div className="wl__hp" aria-hidden="true">
									<label htmlFor="wl-website">Leave this field empty</label>
									<input
										id="wl-website"
										name="website"
										type="text"
										tabIndex={-1}
										autoComplete="off"
										value={honeypot}
										onChange={(e) => setHoneypot(e.target.value)}
									/>
								</div>

								<div className="wl__footer">
									{submitError && (
										<div className="wl__alert" role="alert">
											<AlertCircle size={20} />
											<p>{submitError}</p>
										</div>
									)}
									<div className="wl__actions">
										{step > 0 ? (
											<button
												type="button"
												className="wl__back"
												onClick={() => goToStep(step - 1)}
												disabled={submitting}>
												<ChevronLeft size={18} />
												Back
											</button>
										) : (
											<span className="wl__secure">Takes about 2 minutes</span>
										)}
										<Button type="submit" loading={submitting} disabled={submitting}>
											{step < LAST_STEP
												? "Continue"
												: submitting
													? "Submitting…"
													: "Join the Founding Waitlist"}
										</Button>
									</div>
								</div>
							</form>
						)}
					</div>
				</div>
			</div>
			<p className="sr-only" aria-live="polite" aria-atomic="true">
				{announcement}
			</p>
		</section>
	);
}
