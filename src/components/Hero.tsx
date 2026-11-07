import { useEffect, useRef, useState, type CSSProperties } from "react";
import { asset } from "../config";
import { useDecorativeVideoAllowed, useMediaQuery } from "../hooks/useMediaQuery";
import { cx } from "../lib/cx";
import { Button } from "./Button";
import { useWaitlist } from "./waitlist/WaitlistContext";
import "./Hero.css";

/* Keep in sync with the <link rel="preload"> tags in index.html. */
const MOBILE_MEDIA = "(max-width: 767px) and (orientation: portrait)";
const POSTER_DESKTOP = asset("media/hero/hero-poster.webp");
const POSTER_MOBILE = asset("media/hero/hero-poster-mobile.webp");

/** Entrance-animation delay, consumed by [data-enter] / .hero__line in Hero.css. */
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export function Hero() {
	const { open } = useWaitlist();
	const allowVideo = useDecorativeVideoAllowed();
	const isMobile = useMediaQuery(MOBILE_MEDIA);
	const frameRef = useRef<HTMLDivElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const [playing, setPlaying] = useState(false);

	// Play only while the hero is on screen (saves CPU/battery once scrolled past).
	useEffect(() => {
		const video = videoRef.current;
		const frame = frameRef.current;
		if (!video || !frame) return;
		if (!allowVideo) {
			video.pause();
			return;
		}
		video.muted = true;
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) video.play().catch(() => undefined);
				else video.pause();
			},
			{ threshold: 0.05 },
		);
		io.observe(frame);
		return () => io.disconnect();
	}, [allowVideo]);

	return (
		<section className="hero" id="top" aria-labelledby="hero-title">
			<div className="hero__frame" ref={frameRef}>
				<div className="hero__media" aria-hidden="true">
					<picture>
						<source media={MOBILE_MEDIA} srcSet={POSTER_MOBILE} type="image/webp" />
						<img
							className="hero__poster"
							src={POSTER_DESKTOP}
							alt=""
							width={1500}
							height={800}
							fetchPriority="high"
							decoding="async"
						/>
					</picture>
					<video
						ref={videoRef}
						className={cx("hero__video", playing && "is-playing")}
						poster={isMobile ? POSTER_MOBILE : POSTER_DESKTOP}
						autoPlay={allowVideo}
						muted
						loop
						playsInline
						preload={allowVideo ? "auto" : "none"}
						disablePictureInPicture
						tabIndex={-1}
						onPlaying={() => setPlaying(true)}>
						<source src={asset("media/hero/hero-mobile.mp4")} type="video/mp4" media={MOBILE_MEDIA} />
						<source src={asset("media/hero/hero-1280.mp4")} type="video/mp4" />
					</video>
					<div className="hero__shade" />
				</div>

				<div className="hero__content">
					<p className="hero__kicker" data-enter style={delay(100)}>
						Earn a Global University Credential.
					</p>
					<h1 id="hero-title" className="hero__title">
						<span className="hero__line">
							<span style={delay(200)}>Advance Your Career</span>
						</span>{" "}
						<span className="hero__line">
							<span style={delay(320)}>Without Leaving Your Job.</span>
						</span>
					</h1>
					<div className="hero__aside" data-enter style={delay(600)}>
						<p className="hero__desc">
							International Executive Education from Global Universities. Earn Alumni Status, Build
							Global Connections and Learn While You Work.
						</p>
						<Button size="lg" variant="light" onClick={() => open()}>
							Join the Waitlist
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
}
