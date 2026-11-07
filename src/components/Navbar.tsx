import { useEffect, useState } from "react";
import { cx } from "../lib/cx";
import { Button } from "./Button";
import { Logo } from "./Logo";
import { useWaitlist } from "./waitlist/WaitlistContext";
import "./Navbar.css";

export function Navbar() {
	const { open } = useWaitlist();
	const [scrolled, setScrolled] = useState(false);

	// Transparent over the full-screen hero video; solid white once the page scrolls.
	useEffect(() => {
		const update = () => setScrolled(window.scrollY > 24);
		update();
		window.addEventListener("scroll", update, { passive: true });
		return () => window.removeEventListener("scroll", update);
	}, []);

	return (
		<header className={cx("nav", scrolled ? "nav--scrolled" : "nav--overlay")}>
			<nav className="nav__inner" aria-label="Primary">
				<a className="nav__brand" href="#top" aria-label="CareerJump, back to top">
					<span className="nav__logo nav__logo--light">
						<Logo tone="light" fetchPriority="high" />
					</span>
					<span className="nav__logo nav__logo--dark" aria-hidden="true">
						<Logo />
					</span>
				</a>
				<Button size="sm" onClick={() => open()}>
					Join the Waitlist
				</Button>
			</nav>
		</header>
	);
}
