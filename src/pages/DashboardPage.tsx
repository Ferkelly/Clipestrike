import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
    TrendingUp,
    Clock,
    Instagram,
    Facebook,
    Download,
    RefreshCw,
    CreditCard,
    MoreVertical,
    Calendar,
    User
} from "lucide-react";
import { Button } from "../components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// ── Types ──────────────────────────────────────────────────────────────────
interface Channel {
    id: string;
    title?: string;
    name?: string;
    youtube_channel_id: string;
    is_active: boolean;
    thumbnail?: string;
    status?: string;
}

interface Clip {
    id: string;
    title: string;
    hook: string;
    viral_score: number;
    file_url: string;
    status: 'pending' | 'processing' | 'done' | 'error';
    created_at: string;
    channel_name: string;
    thumbnail?: string;
}

interface VideoJob {
    id: string;
    videoId: string;
    title: string;
    step: string;
    percent: number;
    message: string;
    status: string;
}

// ── Components ────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
    return (
        <div className="bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)] border-gradient-s group hover:bg-white/[0.05] transition-all">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-500/10 text-${color}-500 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-3xl font-bold tracking-tight mb-1">{value}</div>
            <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/30">{label}</div>
        </div>
    );
}

export default function DashboardPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Tabs
    const tabs = [
        { id: 'channels', label: 'Channels', icon: Youtube },
        { id: 'platforms', label: 'Platforms', icon: Share2 },
        { id: 'runs', label: 'Agent Runs', icon: PlayCircle },
        { id: 'clips', label: 'My Clips', icon: Video },
    ];

    const activeTab = useMemo(() => {
        const path = location.pathname.split('/').filter(Boolean).pop();
        if (path === 'dashboard' || !path) return 'clips';
        if (path === 'canais') return 'channels';
        if (path === 'plataformas') return 'platforms';
        if (path === 'runs') return 'runs';
        return 'clips';
    }, [location.pathname]);

    const setActiveTab = (tab: string) => {
        if (tab === 'clips') navigate('/dashboard');
        else if (tab === 'channels') navigate('/dashboard/canais');
        else if (tab === 'platforms') navigate('/dashboard/plataformas');
        else if (tab === 'runs') navigate('/dashboard/runs');
        else navigate(`/dashboard/${tab}`);
    };

    const [url, setUrl] = useState("");
    const [urlError, setUrlError] = useState("");
    const [processing, setProcessing] = useState(false);
    const [clips, setClips] = useState<Clip[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [runs, setRuns] = useState<VideoJob[]>([]);
    const [platformConfig, setPlatformConfig] = useState<{ configured: boolean, enabledPlatforms: string[] }>({ configured: false, enabledPlatforms: [] });
    const [loading, setLoading] = useState(true);

    const fetchClips = async () => {
        try {
            const token = localStorage.getItem("clipstrike_token");
            const res = await fetch(`${API_URL}/clips`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.status === 401) {
                navigate("/login");
                return;
            }
            const data = await res.json();
            if (data.clips) setClips(data.clips);
        } catch (err) {
            console.error("Erro ao buscar clips:", err);
        }
    };

    const fetchChannels = async () => {
        try {
            const token = localStorage.getItem("clipstrike_token");
            const res = await fetch(`${API_URL}/channels`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.channels) setChannels(data.channels);
        } catch (err) {
            console.error("Erro ao buscar canais:", err);
        }
    };

    const fetchPlatformStatus = async () => {
        try {
            const token = localStorage.getItem("clipstrike_token");
            const res = await fetch(`${API_URL}/autopost/platforms`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            setPlatformConfig({ configured: data.configured, enabledPlatforms: data.enabledPlatforms });
        } catch (err) {
            console.error("Erro ao buscar status de plataformas:", err);
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchClips(), fetchChannels(), fetchPlatformStatus()]);
            setLoading(false);
        };
        init();

        const token = localStorage.getItem("clipstrike_token");
        const socket: Socket = io(SOCKET_URL, {
            auth: { token }
        });

        socket.on("video-progress", (data: any) => {
            if (data.status === 'done' || data.status === 'error') {
                fetchClips();
            }
            setRuns(prev => {
                const videoId = data.videoId || data.id;
                const index = prev.findIndex(r => r.videoId === videoId);
                if (index > -1) {
                    const newRuns = [...prev];
                    newRuns[index] = { ...newRuns[index], ...data, videoId };
                    return newRuns;
                }
                return [{ ...data, id: videoId, videoId }, ...prev];
            });
        });

        return () => { socket.disconnect(); };
    }, []);

    const handleProcess = async () => {
        const videoUrl = prompt("Enter YouTube Video or Channel URL:");
        if (!videoUrl) return;

        setProcessing(true);
        try {
            const token = localStorage.getItem("clipstrike_token");
            const isChannel = videoUrl.includes("/@") || videoUrl.includes("/channel/");
            const res = await fetch(`${API_URL}/videos/import`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ url: videoUrl, type: isChannel ? 'channel' : 'video' })
            });
            if (res.ok) {
                setActiveTab("runs");
            } else {
                const data = await res.json();
                alert(data.error || "Error processing video");
            }
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)] animate-pulse">
                    <Zap className="h-8 w-8 text-white" fill="currentColor" />
                </div>
                <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-[loading-bar_2s_infinite_ease-in-out]" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white font-sans flex overflow-hidden">
            {/* Sidebar (Minimal) */}
            <aside className="w-20 lg:w-64 border-r border-white/5 flex flex-col bg-black/20 backdrop-blur-3xl z-40">
                <div className="p-6 flex justify-center lg:justify-start">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                            <Zap className="h-5 w-5 text-white" fill="currentColor" />
                        </div>
                        <span className="hidden lg:block font-bold tracking-tight bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 bg-clip-text text-transparent pt-0.5">
                            EasySlice.AI
                        </span>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-8">
                    {tabs.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-3.5 rounded-2xl transition-all group ${activeTab === item.id
                                ? "bg-white/10 text-white shadow-lg border border-white/10"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <item.icon className={`h-5 w-5 ${activeTab === item.id ? "text-purple-400" : "group-hover:text-purple-400 transition-colors"}`} />
                            <span className="hidden lg:block text-sm font-bold">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5 space-y-2">
                    <button onClick={() => navigate("/settings")} className="w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-3.5 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all">
                        <Settings className="h-5 w-5" />
                        <span className="hidden lg:block text-sm font-bold">Settings</span>
                    </button>
                    <button onClick={() => { localStorage.clear(); navigate("/"); }} className="w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-3.5 rounded-2xl text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all">
                        <LogOut className="h-5 w-5" />
                        <span className="hidden lg:block text-sm font-bold">Log out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative bg-[#0B0F19]">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-[#0B0F19]/80 backdrop-blur-xl border-b border-white/5 px-8 flex items-center justify-between h-24">
                    <div className="fade-in">
                        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Your Dashboard</h2>
                        <p className="text-sm text-white/40 font-medium">Monitor your channels and clips</p>
                    </div>

                    <div className="flex items-center gap-3 fade-in">
                        <button onClick={() => window.location.reload()} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all text-white/60">
                            <RefreshCw className="w-5 h-5" />
                        </button>
                        <button onClick={() => navigate("/setup/platforms")} className="hidden md:flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold shadow-[0_4px_15px_rgba(168,85,247,0.3)] hover:scale-[1.02] transition-all">
                            <Share2 className="w-4 h-4" /> Connect Platforms
                        </button>
                        <button onClick={handleProcess} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-yellow-500 text-white text-xs font-bold shadow-[0_4px_15px_rgba(236,72,153,0.3)] hover:scale-[1.02] transition-all">
                            <Plus className="w-4 h-4" /> Add Video
                        </button>
                        <button className="hidden lg:flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 text-white text-xs font-bold shadow-[0_4px_15px_rgba(79,70,229,0.3)] hover:scale-[1.02] transition-all">
                            <CreditCard className="w-4 h-4" /> Renew Subscription
                        </button>
                    </div>
                </header>

                <div className="p-8 lg:p-12 space-y-12">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 fade-in">
                        <StatCard label="Connected Channels" value={channels.length.toString()} icon={Youtube} color="red" />
                        <StatCard label="Platforms Connected" value={platformConfig.enabledPlatforms.length.toString()} icon={Share2} color="purple" />
                        <StatCard label="Active Runs" value={runs.filter(r => r.percent < 100).length.toString()} icon={PlayCircle} color="pink" />
                    </div>

                    {/* Tabs / Content Section */}
                    <div className="fade-in">
                        <div className="flex items-center gap-1 bg-white/5 border border-white/5 p-1.5 rounded-2xl w-fit mb-10 overflow-x-auto no-scrollbar">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                                            ? "bg-white/10 text-white shadow-md"
                                            : "text-white/30 hover:text-white"
                                        }`}
                                >
                                    <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-purple-400" : ""}`} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* TAB CONTENTS */}
                        {activeTab === 'clips' && (
                            <div className="space-y-4">
                                {clips.length > 0 ? (
                                    clips.map(clip => (
                                        <div key={clip.id} className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.1)] border-gradient-s flex flex-col md:flex-row items-center gap-6 group hover:bg-white/[0.07] transition-all">
                                            <div className="w-full md:w-56 aspect-video rounded-2xl overflow-hidden relative bg-white/5 border border-white/5 flex-shrink-0">
                                                {clip.thumbnail ? (
                                                    <img src={clip.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : <div className="w-full h-full flex items-center justify-center"><Video className="w-8 h-8 text-white/10" /></div>}
                                                <div onClick={() => window.open(clip.file_url, '_blank')} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                                    <PlayCircle className="w-12 h-12 text-white shadow-2xl" />
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0 py-2">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                                                        Viral Score: {clip.viral_score}%
                                                    </span>
                                                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-md ${clip.status === 'done' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                                                        }`}>
                                                        {clip.status}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold truncate group-hover:text-purple-400 transition-colors">{clip.title}</h3>
                                                <div className="flex items-center gap-4 mt-3 text-white/40 text-xs font-medium">
                                                    <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Posted by {clip.channel_name || 'Manual'}</div>
                                                    <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(clip.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 ml-auto px-4">
                                                <button onClick={() => window.open(clip.file_url, '_blank')} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:text-purple-400 transition-all">
                                                    <Download className="w-5 h-5" />
                                                </button>
                                                <button className="p-3 bg-white/5 border border-white/10 rounded-xl hover:text-white transition-all">
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-32 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-[40px]">
                                        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                                            <Video className="w-10 h-10 text-white/20" />
                                        </div>
                                        <h4 className="text-xl font-bold mb-2 text-white/80">No clips found</h4>
                                        <p className="text-white/40 max-w-sm mx-auto">Start by adding a YouTube video to generate your first set of social-ready highlight clips.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'channels' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {channels.map(ch => (
                                    <div key={ch.id} className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl border-gradient-s flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/5 border border-white/5 flex-shrink-0">
                                            {ch.thumbnail ? <img src={ch.thumbnail} className="w-full h-full object-cover" /> : <Youtube className="w-8 h-8 m-4 text-white/20" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold truncate">{ch.name || ch.title}</h4>
                                            <div className="flex items-center gap-2 mt-1.5 font-bold">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[10px] uppercase tracking-wider text-emerald-500">Connected</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'platforms' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { id: "youtube", name: "YouTube Shorts", icon: Youtube, color: "red" },
                                    { id: "tiktok", name: "TikTok", icon: Music, color: "cyan" },
                                    { id: "instagram", name: "Instagram Reels", icon: Instagram, color: "pink" },
                                    { id: "facebook", name: "Facebook", icon: Facebook, color: "blue" },
                                ].map(p => {
                                    const isEnabled = platformConfig.enabledPlatforms.includes(p.id);
                                    return (
                                        <div key={p.id} className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-gradient-s flex flex-col group">
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center transition-transform group-hover:scale-110">
                                                        <p.icon className="w-7 h-7" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl font-bold">{p.name}</h4>
                                                        <p className="text-white/40 text-xs mt-1">Status: {isEnabled ? 'Active' : 'Not Connected'}</p>
                                                    </div>
                                                </div>
                                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/40'}`}>
                                                    {isEnabled ? 'Live' : 'Inactive'}
                                                </div>
                                            </div>
                                            <button className="w-full py-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 font-bold text-xs transition-all uppercase tracking-[0.2em]">Manage Connection</button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === 'runs' && (
                            <div className="space-y-4">
                                {runs.map(run => (
                                    <div key={run.id} className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-gradient-s">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                                                    <PlayCircle className="w-7 h-7 text-purple-400 animate-pulse" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-bold">{run.title || 'Agent Processing Video...'}</h4>
                                                    <p className="text-white/40 text-sm mt-1">{run.message}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-3xl font-bold text-purple-400">{run.percent}%</div>
                                                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">{run.step}</div>
                                            </div>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 transition-all duration-700 ease-out" style={{ width: `${run.percent}%` }} />
                                        </div>
                                    </div>
                                ))}
                                {runs.length === 0 && <div className="py-20 text-center text-white/20 font-bold uppercase tracking-widest bg-white/[0.01] rounded-[40px] border border-dashed border-white/5">No active runs</div>}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <style>{`
                .fade-in { animation: fadeIn 0.8s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .border-gradient-s { position: relative; }
                .border-gradient-s::after { content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1px; background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05)); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                @keyframes loading-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
            `}</style>
        </div>
    );
}

const Music = Share2; // Fallback for lucide icon
