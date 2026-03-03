import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Youtube, Music, Instagram, Facebook } from "lucide-react";

function SetupLayout({ step, title, subtitle, children }: {
    step: 1 | 2; title: string; subtitle: string; children: React.ReactNode;
}) {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-[#0B0F19] text-white font-sans flex flex-col relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] opacity-30 mix-blend-screen" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] opacity-20 mix-blend-screen" />
            </div>

            <nav className="relative z-50 flex items-center justify-between px-8 h-20 border-b border-white/5 bg-black/20 backdrop-blur-md">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                        <Zap className="h-5 w-5 text-white" fill="currentColor" />
                    </div>
                    <span className="font-display text-xl font-bold tracking-tight bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 bg-clip-text text-transparent pt-1">
                        EasySlice.AI
                    </span>
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]">1</div>
                        <span className="hidden sm:inline">Channels</span>
                    </div>
                    <div className="w-10 h-px bg-purple-500" />
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]">2</div>
                        <span className="hidden sm:inline">Platforms</span>
                    </div>
                </div>

                <div className="w-24 hidden sm:block" />
            </nav>

            <div className="flex-1 relative z-10 flex flex-col items-center px-6 pt-16 pb-20">
                <div className="w-full max-w-4xl">
                    <div className="text-center mb-12 fade-in">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{title}</h1>
                        <p className="text-white/50 max-w-md mx-auto leading-relaxed text-sm">{subtitle}</p>
                    </div>
                    {children}
                </div>
            </div>

            <style>{`
                .fade-in { animation: fadeIn 0.6s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
                .border-gradient-s { position: relative; }
                .border-gradient-s::after { content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1px; background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05)); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
            `}</style>
        </div>
    );
}

export default function SetupPlatformsPage() {
    const navigate = useNavigate();
    const [connected, setConnected] = useState<string[]>([]);

    const platforms = [
        { id: "youtube", name: "YouTube", desc: "Post clips as YouTube Shorts", icon: <Youtube className="h-6 w-6 text-red-500" />, color: "red" },
        { id: "tiktok", name: "TikTok", desc: "Short viral video platform", icon: <Music className="h-6 w-6 text-cyan-400" />, color: "cyan" },
        { id: "instagram", name: "Instagram", desc: "Post as Reels automatically", icon: <Instagram className="h-6 w-6 text-pink-500" />, color: "pink" },
        { id: "facebook", name: "Facebook", desc: "Share to Reels & Feed", icon: <Facebook className="h-6 w-6 text-blue-500" />, color: "blue" },
    ];

    const toggleConnect = (id: string) => {
        setConnected(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    return (
        <SetupLayout
            step={2}
            title="Connect Your Platforms"
            subtitle="Connect your social media accounts where you want your clips to be automatically posted."
        >
            <div className="space-y-12 fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {platforms.map(p => (
                        <div key={p.id} className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-gradient-s flex items-center justify-between group hover:border-white/20 transition-all">
                            <div className="flex items-center gap-5">
                                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center transition-transform group-hover:scale-110`}>
                                    {p.icon}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{p.name}</h3>
                                    <p className="text-white/40 text-xs mt-1">{p.desc}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => toggleConnect(p.id)}
                                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${connected.includes(p.id)
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                        : "bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:scale-[1.05]"
                                    }`}
                            >
                                {connected.includes(p.id) ? "Connected" : "Connect"}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="max-w-md mx-auto">
                    <button
                        disabled={connected.length === 0}
                        onClick={() => navigate("/dashboard")}
                        className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:scale-[1.01] transition-all disabled:opacity-40 disabled:scale-100 disabled:shadow-none"
                    >
                        {connected.length > 0 ? "Complete Setup" : "Connect at least one platform to continue"}
                    </button>
                </div>
            </div>

            {/* Subtle Glows */}
            <div className="absolute top-1/2 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-pink-600/10 rounded-full blur-[100px] pointer-events-none" />
        </SetupLayout>
    );
}
