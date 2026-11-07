import { useReveal } from "../hooks/useReveal";
import { Button } from "./Button";
import { ResponsiveImage } from "./ResponsiveImage";
import { useWaitlist } from "./waitlist/WaitlistContext";
import "./FinalCta.css";

export function FinalCta() {
	const { open } = useWaitlist();
	const sectionRef = useReveal<HTMLElement>();

	return (
		<section className="final-cta" aria-labelledby="final-cta-title" ref={sectionRef}>
			<div className="final-cta__frame" data-reveal>
				<div className="final-cta__media" aria-hidden="true">
					<ResponsiveImage
						dir="cta"
						name="city-skyline-dusk"
						widths={[960, 1600, 2400]}
						sizes="100vw"
						alt=""
						width={2400}
						height={1350}
						className="final-cta__img"
					/>
				</div>
				<div className="final-cta__shade" aria-hidden="true" />

				<div className="final-cta__content">
					<h2 id="final-cta-title" className="final-cta__title">
						<span className="final-cta__line">
							<span>Your ambition is global.</span>
						</span>{" "}
						<span className="final-cta__line">
							<em>Your learning should be, too.</em>
						</span>
					</h2>
					<p className="final-cta__text">
						You’ve invested years building your career. Now it’s time to take it further. Join the
						CareerJump Founding Waitlist for early updates on international executive education programs
						from global universities, opportunities to earn alumni status, and global professional
						connections, all while you continue working.
					</p>
					<div className="final-cta__action">
						<Button size="lg" variant="light" onClick={() => open()}>
							Join the Waitlist
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
}
