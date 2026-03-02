import { Navbar } from "../components/landing/Navbar";
import { Hero } from "../components/landing/Hero";
import { Logos } from "../components/landing/Logos";
import { HowItWorks } from "../components/landing/HowItWorks";
import { Features } from "../components/landing/Features";
import { Pricing } from "../components/landing/Pricing";
import { FAQ } from "../components/landing/FAQ";
import { CTAFinal } from "../components/landing/CTAFinal";
import { Footer } from "../components/landing/Footer";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans">
            <Navbar />
            <main>
                <Hero />
                <Logos />
                <HowItWorks />
                <Features />
                <Pricing />
                <FAQ />
                <CTAFinal />
            </main>
            <Footer />
        </div>
    );
}
