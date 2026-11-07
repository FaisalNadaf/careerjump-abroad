import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { BENEFITS } from "../data/benefits";
import { useMediaQuery, usePrefersReducedMotion } from "../hooks/useMediaQuery";
import { useReveal } from "../hooks/useReveal";
import { cx } from "../lib/cx";
import { Plus } from "./Icon";
import { ResponsiveImage } from "./ResponsiveImage";
import "./Benefits.css";

/** Delay before a hovered panel expands, so sweeping the mouse across doesn't flicker. */
const HOVER_INTENT_MS = 140;

/*
 * Expanding gallery: one benefit is open at a time. An invisible CSS "clock"
 * in the open panel drives auto-advance (animationend), so pausing it with
 * animation-play-state (hover, focus, off-screen) is exact.
 */
export function Benefits() {
	const sectionRef = useReveal<HTMLElement>();
	const listRef = useRef<HTMLOListElement>(null);
	const hoverTimer = useRef(0);
	const reducedMotion = usePrefersReducedMotion();

	// Auto-advance only where a panel change is a small part of the view (layout-shift budget).
	const roomyViewport = useMediaQuery("(min-width: 1024px) and (min-height: 640px)");
	// The first benefit starts open, so entering the section never shifts layout.
	const [active, setActive] = useState(0);
	const [entered, setEntered] = useState(false);
	const [inView, setInView] = useState(false);
	const [paused, setPaused] = useState(false);
	const [cycle, setCycle] = useState(0); // restarts the timer line

	useEffect(() => {
		const list = listRef.current;
		if (!list) return;
		const io = new IntersectionObserver(
			([entry]) => {
				setInView(entry.isIntersecting);
				if (entry.isIntersecting) setEntered(true);
			},
			{ threshold: 0.3 },
		);
		io.observe(list);
		return () => io.disconnect();
	}, []);

	useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

	const activate = useCallback((index: number) => {
		window.clearTimeout(hoverTimer.current);
		setActive(index);
		setCycle((c) => c + 1);
	}, []);

	const advance = useCallback(() => {
		setActive((a) => (a + 1) % BENEFITS.length);
		setCycle((c) => c + 1);
	}, []);

	const running = !reducedMotion && roomyViewport && inView && !paused;

	return (
		<section
			id="benefits"
			className="section benefits"
			aria-labelledby="benefits-title"
			ref={sectionRef}>
			<div className="benefits__panel">
				<div className="section-head" data-reveal>
					<div>
						<p className="eyebrow">Career Impact</p>
						<h2 id="benefits-title" className="section-title">
							What International Executive Education Can Do for <em>Your Career?</em>
						</h2>
					</div>
					<p className="section-lede">
						Executive education is designed for people who already lead. Here’s what an international
						programme can add to the experience you’ve built.
					</p>
				</div>

				<ol
					ref={listRef}
					className={cx("bx", entered && "is-in", !running && "is-paused")}
					onPointerEnter={(e) => {
						if (e.pointerType === "mouse") setPaused(true);
					}}
					onPointerLeave={() => {
						window.clearTimeout(hoverTimer.current);
						setPaused(false);
					}}
					onFocus={() => setPaused(true)}
					onBlur={(e) => {
						if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
					}}>
					{BENEFITS.map((b, i) => {
						const isActive = i === active;
						return (
							<li
								key={b.title}
								className={cx("bx__item", isActive && "is-active")}
								style={{ "--i": i } as CSSProperties}>
								<div className="bx__media" aria-hidden="true">
									<ResponsiveImage
										dir="benefits"
										name={b.image.name}
										widths={[640, 960, 1440]}
										sizes="(min-width: 768px) 55vw, 82vw"
										alt=""
										width={1440}
										height={1080}
									/>
								</div>
								<span className="bx__shade" aria-hidden="true" />

								{/* Collapsed state */}
								<div className="bx__mini" aria-hidden="true">
									<span className="bx__mini-label">{b.label}</span>
									<span className="bx__mini-plus">
										<Plus size={16} />
									</span>
								</div>

								{/* Expanded content (always in the DOM for screen readers and search engines) */}
								<div className="bx__content" id={`benefit-${i}`}>
									<h3 className="bx__title">{b.title}</h3>
									<p className="bx__text">{b.text}</p>
									<span className="sr-only">{b.image.alt}</span>
								</div>

								{isActive && (
									<span className="bx__clock" aria-hidden="true">
										<span key={cycle} className="bx__clock-tick" onAnimationEnd={advance} />
									</span>
								)}

								<button
									type="button"
									className="bx__trigger"
									aria-expanded={isActive}
									aria-controls={`benefit-${i}`}
									onClick={() => activate(i)}
									onFocus={() => i !== active && activate(i)}
									onPointerEnter={(e) => {
										if (e.pointerType !== "mouse" || i === active) return;
										window.clearTimeout(hoverTimer.current);
										hoverTimer.current = window.setTimeout(() => activate(i), HOVER_INTENT_MS);
									}}
									onPointerLeave={() => window.clearTimeout(hoverTimer.current)}>
									<span className="sr-only">
										{b.title}
									</span>
								</button>
							</li>
						);
					})}
				</ol>
			</div>
		</section>
	);
}
