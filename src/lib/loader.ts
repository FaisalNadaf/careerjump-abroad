/** How long the intro shows before the curtain lifts, counted from navigation start. */
const DURATION_MS = 1500;

/**
 * Lifts the boot loader in index.html 1.5s after navigation start (or at once
 * if the app boots later than that). Without the loader, or when reduced
 * motion is preferred, the page is released straight away.
 */
export function dismissLoader() {
	const root = document.documentElement;
	const loader = document.getElementById("loader");
	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	if (!loader || reduced) {
		loader?.remove();
		root.classList.remove("is-loading");
		return;
	}

	window.setTimeout(
		() => {
			root.classList.add("is-loaded");
			root.classList.remove("is-loading");
			const remove = () => {
				loader.remove();
				root.classList.remove("is-loaded");
			};
			loader.addEventListener("transitionend", (event) => {
				if (event.target === loader) remove();
			});
			window.setTimeout(remove, 1200); // in case transitionend never fires
		},
		Math.max(0, DURATION_MS - performance.now()),
	);
}
