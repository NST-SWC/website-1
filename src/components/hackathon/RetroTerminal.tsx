"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const terminalLines = [
    "Welcome to DevForge",
    "────────────────────",
    "",
    "$ Loading hackathon.app",
    "→ Brewing coffee... ☕",
    "→ Compiling dreams...",
    "→ Building innovation",
    "",
    "✓ System Ready!",
    "",
    "12 Hours. One Goal.",
    "Let's build something",
    "amazing together! 🚀"
];

export function RetroTerminal() {
    const [displayedLines, setDisplayedLines] = useState<string[]>([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const [showCursor, setShowCursor] = useState(true);

    // Typing effect
    useEffect(() => {
        if (currentLineIndex >= terminalLines.length) {
            const timeout = setTimeout(() => {
                setDisplayedLines([]);
                setCurrentLineIndex(0);
                setCurrentCharIndex(0);
            }, 4000);
            return () => clearTimeout(timeout);
        }

        const currentLine = terminalLines[currentLineIndex];
        
        if (currentCharIndex < currentLine.length) {
            const timeout = setTimeout(() => {
                setDisplayedLines(prev => {
                    const newLines = [...prev];
                    if (newLines.length <= currentLineIndex) {
                        newLines.push("");
                    }
                    newLines[currentLineIndex] = currentLine.substring(0, currentCharIndex + 1);
                    return newLines;
                });
                setCurrentCharIndex(prev => prev + 1);
            }, 40 + Math.random() * 20);
            return () => clearTimeout(timeout);
        } else {
            const timeout = setTimeout(() => {
                setCurrentLineIndex(prev => prev + 1);
                setCurrentCharIndex(0);
            }, 200);
            return () => clearTimeout(timeout);
        }
    }, [currentLineIndex, currentCharIndex]);

    // Cursor blink
    useEffect(() => {
        const interval = setInterval(() => {
            setShowCursor(prev => !prev);
        }, 530);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="relative mx-auto"
            style={{ maxWidth: "320px" }}
        >
            {/* Classic Macintosh Body */}
            <div 
                className="relative rounded-[20px] p-[3px]"
                style={{
                    background: "linear-gradient(180deg, #e8e4d9 0%, #d4cfc2 50%, #c9c4b7 100%)",
                    boxShadow: `
                        0 30px 60px rgba(0,0,0,0.3),
                        0 10px 20px rgba(0,0,0,0.2),
                        inset 0 2px 0 rgba(255,255,255,0.6),
                        inset 0 -2px 4px rgba(0,0,0,0.1)
                    `
                }}
            >
                <div 
                    className="rounded-[18px] p-4 pb-6"
                    style={{
                        background: "linear-gradient(180deg, #d9d5c8 0%, #ccc8bb 100%)",
                    }}
                >
                    {/* Top vents - Classic Macintosh style */}
                    <div className="flex justify-center gap-1 mb-3">
                        {[...Array(11)].map((_, i) => (
                            <div 
                                key={i}
                                className="w-4 h-1 rounded-full"
                                style={{
                                    background: "linear-gradient(180deg, #a8a396 0%, #bfbab0 100%)",
                                    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)"
                                }}
                            />
                        ))}
                    </div>
                    
                    {/* Screen bezel */}
                    <div 
                        className="rounded-lg p-2"
                        style={{
                            background: "linear-gradient(180deg, #3d3d3d 0%, #2a2a2a 100%)",
                            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.1)"
                        }}
                    >
                        {/* CRT Screen with classic green/amber phosphor */}
                        <div 
                            className="relative rounded overflow-hidden"
                            style={{
                                background: "#1a1a18",
                                boxShadow: "inset 0 0 30px rgba(0,0,0,0.8), inset 0 0 60px rgba(34,197,94,0.05)"
                            }}
                        >
                            {/* Scanlines */}
                            <div 
                                className="absolute inset-0 pointer-events-none z-20 opacity-30"
                                style={{
                                    background: "repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)",
                                }}
                            />
                            
                            {/* Screen curvature/vignette */}
                            <div 
                                className="absolute inset-0 pointer-events-none z-30"
                                style={{
                                    background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)",
                                }}
                            />
                            
                            {/* Subtle screen reflection */}
                            <div 
                                className="absolute inset-0 pointer-events-none z-10 opacity-10"
                                style={{
                                    background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)",
                                }}
                            />
                            
                            {/* Terminal content */}
                            <div 
                                className="relative z-10 p-4 font-mono text-xs leading-relaxed"
                                style={{ minHeight: "200px" }}
                            >
                                {displayedLines.map((line, index) => (
                                    <div 
                                        key={index}
                                        className="text-green-400"
                                        style={{
                                            textShadow: "0 0 8px rgba(74,222,128,0.6), 0 0 2px rgba(74,222,128,0.4)",
                                            fontFamily: "'Chicago', 'Monaco', 'Courier New', monospace",
                                            letterSpacing: "0.5px"
                                        }}
                                    >
                                        {line || "\u00A0"}
                                        {index === displayedLines.length - 1 && showCursor && (
                                            <span 
                                                className="inline-block w-2 h-3 ml-0.5 align-middle"
                                                style={{
                                                    background: "#4ade80",
                                                    boxShadow: "0 0 6px rgba(74,222,128,0.8)"
                                                }}
                                            />
                                        )}
                                    </div>
                                ))}
                                {displayedLines.length === 0 && (
                                    <span 
                                        className="inline-block w-2 h-3"
                                        style={{
                                            background: showCursor ? "#4ade80" : "transparent",
                                            boxShadow: showCursor ? "0 0 6px rgba(74,222,128,0.8)" : "none"
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Bottom section with floppy drive and logo */}
                    <div className="mt-4 flex items-center justify-between px-2">
                        {/* DevForge Logo area */}
                        <div className="flex items-center gap-2">
                            <span 
                                className="text-xs font-bold tracking-wide"
                                style={{
                                    color: "#6b6459",
                                    fontFamily: "system-ui"
                                }}
                            >
                                DevForge
                            </span>
                        </div>
                        
                        {/* Floppy drive slot */}
                        <div 
                            className="w-24 h-3 rounded-sm relative overflow-hidden"
                            style={{
                                background: "linear-gradient(180deg, #4a4840 0%, #3d3b35 50%, #4a4840 100%)",
                                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.1)"
                            }}
                        >
                            {/* Drive slot opening */}
                            <div 
                                className="absolute inset-x-1 top-0.5 bottom-0.5 rounded-sm"
                                style={{
                                    background: "linear-gradient(180deg, #1a1918 0%, #2a2825 100%)",
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Stand/Base */}
            <div 
                className="mx-auto mt-1"
                style={{
                    width: "180px",
                    height: "8px",
                    background: "linear-gradient(180deg, #c9c4b7 0%, #b8b3a6 100%)",
                    borderRadius: "0 0 4px 4px",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
                }}
            />
            
            {/* Ambient glow */}
            <div 
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 h-12 rounded-full blur-2xl opacity-40"
                style={{
                    background: "radial-gradient(ellipse, rgba(74,222,128,0.4) 0%, transparent 70%)"
                }}
            />
            
            {/* Retro label */}
            <motion.div 
                className="text-center mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
            >
                <p 
                    className="text-neutral-500 text-xs tracking-[0.3em] font-mono uppercase"
                    style={{ letterSpacing: "0.25em" }}
                >
                    [ Retro Tech Mode ]
                </p>
                <p className="text-neutral-600 text-[10px] mt-1 font-mono">
                    Circa 1984 • Built for the future
                </p>
            </motion.div>
        </motion.div>
    );
}
