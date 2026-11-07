import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../lib/cx";
import { ArrowRight, Spinner } from "./Icon";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: "primary" | "light" | "outline";
	size?: "sm" | "md" | "lg";
	/** Trailing icon. Defaults to an arrow; pass `false` for none. */
	icon?: ReactNode | false;
	loading?: boolean;
};

export function Button({
	variant = "primary",
	size = "md",
	icon,
	loading = false,
	className,
	children,
	type = "button",
	...rest
}: Props) {
	return (
		<button
			type={type}
			className={cx("btn", `btn--${variant}`, `btn--${size}`, loading && "is-loading", className)}
			aria-busy={loading || undefined}
			{...rest}>
			<span className="btn__label">{children}</span>
			{icon !== false && (
				<span className="btn__icon" aria-hidden="true">
					{loading ? <Spinner size={18} /> : (icon ?? <ArrowRight size={18} />)}
				</span>
			)}
		</button>
	);
}
