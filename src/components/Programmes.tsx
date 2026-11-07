import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { PROGRAMMES } from "../data/programmes";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useReveal } from "../hooks/useReveal";
import { cx } from "../lib/cx";
import { ArrowUpRight } from "./Icon";
import { ResponsiveImage } from "./ResponsiveImage";
import { useWaitlist } from "./waitlist/WaitlistContext";
import "./Programmes.css";

/** Scroll distance (px) given to each programme while the stage is pinned. */
const STEP = 120;
const COUNT = PROGRAMMES.length;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/*
 * Pinned programme stage (desktop): once the stage attaches under the navbar,
 * scrolling advances the programmes one by one; the preview cross-fades and the
 * list glides to keep the active row centred. The stage releases only after the
 * last programme. Below 900px it is a plain list with thumbnails.
 * Selecting a row scrolls to the waitlist form with that programme preselected.
 */
export function Programmes() {
	const { open } = useWaitlist();
	const sectionRef = useReveal<HTMLElement>();
	// Must match the pinned-stage media query in Programmes.css.
	const isDesktop = useMediaQuery("(min-width: 900px) and (min-height: 560px)");
	const scrollerRef = useRef<HTMLDivElement>(null);
	const stageRef = useRef<HTMLDivElement>(null);
	const viewportRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLOListElement>(null);
	const [active, setActive] = useState(0);
	const [shift, setShift] = useState(0);
	const select = useCallback((programme: string) => open({ programme }), [open]);
	const current = PROGRAMMES[active];

	/** Pinned geometry: scroll range and where the range starts on the page. */
	const geometry = useCallback(() => {
		const scroller = scrollerRef.current;
		const stage = stageRef.current;
		if (!scroller || !stage) return null;
		const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
		const rect = scroller.getBoundingClientRect();
		const range = rect.height - stage.offsetHeight;
		return { stickyTop, rect, range, pageStart: rect.top + window.scrollY - stickyTop };
	}, []);

	useEffect(() => {
		if (!isDesktop) {
			setShift(0);
			if (viewportRef.current) viewportRef.current.dataset.fade = "";
			return;
		}
		let frame = 0;
		const update = () => {
			frame = 0;
			const g = geometry();
			const viewport = viewportRef.current;
			const list = listRef.current;
			if (!g || !viewport || !list || g.range <= 0) return;
			// Nothing advances until the stage is attached (pinned) to the screen.
			const progress = clamp((g.stickyTop - g.rect.top) / g.range, 0, 1);
			const index = Math.min(COUNT - 1, Math.floor(progress * COUNT));
			setActive((prev) => (prev === index ? prev : index));
			// Keep the active row centred in the clipped list.
			viewport.scrollTop = 0; // focus can scroll overflow:hidden boxes; we own the offset
			const row = list.children[index] as HTMLElement | undefined;
			if (!row) return;
			const maxShift = Math.max(0, list.offsetHeight - viewport.clientHeight);
			const target = Math.round(
				clamp(row.offsetTop + row.offsetHeight / 2 - viewport.clientHeight / 2, 0, maxShift),
			);
			setShift((prev) => (prev === target ? prev : target));
			// Soft fade on whichever edge still has rows hidden beyond it.
			const fade = [target > 0 && "top", target < maxShift && "bottom"].filter(Boolean).join(" ");
			if (viewport.dataset.fade !== fade) viewport.dataset.fade = fade;
		};
		const onScroll = () => {
			if (!frame) frame = requestAnimationFrame(update);
		};
		update();
		// Focus or find-in-page can scroll the clipped list box itself; snap it back.
		const viewport = viewportRef.current;
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll);
		viewport?.addEventListener("scroll", onScroll, { passive: true });
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
			viewport?.removeEventListener("scroll", onScroll);
		};
	}, [isDesktop, geometry]);

	/** Keyboard: focusing a row scrolls the page to that programme's position. */
	const focusRow = (index: number) => {
		if (!isDesktop) {
			setActive(index);
			return;
		}
		const g = geometry();
		if (!g || g.range <= 0) return;
		const y = g.pageStart + ((index + 0.5) / COUNT) * g.range;
		window.scrollTo({ top: y, behavior: "auto" });
	};

	return (
		<section
			id="programmes"
			className="section programmes"
			aria-labelledby="programmes-title"
			ref={sectionRef}>
			<div className="container">
				<div className="section-head" data-reveal>
					<div>
						<p className="eyebrow">Executive Programmes</p>
						<h2 id="programmes-title" className="section-title">
							Choose the Executive Program That Matches <em>Your Career Goals</em>
						</h2>
					</div>
					<div className="section-lede programmes__intro">
						<p>
							Explore 10 specialised Executive Programs across AI, Data Science, Business Analytics,
							Leadership, Finance, Product Management and Digital Marketing.
						</p>
						<p>
							Learn from global universities, earn alumni status and build international
							professional connections while continuing to work.
						</p>
					</div>
				</div>

				<div
					className="px-scroller"
					ref={scrollerRef}
					style={{ "--px-steps": `${COUNT * STEP}px` } as CSSProperties}>
					<div className="px" ref={stageRef}>
						{/* Preview: decorative mirror of the active row */}
						<div className="px__preview" aria-hidden="true" data-reveal>
							<div className="px__frame">
								{PROGRAMMES.map((p, i) => (
									<div key={p.id} className={cx("px__slide", i === active && "is-active")}>
										<ResponsiveImage
											dir="programmes"
											name={p.image.name}
											widths={[640, 960, 1280]}
											sizes="(min-width: 900px) 42vw, 1px"
											alt=""
											width={1280}
											height={800}
										/>
									</div>
								))}
								<span className="px__shade" />
								<div className="px__caption" key={current.id}>
									<span className="px__category">{current.category}</span>
									<span className="px__kicker">Executive Program in</span>
									<span className="px__title">{current.subject}</span>
									<span className="px__hint">
										Select to register your interest
										<ArrowUpRight size={16} />
									</span>
								</div>
							</div>
						</div>

						{/* Index (clipped viewport on desktop; the list glides inside it) */}
						<div className="px__viewport" ref={viewportRef} data-reveal>
							<ol
								className="px__list"
								ref={listRef}
								style={isDesktop ? { transform: `translate3d(0, ${-shift}px, 0)` } : undefined}>
								{PROGRAMMES.map((p, i) => (
									<li key={p.id} className={cx("px__row", i === active && "is-active")}>
										<span className="px__thumb" aria-hidden="true">
											<ResponsiveImage
												dir="programmes"
												name={p.image.name}
												widths={[640, 960, 1280]}
												sizes="(max-width: 899px) 96px, 1px"
												alt=""
												width={1280}
												height={800}
											/>
										</span>
										<div className="px__body">
											<span className="px__row-kicker">Executive Program in</span>
											<h3 className="px__row-title">{p.subject}</h3>
										</div>
										<span className="px__row-category">{p.category}</span>
										<span className="px__go" aria-hidden="true">
											<ArrowUpRight size={18} />
										</span>
										<button
											type="button"
											className="px__select"
											onClick={() => select(p.formOption)}
											onFocus={(e) => {
												// Keyboard only: a mouse click goes straight to the form instead.
												if (e.currentTarget.matches(":focus-visible")) focusRow(i);
											}}>
											<span className="sr-only">{p.title}. Register your interest.</span>
										</button>
									</li>
								))}
							</ol>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
