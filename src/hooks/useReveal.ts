import { useEffect, useRef } from "react";

/*
 * Scroll-triggered reveal. One shared IntersectionObserver toggles the
 * `is-revealed` class directly on the element, so revealing causes no React
 * re-renders. Styles live in base.css under [data-reveal].
 */
let observer: IntersectionObserver | null = null;

function getObserver() {
	if (!observer) {
		observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						entry.target.classList.add("is-revealed");
						observer?.unobserve(entry.target);
					}
				}
			},
			{ rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
		);
	}
	return observer;
}

export function useReveal<T extends HTMLElement>() {
	const ref = useRef<T>(null);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		if (!("IntersectionObserver" in window)) {
			el.classList.add("is-revealed");
			return;
		}
		const els = [el, ...Array.from(el.querySelectorAll<HTMLElement>("[data-reveal]"))];
		const obs = getObserver();
		els.forEach((node) => obs.observe(node));
		return () => els.forEach((node) => obs.unobserve(node));
	}, []);
	return ref;
}
