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
    User,
    BarChart3,
    Loader2
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

import { EditClipModal } from "../components/EditClipModal";

interface Clip {
    id: string;
    video_id: string;
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
    videos?: { id: string; title: string };
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
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'runs', label: 'Execuções', icon: PlayCircle },
        { id: 'clips', label: 'Meus Clipes', icon: Video },
    ];

    const activeTab = useMemo(() => {
        const path = location.pathname.split('/').filter(Boolean).pop();
        if (path === 'dashboard' || !path) return 'clips';
        if (path === 'canais') return 'channels';
        if (path === 'plataformas') return 'platforms';
        if (path === 'analytics') return 'analytics';
        if (path === 'runs') return 'runs';
        return 'clips';
    }, [location.pathname]);

    const setActiveTab = (tab: string) => {
        if (tab === 'clips') navigate('/app/dashboard');
        else if (tab === 'channels') navigate('/app/dashboard/canais');
        else if (tab === 'platforms') navigate('/app/dashboard/plataformas');
        else if (tab === 'analytics') navigate('/app/dashboard/analytics');
        else if (tab === 'runs') navigate('/app/dashboard/runs');
        else navigate(`/app/dashboard/${tab}`);
    };

    const [url, setUrl] = useState("");
    const [urlError, setUrlError] = useState("");
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [step, setStep] = useState("");
    const [clips, setClips] = useState<Clip[]>([]);
    const [editingClip, setEditingClip] = useState<Clip | null>(null);
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
    const [downloadingClipId, setDownloadingClipId] = useState<string | null>(null);
    const [openDownloadMenu, setOpenDownloadMenu] = useState<string | null>(null);
    const [zipQuality, setZipQuality] = useState<"1080" | "720">("1080");

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

    const handleDownload = async (clip: Clip, type: "1080" | "720" | "srt") => {
        setDownloadingClipId(clip.id);
        setOpenDownloadMenu(null);
        try {
            const token = localStorage.getItem("clipstrike_token");
            const url = type === "srt"
                ? `${API_URL}/download/clip/${clip.id}/srt`
                : `${API_URL}/download/clip/${clip.id}?quality=${type}`;

            const res = await fetch(url, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Erro ao baixar");

            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;

            const contentDisp = res.headers.get("content-disposition");
            let filename = `clip_${clip.id}.${type === 'srt' ? 'srt' : 'mp4'}`;
            if (contentDisp && contentDisp.includes("filename=")) {
                filename = contentDisp.split("filename=")[1].replace(/"/g, "");
            }

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            alert("Erro ao baixar. Tente novamente.");
        } finally {
            setDownloadingClipId(null);
        }
    };

    const handleDownloadZip = async (videoId: string, videoTitle: string) => {
        try {
            const token = localStorage.getItem("clipstrike_token");
            const res = await fetch(
                `${API_URL}/download/video/${videoId}/zip?quality=${zipQuality}`,
                { headers: { "Authorization": `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error("Erro ao gerar ZIP");

            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = `ClipStrike_${videoTitle.replace(/\s+/g, '_')}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            alert("Erro ao baixar ZIP.");
        }
    };

    const groupedClips = useMemo(() => {
        const groups: Record<string, { title: string, clips: Clip[] }> = {};
        clips.forEach(clip => {
            const vId = clip.video_id || 'manual';
            if (!groups[vId]) {
                const videoTitle = clip.videos?.title || 'Meus Clips';
                groups[vId] = { title: videoTitle, clips: [] };
            }
            groups[vId].clips.push(clip);
        });
        return groups;
    }, [clips]);

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

    function detectUrlType(url: string): "video" | "channel" | "invalid" {
        if (/youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\//.test(url))
            return "video";
        if (/youtube\.com\/@|youtube\.com\/channel\/|youtube\.com\/c\/|youtube\.com\/user\//.test(url))
            return "channel";
        return "invalid";
    }

    const handleProcess = async () => {
        const type = detectUrlType(url);
        if (type === "invalid") {
            setUrlError("Cole uma URL válida do YouTube (vídeo ou canal)");
            return;
        }

        setProcessing(true);
        setUrlError("");
        setProgress(0);
        setStep("Iniciando...");

        try {
            const token = localStorage.getItem("clipstrike_token");
            const res = await fetch(`${API_URL}/videos/import`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ url, type }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `Erro ${res.status}`);
            }

            const { videoId } = await res.json();

            // Conectar Socket.io para progresso se ainda não estiver conectado no useEffect
            const socket: Socket = io(SOCKET_URL, {
                auth: { token }
            });

            // Entrar no quarto do usuário
            // Precisamos buscar o ID do usuário se não tivermos
            const profileRes = await fetch(`${API_URL}/auth/me`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const profileData = await profileRes.json();
            if (profileData.user?.id) {
                socket.emit('join-user-room', profileData.user.id);
            }

            socket.on("video-progress", (data: any) => {
                if (data.videoId !== videoId) return;
                setProgress(data.percent);
                setStep(data.message);

                if (data.status === 'done' || data.percent >= 100) {
                    setProcessing(false);
                    setStep("Concluído! ✅");
                    socket.disconnect();
                    fetchClips();
                    setActiveTab("clips");
                }
            });

            socket.on("video-error", (data: any) => {
                if (data.videoId !== videoId) return;
                setProcessing(false);
                setUrlError(data.message || "Erro no processamento");
                socket.disconnect();
            });

        } catch (err: any) {
            setProcessing(false);
            setUrlError(err.message.includes("fetch")
                ? "Servidor indisponível. Tente novamente."
                : err.message
            );
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
                        <div className="relative group mr-2">
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Cole URL do vídeo ou canal..."
                                className="w-64 lg:w-96 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-xs focus:border-primary outline-none transition-all placeholder:text-white/20"
                            />
                            {urlError && <div className="absolute top-full left-0 mt-2 text-[10px] text-red-500 font-bold uppercase tracking-wider">{urlError}</div>}
                        </div>
                        <button onClick={() => window.location.reload()} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all text-white/60">
                            <RefreshCw className="w-5 h-5" />
                        </button>
                        <button
                            disabled={processing}
                            onClick={handleProcess}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-xs font-bold shadow-[0_4px_15px_rgba(255,90,31,0.3)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
                        >
                            {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            {processing ? "Processando..." : "Processar Agora"}
                        </button>
                    </div>
                </header>

                {processing && (
                    <div className="mx-8 mt-8 fade-in">
                        <div className="bg-gradient-to-r from-primary/10 to-orange-500/5 border border-primary/20 rounded-3xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                        <PlayCircle className="w-5 h-5 text-primary animate-pulse" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">IA está trabalhando no seu vídeo</h4>
                                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-0.5">{step}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-primary">{progress}%</span>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    </div>
                )}

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
                            <div className="space-y-12">
                                {Object.keys(groupedClips).length > 0 ? (
                                    Object.entries(groupedClips).map(([videoId, group]) => (
                                        <div key={videoId} className="space-y-6">
                                            {/* Video Group Header */}
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1 h-8 bg-primary rounded-full" />
                                                    <h3 className="text-xl font-black tracking-tighter truncate max-w-md">
                                                        {group.title}
                                                    </h3>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20 bg-white/5 px-2 py-1 rounded-lg">
                                                        {group.clips.length} clips
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
                                                    <select
                                                        value={zipQuality}
                                                        onChange={e => setZipQuality(e.target.value as "1080" | "720")}
                                                        className="bg-transparent border-none text-white/60 text-[10px] font-black uppercase tracking-widest px-3 outline-none cursor-pointer hover:text-white transition-colors"
                                                    >
                                                        <option value="1080">1080p</option>
                                                        <option value="720">720p</option>
                                                    </select>
                                                    <button
                                                        onClick={() => handleDownloadZip(videoId, group.title)}
                                                        className="flex items-center gap-2 bg-white/10 hover:bg-primary hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl"
                                                    >
                                                        <Download className="w-3 h-3" />
                                                        Baixar Pack (.ZIP)
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {group.clips.map(clip => (
                                                    <div key={clip.id} className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.1)] border-gradient-s flex flex-col md:flex-row items-center gap-6 group hover:bg-white/[0.07] transition-all relative">
                                                        <div className="w-full md:w-56 aspect-video rounded-2xl overflow-hidden relative bg-black border border-white/5 flex-shrink-0">
                                                            {clip.thumbnail ? (
                                                                <img src={clip.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-60 group-hover:opacity-100" />
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
                                                            </div>
                                                            <h3 className="text-lg font-bold truncate group-hover:text-primary transition-colors">{clip.hook || clip.title}</h3>
                                                            <div className="flex items-center gap-4 mt-3 text-white/40 text-xs font-medium">
                                                                <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(clip.created_at).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 ml-auto px-4">
                                                            {clip.status === 'done' && (
                                                                <button
                                                                    onClick={() => setEditingClip(clip)}
                                                                    title="Publicar no YouTube"
                                                                    className={`p-3 rounded-xl transition-all ${clip.post_status === 'posted' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20'}`}
                                                                >
                                                                    <Youtube className="w-5 h-5" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleManualPost(clip.id)}
                                                                title="Auto-Postagem"
                                                                className="p-3 bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary/20 text-primary transition-all shadow-lg"
                                                            >
                                                                <Share2 className="w-5 h-5" />
                                                            </button>

                                                            {/* Download Dropdown */}
                                                            <div className="relative">
                                                                <button
                                                                    onClick={() => setOpenDownloadMenu(openDownloadMenu === clip.id ? null : clip.id)}
                                                                    className={`p-3 bg-white/5 border border-white/10 rounded-xl transition-all hover:text-primary ${openDownloadMenu === clip.id ? 'text-primary border-primary/40 bg-primary/10' : ''}`}
                                                                >
                                                                    {downloadingClipId === clip.id ? (
                                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                                    ) : (
                                                                        <Download className="w-5 h-5" />
                                                                    )}
                                                                </button>

                                                                {openDownloadMenu === clip.id && (
                                                                    <div className="absolute bottom-full right-0 mb-4 w-64 bg-[#111] border border-white/10 rounded-3xl p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                                                        <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/20 border-b border-white/5 mb-2">Opções de Download</p>
                                                                        <button onClick={() => handleDownload(clip, "1080")} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white/5 transition-all group text-left">
                                                                            <span className="text-xs font-bold text-white/70 group-hover:text-white">Qualidade 1080p</span>
                                                                            <span className="text-[9px] font-black uppercase tracking-tighter text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">High</span>
                                                                        </button>
                                                                        <button onClick={() => handleDownload(clip, "720")} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white/5 transition-all group text-left">
                                                                            <span className="text-xs font-bold text-white/70 group-hover:text-white">Qualidade 720p</span>
                                                                            <span className="text-[9px] font-black uppercase tracking-tighter text-white/20 bg-white/5 px-1.5 py-0.5 rounded">Mobile</span>
                                                                        </button>
                                                                        <div className="h-[1px] bg-white/5 my-2 mx-4" />
                                                                        <button onClick={() => handleDownload(clip, "srt")} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white/5 transition-all group text-left">
                                                                            <span className="text-xs font-bold text-white/70 group-hover:text-white">Legendas (.SRT)</span>
                                                                            <span className="text-[9px] font-black uppercase tracking-tighter text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">Text</span>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <button className="p-3 bg-white/5 border border-white/10 rounded-xl hover:text-white transition-all">
                                                                <MoreVertical className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
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
