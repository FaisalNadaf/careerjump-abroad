import { memo, useCallback, useEffect, useRef, useState } from "react";
import { asset } from "../config";
import { DESTINATIONS, type Destination } from "../data/destinations";
import { useDecorativeVideoAllowed, usePrefersReducedMotion } from "../hooks/useMediaQuery";
import { useReveal } from "../hooks/useReveal";
import { cx } from "../lib/cx";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "./Icon";
import { useWaitlist } from "./waitlist/WaitlistContext";
import "./Destinations.css";

/** Time between automatic slides. */
const AUTOPLAY_MS = 3200;
/** After a touch, wheel, arrow or drag interaction, wait this long before auto-sliding again. */
const RESUME_AFTER_MS = 5000;
/** Pointer travel (px) before a mouse press becomes a drag instead of a click. */
const DRAG_THRESHOLD = 6;

/*
 * Infinite loop: the destinations are rendered three times. The visitor always
 * browses the middle copy; whenever scrolling settles outside it, the position
 * jumps by exactly one set width. The copies are identical, so the jump is
 * invisible. Copies are hidden from assistive tech and the tab order.
 */
const COUNT = DESTINATIONS.length;
const SETS = 3;
const SLIDES = Array.from({ length: SETS }, (_, set) =>
	DESTINATIONS.map((destination) => ({ destination, set, key: `${set}-${destination.id}` })),
).flat();

interface CardProps {
	destination: Destination;
	allowVideo: boolean;
	isCopy: boolean;
	onSelect: (region: string) => void;
}

const DestinationCard = memo(function DestinationCard({
	destination,
	allowVideo,
	isCopy,
	onSelect,
}: CardProps) {
	const cardRef = useRef<HTMLButtonElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const [shouldLoad, setShouldLoad] = useState(false);
	const [ready, setReady] = useState(false);

	// Lazy-load on first visibility; play only while the card is mostly on screen.
	useEffect(() => {
		const card = cardRef.current;
		if (!card || !allowVideo) return;
		const io = new IntersectionObserver(
			([entry]) => {
				const video = videoRef.current;
				if (entry.isIntersecting) {
					setShouldLoad(true);
					if (video?.src) video.play().catch(() => undefined);
				} else {
					video?.pause();
				}
			},
			{ threshold: 0.55 },
		);
		io.observe(card);
		return () => io.disconnect();
	}, [allowVideo]);

	const poster = asset(`media/destinations/${destination.id}`);

	return (
		<button
			ref={cardRef}
			type="button"
			className="dest-card"
			tabIndex={isCopy ? -1 : undefined}
			onClick={() => onSelect(destination.formOption)}>
			<span className="dest-card__media" aria-hidden="true">
				<picture>
					<source srcSet={`${poster}.webp`} type="image/webp" />
					<img
						src={`${poster}.jpg`}
						alt=""
						width={540}
						height={900}
						loading="lazy"
						decoding="async"
						draggable={false}
					/>
				</picture>
				{allowVideo && (
					<video
						ref={videoRef}
						className={cx("dest-card__video", ready && "is-ready")}
						src={shouldLoad ? `${poster}.mp4` : undefined}
						muted
						loop
						playsInline
						autoPlay
						preload="none"
						disablePictureInPicture
						tabIndex={-1}
						onPlaying={() => setReady(true)}
					/>
				)}
			</span>
			<span className="dest-card__shade" aria-hidden="true" />
			<span className="dest-card__top">
				<span className="dest-card__name">{destination.name}</span>
			</span>
			<span className="dest-card__go" aria-hidden="true">
				<ArrowUpRight size={18} />
			</span>
			<span className="sr-only">. Register your interest in this destination.</span>
		</button>
	);
});

export function Destinations() {
	const { open } = useWaitlist();
	const allowVideo = useDecorativeVideoAllowed();
	const reducedMotion = usePrefersReducedMotion();
	const sectionRef = useReveal<HTMLElement>();
	const carouselRef = useRef<HTMLDivElement>(null);
	const trackRef = useRef<HTMLUListElement>(null);
	const thumbRef = useRef<HTMLSpanElement>(null);

	// Auto-slide pause signals, kept in refs so the timer never re-renders the section.
	const hovering = useRef(false);
	const focusWithin = useRef(false);
	const dragging = useRef(false);
	const touching = useRef(false);
	const inView = useRef(false);
	const lastInteraction = useRef(0);

	/** Width of one card plus the gap. */
	const stepSize = useCallback(() => {
		const track = trackRef.current;
		const item = track?.querySelector("li");
		if (!track || !item) return 0;
		const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
		return item.getBoundingClientRect().width + gap;
	}, []);

	const behavior: ScrollBehavior = reducedMotion ? "auto" : "smooth";

	/* ---------- infinite loop, progress line ---------- */
	useEffect(() => {
		const track = trackRef.current;
		if (!track) return;
		let frame = 0;
		let settleTimer = 0;
		let index = COUNT; // card index aligned to the left edge (middle set)

		const updateProgress = () => {
			frame = 0;
			const step = stepSize();
			if (!step) return;
			index = Math.round(track.scrollLeft / step);
			const pos = (((track.scrollLeft / step) % COUNT) + COUNT) % COUNT;
			thumbRef.current?.style.setProperty("--pos", pos.toFixed(3));
		};

		// Keep the visitor inside the middle copy (between 0.5 and 1.5 set widths).
		const recentre = () => {
			if (dragging.current || touching.current) return;
			const setWidth = stepSize() * COUNT;
			if (!setWidth) return;
			if (track.scrollLeft < setWidth * 0.5) track.scrollLeft += setWidth;
			else if (track.scrollLeft >= setWidth * 1.5) track.scrollLeft -= setWidth;
		};

		const onScroll = () => {
			if (!frame) frame = requestAnimationFrame(updateProgress);
			window.clearTimeout(settleTimer);
			settleTimer = window.setTimeout(recentre, 160);
		};

		// Keep the same card in place when the card width changes.
		const onResize = () => {
			const step = stepSize();
			if (step) track.scrollLeft = index * step;
			updateProgress();
		};

		const onTouchStart = () => {
			touching.current = true;
			lastInteraction.current = Date.now();
		};
		const onTouchEnd = () => {
			touching.current = false;
			lastInteraction.current = Date.now();
			window.clearTimeout(settleTimer);
			settleTimer = window.setTimeout(recentre, 400);
		};

		track.scrollLeft = stepSize() * COUNT; // start on the first card of the middle set
		updateProgress();
		track.addEventListener("scroll", onScroll, { passive: true });
		track.addEventListener("touchstart", onTouchStart, { passive: true });
		track.addEventListener("touchend", onTouchEnd, { passive: true });
		track.addEventListener("touchcancel", onTouchEnd, { passive: true });
		window.addEventListener("resize", onResize);
		return () => {
			cancelAnimationFrame(frame);
			window.clearTimeout(settleTimer);
			track.removeEventListener("scroll", onScroll);
			track.removeEventListener("touchstart", onTouchStart);
			track.removeEventListener("touchend", onTouchEnd);
			track.removeEventListener("touchcancel", onTouchEnd);
			window.removeEventListener("resize", onResize);
		};
	}, [stepSize]);

	const scrollByPage = (dir: 1 | -1) => {
		const track = trackRef.current;
		const step = stepSize();
		if (!track || !step) return;
		lastInteraction.current = Date.now();
		const perPage = Math.max(1, Math.floor(track.clientWidth / step) - 1);
		track.scrollBy({ left: dir * step * perPage, behavior });
	};

	/* ---------- auto-slide ---------- */
	useEffect(() => {
		const carousel = carouselRef.current;
		if (!carousel) return;
		const io = new IntersectionObserver(([e]) => (inView.current = e.isIntersecting), {
			threshold: 0.35,
		});
		io.observe(carousel);
		return () => io.disconnect();
	}, []);

	useEffect(() => {
		if (reducedMotion) return;
		const id = window.setInterval(() => {
			const track = trackRef.current;
			if (!track) return;
			const paused =
				hovering.current ||
				focusWithin.current ||
				dragging.current ||
				touching.current ||
				!inView.current ||
				document.hidden ||
				Date.now() - lastInteraction.current < RESUME_AFTER_MS;
			if (!paused) track.scrollBy({ left: stepSize(), behavior: "smooth" });
		}, AUTOPLAY_MS);
		return () => window.clearInterval(id);
	}, [reducedMotion, stepSize]);

	/* ---------- mouse drag (touch uses native swipe) ---------- */
	useEffect(() => {
		const track = trackRef.current;
		if (!track) return;
		let pointerId = -1;
		let startX = 0;
		let startLeft = 0;
		let pressed = false;
		let moved = false;
		let suppressClick = false;

		const onDown = (e: PointerEvent) => {
			if (e.pointerType !== "mouse" || e.button !== 0) return;
			pressed = true;
			moved = false;
			pointerId = e.pointerId;
			startX = e.clientX;
			startLeft = track.scrollLeft;
		};
		const onMove = (e: PointerEvent) => {
			if (!pressed) return;
			const dx = e.clientX - startX;
			if (!moved && Math.abs(dx) > DRAG_THRESHOLD) {
				moved = true;
				dragging.current = true;
				track.classList.add("is-dragging");
				track.setPointerCapture(pointerId);
			}
			if (moved) {
				e.preventDefault();
				track.scrollLeft = startLeft - dx;
			}
		};
		const onUp = () => {
			if (!pressed) return;
			pressed = false;
			if (!moved) return;
			suppressClick = true;
			dragging.current = false;
			lastInteraction.current = Date.now();
			if (track.hasPointerCapture(pointerId)) track.releasePointerCapture(pointerId);
			// Settle on the nearest card, then restore snapping.
			const step = stepSize();
			const target = step ? Math.round(track.scrollLeft / step) * step : track.scrollLeft;
			track.classList.remove("is-dragging");
			track.scrollTo({ left: target, behavior });
		};
		// A drag that ends over a card must not open the waitlist.
		const onClickCapture = (e: MouseEvent) => {
			if (suppressClick) {
				e.preventDefault();
				e.stopPropagation();
				suppressClick = false;
			}
		};
		const onWheel = () => (lastInteraction.current = Date.now());

		track.addEventListener("pointerdown", onDown);
		track.addEventListener("pointermove", onMove);
		track.addEventListener("pointerup", onUp);
		track.addEventListener("pointercancel", onUp);
		track.addEventListener("click", onClickCapture, true);
		track.addEventListener("wheel", onWheel, { passive: true });
		return () => {
			track.removeEventListener("pointerdown", onDown);
			track.removeEventListener("pointermove", onMove);
			track.removeEventListener("pointerup", onUp);
			track.removeEventListener("pointercancel", onUp);
			track.removeEventListener("click", onClickCapture, true);
			track.removeEventListener("wheel", onWheel);
		};
	}, [behavior, stepSize]);

	const onSelect = useCallback((region: string) => open({ region }), [open]);

	return (
		<section
			id="destinations"
			className="section destinations"
			aria-labelledby="destinations-title"
			ref={sectionRef}>
			<div className="container">
				<div className="section-head section-head--single" data-reveal>
					<h2 id="destinations-title" className="section-title">
						Explore Executive Education from <em>Top Universities</em> Worldwide
					</h2>
				</div>
			</div>

			<div
				className="dest-carousel"
				ref={carouselRef}
				data-reveal
				onPointerEnter={(e) => {
					if (e.pointerType === "mouse") hovering.current = true;
				}}
				onPointerLeave={() => {
					hovering.current = false;
				}}
				onFocus={() => {
					focusWithin.current = true;
				}}
				onBlur={(e) => {
					if (!e.currentTarget.contains(e.relatedTarget as Node | null)) focusWithin.current = false;
				}}>
				<ul
					id="destinations-track"
					className="dest-track"
					ref={trackRef}
					aria-label="Destinations. Drag or use the arrows to browse.">
					{SLIDES.map(({ destination, set, key }) => {
						const isCopy = set !== 1;
						return (
							<li key={key} className="dest-track__item" aria-hidden={isCopy || undefined}>
								<DestinationCard
									destination={destination}
									allowVideo={allowVideo}
									isCopy={isCopy}
									onSelect={onSelect}
								/>
							</li>
						);
					})}
				</ul>
				<button
					type="button"
					className="carousel-nav__btn carousel-nav__btn--prev"
					onClick={() => scrollByPage(-1)}
					aria-controls="destinations-track"
					aria-label="Previous destinations">
					<ChevronLeft size={22} />
				</button>
				<button
					type="button"
					className="carousel-nav__btn carousel-nav__btn--next"
					onClick={() => scrollByPage(1)}
					aria-controls="destinations-track"
					aria-label="Next destinations">
					<ChevronRight size={22} />
				</button>
			</div>

			<div className="container">
				<div className="dest-progress" aria-hidden="true">
					<span className="dest-progress__thumb" ref={thumbRef} />
				</div>
			</div>
		</section>
	);
}
