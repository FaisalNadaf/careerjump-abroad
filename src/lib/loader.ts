/** Shortest time the intro plays, so the jump and wordmark can finish. */
const MIN_MS = 2100;
/** Never hold the page longer than this, even on a slow connection. */
const MAX_MS = 4000;

/**
 * Lifts the boot loader in index.html once the page has loaded. The timings
 * count from navigation start (performance.now()). Without the loader, or
 * when reduced motion is preferred, the page is released straight away.
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

	let lifted = false;
	const lift = () => {
		if (lifted) return;
		lifted = true;
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
				window.setTimeout(remove, 1500); // in case transitionend never fires
			},
			Math.max(0, MIN_MS - performance.now()),
		);
	};

	if (document.readyState === "complete") lift();
	else window.addEventListener("load", lift, { once: true });
	window.setTimeout(lift, Math.max(0, MAX_MS - performance.now()));
}
