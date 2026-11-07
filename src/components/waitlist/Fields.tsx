import { memo, type ChangeEvent, type ReactNode } from "react";
import { COUNTRY_CODES, PINNED_COUNTRY_COUNT, findCountry } from "../../data/countryCodes";
import { cx } from "../../lib/cx";
import { AlertCircle, ChevronDown } from "../Icon";

interface FieldShellProps {
	id: string;
	label: string;
	required?: boolean;
	error?: string;
	full?: boolean;
	children: ReactNode;
	as?: "div" | "fieldset";
}

function RequiredMark({ required }: { required?: boolean }) {
	if (!required) return null;
	return (
		<span className="field__req" aria-hidden="true">
			*
		</span>
	);
}

export function FieldError({ id, message }: { id: string; message?: string }) {
	if (!message) return null;
	return (
		<p id={id} className="field__error">
			<AlertCircle size={16} />
			<span>{message}</span>
		</p>
	);
}

function FieldShell({ id, label, required, error, full, children }: FieldShellProps) {
	return (
		<div className={cx("field", full && "field--full", error && "field--invalid")}>
			<label htmlFor={id} className="field__label">
				{label}
				<RequiredMark required={required} />
			</label>
			{children}
			<FieldError id={`${id}-error`} message={error} />
		</div>
	);
}

/* ---------------------------------------------------------------- */

interface TextFieldProps {
	id: string;
	label: string;
	type: "text" | "email";
	value: string;
	placeholder: string;
	autoComplete: string;
	maxLength: number;
	required?: boolean;
	full?: boolean;
	error?: string;
	onChange: (value: string) => void;
	onBlur: () => void;
}

export const TextField = memo(function TextField({
	id,
	label,
	type,
	value,
	placeholder,
	autoComplete,
	maxLength,
	required,
	full,
	error,
	onChange,
	onBlur,
}: TextFieldProps) {
	return (
		<FieldShell id={id} label={label} required={required} error={error} full={full}>
			<input
				id={id}
				name={id.replace(/^wl-/, "")}
				className="field__control"
				type={type}
				value={value}
				placeholder={placeholder}
				autoComplete={autoComplete}
				maxLength={maxLength}
				inputMode={type === "email" ? "email" : undefined}
				spellCheck={type === "email" ? false : undefined}
				autoCapitalize={type === "email" ? "off" : undefined}
				required={required}
				aria-invalid={error ? true : undefined}
				aria-describedby={error ? `${id}-error` : undefined}
				onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
				onBlur={onBlur}
			/>
		</FieldShell>
	);
});

/* ---------------------------------------------------------------- */

interface SelectFieldProps {
	id: string;
	label: string;
	value: string;
	options: readonly string[];
	required?: boolean;
	full?: boolean;
	error?: string;
	onChange: (value: string) => void;
	onBlur: () => void;
}

export const SelectField = memo(function SelectField({
	id,
	label,
	value,
	options,
	required,
	full,
	error,
	onChange,
	onBlur,
}: SelectFieldProps) {
	return (
		<FieldShell id={id} label={label} required={required} error={error} full={full}>
			<div className="select">
				<select
					id={id}
					name={id.replace(/^wl-/, "")}
					className={cx("field__control", "select__control", !value && "is-placeholder")}
					value={value}
					required={required}
					aria-invalid={error ? true : undefined}
					aria-describedby={error ? `${id}-error` : undefined}
					onChange={(e) => onChange(e.target.value)}
					onBlur={onBlur}>
					<option value="">Select an option</option>
					{options.map((o) => (
						<option key={o} value={o}>
							{o}
						</option>
					))}
				</select>
				<ChevronDown size={18} className="select__chevron" />
			</div>
		</FieldShell>
	);
});

/* ---------------------------------------------------------------- */

interface PhoneFieldProps {
	label: string;
	country: string;
	number: string;
	required?: boolean;
	error?: string;
	onCountryChange: (iso: string) => void;
	onNumberChange: (value: string) => void;
	onBlur: () => void;
}

const pinned = COUNTRY_CODES.slice(0, PINNED_COUNTRY_COUNT);
const rest = COUNTRY_CODES.slice(PINNED_COUNTRY_COUNT).sort((a, b) => a.name.localeCompare(b.name));

export const PhoneField = memo(function PhoneField({
	label,
	country,
	number,
	required,
	error,
	onCountryChange,
	onNumberChange,
	onBlur,
}: PhoneFieldProps) {
	const selected = findCountry(country);
	const errorId = "wl-phone-error";
	return (
		<fieldset className={cx("field", "field--full", error && "field--invalid")}>
			<legend className="field__label" id="wl-phone-label">
				{label}
				<RequiredMark required={required} />
			</legend>
			<div className="phone">
				<div className="phone__code">
					<select
						id="wl-phoneCountry"
						name="phoneCountry"
						className="phone__select"
						value={country}
						aria-label={`Country calling code, ${selected.name} ${selected.dial} selected`}
						onChange={(e) => onCountryChange(e.target.value)}>
						<optgroup label="Popular">
							{pinned.map((c) => (
								<option key={c.iso} value={c.iso}>
									{c.name} ({c.dial})
								</option>
							))}
						</optgroup>
						<optgroup label="All countries">
							{rest.map((c) => (
								<option key={c.iso} value={c.iso}>
									{c.name} ({c.dial})
								</option>
							))}
						</optgroup>
					</select>
					<span className="phone__code-display" aria-hidden="true">
						<span className="phone__iso">{selected.iso}</span>
						<span>{selected.dial}</span>
						<ChevronDown size={16} />
					</span>
				</div>
				<input
					id="wl-phoneNumber"
					name="phone"
					className="field__control phone__number"
					type="tel"
					inputMode="tel"
					autoComplete="tel-national"
					placeholder={selected.iso === "IN" ? "98765 43210" : "Phone number"}
					maxLength={20}
					value={number}
					required={required}
					aria-labelledby="wl-phone-label"
					aria-invalid={error ? true : undefined}
					aria-describedby={error ? errorId : "wl-phone-hint"}
					onChange={(e) => onNumberChange(e.target.value)}
					onBlur={onBlur}
				/>
			</div>
			{error ? (
				<FieldError id={errorId} message={error} />
			) : (
				<p id="wl-phone-hint" className="field__hint">
					We’ll use this for programme updates, including on WhatsApp.
				</p>
			)}
		</fieldset>
	);
});

/* ---------------------------------------------------------------- */

interface CheckboxFieldProps {
	label: string;
	checked: boolean;
	required?: boolean;
	error?: string;
	onChange: (checked: boolean) => void;
}

export const CheckboxField = memo(function CheckboxField({
	label,
	checked,
	required,
	error,
	onChange,
}: CheckboxFieldProps) {
	return (
		<div className={cx("field", "field--full", "consent", error && "field--invalid")}>
			<label className="consent__label" htmlFor="wl-consent">
				<input
					id="wl-consent"
					name="consent"
					type="checkbox"
					className="consent__box"
					checked={checked}
					required={required}
					aria-invalid={error ? true : undefined}
					aria-describedby={error ? "wl-consent-error" : undefined}
					onChange={(e) => onChange(e.target.checked)}
				/>
				<span className="consent__text">
					{label}
					<RequiredMark required={required} />
				</span>
			</label>
			<FieldError id="wl-consent-error" message={error} />
		</div>
	);
});
