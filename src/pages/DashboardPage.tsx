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
    post_status?: string;
    post_results?: any;
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
        { id: 'channels', label: 'Canais', icon: Youtube },
        { id: 'platforms', label: 'Plataformas', icon: Share2 },
        { id: 'runs', label: 'Execuções', icon: PlayCircle },
        { id: 'clips', label: 'Meus Clipes', icon: Video },
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
        if (tab === 'clips') navigate('/app/dashboard');
        else if (tab === 'channels') navigate('/app/dashboard/canais');
        else if (tab === 'platforms') navigate('/app/dashboard/plataformas');
        else if (tab === 'runs') navigate('/app/dashboard/runs');
        else navigate(`/app/dashboard/${tab}`);
    };

    const [url, setUrl] = useState("");
    const [urlError, setUrlError] = useState("");
    const [processing, setProcessing] = useState(false);
    const [clips, setClips] = useState<Clip[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [runs, setRuns] = useState<VideoJob[]>([]);
    const [platformConfig, setPlatformConfig] = useState<{
        configured: boolean;
        enabledPlatforms: string[];
        uploadPostUser?: string;
        autoPost?: boolean;
        realPlatforms?: Record<string, any>;
    }>({ configured: false, enabledPlatforms: [] });
    const [directConnections, setDirectConnections] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);

    // ── Upload-Post Modal ────────────────────────────────────────────────────
    const [showPlatformModal, setShowPlatformModal] = useState(false);
    const [modalUsername, setModalUsername] = useState("");
    const [modalPlatforms, setModalPlatforms] = useState<string[]>([]);
    const [modalAutoPost, setModalAutoPost] = useState(true);
    const [modalSaving, setModalSaving] = useState(false);
    const [modalError, setModalError] = useState("");
    const [modalSuccess, setModalSuccess] = useState("");

    const openPlatformModal = () => {
        setModalUsername(platformConfig.uploadPostUser || "");
        setModalPlatforms(platformConfig.enabledPlatforms || []);
        setModalAutoPost(platformConfig.autoPost !== false);
        setModalError("");
        setModalSuccess("");
        setShowPlatformModal(true);
    };

    const toggleModalPlatform = (id: string) => {
        setModalPlatforms(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleConnectPlatforms = async () => {
        try {
            const token = localStorage.getItem("clipstrike_token");
            const res = await fetch(`${API_URL}/autopost/connect`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.connectUrl) {
                window.location.href = data.connectUrl;
            } else {
                throw new Error(data.error || "Falha ao gerar link de conexão");
            }
        } catch (err: any) {
            alert("Erro: " + err.message);
        }
    };

    const handleSavePlatforms = async () => {
        if (modalPlatforms.length === 0) { setModalError("Selecione ao menos uma plataforma."); return; }
        setModalSaving(true); setModalError(""); setModalSuccess("");
        try {
            const token = localStorage.getItem("clipstrike_token");
            const res = await fetch(`${API_URL}/autopost/platforms/config`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ enabledPlatforms: modalPlatforms, autoPost: modalAutoPost }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro ao salvar");
            setPlatformConfig(prev => ({ ...prev, enabledPlatforms: modalPlatforms, autoPost: modalAutoPost }));
            setModalSuccess("Configurações salvas! ✅");
            setTimeout(() => setShowPlatformModal(false), 1000);
        } catch (err: any) {
            setModalError(err.message);
        } finally {
            setModalSaving(false);
        }
    };

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

    const handleManualPost = async (clipId: string) => {
        if (!platformConfig.configured) {
            alert("Configure suas plataformas primeiro na aba Plataformas.");
            setActiveTab("platforms");
            return;
        }
        if (!confirm("Deseja publicar este clip agora nas plataformas configuradas via Upload-Post?")) return;

        try {
            const token = localStorage.getItem("clipstrike_token");
            const res = await fetch(`${API_URL}/autopost/clip/${clipId}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            alert(data.message || "Postagem iniciada!");
            fetchClips(); // Refresh status
        } catch (err: any) {
            alert("Erro ao publicar: " + err.message);
        }
    };

    const handleYouTubeManualPost = async (clipId: string) => {
        const directConn = directConnections['youtube'];
        if (!directConn?.connected) {
            alert("Conecte seu YouTube primeiro na aba Plataformas.");
            setActiveTab("platforms");
            return;
        }

        if (!confirm(`Deseja publicar este clip no canal "${directConn.username}" agora?`)) return;

        try {
            const token = localStorage.getItem("clipstrike_token");
            const res = await fetch(`${API_URL}/platforms/youtube/upload/${clipId}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            alert(data.message || "Upload para o YouTube iniciado!");
            fetchClips(); // Refresh status
        } catch (err: any) {
            alert("Erro ao publicar no YouTube: " + err.message);
        }
    };

    const fetchPlatformStatus = async () => {
        try {
            const token = localStorage.getItem("clipstrike_token");
            // 1. Fetch Upload-Post status
            const resAP = await fetch(`${API_URL}/autopost/platforms`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const dataAP = await resAP.json();
            setPlatformConfig({
                configured: dataAP.configured,
                enabledPlatforms: dataAP.enabledPlatforms || [],
                uploadPostUser: dataAP.uploadPostUser || "",
                autoPost: dataAP.autoPost !== false,
                realPlatforms: dataAP.realPlatforms || {}
            });

            // 2. Fetch Direct Connections status
            const resDirect = await fetch(`${API_URL}/platforms/status`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const dataDirect = await resDirect.json();
            setDirectConnections(dataDirect || {});

        } catch (err) {
            console.error("Erro ao buscar status de plataformas:", err);
        }
    };

    const handleConnectYouTube = () => {
        const token = localStorage.getItem("clipstrike_token");
        // We pass the token in URL if needed, but here we redirect to the backend route
        // The backend route 'authenticate' middleware requires Bearer token, 
        // but redirects don't carry headers. 
        // WAIT: The user's provided backend code uses 'requireAuth' (authenticate).
        // For a GET redirect, we might need a workaround if not using sessions.
        // However, I'll follow the user's window.location.href suggestion.
        window.location.href = `${API_URL}/platforms/youtube/connect?token=${token}`;
        // Adjusted to pass token as query param so middleware can pick it up
    };

    const handleDisconnectPlatform = async (platform: string) => {
        if (!confirm(`Deseja desconectar o ${platform}?`)) return;
        try {
            const token = localStorage.getItem("clipstrike_token");
            await fetch(`${API_URL}/platforms/${platform}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            fetchPlatformStatus();
        } catch (err) {
            console.error("Erro ao desconectar:", err);
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchClips(), fetchChannels(), fetchPlatformStatus()]);
            setLoading(false);

            // Check if returned from connection
            const params = new URLSearchParams(window.location.search);
            if (params.get("connected") === "true") {
                alert("Plataformas conectadas com sucesso! ✅");
            } else if (params.get("connected") === "youtube") {
                const channel = params.get("channel");
                alert(`YouTube conectado: ${channel}! ✅`);
            } else if (params.get("error")) {
                alert("Erro na conexão: " + params.get("error"));
            }

            if (params.get("connected") || params.get("error")) {
                const newUrl = window.location.pathname + window.location.hash;
                window.history.replaceState({}, "", newUrl);
            }
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
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(255,90,31,0.4)] animate-pulse">
                    <Zap className="h-8 w-8 text-white" fill="currentColor" />
                </div>
                <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-[loading-bar_2s_infinite_ease-in-out]" />
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
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(255,90,31,0.5)]">
                            <Zap className="h-5 w-5 text-white" fill="currentColor" />
                        </div>
                        <span className="hidden lg:block font-bold tracking-tight text-primary pt-0.5">
                            CLIPSTRIKE
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
                            <item.icon className={`h-5 w-5 ${activeTab === item.id ? "text-primary" : "group-hover:text-primary transition-colors"}`} />
                            <span className="hidden lg:block text-sm font-bold">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5 space-y-2">
                    <button onClick={() => navigate("/app/dashboard/configuracoes")} className="w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-3.5 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all">
                        <Settings className="h-5 w-5" />
                        <span className="hidden lg:block text-sm font-bold">Configurações</span>
                    </button>
                    <button onClick={() => { localStorage.clear(); navigate("/"); }} className="w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-3.5 rounded-2xl text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all">
                        <LogOut className="h-5 w-5" />
                        <span className="hidden lg:block text-sm font-bold">Sair</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative bg-[#0B0F19]">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-[#0B0F19]/80 backdrop-blur-xl border-b border-white/5 px-8 flex items-center justify-between h-24">
                    <div className="fade-in">
                        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Seu Painel</h2>
                        <p className="text-sm text-white/40 font-medium">Monitore seus canais e clipes</p>
                    </div>

                    <div className="flex items-center gap-3 fade-in">
                        <button onClick={() => window.location.reload()} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all text-white/60">
                            <RefreshCw className="w-5 h-5" />
                        </button>
                        <button onClick={() => navigate("/app/plataformas")} className="hidden md:flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-xs font-bold shadow-[0_4px_15px_rgba(255,90,31,0.3)] hover:scale-[1.02] transition-all">
                            <Share2 className="w-4 h-4" /> Conectar Plataformas
                        </button>
                        <button onClick={handleProcess} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-xs font-bold shadow-[0_4px_15px_rgba(255,90,31,0.3)] hover:scale-[1.02] transition-all">
                            <Plus className="w-4 h-4" /> Adicionar Vídeo
                        </button>
                        <button className="hidden lg:flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-xs font-bold shadow-[0_4px_15px_rgba(255,90,31,0.3)] hover:scale-[1.02] transition-all">
                            <CreditCard className="w-4 h-4" /> Renovar Assinatura
                        </button>
                    </div>
                </header>

                <div className="p-8 lg:p-12 space-y-12">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 fade-in">
                        <StatCard label="Canais Conectados" value={channels.length.toString()} icon={Youtube} color="primary" />
                        <StatCard label="Plataformas Conectadas" value={platformConfig.enabledPlatforms.length.toString()} icon={Share2} color="primary" />
                        <StatCard label="Execuções Ativas" value={runs.filter(r => r.percent < 100).length.toString()} icon={PlayCircle} color="primary" />
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
                                    <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-primary" : ""}`} />
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
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md">
                                                        Viral Score: {clip.viral_score}%
                                                    </span>
                                                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-md ${clip.status === 'done' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                                                        }`}>
                                                        {clip.status === 'done' ? 'Concluído' : clip.status === 'processing' ? 'Processando' : clip.status === 'pending' ? 'Pendente' : 'Erro'}
                                                    </span>
                                                    {clip.post_status === 'posted' && (
                                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                            <Share2 className="w-3 h-3" /> Publicado
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-bold truncate group-hover:text-primary transition-colors">{clip.title}</h3>
                                                <div className="flex items-center gap-4 mt-3 text-white/40 text-xs font-medium">
                                                    <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Postado por {clip.channel_name || 'Manual'}</div>
                                                    <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(clip.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 ml-auto px-4">
                                                {clip.status === 'done' && (
                                                    <button
                                                        onClick={() => handleYouTubeManualPost(clip.id)}
                                                        title="Publicar no YouTube"
                                                        className={`p-3 rounded-xl transition-all ${clip.post_status === 'posted' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20'}`}
                                                    >
                                                        <Youtube className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleManualPost(clip.id)}
                                                    title="Publicar em Outras Redes"
                                                    className="p-3 bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary/20 text-primary transition-all font-bold"
                                                >
                                                    <Share2 className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => window.open(clip.file_url, '_blank')} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:text-primary transition-all">
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
                                        <h4 className="text-xl font-bold mb-2 text-white/80">Nenhum clipe encontrado</h4>
                                        <p className="text-white/40 max-w-sm mx-auto">Comece adicionando um vídeo do YouTube para gerar seu primeiro conjunto de clipes de destaque.</p>
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
                                                <span className="text-[10px] uppercase tracking-wider text-emerald-500">Conectado</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'platforms' && (
                            <div className="space-y-8">
                                {/* Upload-Post banner */}
                                <div className="bg-gradient-to-r from-primary/10 to-orange-500/5 border border-primary/20 rounded-3xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                                <Share2 className="w-5 h-5 text-primary" />
                                            </div>
                                            <h3 className="text-lg font-bold">Upload-Post.com</h3>
                                        </div>
                                        <p className="text-white/50 text-sm max-w-md">
                                            Conecte suas redes sociais pelo Upload-Post, copie seu username e cole abaixo para publicar automaticamente.
                                        </p>
                                        {platformConfig.uploadPostUser && (
                                            <div className="mt-3 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-xs text-emerald-400 font-bold">{platformConfig.uploadPostUser} — {platformConfig.enabledPlatforms.length} plataforma(s) ativa(s)</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-3 flex-shrink-0">
                                        <button
                                            onClick={handleConnectPlatforms}
                                            className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all font-primary text-primary"
                                        >
                                            Conectar Novas Contas ↗
                                        </button>
                                        <button
                                            onClick={openPlatformModal}
                                            className="px-5 py-3 rounded-xl bg-primary text-white text-xs font-bold shadow-[0_4px_15px_rgba(255,90,31,0.3)] hover:scale-[1.02] transition-all"
                                        >
                                            {platformConfig.configured ? "Preferências de Auto-Post" : "Configurar Agora"}
                                        </button>
                                    </div>
                                </div>

                                {/* Platform grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { id: "youtube", name: "YouTube Shorts", icon: Youtube, direct: true },
                                        { id: "tiktok", name: "TikTok", icon: Music },
                                        { id: "instagram", name: "Instagram Reels", icon: Instagram },
                                        { id: "facebook", name: "Facebook", icon: Facebook },
                                    ].map(p => {
                                        const isEnabled = platformConfig.enabledPlatforms.includes(p.id);
                                        const directConn = directConnections[p.id];
                                        const isConnected = isEnabled || platformConfig.realPlatforms?.[p.id] || directConn?.connected;

                                        return (
                                            <div key={p.id} className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-gradient-s flex flex-col group">
                                                <div className="flex items-center justify-between mb-8">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center transition-transform group-hover:scale-110">
                                                            <p.icon className="w-7 h-7" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xl font-bold">{p.name}</h4>
                                                            <p className="text-white/40 text-xs mt-1">
                                                                {directConn?.username ? `Logado como: ${directConn.username}` : (isEnabled ? 'Ativo via Upload-Post' : 'Não configurado')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isConnected
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-white/5 text-white/30 border-white/10'
                                                        }`}>
                                                        {isConnected ? (p.direct && directConn?.connected ? 'ONLINE' : 'CONECTADO') : 'INATIVO'}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={p.id === 'youtube' ? handleConnectYouTube : (isConnected ? openPlatformModal : handleConnectPlatforms)}
                                                        className={`flex-1 py-4 rounded-xl border font-bold text-xs transition-all uppercase tracking-[0.2em] ${isConnected
                                                            ? "bg-white/5 border-white/5 hover:bg-white/10"
                                                            : "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                                                            }`}
                                                    >
                                                        {isConnected ? 'Gerenciar' : 'Conectar Agora'}
                                                    </button>
                                                    {p.direct && directConn?.connected && (
                                                        <button
                                                            onClick={() => handleDisconnectPlatform(p.id)}
                                                            className="px-4 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all font-bold text-xs"
                                                            title="Desconectar"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* auto-post info */}
                                {platformConfig.configured && (
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold">Publicação Automática</p>
                                            <p className="text-xs text-white/40 mt-0.5">Clips são publicados automaticamente ao serem gerados</p>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${platformConfig.autoPost
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-white/5 text-white/30 border-white/10'
                                            }`}>
                                            {platformConfig.autoPost ? 'LIGADO' : 'DESLIGADO'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'runs' && (
                            <div className="space-y-4">
                                {runs.map(run => (
                                    <div key={run.id} className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-gradient-s">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                                                    <PlayCircle className="w-7 h-7 text-primary animate-pulse" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-bold">{run.title || 'Agente Processando Vídeo...'}</h4>
                                                    <p className="text-white/40 text-sm mt-1">{run.message}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-3xl font-bold text-primary">{run.percent}%</div>
                                                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">{run.step}</div>
                                            </div>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary transition-all duration-700 ease-out" style={{ width: `${run.percent}%` }} />
                                        </div>
                                    </div>
                                ))}
                                {runs.length === 0 && <div className="py-20 text-center text-white/20 font-bold uppercase tracking-widest bg-white/[0.01] rounded-[40px] border border-dashed border-white/5">Nenhuma execução ativa</div>}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* ── Upload-Post Config Modal ───────────────────────────────── */}
            {showPlatformModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowPlatformModal(false)}>
                    <div className="w-full max-w-lg bg-[#111419] border border-white/10 rounded-3xl p-8 shadow-[0_25px_60px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                    <Share2 className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Configurar Plataformas</h3>
                                    <p className="text-xs text-white/40">via Upload-Post.com</p>
                                </div>
                            </div>
                            <button onClick={() => setShowPlatformModal(false)} className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all">✕</button>
                        </div>

                        {/* Instructions */}
                        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 mb-6 text-sm text-white/50 leading-relaxed">
                            <span className="text-primary font-bold">Como funciona:</span> Acesse{" "}
                            <button onClick={() => window.open("https://app.upload-post.com", "_blank")} className="text-primary underline underline-offset-2">app.upload-post.com</button>,
                            {" "}faça login, conecte suas redes (TikTok, Instagram, etc.) e copie seu <strong className="text-white">username</strong>.
                        </div>

                        {/* Username (Read Only) */}
                        <div className="space-y-2 mb-6">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/40">Seu Perfil ClipStrike</label>
                            <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/40 select-none">
                                {platformConfig.uploadPostUser || "Carregando..."}
                            </div>
                        </div>

                        {/* Platform Checkboxes */}
                        <div className="mb-6">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3 block">Plataformas para Publicar</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: "tiktok", name: "TikTok" },
                                    { id: "instagram", name: "Instagram Reels" },
                                    { id: "youtube", name: "YouTube Shorts" },
                                    { id: "facebook", name: "Facebook" },
                                ].map(p => {
                                    const checked = modalPlatforms.includes(p.id);
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => toggleModalPlatform(p.id)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold transition-all ${checked
                                                ? "bg-primary/10 border-primary/40 text-white"
                                                : "bg-white/[0.02] border-white/10 text-white/40 hover:border-white/20"
                                                }`}
                                        >
                                            <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? "bg-primary border-primary" : "border-white/20"}`}>
                                                {checked && <span className="text-white text-[10px]">✓</span>}
                                            </div>
                                            {p.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Auto-post Toggle */}
                        <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl mb-6">
                            <div>
                                <p className="text-sm font-bold">Publicar automaticamente</p>
                                <p className="text-xs text-white/40 mt-0.5">Quando um clip ficar pronto, publicar nas redes imediatamente</p>
                            </div>
                            <button
                                onClick={() => setModalAutoPost(v => !v)}
                                className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${modalAutoPost ? "bg-primary" : "bg-white/10"}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow ${modalAutoPost ? "left-7" : "left-1"}`} />
                            </button>
                        </div>

                        {/* Feedback */}
                        {modalError && <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 font-bold">{modalError}</div>}
                        {modalSuccess && <div className="mb-4 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 font-bold">{modalSuccess}</div>}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button onClick={() => setShowPlatformModal(false)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all">
                                Cancelar
                            </button>
                            <button
                                onClick={handleSavePlatforms}
                                disabled={modalSaving}
                                className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-[0_4px_15px_rgba(255,90,31,0.3)] hover:scale-[1.01] transition-all disabled:opacity-50"
                            >
                                {modalSaving ? "Salvando..." : "Salvar Configuração"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
