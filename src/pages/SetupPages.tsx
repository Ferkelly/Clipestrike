import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Check, Trash2, Youtube, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function SetupLayout({ step, title, subtitle, children }: {
    step: 1 | 2; title: string; subtitle: string; children: React.ReactNode;
}) {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-[#0B0F19] text-white font-sans flex flex-col relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[120px] opacity-30 mix-blend-screen" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-600/10 rounded-full blur-[100px] opacity-20 mix-blend-screen" />
            </div>

            <nav className="relative z-50 flex items-center justify-between px-8 h-20 border-b border-white/5 bg-black/20 backdrop-blur-md">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF4D00] to-[#FF8C00] flex items-center justify-center shadow-[0_0_15px_rgba(255,77,0,0.5)]">
                        <Zap className="h-5 w-5 text-white" fill="currentColor" />
                    </div>
                    <span className="font-display text-xl font-bold tracking-tight bg-gradient-to-r from-[#FF4D00] to-[#FF8C00] bg-clip-text text-transparent pt-1">
                        CLIPSTRIKE
                    </span>
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${step >= 1 ? "text-red-400" : "text-white/20"}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${step >= 1 ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]" : "bg-white/5 text-white/20"}`}>1</div>
                        <span className="hidden sm:inline">Canais</span>
                    </div>
                    <div className={`w-10 h-px transition-colors ${step >= 2 ? "bg-red-500" : "bg-white/10"}`} />
                    <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${step >= 2 ? "text-red-400" : "text-white/20"}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${step >= 2 ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]" : "bg-white/5 text-white/20"}`}>2</div>
                        <span className="hidden sm:inline">Plataformas</span>
                    </div>
                </div>

                <div className="w-24 hidden sm:block" />
            </nav>

            <div className="flex-1 relative z-10 flex flex-col items-center px-6 pt-16 pb-20">
                <div className="w-full max-w-2xl">
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
        const token = localStorage.getItem("clipstrike_token");
        try {
            const res = await fetch(`${API_URL}/channels`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ url }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro ao conectar canal");
            setChannels(prev => [...prev, data]);
            setSuccess(`Channel "${data.name}" connected!`);
            setUrl("");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleRemove(id: string) {
        const token = localStorage.getItem("clipstrike_token");
        await fetch(`${API_URL}/channels/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        setChannels(prev => prev.filter(c => c.id !== id));
    }

    return (
        <SetupLayout
            step={1}
            title="Conecte seus Canais"
            subtitle="Adicione os canais do YouTube que você deseja monitorar. O ClipStrike detectará automaticamente novos uploads e criará clipes para você."
        >
            <div className="space-y-6 fade-in">
                <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-gradient-s">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                            <Youtube className="text-red-500 h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">Adicionar Canal do YouTube</h2>
                    </div>

                    <div className="space-y-6">
                        <button
                            onClick={() => navigate("/auth/redirect")}
                            className="w-full h-14 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-sm shadow-[0_0_20px_rgba(255,77,0,0.3)] hover:shadow-[0_0_30px_rgba(255,77,0,0.5)] hover:scale-[1.01] transition-all flex items-center justify-center gap-3 mb-4"
                        >
                            <Youtube className="w-5 h-5" /> Conectar com Google
                        </button>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest"><span className="bg-[#0B0F19] px-4 text-white/20">Ou use a URL do canal</span></div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-1">URL do Canal do YouTube</label>
                            <input
                                type="text"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleConnect()}
                                placeholder="https://youtube.com/@NomeDoCanal"
                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-red-500/50 transition-all placeholder:text-white/20"
                            />
                        </div>

                        {success && <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-2"><Check className="h-4 w-4" /> {success}</div>}
                        {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-2"> {error}</div>}

                        <button
                            onClick={handleConnect}
                            disabled={loading || !url.trim()}
                            className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50"
                        >
                            {loading ? "Conectando..." : "+ Conectar Manualmente"}
                        </button>
                    </div>

                    <div className="mt-10 pt-8 border-t border-white/5">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-5 ml-1">Canais Conectados</h3>
                        {channels.length === 0 ? (
                            <div className="text-center py-10 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                <p className="text-sm text-white/30">Nenhum canal conectado</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {channels.map(ch => (
                                    <div key={ch.id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl px-5 py-4 group hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center"><Youtube className="h-5 w-5 text-red-500" /></div>
                                            <div>
                                                <div className="text-sm font-bold text-white">{ch.name}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/80">Conectado</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemove(ch.id)} className="p-2.5 bg-white/5 rounded-xl text-white/30 hover:text-red-500 hover:bg-red-500/10 transition-all">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => navigate("/app/plataformas")}
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#FF4D00] to-[#FF8C00] text-white font-bold text-sm shadow-[0_0_20px_rgba(255,77,0,0.2)] hover:shadow-[0_0_30px_rgba(255,77,0,0.4)] hover:scale-[1.01] transition-all"
                >
                    Continuar para Configuração de Plataformas →
                </button>

                {/* Warning Card */}
                <div className="bg-yellow-500/10 border border-yellow-500/20 backdrop-blur-xl rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-gradient-s">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                            <AlertCircle className="text-yellow-500 h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-yellow-500">Corrigir Problema de Limite de Canal</h3>
                            <p className="text-xs text-yellow-500/60 mt-0.5">Algumas contas podem sofrer limitações ao conectar vários canais.</p>
                        </div>
                    </div>
                    <button className="whitespace-nowrap px-6 py-2.5 bg-yellow-500 text-black text-xs font-bold rounded-xl hover:bg-yellow-400 transition-colors">
                        Corrigir Limites
                    </button>
                </div>
            </div>
        </SetupLayout>
    );
}
