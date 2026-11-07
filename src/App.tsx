import { Benefits } from "./components/Benefits";
import { Destinations } from "./components/Destinations";
import { FinalCta } from "./components/FinalCta";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { Navbar } from "./components/Navbar";
import { Programmes } from "./components/Programmes";
import { WaitlistProvider } from "./components/waitlist/WaitlistContext";
import { WaitlistSection } from "./components/waitlist/WaitlistSection";

export default function App() {
	return (
		<WaitlistProvider>
			<a className="skip-link" href="#main">
				Skip to main content
			</a>
			<Navbar />
			<main id="main" tabIndex={-1}>
				<Hero />
				<Destinations />
				<WaitlistSection />
				<Benefits />
				<Programmes />
				<FinalCta />
			</main>
			<Footer />
		</WaitlistProvider>
	);
}
