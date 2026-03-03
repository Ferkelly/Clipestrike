import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const PLATFORMS = [
    { id: "tiktok", icon: "🎵", name: "TikTok", color: "from-pink-600 to-red-500" },
    { id: "instagram", icon: "📸", name: "Instagram Reels", color: "from-purple-600 to-pink-500" },
    { id: "youtube", icon: "📺", name: "YouTube Shorts", color: "from-red-600 to-red-400" },
    { id: "facebook", icon: "👤", name: "Facebook", color: "from-blue-700 to-blue-500" },
    { id: "twitter", icon: "✖", name: "X / Twitter", color: "from-zinc-700 to-zinc-500" },
    { id: "linkedin", icon: "💼", name: "LinkedIn", color: "from-blue-600 to-blue-400" },
];

export default function SetupPlatformsPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<"connect" | "username" | "platforms">("connect");
    const [username, setUsername] = useState("");
    const [selected, setSelected] = useState<Set<string>>(new Set(["tiktok", "instagram", "youtube"]));
    const [autoPost, setAutoPost] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    function togglePlatform(id: string) {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    async function handleSave() {
        if (!username.trim() || selected.size === 0) return;
        setSaving(true);
        setError("");
        const token = localStorage.getItem("clipstrike_token");
        try {
            const res = await fetch(`${API_URL}/autopost/platforms/config`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    uploadPostUser: username.trim(),
                    enabledPlatforms: [...selected],
                    autoPost,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro ao salvar");
            navigate("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#080808] text-white font-sans flex flex-col">
            {/* BG */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-orange-600/7 blur-[100px]" />
            </div>

            {/* Nav */}
            <nav className="flex items-center justify-between px-8 h-16 border-b border-white/5 relative z-10">
                <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-sm">⚡</div>
                    <span className="font-black text-xl tracking-tight">Clip<span className="text-orange-500">Strike</span></span>
                </div>
                {/* Steps */}
                <div className="flex items-center gap-2 text-xs">
                    {["connect", "username", "platforms"].map((s, i) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-all ${step === s ? "bg-orange-500 text-white" :
                                    ["connect", "username", "platforms"].indexOf(step) > i ? "bg-emerald-500 text-white" :
                                        "bg-zinc-800 text-zinc-600"
                                }`}>{i + 1}</div>
                            {i < 2 && <div className={`w-8 h-px ${["connect", "username", "platforms"].indexOf(step) > i ? "bg-emerald-500" : "bg-zinc-800"}`} />}
                        </div>
                    ))}
                </div>
                <div className="w-24" />
            </nav>

            <div className="flex-1 flex items-start justify-center px-6 pt-10 pb-16 relative z-10">
                <div className="w-full max-w-[580px]">

                    {/* ── STEP 1: Instruções para conectar no Upload-Post ── */}
                    {step === "connect" && (
                        <div>
                            <div className="text-center mb-8">
                                <div className="text-5xl mb-4">🔗</div>
                                <h1 className="text-3xl font-black tracking-tight mb-2">Conecte Suas Plataformas</h1>
                                <p className="text-zinc-500 text-sm">O ClipStrike usa o Upload-Post.com para publicar nas redes sociais. É grátis e leva 2 minutos.</p>
                            </div>

                            <div className="bg-[#111] border border-white/8 rounded-2xl p-6 mb-4">
                                <h2 className="font-bold text-white mb-5 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-black flex items-center justify-center">1</span>
                                    Crie sua conta no Upload-Post.com
                                </h2>
                                <p className="text-zinc-400 text-sm mb-5 leading-relaxed">
                                    O Upload-Post.com é o serviço que conecta o ClipStrike ao TikTok, Instagram, YouTube e mais — usando OAuth oficial, sem riscos de banimento.
                                </p>
                                <a
                                    href="https://app.upload-post.com/welcome"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 font-bold text-sm hover:opacity-90 transition-opacity"
                                >
                                    Acessar Upload-Post.com →
                                </a>
                            </div>

                            <div className="bg-[#111] border border-white/8 rounded-2xl p-6 mb-4">
                                <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-black flex items-center justify-center">2</span>
                                    Conecte suas redes lá
                                </h2>
                                <div className="grid grid-cols-3 gap-2">
                                    {PLATFORMS.map(p => (
                                        <div key={p.id} className="flex items-center gap-2 bg-white/3 rounded-lg px-3 py-2 text-xs text-zinc-400">
                                            <span>{p.icon}</span> {p.name}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-[#111] border border-white/8 rounded-2xl p-6 mb-6">
                                <h2 className="font-bold text-white mb-2 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-black flex items-center justify-center">3</span>
                                    Volte aqui e clique em "Já conectei"
                                </h2>
                                <p className="text-zinc-500 text-xs">Você vai informar seu username do Upload-Post e selecionar as plataformas que quer usar.</p>
                            </div>

                            <button
                                onClick={() => setStep("username")}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 font-bold text-sm hover:opacity-90 transition-opacity"
                            >
                                ✅ Já conectei — Continuar
                            </button>

                            <button
                                onClick={() => navigate("/dashboard")}
                                className="w-full mt-3 py-3 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                            >
                                Pular por agora
                            </button>
                        </div>
                    )}

                    {/* ── STEP 2: Informar username ── */}
                    {step === "username" && (
                        <div>
                            <div className="text-center mb-8">
                                <div className="text-5xl mb-4">👤</div>
                                <h1 className="text-3xl font-black tracking-tight mb-2">Seu Username</h1>
                                <p className="text-zinc-500 text-sm">Qual é o seu username no Upload-Post.com?</p>
                            </div>

                            <div className="bg-[#111] border border-white/8 rounded-2xl p-6 mb-4">
                                <label className="block text-xs font-medium text-zinc-400 mb-2">
                                    Username do Upload-Post.com
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="meu-usuario"
                                    className="w-full bg-[#0d0d0d] border border-white/8 rounded-xl px-4 py-3.5 text-white text-sm placeholder-zinc-700 outline-none focus:border-orange-500/40 transition-colors"
                                />
                                <p className="text-xs text-zinc-600 mt-2">
                                    Encontre no painel do Upload-Post.com após fazer login.
                                </p>
                            </div>

                            {/* Onde encontrar o username */}
                            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 mb-6 text-xs text-zinc-500 leading-relaxed">
                                <p className="font-semibold text-zinc-400 mb-2">📍 Como encontrar seu username:</p>
                                <p>1. Acesse <span className="text-orange-400">app.upload-post.com</span></p>
                                <p>2. Clique no seu perfil (canto superior direito)</p>
                                <p>3. O username aparece abaixo do seu nome</p>
                            </div>

                            <button
                                onClick={() => username.trim() && setStep("platforms")}
                                disabled={!username.trim()}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Continuar →
                            </button>
                            <button onClick={() => setStep("connect")} className="w-full mt-3 py-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                                ← Voltar
                            </button>
                        </div>
                    )}

                    {/* ── STEP 3: Selecionar plataformas ── */}
                    {step === "platforms" && (
                        <div>
                            <div className="text-center mb-8">
                                <div className="text-5xl mb-4">📲</div>
                                <h1 className="text-3xl font-black tracking-tight mb-2">Onde Publicar?</h1>
                                <p className="text-zinc-500 text-sm">Selecione as plataformas onde seus clips serão publicados automaticamente.</p>
                            </div>

                            <div className="bg-[#111] border border-white/8 rounded-2xl p-6 mb-4">
                                <div className="grid grid-cols-2 gap-3 mb-5">
                                    {PLATFORMS.map(p => {
                                        const isSelected = selected.has(p.id);
                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => togglePlatform(p.id)}
                                                className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${isSelected
                                                        ? "border-orange-500/40 bg-orange-500/8"
                                                        : "border-white/8 bg-[#0d0d0d] hover:border-white/15"
                                                    }`}
                                            >
                                                <span className="text-xl">{p.icon}</span>
                                                <div>
                                                    <div className={`text-sm font-semibold ${isSelected ? "text-white" : "text-zinc-400"}`}>
                                                        {p.name}
                                                    </div>
                                                </div>
                                                <div className="ml-auto">
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-orange-500 bg-orange-500" : "border-zinc-700"
                                                        }`}>
                                                        {isSelected && <span className="text-white text-[10px]">✓</span>}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Auto-post toggle */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/6">
                                    <div>
                                        <div className="text-sm font-semibold text-white">Publicar automaticamente</div>
                                        <div className="text-xs text-zinc-500 mt-0.5">Publica assim que o clip for gerado</div>
                                    </div>
                                    <button
                                        onClick={() => setAutoPost(!autoPost)}
                                        className={`w-12 h-6 rounded-full transition-all relative ${autoPost ? "bg-orange-500" : "bg-zinc-700"}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${autoPost ? "left-7" : "left-1"}`} />
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-4 text-xs text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-4 py-3">{error}</div>
                            )}

                            <button
                                onClick={handleSave}
                                disabled={saving || selected.size === 0}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {saving ? "Salvando..." : `Salvar e Ir para o Dashboard →`}
                            </button>

                            <p className="text-center text-xs text-zinc-600 mt-3">
                                {selected.size} plataforma(s) selecionada(s)
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
