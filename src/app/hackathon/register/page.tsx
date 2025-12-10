"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Plus, Trash2, Users, User } from "lucide-react";
import { useState, useEffect } from "react";
import { getFirestoreDb } from "@/lib/firebase/client";
import { collection, addDoc } from "firebase/firestore";

const memberSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Valid phone number required"),
    gender: z.enum(["male", "female", "other"]),
    github: z.string().optional(),
    portfolio: z.string().optional(),
});

const formSchema = z.object({
    type: z.enum(["individual", "team"]),
    teamName: z.string().optional(),
    members: z.array(memberSchema).min(1, "At least one member is required").max(4, "Maximum 4 members allowed"),
}).refine((data) => {
    if (data.type === "team") {
        return !!data.teamName && data.members.length >= 2;
    }
    return true;
}, {
    message: "Team name and at least 2 members are required for team registration",
    path: ["teamName"], // pinpoint error
});

type FormData = z.infer<typeof formSchema>;

export default function RegisterPage() {
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    // "individual" | "team" | null - controlled by UI state before react-hook-form takes over fully? 
    // Actually, let's keep the split flow UI but integrate it into the form state or just set default values.
    const [registrationType, setRegistrationType] = useState<"individual" | "team" | null>(null);

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: "individual",
            members: [{ name: "", email: "", phone: "", gender: "male", github: "", portfolio: "" }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "members",
    });

    // Check Firebase connection on mount
    const [firebaseError, setFirebaseError] = useState<string | null>(null);
    useEffect(() => {
        // Simple check: do we have config?
        // Note: We can't import hasFirebaseConfig easily because it's in a non-component file, 
        // but we can check the env var availability which drives it.
        if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
            setFirebaseError("Missing Firebase Environment Variables (NEXT_PUBLIC_FIREBASE_API_KEY)");
        }
    }, []);

    // Watch type to adjust validation or UI if needed
    // const type = watch("type");

    const handleTypeSelect = (type: "individual" | "team") => {
        setRegistrationType(type);
        setValue("type", type);
        if (type === "team") {
            // Ensure at least 2 slots for team?
            if (fields.length < 2) {
                append({ name: "", email: "", phone: "", gender: "male", github: "", portfolio: "" });
            }
        } else {
            // Reset to 1 for individual
            if (fields.length > 1) {
                // remove extra fields? simplistic approach:
                setValue("members", [fields[0]]);
            }
        }
    };

    const onSubmit = async (data: FormData) => {
        setSubmitting(true);
        try {
            console.log("Submitting:", data);

            const db = getFirestoreDb();
            if (db) {
                const collectionRef = collection(db, "hackathon_registrations");
                await addDoc(collectionRef, {
                    ...data,
                    createdAt: new Date(),
                });
                console.log("Document written to Firestore");
            } else {
                console.warn("Firestore not initialized, skipping save");
                // Log the real issue
                if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
                    alert("Registration Failed: Firebase Config Missing. Please contact support.");
                } else {
                    alert("Registration Failed: Could not connect to database.");
                }
                return; // Stop here so we don't show success
            }

            // Send confirmation email (non-blocking - don't fail registration if email fails)
            try {
                const leadMember = data.members[0];
                const emailResponse = await fetch("/api/hackathon/send-confirmation", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: leadMember.email,
                        name: leadMember.name,
                        type: data.type,
                        teamName: data.teamName,
                        memberCount: data.members.length,
                    }),
                });

                const emailResult = await emailResponse.json();
                if (emailResult.success) {
                    console.log("✅ Confirmation email sent successfully");
                } else {
                    console.warn("⚠️ Failed to send confirmation email:", emailResult.error);
                }
            } catch (emailError) {
                console.error("⚠️ Error sending confirmation email (non-blocking):", emailError);
                // Continue with registration success even if email fails
            }

            // Simulate delay for better UX
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setSubmitted(true);
        } catch (error) {
            console.error("Error registering:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-neutral-900 border border-neutral-800 p-8 rounded-2xl text-center space-y-6"
                >
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500 mb-4">
                        <Check className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">You're In!</h2>
                    <p className="text-neutral-400">
                        Thanks for registering for DevForge. We've sent a confirmation email to your inbox with important next steps.
                    </p>
                    <p className="text-sm text-neutral-500 mt-2">
                        Please check your email (and spam folder) for details about the selection process.
                    </p>
                    <Link
                        href="https://hackathon.code4o4.xyz"
                        className="inline-block w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition-colors"
                    >
                        Back to Home
                    </Link>
                </motion.div>
            </div>
        );
    }

    if (!registrationType) {
        return (
            <div className="min-h-screen bg-black text-white p-4 md:p-8 flex items-center justify-center">
                <div className="max-w-4xl w-full">
                    {firebaseError && (
                        <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
                            <strong>System Error:</strong> {firebaseError}
                        </div>
                    )}
                    <Link href="https://hackathon.code4o4.xyz" className="inline-flex items-center text-neutral-400 hover:text-white mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Link>

                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">How do you want to participate?</h1>
                        <p className="text-neutral-400 text-lg">Choose your registration type to proceed.</p>

                        <div className="mt-6 max-w-2xl mx-auto px-6 py-4 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 border border-orange-500/30 rounded-xl backdrop-blur-sm">
                            <p className="text-orange-300 font-semibold">
                                ⚡ Only <span className="text-orange-400 font-bold text-lg">20 SLOTS</span> available •
                                <span className="text-white"> Registrations are selection-based</span> •
                                <span className="text-orange-400 font-bold"> Register ASAP!</span>
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <button
                            onClick={() => handleTypeSelect("individual")}
                            className="group relative p-8 bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-orange-500/50 transition-all text-left hover:bg-neutral-800/50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10">
                                <Users className="w-12 h-12 text-orange-500 mb-6" />
                                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">Individual</h3>
                                <p className="text-neutral-400">Join solo, meet new people, and form a team at the event or check in alone.</p>
                            </div>
                        </button>

                        <button
                            onClick={() => handleTypeSelect("team")}
                            className="group relative p-8 bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-orange-500/50 transition-all text-left hover:bg-neutral-800/50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10">
                                <div className="flex -space-x-4 mb-6">
                                    <div className="w-12 h-12 rounded-full bg-neutral-800 border-2 border-black flex items-center justify-center text-orange-500 z-10"><User /></div>
                                    <div className="w-12 h-12 rounded-full bg-neutral-800 border-2 border-black flex items-center justify-center text-orange-500/80"><User /></div>
                                    <div className="w-12 h-12 rounded-full bg-neutral-800 border-2 border-black flex items-center justify-center text-orange-500/60"><User /></div>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">Team</h3>
                                <p className="text-neutral-400">Register with your squad (2-4 members). Bring your whole team!</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8">
            <button
                onClick={() => setRegistrationType(null)}
                className="inline-flex items-center text-neutral-400 hover:text-white mb-8 transition-colors"
                type="button"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Selection
            </button>

            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">
                        Register as <span className="text-orange-500 capitalize">{registrationType}</span>
                    </h1>
                    <p className="text-neutral-400">Fill out the details below.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Team Name - Only for Teams */}
                    {registrationType === "team" && (
                        <div className="space-y-2 p-6 bg-neutral-900/50 border border-neutral-800 rounded-xl">
                            <label className="text-sm font-medium text-neutral-300">Team Name</label>
                            <input
                                {...register("teamName")}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all placeholder:text-neutral-600"
                                placeholder="Enter your team name"
                            />
                            {errors.teamName && <p className="text-red-400 text-sm">{errors.teamName.message}</p>}
                        </div>
                    )}

                    {/* Member Fields */}
                    <div className="space-y-6">
                        {fields.map((field, index) => (
                            <motion.div
                                key={field.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />

                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <User className="w-5 h-5 text-orange-500" />
                                        {registrationType === "individual" ? "Your Details" : `Member ${index + 1} ${index === 0 ? "(Leader)" : ""}`}
                                    </h3>
                                    {registrationType === "team" && index > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="text-neutral-500 hover:text-red-400 transition-colors p-2"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-neutral-300">Full Name</label>
                                        <input
                                            {...register(`members.${index}.name`)}
                                            className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all placeholder:text-neutral-600"
                                            placeholder="John Doe"
                                        />
                                        {errors.members?.[index]?.name && (
                                            <p className="text-red-400 text-sm">{errors.members[index]?.name?.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-neutral-300">Email Address</label>
                                        <input
                                            {...register(`members.${index}.email`)}
                                            type="email"
                                            className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all placeholder:text-neutral-600"
                                            placeholder="john@example.com"
                                        />
                                        {errors.members?.[index]?.email && (
                                            <p className="text-red-400 text-sm">{errors.members[index]?.email?.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-neutral-300">Phone Number</label>
                                        <input
                                            {...register(`members.${index}.phone`)}
                                            className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all placeholder:text-neutral-600"
                                            placeholder="+91 9876543210"
                                        />
                                        {errors.members?.[index]?.phone && (
                                            <p className="text-red-400 text-sm">{errors.members[index]?.phone?.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-neutral-300">Gender</label>
                                        <select
                                            {...register(`members.${index}.gender`)}
                                            className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all placeholder:text-neutral-600"
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                        {errors.members?.[index]?.gender && (
                                            <p className="text-red-400 text-sm">{errors.members[index]?.gender?.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-neutral-300">GitHub (Optional)</label>
                                        <input
                                            {...register(`members.${index}.github`)}
                                            className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all placeholder:text-neutral-600"
                                            placeholder="@username"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-neutral-300">Portfolio/LinkedIn (Optional)</label>
                                        <input
                                            {...register(`members.${index}.portfolio`)}
                                            className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all placeholder:text-neutral-600"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {registrationType === "team" && fields.length < 4 && (
                        <button
                            type="button"
                            onClick={() => append({ name: "", email: "", phone: "", gender: "male", github: "", portfolio: "" })}
                            className="w-full py-4 border-2 border-dashed border-neutral-800 rounded-xl text-neutral-400 hover:text-white hover:border-neutral-600 hover:bg-neutral-900 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> Add Team Member (Max 4)
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 text-lg shadow-lg shadow-orange-500/20"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" /> Registering...
                            </>
                        ) : (
                            "Complete Registration"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
