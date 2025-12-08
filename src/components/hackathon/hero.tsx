"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Code2, Terminal, Cpu } from "lucide-react";

export function Hero() {
    return (
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden bg-black px-4">
            {/* Background/Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f973161a_1px,transparent_1px),linear-gradient(to_bottom,#f973161a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            {/* Floating Elements (Background) */}
            <motion.div
                animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 left-10 md:left-20 text-orange-500/20"
            >
                <Code2 size={64} />
            </motion.div>
            <motion.div
                animate={{ y: [0, 30, 0], rotate: [0, -10, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-1/4 right-10 md:right-32 text-red-500/20"
            >
                <Terminal size={80} />
            </motion.div>

            <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
                {/* Presented By Logos */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mb-8"
                >
                    <div className="h-16 w-32 md:h-20 md:w-40 bg-white rounded-lg p-2 flex items-center justify-center">
                        <img
                            src="/nst-logo.png"
                            alt="Newton School of Technology"
                            className="max-h-full max-w-full object-contain"
                        />
                    </div>
                    <span className="text-neutral-500 font-medium uppercase tracking-widest text-xs md:text-sm">Presents</span>
                    <div className="h-16 w-32 md:h-20 md:w-40 bg-white rounded-lg p-2 flex items-center justify-center">
                        <img
                            src="/svyasa-logo.png"
                            alt="S-VYASA"
                            className="max-h-full max-w-full object-contain"
                        />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-950/30 text-orange-400 text-sm font-medium backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                        </span>
                        December 20, 2025
                    </span>
                </motion.div>


                {/* 50 Spots Limited Banner */}
                <motion.div
                    className="max-w-2xl mx-auto mt-6 mb-8"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className="px-6 py-3 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20 border-2 border-orange-500/50 rounded-xl backdrop-blur-sm shadow-lg shadow-orange-500/10">
                        <p className="text-center text-orange-200 font-bold text-sm md:text-base">
                            ⚡ Only <span className="text-orange-400 font-black text-lg md:text-xl">50 SPOTS</span> Available •
                            <span className="text-white"> Selection-Based</span> •
                            <span className="text-orange-400 font-black"> Register ASAP!</span>
                        </p>
                    </div>
                </motion.div>


                <motion.h1
                    className="text-6xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-neutral-500"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                >
                    Dev<span className="text-orange-500">Forge</span>
                </motion.h1>

                <motion.p
                    className="text-xl md:text-2xl text-neutral-400 max-w-2xl mx-auto leading-relaxed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                >
                    12 Hours. Infinite Coffee. <span className="text-white font-semibold">One Goal.</span>
                    <br />
                    Join the ultimate hackathon experience.
                </motion.p>

                <motion.div
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    <Link
                        href="/register"
                        className="group relative px-8 py-4 bg-orange-500 hover:bg-orange-400 text-black font-bold text-lg rounded-xl transition-all hover:shadow-[0_0_40px_-10px_rgba(249,115,22,0.5)]"
                    >
                        Register Now
                        <ArrowRight className="inline-block ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link
                        href="#schedule"
                        className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-medium text-lg rounded-xl border border-white/10 transition-colors backdrop-blur-sm"
                    >
                        View Schedule
                    </Link>
                </motion.div>
            </div>

            {/* Bottom Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        </section>
    );
}
