import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Types ──────────────────────────────────────────────────────────────────
interface Channel { id: string; name: string; url: string; status: string; thumbnail?: string; }
interface Clip { id: string; title: string; hook: string; viral_score: number; file_url: string; status: string; created_at: string; channel_name: string; thumbnail?: string; }
interface VideoJob { id: string; title: string; step: string; percent: number; message: string; status: string; }

// ── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string }> = {
        pending: { label: "PENDENTE", cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
        processing: { label: "PROCESSANDO", cls: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
        done: { label: "CONCLUÍDO", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
        error: { label: "ERRO", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
        monitoring: { label: "MONITORANDO", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    };
    const s = map[status] || { label: status.toUpperCase(), cls: "bg-zinc-800 text-zinc-400 border-zinc-700" };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wider ${s.cls}`}>
            {s.label}
        </span>
    );
}

// ── Progress bar ───────────────────────────────────────────────────────────
function ProgressJob({ job }: { job: VideoJob }) {
    return (
        <div className="bg-[#111] border border-white/6 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-white truncate max-w-[60%]">{job.title}</span>
                <span className="text-xs text-orange-400 font-bold">{job.percent}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
                <div
                    className="h-full bg-gradient-to-r from-red-600 to-orange-400 rounded-full transition-all duration-500"
                    style={{ width: `${job.percent}%` }}
                />
            </div>
            <p className="text-xs text-zinc-500">{job.message}</p>
        </div>
    );
}

// ── Clip card ──────────────────────────────────────────────────────────────
function ClipCard({ clip }: { clip: Clip }) {
    const scoreColor = clip.viral_score >= 90 ? "text-emerald-400" : clip.viral_score >= 70 ? "text-orange-400" : "text-zinc-400";
    return (
        <div className="flex gap-4 items-center bg-[#111] border border-white/6 rounded-xl p-4 hover:bg-[#161616] transition-colors group">
            {/* Thumbnail */}
            <div className="w-20 h-14 rounded-lg bg-zinc-900 border border-white/5 flex-shrink-0 overflow-hidden relative">
                {clip.thumbnail ? (
                    <img src={clip.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">🎬</div>
                )}
                {clip.viral_score && (
                    <div className={`absolute top-1 right-1 text-[9px] font-black ${scoreColor}`}>
                        {clip.viral_score}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{clip.title}</div>
                {clip.hook && (
                    <div className="text-xs text-orange-400 mt-0.5 truncate">"{clip.hook}"</div>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-zinc-600">{clip.channel_name}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-xs text-zinc-600">
                        {new Date(clip.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
                <StatusBadge status={clip.status} />
                {clip.file_url && clip.status === "done" && (
                    <a
                        href={clip.file_url}
                        download
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20"
                    >
                        ↓ Download
                    </a>
                )}
            </div>
        </div>
    );
}

// ── Channel card ───────────────────────────────────────────────────────────
function ChannelCard({ channel, onImport }: { channel: Channel; onImport: (id: string) => void }) {
    return (
        <div className="bg-[#111] border border-white/6 rounded-xl p-5 hover:bg-[#161616] transition-colors">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-700 to-orange-500 flex items-center justify-center text-lg flex-shrink-0">
                    {channel.thumbnail ? <img src={channel.thumbnail} className="w-full h-full rounded-xl object-cover" alt="" /> : "▶"}
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate">{channel.name}</div>
                    <div className="text-xs text-zinc-600 truncate">{channel.url}</div>
                </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400">Monitorando</span>
            </div>
            <button
                onClick={() => onImport(channel.id)}
                className="w-full py-2 rounded-lg border border-white/8 text-zinc-400 text-xs font-medium hover:border-white/20 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
                🎬 Importar Vídeos
            </button>
        </div>
    );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function DashboardPage() {
    const navigate = useNavigate();
    const [tab, setTab] = useState<"clips" | "channels" | "platforms" | "runs">("clips");
    const [channels, setChannels] = useState<Channel[]>([]);
    const [clips, setClips] = useState<Clip[]>([]);
    const [jobs, setJobs] = useState<VideoJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [addVideoUrl, setAddVideoUrl] = useState("");
    const [addingVideo, setAddingVideo] = useState(false);

    // Stats
    const stats = {
        channels: channels.length,
        platforms: 0, // will come from API
        activeRuns: jobs.filter(j => j.status === "processing").length,
    };

    // Load data
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/login"); return; }
        fetchData(token);

        const s = io(API_URL.replace("/api", ""), { auth: { token } });
        s.on("video-progress", (data: { videoId: string; step: string; percent: number; message: string }) => {
            setJobs(prev => prev.map(j =>
                j.id === data.videoId
                    ? { ...j, step: data.step, percent: data.percent, message: data.message, status: data.percent === 100 ? "done" : "processing" }
                    : j
            ));
            if (data.percent === 100) fetchData(token);
        });
        setSocket(s);
        return () => { s.disconnect(); };
    }, [navigate]);

    async function fetchData(token: string) {
        setLoading(true);
        try {
            const [chRes, clRes] = await Promise.all([
                fetch(`${API_URL}/channels`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/clips`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            if (chRes.ok) setChannels(await chRes.json());
            if (clRes.ok) setClips(await clRes.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddVideo() {
        const token = localStorage.getItem("token");
        if (!addVideoUrl.trim() || !token) return;
        setAddingVideo(true);
        try {
            const res = await fetch(`${API_URL}/videos/import`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ url: addVideoUrl }),
            });
            if (res.ok) {
                const data = await res.json();
                setJobs(prev => [...prev, {
                    id: data.videoId,
                    title: data.title || addVideoUrl,
                    step: "INIT",
                    percent: 0,
                    message: "Iniciando processamento...",
                    status: "processing",
                }]);
                setAddVideoUrl("");
                setTab("runs");
            }
        } catch (e) { console.error(e); }
        finally { setAddingVideo(false); }
    }

    async function handleImportChannel(channelId: string) {
        const token = localStorage.getItem("token");
        if (!token) return;
        await fetch(`${API_URL}/channels/${channelId}/import`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        setTab("runs");
    }

    function handleLogout() {
        localStorage.removeItem("token");
        navigate("/");
    }

    const tabs = [
        { key: "clips", label: "Meus Clips", count: clips.length },
        { key: "channels", label: "Canais", count: channels.length },
        { key: "platforms", label: "Plataformas", count: null },
        { key: "runs", label: "Agent Runs", count: jobs.filter(j => j.status === "processing").length || null },
    ] as const;

    return (
        <div className="min-h-screen bg-[#080808] text-white font-sans">

            {/* ── DASH NAV ── */}
            <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-8 bg-[#080808]/90 backdrop-blur-xl border-b border-white/5">
                <div
                    className="flex items-center gap-2.5 cursor-pointer"
                    onClick={() => navigate("/")}
                >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-sm font-bold">⚡</div>
                    <span className="font-black text-xl tracking-tight">Clip<span className="text-orange-500">Strike</span></span>
                </div>
                <div className="hidden md:flex gap-6 text-sm text-zinc-500">
                    <span className="hover:text-white cursor-pointer transition-colors">Funcionalidades</span>
                    <span className="hover:text-white cursor-pointer transition-colors">Como Funciona</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center font-bold text-sm cursor-pointer" title="Perfil">
                        A
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-zinc-600 hover:text-white transition-colors text-sm"
                    >
                        Sair
                    </button>
                </div>
            </nav>

            {/* ── BODY ── */}
            <div className="pt-24 pb-20 px-6 max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-5 mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <span className="text-2xl">👤</span> Seu Dashboard
                        </h1>
                        <p className="text-zinc-500 text-sm mt-1">Monitore seus canais e clips em tempo real</p>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                        <button
                            onClick={() => navigate("/setup/platforms")}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-600 to-orange-500 hover:opacity-90 transition-opacity"
                        >
                            + Conectar Plataformas
                        </button>
                        <button
                            onClick={() => { setTab("runs"); }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border border-white/10 text-zinc-300 hover:border-white/20 hover:text-white transition-colors"
                        >
                            🔗 Adicionar Vídeo
                        </button>
                        <button
                            onClick={() => fetchData(localStorage.getItem("token") || "")}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border border-white/10 text-zinc-400 hover:border-white/20 hover:text-white transition-colors"
                        >
                            ↻ Atualizar
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {[
                        { icon: "📺", value: stats.channels, label: "Canais Conectados", color: "blue" },
                        { icon: "🎵", value: stats.platforms, label: "Plataformas Conectadas", color: "green" },
                        { icon: "⚙️", value: stats.activeRuns, label: "Runs Ativas", color: "yellow" },
                    ].map((s) => (
                        <div key={s.label} className="bg-[#111] border border-white/6 rounded-xl p-6 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${s.color === "blue" ? "bg-blue-500/10" : s.color === "green" ? "bg-emerald-500/10" : "bg-yellow-500/10"
                                }`}>
                                {s.icon}
                            </div>
                            <div>
                                <div className="text-3xl font-black text-white">{s.value}</div>
                                <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-[#111] border border-white/6 rounded-xl w-fit mb-6">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t.key
                                    ? "bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg"
                                    : "text-zinc-500 hover:text-white"
                                }`}
                        >
                            {t.label}
                            {t.count != null && t.count > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === t.key ? "bg-white/20 text-white" : "bg-white/8 text-zinc-400"
                                    }`}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── CLIPS TAB ── */}
                {tab === "clips" && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-white">Meus Clips</h2>
                            <button
                                onClick={() => fetchData(localStorage.getItem("token") || "")}
                                className="text-xs px-3 py-1.5 rounded-lg border border-white/8 text-zinc-500 hover:text-white hover:border-white/20 transition-colors"
                            >
                                ↻ Refresh
                            </button>
                        </div>
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-20 rounded-xl bg-white/3 animate-pulse" />
                                ))}
                            </div>
                        ) : clips.length === 0 ? (
                            <div className="text-center py-20 text-zinc-600">
                                <div className="text-5xl mb-4 opacity-30">🎬</div>
                                <p className="font-semibold text-zinc-500">Nenhum clip ainda</p>
                                <p className="text-sm mt-2">Importe um vídeo para começar</p>
                                <button
                                    onClick={() => setTab("runs")}
                                    className="mt-6 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-sm font-semibold hover:opacity-90 transition-opacity"
                                >
                                    + Adicionar Vídeo
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {clips.map(clip => <ClipCard key={clip.id} clip={clip} />)}
                            </div>
                        )}
                    </div>
                )}

                {/* ── CHANNELS TAB ── */}
                {tab === "channels" && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-white">Canais Conectados</h2>
                            <button
                                onClick={() => navigate("/setup/channel")}
                                className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 text-white font-semibold hover:opacity-90 transition-opacity"
                            >
                                + Adicionar Canal
                            </button>
                        </div>
                        {channels.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="text-5xl mb-4 opacity-30">📺</div>
                                <p className="text-zinc-500 font-semibold">Nenhum canal conectado</p>
                                <button
                                    onClick={() => navigate("/setup/channel")}
                                    className="mt-6 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-sm font-semibold hover:opacity-90 transition-opacity"
                                >
                                    Conectar Primeiro Canal
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {channels.map(ch => (
                                    <ChannelCard key={ch.id} channel={ch} onImport={handleImportChannel} />
                                ))}
                                <div
                                    onClick={() => navigate("/setup/channel")}
                                    className="border border-dashed border-white/10 rounded-xl p-5 flex items-center justify-center cursor-pointer hover:border-orange-500/30 hover:bg-orange-500/3 transition-all min-h-[150px]"
                                >
                                    <div className="text-center">
                                        <div className="text-2xl mb-2 opacity-40">+</div>
                                        <div className="text-xs text-zinc-600 hover:text-zinc-400">Adicionar Canal</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── PLATFORMS TAB ── */}
                {tab === "platforms" && (
                    <div>
                        <h2 className="font-bold text-white mb-4">Plataformas de Destino</h2>
                        <div className="space-y-3">
                            {[
                                { icon: "📺", name: "YouTube Shorts", desc: "Publicar clips como YouTube Shorts", connected: false },
                                { icon: "🎵", name: "TikTok", desc: "Publicar clips na sua conta TikTok", connected: false },
                                { icon: "📸", name: "Instagram Reels", desc: "Publicar clips como Instagram Reels", connected: false },
                                { icon: "👤", name: "Facebook", desc: "Publicar clips na sua página Facebook", connected: false },
                            ].map((p) => (
                                <div key={p.name} className="flex items-center justify-between bg-[#111] border border-white/6 rounded-xl p-5">
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl">{p.icon}</span>
                                        <div>
                                            <div className="font-semibold text-sm text-white">{p.name}</div>
                                            <div className="text-xs text-zinc-500 mt-0.5">{p.desc}</div>
                                        </div>
                                    </div>
                                    {p.connected ? (
                                        <span className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Conectado
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => navigate("/setup/platforms")}
                                            className="text-xs px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 text-white font-semibold hover:opacity-90 transition-opacity"
                                        >
                                            🔗 Conectar
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── RUNS TAB ── */}
                {tab === "runs" && (
                    <div>
                        <h2 className="font-bold text-white mb-4">Processar Vídeo</h2>

                        {/* Add video */}
                        <div className="bg-[#111] border border-white/6 rounded-xl p-5 mb-6">
                            <label className="block text-sm font-medium text-zinc-300 mb-2">URL do Vídeo do YouTube</label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={addVideoUrl}
                                    onChange={e => setAddVideoUrl(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleAddVideo()}
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="flex-1 bg-[#0d0d0d] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 outline-none focus:border-orange-500/40 transition-colors"
                                />
                                <button
                                    onClick={handleAddVideo}
                                    disabled={addingVideo || !addVideoUrl.trim()}
                                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                    {addingVideo ? "Enviando..." : "⚡ Processar"}
                                </button>
                            </div>
                            <p className="text-xs text-zinc-600 mt-2">
                                O vídeo será baixado, transcrito e cortado automaticamente em clips virais.
                            </p>
                        </div>

                        {/* Active jobs */}
                        {jobs.length === 0 ? (
                            <div className="text-center py-20 text-zinc-600">
                                <div className="text-5xl mb-4 opacity-20">⚙️</div>
                                <p className="text-zinc-500">Nenhum processamento ativo</p>
                                <p className="text-xs mt-2">Cole uma URL acima para processar um vídeo</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {jobs.map(job => <ProgressJob key={job.id} job={job} />)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
