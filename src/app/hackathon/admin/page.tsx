"use client";

import { useState, useEffect } from "react";
import { getFirestoreDb } from "@/lib/firebase/client";
import { collection, getDocs, addDoc, query, orderBy, Timestamp } from "firebase/firestore";
import { Loader2, Upload, Download, Search, RefreshCw, Users, User, ShieldCheck, XCircle } from "lucide-react";
import { motion } from "framer-motion";

const ADMIN_CODE = "12345678@";

type Member = {
    name: string;
    email: string;
    phone: string;
    gender: string;
    github?: string;
    portfolio?: string;
};

type Registration = {
    id: string;
    type: "individual" | "team";
    teamName?: string;
    members: Member[];
    createdAt: any;
};

export default function AdminPage() {
    const [accessGranted, setAccessGranted] = useState(false);
    const [accessInput, setAccessInput] = useState("");
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [importing, setImporting] = useState(false);
    const [configError, setConfigError] = useState<string | null>(null);

    useEffect(() => {
        const cached = localStorage.getItem("devforge_admin_access");
        if (cached === "true") {
            setAccessGranted(true);
            fetchData();
        }
    }, []);

    const verifyAccess = () => {
        if (accessInput === ADMIN_CODE) {
            setAccessGranted(true);
            localStorage.setItem("devforge_admin_access", "true");
            fetchData();
        } else {
            alert("Invalid Access Code");
        }
    };

    const fetchData = async () => {
        setLoading(true);
        setConfigError(null);
        try {
            if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
                throw new Error("Missing Environment Variables (NEXT_PUBLIC_FIREBASE_API_KEY). Check your Vercel Project Settings.");
            }
            const db = getFirestoreDb();
            if (!db) {
                throw new Error("Firestore not initialized. Possible config error.");
            }
            // Note: OrderBy might require an index, using simple fetch for now if it fails
            const q = query(collection(db, "hackathon_registrations"), orderBy("createdAt", "desc"));

            // Fallback if index missing: just getDocs(collection(...)) and sort client side
            let snapshot;
            try {
                snapshot = await getDocs(q);
            } catch (e) {
                console.warn("Index query failed, fetching unsorted", e);
                snapshot = await getDocs(collection(db, "hackathon_registrations"));
            }

            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Registration[];

            // Client sort if needed
            data.sort((a, b) => {
                const tA = a.createdAt?.seconds || 0;
                const tB = b.createdAt?.seconds || 0;
                return tB - tA;
            });

            setRegistrations(data);
        } catch (error) {
            console.error("Error fetching data:", error);
            setConfigError(error instanceof Error ? error.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImporting(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            const rows = text.split("\n").slice(1); // Skip header
            const db = getFirestoreDb();

            if (!db) {
                alert("Database not connected");
                setImporting(false);
                return;
            }

            let count = 0;
            const batchPromises = [];
            const collectionRef = collection(db, "hackathon_registrations");

            for (const row of rows) {
                if (!row.trim()) continue;
                // Expected CSV: Type, TeamName, Name, Email, Phone, Gender, Github, Portfolio
                const cols = row.split(",").map(c => c.trim().replace(/^"|"$/g, ''));
                if (cols.length < 4) continue;

                const [type, teamName, name, email, phone, gender, github, portfolio] = cols;
                const regData = {
                    type: (type?.toLowerCase() === "team" ? "team" : "individual"),
                    teamName: teamName || "",
                    members: [{
                        name: name || "",
                        email: email || "",
                        phone: phone || "",
                        gender: gender || "other",
                        github: github || "",
                        portfolio: portfolio || ""
                    }],
                    createdAt: new Date()
                };

                batchPromises.push(addDoc(collectionRef, regData));
                count++;
            }

            await Promise.all(batchPromises);
            alert(`Imported ${count} registrations successfully!`);
            setImporting(false);
            fetchData();
        };
        reader.readAsText(file);
    };

    const exportCSV = () => {
        // Flatten data
        const headers = ["ID", "Type", "Team Name", "Member Name", "Email", "Phone", "Gender", "GitHub", "Portfolio", "Registered At"];
        const rows = registrations.flatMap(reg =>
            reg.members.map(m => [
                reg.id,
                reg.type,
                reg.teamName || "N/A",
                `"${m.name}"`,
                m.email,
                m.phone,
                m.gender,
                m.github || "",
                m.portfolio || "",
                reg.createdAt ? new Date(reg.createdAt.seconds * 1000).toLocaleString() : "N/A"
            ].join(","))
        );

        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `hackathon_registrations_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Stats
    const totalRegistrations = registrations.length;
    const totalParticipants = registrations.reduce((acc, curr) => acc + curr.members.length, 0);
    const teamsCount = registrations.filter(r => r.type === "team").length;

    if (!accessGranted) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 p-8 rounded-2xl">
                    <div className="flex justify-center mb-6 text-orange-500">
                        <ShieldCheck size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-white text-center mb-6">Admin Access</h2>
                    <div className="space-y-4">
                        <input
                            type="password"
                            placeholder="Enter Access Code"
                            className="w-full bg-black border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                            value={accessInput}
                            onChange={(e) => setAccessInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && verifyAccess()}
                        />
                        <button
                            onClick={verifyAccess}
                            className="w-full bg-orange-500 text-black font-bold py-3 rounded-lg hover:bg-orange-400 transition-colors"
                        >
                            Unlock Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Hackathon Admin</h1>
                        <p className="text-neutral-400">Manage registrations and data</p>
                    </div>
                    <div className="flex gap-3">
                        <label className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg cursor-pointer transition-colors">
                            <Upload size={18} />
                            <span>Import CSV</span>
                            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" disabled={importing} />
                        </label>
                        <button onClick={exportCSV} className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg transition-colors">
                            <Download size={18} />
                            <span>Export CSV</span>
                        </button>
                        <button onClick={fetchData} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black px-4 py-2 rounded-lg transition-colors font-medium">
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {configError && (
                    <div className="p-4 bg-red-500/10 border border-red-500 rounded-xl text-red-200 flex items-center gap-3">
                        <XCircle className="w-6 h-6 shrink-0" />
                        <div>
                            <strong>Connection Error:</strong> {configError}
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
                        <div className="text-neutral-400 mb-1">Total Registrations</div>
                        <div className="text-3xl font-bold">{totalRegistrations}</div>
                    </div>
                    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
                        <div className="text-neutral-400 mb-1">Total Participants</div>
                        <div className="text-3xl font-bold text-orange-500">{totalParticipants}</div>
                    </div>
                    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
                        <div className="text-neutral-400 mb-1">Teams Created</div>
                        <div className="text-3xl font-bold">{teamsCount}</div>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, team, or email..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-orange-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Table */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-neutral-800/50 border-b border-neutral-800 text-neutral-400 text-sm">
                                    <th className="p-4 font-medium">Type</th>
                                    <th className="p-4 font-medium">Team / Name</th>
                                    <th className="p-4 font-medium">Members</th>
                                    <th className="p-4 font-medium">Contact</th>
                                    <th className="p-4 font-medium">Registered</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {registrations
                                    .filter(r => {
                                        const search = searchTerm.toLowerCase();
                                        const teamMatch = r.teamName?.toLowerCase().includes(search);
                                        const memberMatch = r.members.some(m => m.name.toLowerCase().includes(search) || m.email.toLowerCase().includes(search));
                                        return teamMatch || memberMatch;
                                    })
                                    .map((reg) => (
                                        <tr key={reg.id} className="hover:bg-neutral-800/30 transition-colors">
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${reg.type === 'team' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                                    {reg.type.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {reg.type === 'team' ? (
                                                    <span className="font-semibold text-white">{reg.teamName}</span>
                                                ) : (
                                                    <span className="text-white">{reg.members[0]?.name}</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    {reg.members.map((m, i) => (
                                                        <div key={i} className="text-sm text-neutral-300 flex items-center gap-2">
                                                            <User size={12} className="text-neutral-500" />
                                                            {m.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 font-mono text-sm text-neutral-400">
                                                {reg.members[0]?.email}
                                                <div className="text-xs opacity-60">{reg.members[0]?.phone}</div>
                                            </td>
                                            <td className="p-4 text-sm text-neutral-500">
                                                {reg.createdAt?.seconds ? new Date(reg.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                {registrations.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-neutral-500">
                                            No registrations found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
