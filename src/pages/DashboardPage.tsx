import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import {
    Zap,
    Video,
    Youtube,
    Share2,
    PlayCircle,
    Plus,
    Search,
    Settings,
    LogOut,
    ChevronRight,
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertCircle,
    Instagram,
    Facebook
} from "lucide-react";
import { Button } from "../components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Types ──────────────────────────────────────────────────────────────────
interface Channel { id: string; name: string; url: string; status: string; thumbnail?: string; }
interface Clip { id: string; title: string; hook: string; viral_score: number; file_url: string; status: string; created_at: string; channel_name: string; thumbnail?: string; }
interface VideoJob { id: string; title: string; step: string; percent: number; message: string; status: string; }

// ── Components ────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
    return (
        <div className="glass-card rounded-2xl p-6 border-white/5 hover:border-white/10 transition-all group">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
                    <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-mono text-muted-foreground">+12% ✨</span>
            </div>
            <div className="text-2xl font-display tracking-tight text-foreground mb-1">{value}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest font-mono">{label}</div>
        </div>
    );
}

export default function DashboardPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("clips");
    const [url, setUrl] = useState("");
    const [processing, setProcessing] = useState(false);

    // Mock data for UI demonstration
    const [clips] = useState<Clip[]>([]);
    const [channels] = useState<Channel[]>([]);
    const [runs, setRuns] = useState<VideoJob[]>([]);

    useEffect(() => {
        const socket: Socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000");

        socket.on("video-progress", (data: VideoJob) => {
            setRuns(prev => {
                const index = prev.findIndex(r => r.id === data.id);
                if (index > -1) {
                    const newRuns = [...prev];
                    newRuns[index] = data;
                    return newRuns;
                }
                return [data, ...prev];
            });
        });

        return () => { socket.disconnect(); };
    }, []);

    const handleProcess = async () => {
        if (!url) return;
        setProcessing(true);
        // API Call logic
        setTimeout(() => {
            setProcessing(false);
            setUrl("");
        }, 2000);
    };

    const menuItems = [
        { id: "clips", label: "Meus Clips", icon: Video },
        { id: "channels", label: "Canais", icon: Youtube },
        { id: "platforms", label: "Plataformas", icon: Share2 },
        { id: "runs", label: "Agent Runs", icon: PlayCircle },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 flex flex-col bg-background relative z-20">
                <div className="p-8 pb-4">
                    <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => navigate("/")}>
                        <Zap className="h-6 w-6 text-primary animate-flicker" fill="currentColor" />
                        <span className="font-display text-2xl tracking-wider pt-1">CLIPSTRIKE</span>
                    </div>

                    <nav className="space-y-1">
                        {menuItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.id
                                    ? "bg-gradient-primary text-white shadow-lg shadow-primary/20"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                    }`}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-8 pt-4 border-t border-white/5">
                    <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground w-full transition-all">
                        <Settings className="h-4 w-4" />
                        Configurações
                    </button>
                    <button
                        onClick={() => { localStorage.removeItem("token"); navigate("/login"); }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 w-full transition-all"
                    >
                        <LogOut className="h-4 w-4" />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative z-10">
                {/* Background Hint */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />

                <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 sticky top-0 bg-background/80 backdrop-blur-md z-30">
                    <h2 className="text-2xl font-display uppercase tracking-wider">{menuItems.find(m => m.id === activeTab)?.label}</h2>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar clips..."
                                className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-primary/50 w-64 transition-all"
                            />
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-primary p-[1px] glow-effect">
                            <div className="w-full h-full rounded-full bg-background flex items-center justify-center font-bold text-xs">JD</div>
                        </div>
                    </div>
                </header>

                <div className="p-10">
                    {/* Dashboard Home - Stats */}
                    {activeTab === "clips" && (
                        <div className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <StatCard label="Clips Gerados" value="1,284" icon={Video} color="text-primary" />
                                <StatCard label="Visualizações" value="84.2K" icon={TrendingUp} color="text-emerald-500" />
                                <StatCard label="Horas Salvas" value="156h" icon={Clock} color="text-amber-500" />
                                <StatCard label="Score Viral" value="92%" icon={Zap} color="text-indigo-500" />
                            </div>

                            {/* Action Section */}
                            <div className="glass-card rounded-3xl p-10 border-gradient">
                                <div className="max-w-2xl">
                                    <h3 className="text-3xl font-display mb-4">CRIE CLIPS AGORA</h3>
                                    <p className="text-muted-foreground mb-8">Cole a URL de um vídeo do YouTube para que nossa IA comece a mágica.</p>

                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={url}
                                            onChange={e => setUrl(e.target.value)}
                                            placeholder="https://youtube.com/watch?v=..."
                                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                        />
                                        <Button
                                            onClick={handleProcess}
                                            disabled={processing || !url}
                                            className="h-14 px-10 rounded-2xl bg-gradient-primary text-white font-bold glow-effect hover:scale-105 transition-transform border-0"
                                        >
                                            {processing ? "Iniciando..." : "Processar Vídeo"}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Content Grid (Placeholder) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {clips.length > 0 ? (
                                    clips.map(clip => (
                                        <div key={clip.id} className="glass-card rounded-2xl overflow-hidden border-white/5 hover:border-white/10 transition-all">
                                            <div className="aspect-video bg-white/5 relative group">
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                                    <PlayCircle className="h-12 w-12 text-white" />
                                                </div>
                                            </div>
                                            <div className="p-5">
                                                <div className="text-xs text-primary font-mono mb-2">SCORE: {clip.viral_score}%</div>
                                                <h4 className="font-bold text-sm mb-4 line-clamp-1">{clip.title}</h4>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] text-muted-foreground uppercase">{clip.channel_name}</span>
                                                    <Button size="sm" variant="ghost" className="h-8 text-xs hover:text-primary">Download</Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-3 py-20 text-center glass-card rounded-2xl border-dashed border-white/10">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                                            <Video className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground font-medium">Nenhum clip gerado ainda.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Runs Section */}
                    {activeTab === "runs" && (
                        <div className="space-y-6">
                            {runs.map(run => (
                                <div key={run.id} className="glass-card rounded-2xl p-6 border-white/5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                <PlayCircle className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm">{run.title}</h4>
                                                <p className="text-xs text-muted-foreground">{run.message}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-display text-primary">{run.percent}%</div>
                                            <div className="text-[10px] font-mono uppercase text-muted-foreground">{run.step}</div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-primary transition-all duration-500 ease-out"
                                            style={{ width: `${run.percent}%` }}
                                        />
                                    </div>

                                    <div className="mt-4 flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${run.status === "processing" ? "bg-primary" : "bg-emerald-500"}`} />
                                            {run.status === "processing" ? "Processando" : "Finalizado"}
                                        </div>
                                        <div>Started 2m ago</div>
                                    </div>
                                </div>
                            ))}

                            {runs.length === 0 && (
                                <div className="py-20 text-center glass-card rounded-2xl border-dashed border-white/10">
                                    <p className="text-muted-foreground font-medium">Nenhuma tarefa ativa no momento.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Platforms Section */}
                    {activeTab === "platforms" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { name: "YouTube", icon: Youtube, connected: true, color: "hover:border-red-500/50" },
                                { name: "TikTok", icon: Music, connected: false, color: "hover:border-cyan-500/50" },
                                { name: "Instagram", icon: Instagram, connected: false, color: "hover:border-pink-500/50" },
                                { name: "Facebook", icon: Facebook, connected: false, color: "hover:border-blue-500/50" },
                            ].map(p => (
                                <div key={p.name} className={`glass-card rounded-2xl p-8 border-white/5 transition-all ${p.color}`}>
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                                                <p.icon className="h-6 w-6" />
                                            </div>
                                            <h4 className="text-xl font-display">{p.name}</h4>
                                        </div>
                                        {p.connected ? (
                                            <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full uppercase">
                                                Conectado
                                            </span>
                                        ) : (
                                            <Button size="sm" className="bg-white/5 text-xs border-0 hover:bg-primary hover:text-white transition-all">Conectar</Button>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-0">Postagens automáticas ativadas para clips virais.</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

// Mock icon for Music (TikTok)
function Music(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
        </svg>
    );
}
