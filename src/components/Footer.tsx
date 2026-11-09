import { CONTACT_EMAIL, CUBICCODE_URL } from "../config";
import { ArrowUpRight, Mail } from "./Icon";
import { Logo } from "./Logo";
import "./Footer.css";

export function Footer() {
	return (
		<footer className="footer">
			<div className="container">
				{/* Brand row: logo and tagline */}
				<div className="footer__top">
					<div className="footer__brand">
						<Logo loading="lazy" />
						<p className="footer__tagline">
							International Executive Education for working professionals.
						</p>
					</div>
				</div>

				{/* Disclosures: two text columns; the contact email fills the space under the shorter left one */}
				<div className="footer__disclosures">
					<section className="footer__partnership" aria-labelledby="footer-partnership">
						<h2 id="footer-partnership" className="footer__heading">
							University Partnership Disclosure
						</h2>
						<p>
							We are currently in discussions with some esteemed international universities and
							academic institutions.
						</p>
						<p>
							Official university partnerships, programme details and credentials will be announced
							once agreements are finalised.
						</p>
					</section>
					<section className="footer__waitlist" aria-labelledby="footer-waitlist">
						<h2 id="footer-waitlist" className="footer__heading">
							Founding Waitlist Information
						</h2>
						<p>
							Join the CareerJump Founding Waitlist to receive priority programme announcements and
							early access to enrolment opportunities.
						</p>
						<p>
							Seats in international executive education programmes and eligibility for university
							alumni status will be limited.
						</p>
						<p>Our team will reach out to registered members when programmes launch.</p>
						<p className="footer__emphasis">
							Registration does not guarantee admission or reserve a seat.
						</p>
					</section>
					<p className="footer__contact">
						<span className="footer__contact-label">Contact us</span>
						<a href={`mailto:${CONTACT_EMAIL}`} className="footer__link">
							<Mail size={16} />
							{CONTACT_EMAIL}
						</a>
					</p>
				</div>

				<div className="footer__bottom">
					<p>© 2026 CareerJump. All rights reserved.</p>
					<p className="footer__legal">
						A product of{" "}
						<a
							href={CUBICCODE_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="footer__link">
							Cubiccode Digital Media LLP
							<ArrowUpRight size={14} />
							<span className="sr-only">(opens in a new tab)</span>
						</a>
						<span className="footer__sep" aria-hidden="true">
							·
						</span>
						An ISO 9001:2015 Certified Company
					</p>
				</div>
			</div>
		</footer>
	);
}
