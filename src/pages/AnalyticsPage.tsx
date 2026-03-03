import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    BarChart3,
    Youtube,
    Video,
    Zap,
    TrendingUp,
    Clock,
    ArrowLeft,
    Heart,
    MessageCircle,
    Eye,
    ChevronRight,
    Loader2,
    ExternalLink,
    LineChart,
    CheckCircle
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";
import { Button } from "../components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface InternalStats {
    totalClips: number;
    publishedClips: number;
    totalVideos: number;
    totalChannels: number;
    avgViralScore: number;
    hoursSaved: number;
    weeklyData: { week: string, clips: number }[];
}

interface YoutubeClip {
    id: string;
    title: string;
    description?: string;
    videoId: string;
    url: string | null;
    postedAt: string;
    thumbnail: string | null;
    views: number;
    likes: number;
    comments: number;
}

interface YoutubeStats {
    connected: boolean;
    totals: { views: number, likes: number, comments: number };
    clips: YoutubeClip[];
}

export default function AnalyticsPage() {
    const navigate = useNavigate();
    const [internalLoading, setInternalLoading] = useState(true);
    const [youtubeLoading, setYoutubeLoading] = useState(true);
    const [internalStats, setInternalStats] = useState<InternalStats | null>(null);
    const [youtubeStats, setYoutubeStats] = useState<YoutubeStats | null>(null);

    useEffect(() => {
        fetchInternal();
        fetchYoutube();
    }, []);

    const fetchInternal = async () => {
        try {
            const token = localStorage.getItem("clipstrike_token");
            const res = await fetch(`${API_URL}/analytics/internal`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            setInternalStats(data);
        } catch (err) {
            console.error("Erro ao buscar stats internos:", err);
        } finally {
            setInternalLoading(false);
        }
    };

    const fetchYoutube = async () => {
        try {
            const token = localStorage.getItem("clipstrike_token");
            const res = await fetch(`${API_URL}/analytics/youtube`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            setYoutubeStats(data);
        } catch (err) {
            console.error("Erro ao buscar stats youtube:", err);
        } finally {
            setYoutubeLoading(false);
        }
    };

    if (internalLoading) {
        return (
            <div className="min-h-screen bg-[#080808] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <span className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20">Processando métricas</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#080808] text-white font-sans flex overflow-hidden">
            {/* Sidebar Mock */}
            <aside className="w-20 lg:w-64 border-r border-white/5 flex flex-col bg-black/20 backdrop-blur-3xl z-40">
                <div className="p-6 flex justify-center lg:justify-start">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/app/dashboard")}>
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(255,90,31,0.5)]">
                            <Zap className="h-5 w-5 text-white" fill="currentColor" />
                        </div>
                        <span className="hidden lg:block font-bold tracking-tight text-primary pt-0.5 uppercase tracking-tighter">
                            CLIPSTRIKE
                        </span>
                    </div>
                </div>
                <div className="flex-1 mt-8">
                    <button onClick={() => navigate("/app/dashboard")} className="w-full flex items-center justify-center lg:justify-start gap-4 px-8 py-4 text-white/40 hover:text-white transition-all group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="hidden lg:block font-bold text-sm tracking-tight">Voltar ao Painel</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto px-8 lg:px-20 py-16 no-scrollbar">
                <header className="mb-16 animate-in slide-in-from-top-10 fade-in duration-500">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <BarChart3 className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter">ANALYTICS</h1>
                            <p className="text-white/40 font-medium tracking-tight">Evolução do seu conteúdo e impacto real nas redes.</p>
                        </div>
                    </div>
                </header>

                <div className="space-y-20 pb-32">

                    {/* ── SECTION 1: INTERNAL STATS ─────────────────────────────────── */}
                    <section className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black tracking-widest uppercase text-white/20">Impacto ClipStrike</h2>
                        </div>

                        {/* Internal Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                label="Total de Clips"
                                value={internalStats?.totalClips || 0}
                                icon={Video}
                                desc="clips gerados pela IA"
                            />
                            <StatCard
                                label="Publicados"
                                value={internalStats?.publishedClips || 0}
                                icon={CheckCircle}
                                desc="enviados para redes"
                            />
                            <StatCard
                                label="Score Médio"
                                value={`${internalStats?.avgViralScore || 0}/10`}
                                icon={TrendingUp}
                                desc="potencial de viralização"
                            />
                            <StatCard
                                label="Horas Poupadas"
                                value={`${internalStats?.hoursSaved || 0}h`}
                                icon={Clock}
                                desc="estimativa de edição"
                            />
                        </div>

                        {/* Chart Container */}
                        <div className="p-8 lg:p-12 rounded-[40px] bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-all">
                            <h3 className="text-lg font-bold mb-10 tracking-tight">Clips gerados por semana</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={internalStats?.weeklyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                        <XAxis
                                            dataKey="week"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#ffffff20', fontSize: 10, fontWeight: 'bold' }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#ffffff20', fontSize: 10, fontWeight: 'bold' }}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '16px' }}
                                            itemStyle={{ color: '#ff5a1f', fontWeight: 'bold' }}
                                            cursor={{ fill: '#ffffff05' }}
                                        />
                                        <Bar dataKey="clips" radius={[8, 8, 0, 0]}>
                                            {
                                                internalStats?.weeklyData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === (internalStats.weeklyData.length - 1) ? '#ff5a1f' : '#ffffff10'} />
                                                ))
                                            }
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </section>

                    {/* ── SECTION 2: YOUTUBE PERFORMANCE ───────────────────────────── */}
                    <section className="space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black tracking-widest uppercase text-white/20">Performance YouTube</h2>
                            {youtubeStats?.connected && (
                                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                    Conectado via OAuth
                                </div>
                            )}
                        </div>

                        {!youtubeStats?.connected ? (
                            <div className="p-16 rounded-[40px] border border-dashed border-white/10 bg-white/[0.01] text-center flex flex-col items-center">
                                <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
                                    <Youtube className="w-8 h-8 text-white/20" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 tracking-tighter">CONECTE SEU YOUTUBE</h3>
                                <p className="text-white/40 text-sm max-w-sm mb-10 leading-relaxed">
                                    Acesse o desempenho real dos seus Shorts. Visualize visualizações, likes e comentários diretamente aqui.
                                </p>
                                <Button
                                    onClick={() => navigate("/app/dashboard/plataformas")}
                                    className="bg-white text-black font-black text-xs uppercase tracking-widest px-10 h-14 rounded-2xl hover:bg-white/90"
                                >
                                    Conectar Agora
                                </Button>
                            </div>
                        ) : youtubeLoading ? (
                            <div className="h-64 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="h-8 w-8 text-white/10 animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {/* YouTube Totals */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <MiniStatCard label="Total Views" value={youtubeStats?.totals.views || 0} icon={Eye} color="text-primary" />
                                    <MiniStatCard label="Total Likes" value={youtubeStats?.totals.likes || 0} icon={Heart} color="text-red-500" />
                                    <MiniStatCard label="Total Comentários" value={youtubeStats?.totals.comments || 0} icon={MessageCircle} color="text-blue-500" />
                                </div>

                                {/* Results Table */}
                                <div className="rounded-[40px] bg-white/[0.02] border border-white/5 overflow-hidden">
                                    <div className="p-8 border-b border-white/5">
                                        <h3 className="text-lg font-bold tracking-tight">Últimos Shorts Publicados</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-white/[0.02] border-b border-white/5">
                                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/20">Clip</th>
                                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/20">Visualizações</th>
                                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/20">Engajamento</th>
                                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/20">Link</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/[0.03]">
                                                {youtubeStats?.clips.map(clip => (
                                                    <tr key={clip.id} className="hover:bg-white/[0.03] transition-colors group">
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-20 h-12 rounded-lg bg-black border border-white/5 overflow-hidden flex-shrink-0 group-hover:border-primary/40 transition-colors">
                                                                    {clip.thumbnail ? (
                                                                        <img src={clip.thumbnail} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                                                    ) : <div className="w-full h-full flex items-center justify-center"><Youtube className="w-4 h-4 text-white/10" /></div>}
                                                                </div>
                                                                <div className="max-w-[240px]">
                                                                    <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{clip.title}</p>
                                                                    <p className="text-[10px] text-white/20 uppercase font-black tracking-widest mt-1">
                                                                        {new Date(clip.postedAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-lg font-black tracking-tight">{clip.views.toLocaleString()}</span>
                                                                <div className={`w-fit px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter ${clip.views > 1000 ? 'bg-emerald-500/10 text-emerald-400' :
                                                                        clip.views > 100 ? 'bg-primary/10 text-primary' : 'bg-white/5 text-white/20'
                                                                    }`}>
                                                                    {clip.views > 1000 ? '🔥 Viralizando' : clip.views > 100 ? '⚡ Em alta' : '💤 No início'}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-6">
                                                                <div className="flex items-center gap-2">
                                                                    <Heart className="w-4 h-4 text-red-500/40" />
                                                                    <span className="text-xs font-bold">{clip.likes.toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <MessageCircle className="w-4 h-4 text-blue-500/40" />
                                                                    <span className="text-xs font-bold">{clip.comments.toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <a
                                                                href={clip.url || "#"}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:text-white transition-colors"
                                                            >
                                                                Ver Short
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {youtubeStats?.clips.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="px-8 py-20 text-center">
                                                            <p className="text-sm font-bold text-white/20 uppercase tracking-widest">Nenhum Short publicado encontrado</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .fade-in { animation: fadeIn 0.8s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, desc }: any) {
    return (
        <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                <Icon className="w-6 h-6 text-white/20 group-hover:text-primary transition-colors" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-2">{label}</p>
            <h4 className="text-3xl font-black tracking-tighter mb-1">{value}</h4>
            <p className="text-[10px] font-bold text-white/10 uppercase tracking-widest">{desc}</p>
        </div>
    )
}

function MiniStatCard({ label, value, icon: Icon, color }: any) {
    return (
        <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center gap-5">
            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${color} shadow-lg shadow-black/20`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-0.5">{label}</p>
                <h4 className="text-2xl font-black tracking-tight">{value.toLocaleString()}</h4>
            </div>
        </div>
    )
}
