import { Hero } from "@/components/hackathon/hero";
import { Schedule } from "@/components/hackathon/schedule";
import { FAQ } from "@/components/hackathon/faq";
import { Sponsors } from "@/components/hackathon/sponsors";
import { RetroTerminal } from "@/components/hackathon/RetroTerminal";

export default function HackathonPage() {
    return (
        <div className="bg-black text-white selection:bg-orange-500 selection:text-black">
            <Hero />
            
            {/* Retro Tech Element - Hackathon Constraint */}
            <section className="py-12 bg-gradient-to-b from-black via-neutral-950 to-black">
                <RetroTerminal />
            </section>
            
            <Sponsors />
            <Schedule />
            <FAQ />

            {}
            <footer className="py-8 text-center text-neutral-600 border-t border-white/5 text-sm">
                <p className="text-neutral-500 text-sm">
                    © 2025 DevForge. Built by Dev Club NSTxSVYASA.
                </p>
            </footer>
        </div>
    );
}
