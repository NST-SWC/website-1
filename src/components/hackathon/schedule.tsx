"use client";

import { motion } from "framer-motion";

const scheduleItems = [
    {
        day: "Day 1",
        date: "Saturday, December 20, 2025",
        events: [
            { time: "07:00 AM IST", title: "Check-In", description: "Get your team no." },
            { time: "08:00 AM IST", title: "Opening Ceremony", description: "Event kickoff and rules." },
            { time: "09:00 AM IST", title: "Coding Begins", description: "Start your engines." },
            { time: "01:00 PM IST", title: "Lunch Break", description: "Refuel and network." },
            { time: "02:00 PM IST", title: "Mid-Evaluation & Mentorship", description: "Check-in with mentors." },
            { time: "06:00 PM IST", title: "Final Submission", description: "Upload to Devpost." },
            { time: "06:30 PM IST", title: "Demos & Judging", description: "Present your solution." },
            { time: "07:00 PM IST", title: "Closing Ceremony & Prize Distribution", description: "Winners announced." },
        ],
    },
];

export function Schedule() {
    return (
        <section id="schedule" className="py-12 md:py-24 bg-black relative">
            <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-8 md:mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Event Schedule</h2>
                    <p className="text-neutral-400">12 hours of intense creation.</p>
                </div>

                <div className="space-y-12">
                    {scheduleItems.map((day, dayIndex) => (
                        <div key={dayIndex} className="relative">
                            <div className="py-2 mb-8 border-b border-white/10">
                                <p className="text-xl md:text-2xl font-bold text-neutral-200">{day.date}</p>
                            </div>

                            <div className="space-y-6 relative pl-8 border-l border-white/10 ml-3">
                                {day.events.map((event, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        className="relative group"
                                    >
                                        <div className="absolute -left-[39px] top-2 h-5 w-5 rounded-full border-4 border-black bg-neutral-800 group-hover:bg-orange-500 transition-colors" />
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-orange-500/30 transition-colors">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                                <h4 className="text-xl font-bold text-white">{event.title}</h4>
                                                <span className="text-orange-400 font-mono text-sm bg-orange-950/30 px-2 py-1 rounded inline-block w-fit">
                                                    {event.time}
                                                </span>
                                            </div>
                                            <p className="text-neutral-400 text-sm">{event.description}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
