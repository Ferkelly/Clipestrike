import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function SetupLayout({ step, title, subtitle, children }: {
    step: 1 | 2; title: string; subtitle: string; children: React.ReactNode;
}) {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-[#080808] text-white font-sans flex flex-col">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-orange-600/7 blur-[90px]" />
            </div>

            <nav className="flex items-center justify-between px-8 h-16 border-b border-white/5 relative z-10">
                <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-sm">⚡</div>
                    <span className="font-black text-xl tracking-tight">Clip<span className="text-orange-500">Strike</span></span>
                </div>
                {/* Step indicator */}
                <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 1 ? "text-orange-400" : "text-zinc-600"}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-600"}`}>1</div>
                        Canais
                    </div>
                    <div className={`w-8 h-px ${step >= 2 ? "bg-orange-500" : "bg-zinc-800"}`} />
                    <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 2 ? "text-orange-400" : "text-zinc-600"}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-600"}`}>2</div>
                        Plataformas
                    </div>
                </div>
                <div className="w-24" />
            </nav>

            <div className="flex-1 flex items-start justify-center px-6 pt-12 pb-16 relative z-10">
                <div className="w-full max-w-[640px]">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-black tracking-tight mb-3">{title}</h1>
                        <p className="text-zinc-500 max-w-md mx-auto leading-relaxed">{subtitle}</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}

// ── CONNECT CHANNEL ────────────────────────────────────────────────────────
export function ConnectChannelPage() {
    const navigate = useNavigate();
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [channels, setChannels] = useState<{ id: string; name: string; url: string }[]>([]);

    async function handleConnect() {
        if (!url.trim()) return;
        setLoading(true);
        setError("");
        setSuccess("");
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API_URL}/channels`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ url }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro ao conectar canal");
            setChannels(prev => [...prev, data]);
            setSuccess(`Canal "${data.name}" conectado! O ClipStrike vai monitorá-lo automaticamente.`);
            setUrl("");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleRemove(id: string) {
        const token = localStorage.getItem("token");
        await fetch(`${API_URL}/channels/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        setChannels(prev => prev.filter(c => c.id !== id));
    }

    return (
        <SetupLayout
            step={1}
            title="Conecte Seus Canais"
            subtitle="Adicione os canais que quer monitorar. O ClipStrike detecta novos uploads automaticamente e cria clips para você."
        >
            {/* Card */}
            <div className="bg-[#111] border border-white/8 rounded-2xl p-7 mb-5">
                <div className="flex items-center gap-3 mb-6">
                    <span className="bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded">YT</span>
                    <h2 className="font-bold text-white">Adicionar Canal do YouTube</h2>
                </div>

                <label className="block text-xs font-medium text-zinc-400 mb-2">URL do Canal</label>
                <div className="relative mb-3">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">🔍</span>
                    <input
                        type="text"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleConnect()}
                        placeholder="https://youtube.com/@SeuCanal"
                        className="w-full bg-[#0d0d0d] border border-white/8 rounded-xl pl-10 pr-4 py-3.5 text-white text-sm placeholder-zinc-700 outline-none focus:border-orange-500/40 transition-colors"
                    />
                </div>

                {success && (
                    <div className="mb-3 text-xs text-emerald-400 bg-emerald-500/8 border border-emerald-500/15 rounded-lg px-4 py-3">
                        ✅ {success}
                    </div>
                )}
                {error && (
                    <div className="mb-3 text-xs text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-4 py-3">
                        ❌ {error}
                    </div>
                )}

                <button
                    onClick={handleConnect}
                    disabled={loading || !url.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed mb-5"
                >
                    {loading ? "Conectando..." : "+ Conectar Canal"}
                </button>

                {channels.length > 0 ? (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-sm text-white">Canais Conectados</h3>
                            <span className="w-6 h-6 rounded-full bg-gradient-to-r from-red-600 to-orange-500 text-xs font-bold flex items-center justify-center">
                                {channels.length}
                            </span>
                        </div>
                        <div className="space-y-2">
                            {channels.map(ch => (
                                <div key={ch.id} className="flex items-center justify-between bg-[#0d0d0d] border border-white/6 rounded-xl px-4 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">▶</span>
                                        <div>
                                            <div className="text-sm font-semibold text-white">{ch.name}</div>
                                            <div className="text-xs text-zinc-600 truncate max-w-[300px]">{ch.url}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Conectado
                                        </span>
                                        <button
                                            onClick={() => handleRemove(ch.id)}
                                            className="text-zinc-700 hover:text-red-400 transition-colors text-lg"
                                            title="Remover"
                                        >
                                            🗑
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-zinc-700">
                        <div className="text-4xl mb-3 opacity-30">📺</div>
                        <p className="font-semibold text-zinc-600 text-sm">Nenhum canal conectado</p>
                        <p className="text-xs mt-1 text-zinc-700">Conecte seu primeiro canal para começar</p>
                    </div>
                )}
            </div>

            {/* Continue */}
            <button
                onClick={() => navigate("/setup/platforms")}
                className="w-full py-3.5 rounded-xl border border-white/10 text-zinc-400 text-sm font-medium hover:border-white/20 hover:text-white transition-colors mb-5"
            >
                Continuar para Plataformas →
            </button>

            {/* Warning box */}
            <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-5">
                <div className="flex items-center gap-2 text-yellow-400 font-semibold text-sm mb-2">
                    🔧 Problema de Limite de Canais?
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed mb-3">
                    Recebendo erro "máximo de canais atingido"? Isso corrige o problema quando o limite não atualiza após excluir canais.
                </p>
                <button className="text-xs px-4 py-2 rounded-lg bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition-colors">
                    Corrigir Limite
                </button>
            </div>
        </SetupLayout>
    );
}

// ── CONNECT PLATFORMS ─────────────────────────────────────────────────────
const PLATFORMS = [
    { id: "youtube", icon: "📺", name: "YouTube Shorts", desc: "Publicar clips como YouTube Shorts", authPath: "/auth/youtube" },
    { id: "tiktok", icon: "🎵", name: "TikTok", desc: "Publicar clips na sua conta TikTok", authPath: "/auth/tiktok" },
    { id: "instagram", icon: "📸", name: "Instagram Reels", desc: "Publicar clips como Instagram Reels", authPath: "/auth/instagram" },
    { id: "facebook", icon: "👤", name: "Facebook", desc: "Publicar clips na sua conta Facebook", authPath: "/auth/facebook" },
];

export function ConnectPlatformsPage() {
    const navigate = useNavigate();
    const [connected, setConnected] = useState<Set<string>>(new Set());

    function handleConnect(platformId: string, authPath: string) {
        // In production: redirect to OAuth
        // window.location.href = `${API_URL}${authPath}`;
        // For now: mock connection
        setConnected(prev => new Set([...prev, platformId]));
    }

    const canContinue = connected.size > 0;

    return (
        <SetupLayout
            step={2}
            title="Conecte Suas Plataformas"
            subtitle="Conecte as redes sociais onde você quer que seus clips sejam publicados automaticamente."
        >
            <div className="bg-[#111] border border-white/8 rounded-2xl p-7 mb-5">
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {PLATFORMS.map(p => {
                        const isConnected = connected.has(p.id);
                        return (
                            <div
                                key={p.id}
                                className={`rounded-xl border p-5 transition-all ${isConnected
                                        ? "border-emerald-500/25 bg-emerald-500/5"
                                        : "border-white/8 bg-[#0d0d0d]"
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">{p.icon}</span>
                                    <h3 className="font-bold text-sm text-white">{p.name}</h3>
                                </div>
                                <p className="text-xs text-zinc-600 mb-4">{p.desc}</p>
                                <button
                                    onClick={() => handleConnect(p.id, p.authPath)}
                                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${isConnected
                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default"
                                            : "bg-gradient-to-r from-red-600 to-orange-500 text-white hover:opacity-90"
                                        }`}
                                >
                                    {isConnected ? "✓ Conectado" : "🔗 Conectar"}
                                </button>
                            </div>
                        );
                    })}
                </div>
                <p className="text-xs text-zinc-600 text-center">
                    Conecte ao menos uma plataforma para continuar
                </p>
            </div>

            <button
                onClick={() => canContinue && navigate("/dashboard")}
                disabled={!canContinue}
                className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${canContinue
                        ? "bg-gradient-to-r from-red-600 to-orange-500 text-white hover:opacity-90 shadow-lg shadow-orange-900/30"
                        : "bg-[#111] border border-white/8 text-zinc-600 cursor-not-allowed"
                    }`}
            >
                {canContinue ? "Ir para o Dashboard →" : "Conecte ao menos uma plataforma para continuar"}
            </button>
        </SetupLayout>
    );
}
