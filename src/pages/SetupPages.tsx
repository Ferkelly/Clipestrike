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

const PLATFORMS = [
    { id: "youtube", icon: <Youtube />, name: "YouTube Shorts", desc: "Shorts" },
    { id: "tiktok", icon: <Music />, name: "TikTok", desc: "Clips" },
    { id: "instagram", icon: <Instagram />, name: "Instagram Reels", desc: "Reels" },
    { id: "facebook", icon: <Facebook />, name: "Facebook", desc: "Videos" },
];

export function ConnectPlatformsPage() {
    const navigate = useNavigate();
    const [subStep, setSubStep] = useState<1 | 2 | 3>(1);
    const [username, setUsername] = useState("");
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [autoPost, setAutoPost] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const PLATFORMS = [
        { id: "tiktok", icon: <Music className="h-5 w-5" />, name: "TikTok" },
        { id: "instagram", icon: <Instagram className="h-5 w-5" />, name: "Instagram" },
        { id: "youtube", icon: <Youtube className="h-5 w-5" />, name: "YouTube" },
        { id: "facebook", icon: <Facebook className="h-5 w-5" />, name: "Facebook" },
    ];

    async function handleSaveConfig() {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API_URL}/autopost/platforms/config`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    upload_post_user: username,
                    enabled_platforms: selectedPlatforms,
                    auto_post: autoPost
                }),
            });
            if (!res.ok) throw new Error("Erro ao salvar configuração");
            navigate("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const togglePlatform = (id: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    return (
        <SetupLayout
            step={2}
            title="CONFIGURAR AUTO-POST"
            subtitle="Conectamos ao Upload-Post.com para automatizar suas publicações em todas as redes."
        >
            <div className="glass-card rounded-2xl p-8 border-gradient mb-8">
                {/* Step 1: External Connection */}
                {subStep === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col items-center text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                                <Zap className="h-8 w-8 text-primary" fill="currentColor" />
                            </div>
                            <h3 className="text-xl font-display mb-2">1. Conecte suas Redes</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Clique no botão abaixo para abrir o Upload-Post.com e conectar suas contas (TikTok, Instagram, etc).
                            </p>
                            <a
                                href="https://app.upload-post.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full"
                            >
                                <Button className="w-full h-14 rounded-xl bg-white text-black hover:bg-white/90 font-bold transition-all">
                                    Abrir Upload-Post.com ↗
                                </Button>
                            </a>
                        </div>
                        <Button
                            onClick={() => setSubStep(2)}
                            className="w-full h-14 rounded-xl bg-gradient-primary text-white font-bold glow-effect"
                        >
                            Já conectei as redes →
                        </Button>
                    </div>
                )}

                {/* Step 2: Username Input */}
                {subStep === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-4">
                            <h3 className="text-xl font-display text-center">2. Informe seu Usuário</h3>
                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Username do Upload-Post</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="@seu_usuario"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                                />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Button variant="outline" onClick={() => setSubStep(1)} className="flex-1 h-14 rounded-xl border-white/10 bg-transparent hover:bg-white/5">Voltar</Button>
                            <Button
                                onClick={() => username.trim() && setSubStep(3)}
                                disabled={!username.trim()}
                                className="flex-[2] h-14 rounded-xl bg-gradient-primary text-white font-bold glow-effect"
                            >
                                Próximo Passo →
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Platform Selection & Auto-Post Toggle */}
                {subStep === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-xl font-display text-center">3. Escolha as Plataformas</h3>

                        <div className="grid grid-cols-2 gap-3">
                            {PLATFORMS.map(p => {
                                const isSelected = selectedPlatforms.includes(p.id);
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => togglePlatform(p.id)}
                                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${isSelected ? "bg-primary/20 border-primary" : "bg-white/5 border-white/10 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                                            }`}
                                    >
                                        <div className={isSelected ? "text-primary" : "text-muted-foreground"}>{p.icon}</div>
                                        <span className={`text-sm font-bold ${isSelected ? "text-white" : "text-muted-foreground"}`}>{p.name}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 mt-4">
                            <div>
                                <div className="text-sm font-bold">Auto-Post Ativado</div>
                                <div className="text-xs text-muted-foreground">Postar clips automaticamente após gerados</div>
                            </div>
                            <button
                                onClick={() => setAutoPost(!autoPost)}
                                className={`w-12 h-6 rounded-full p-1 transition-colors ${autoPost ? "bg-primary" : "bg-white/20"}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${autoPost ? "translate-x-6" : ""}`} />
                            </button>
                        </div>

                        {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-4">{error}</div>}

                        <div className="flex gap-4">
                            <Button variant="outline" onClick={() => setSubStep(2)} className="flex-1 h-14 rounded-xl border-white/10 bg-transparent hover:bg-white/5">Voltar</Button>
                            <Button
                                onClick={handleSaveConfig}
                                disabled={loading || selectedPlatforms.length === 0}
                                className="flex-[2] h-14 rounded-xl bg-gradient-primary text-white font-bold glow-effect"
                            >
                                {loading ? "Salvando..." : "Finalizar e Ir ao Dashboard"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </SetupLayout>
    );
}

