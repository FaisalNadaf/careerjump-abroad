import { asset } from "../config";

interface Props {
	/** "dark" = navy wordmark for light backgrounds; "light" = white wordmark for dark backgrounds. */
	tone?: "dark" | "light";
	className?: string;
	loading?: "lazy" | "eager";
	fetchPriority?: "high" | "low" | "auto";
}

/** Official CareerJump logo (WebP with PNG fallback). */
export function Logo({ tone = "dark", className, loading = "eager", fetchPriority }: Props) {
	const base = asset(tone === "dark" ? "brand/careerjump-logo" : "brand/careerjump-logo-white");
	return (
		<picture>
			<source srcSet={`${base}.webp`} type="image/webp" />
			<img
				className={className}
				src={`${base}.png`}
				alt="CareerJump"
				width={600}
				height={131}
				loading={loading}
				decoding="async"
				fetchPriority={fetchPriority}
			/>
		</picture>
	);
}
