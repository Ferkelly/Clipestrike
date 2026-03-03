import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Zap, Check, Trash2, Youtube, Music, Instagram, Facebook } from "lucide-react";
import { Button } from "../components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function SetupLayout({ step, title, subtitle, children }: {
    step: 1 | 2; title: string; subtitle: string; children: React.ReactNode;
}) {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col relative overflow-hidden">
            {/* Background Effects (Matching Hero) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] opacity-30 mix-blend-screen" />
            </div>

            <nav className="relative z-50 flex items-center justify-between px-8 h-20 border-b border-white/5 bg-background/50 backdrop-blur-md">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
                    <Zap className="h-6 w-6 text-primary animate-flicker" fill="currentColor" />
                    <span className="font-display text-2xl tracking-wider pt-1">CLIPSTRIKE</span>
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 text-xs font-mono uppercase tracking-widest ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${step >= 1 ? "bg-primary text-white" : "bg-white/5 text-muted-foreground"}`}>1</div>
                        <span className="hidden sm:inline">Canais</span>
                    </div>
                    <div className={`w-12 h-px ${step >= 2 ? "bg-primary" : "bg-white/10"}`} />
                    <div className={`flex items-center gap-2 text-xs font-mono uppercase tracking-widest ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${step >= 2 ? "bg-primary text-white" : "bg-white/5 text-muted-foreground"}`}>2</div>
                        <span className="hidden sm:inline">Redes</span>
                    </div>
                </div>

                <div className="w-24 hidden sm:block" />
            </nav>

            <div className="flex-1 relative z-10 flex flex-col items-center px-6 pt-12 pb-16">
                <div className="w-full max-w-2xl">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-display tracking-tight mb-4">{title}</h1>
                        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">{subtitle}</p>
                    </div>
                    {children}
                </div>
            </div>
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
            setSuccess(`Canal "${data.name}" conectado! O ClipStrike vai monitorá-lo automaticamente.`);
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
            title="CONECTE SEUS CANAIS"
            subtitle="Adicione os canais que quer monitorar. O ClipStrike detecta novos uploads automaticamente."
        >
            <div className="glass-card rounded-2xl p-8 border-gradient mb-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center">
                        <Youtube className="text-red-600 h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-display">Adicionar Canal do YouTube</h2>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">URL do Canal</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleConnect()}
                                placeholder="https://youtube.com/@SeuCanal"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>
                    </div>

                    {success && <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-2"><Check className="h-4 w-4" /> {success}</div>}
                    {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-2"> {error}</div>}

                    <Button
                        onClick={handleConnect}
                        disabled={loading || !url.trim()}
                        className="w-full h-14 rounded-xl bg-gradient-primary text-white font-bold glow-effect hover:scale-[1.01] transition-transform border-0"
                    >
                        {loading ? "Conectando..." : "+ Conectar Canal"}
                    </Button>
                </div>

                {channels.length > 0 && (
                    <div className="mt-10 border-t border-white/5 pt-8">
                        <h3 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">Canais Conectados ({channels.length})</h3>
                        <div className="space-y-3">
                            {channels.map(ch => (
                                <div key={ch.id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-5 py-4 group hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-red-600/10 flex items-center justify-center"><Youtube className="h-4 w-4 text-red-600" /></div>
                                        <div>
                                            <div className="text-sm font-bold text-foreground">{ch.name}</div>
                                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">{ch.url}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemove(ch.id)} className="p-2 text-muted-foreground hover:text-red-500 transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={() => navigate("/setup/platforms")}
                className="w-full py-4 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
                Continuar para Redes Sociais →
            </button>
        </SetupLayout>
    );
}


