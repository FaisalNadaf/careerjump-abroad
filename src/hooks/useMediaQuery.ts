import { useSyncExternalStore } from "react";

/** Subscribe to a CSS media query. */
export function useMediaQuery(query: string): boolean {
	return useSyncExternalStore(
		(onChange) => {
			const mql = window.matchMedia(query);
			mql.addEventListener("change", onChange);
			return () => mql.removeEventListener("change", onChange);
		},
		() => window.matchMedia(query).matches,
		() => false,
	);
}

export const usePrefersReducedMotion = () =>
	useMediaQuery("(prefers-reduced-motion: reduce)");

interface NetworkInformationLike {
	saveData?: boolean;
	effectiveType?: string;
}

/** Decorative video is skipped for reduced motion and data-saver / very slow connections. */
export function useDecorativeVideoAllowed(): boolean {
	const reduced = usePrefersReducedMotion();
	if (reduced) return false;
	const conn = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
	if (conn?.saveData) return false;
	if (conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return false;
	return true;
}
