import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Animated counter hook ──────────────────────────────────────────────────
function useCounter(target: number, duration = 2000, start = false) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!start) return;
        let startTime: number | null = null;
        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [start, target, duration]);
    return count;
}

// ── FAQ Item ───────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div
            className="border-b border-white/8 cursor-pointer group"
            onClick={() => setOpen(!open)}
        >
            <div className="flex items-center justify-between py-5 gap-4">
                <span className="text-white font-medium text-[15px] group-hover:text-orange-400 transition-colors">
                    {q}
                </span>
                <span
                    className="text-orange-500 text-xl flex-shrink-0 transition-transform duration-300"
                    style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
                >
                    +
                </span>
            </div>
            <div
                className="overflow-hidden transition-all duration-300 text-zinc-400 text-[14px] leading-relaxed"
                style={{ maxHeight: open ? "200px" : "0", paddingBottom: open ? "20px" : "0" }}
            >
                {a}
            </div>
        </div>
    );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function LandingPage() {
    const navigate = useNavigate();
    const [countersVisible, setCountersVisible] = useState(false);
    const statsRef = useRef<HTMLDivElement>(null);

    const clipsCount = useCounter(48200, 2500, countersVisible);
    const creatorsCount = useCounter(4367, 2000, countersVisible);
    const hoursCount = useCounter(12800, 2200, countersVisible);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setCountersVisible(true); },
            { threshold: 0.3 }
        );
        if (statsRef.current) observer.observe(statsRef.current);
        return () => observer.disconnect();
    }, []);

    const steps = [
        { num: "01", icon: "🔗", title: "Conecte seu Canal", desc: "Cole a URL ou autentique com Google. Funciona com qualquer canal, qualquer tamanho." },
        { num: "02", icon: "🔔", title: "Detecção Automática", desc: "Novo vídeo publicado? Detectamos em segundos. Sem refresh, sem espera." },
        { num: "03", icon: "🧠", title: "IA Analisa Tudo", desc: "Transcrição palavra a palavra + LLM identifica os momentos com maior potencial viral." },
        { num: "04", icon: "✂️", title: "FFmpeg Edita", desc: "Smart Framing 9:16, legendas Hormozi coloridas queimadas no vídeo. Automático." },
        { num: "05", icon: "🚀", title: "Publica nas Redes", desc: "TikTok, Instagram Reels e YouTube Shorts publicados sem você tocar em nada." },
    ];

    const features = [
        { icon: "🎯", title: "Smart Framing 9:16", desc: "Detecção facial com FFmpeg centraliza o sujeito em formato vertical perfeitamente." },
        { icon: "💬", title: "Legendas Hormozi", desc: "Legendas dinâmicas e coloridas queimadas no vídeo, sincronizadas palavra a palavra." },
        { icon: "⚡", title: "Progresso Real-time", desc: "Barra de progresso ao vivo via Socket.io — Download, Transcrição, IA, Corte." },
        { icon: "🏆", title: "Viral Score", desc: "Cada clip recebe um score de viralidade com base em engajamento e hook power." },
        { icon: "📊", title: "Multi-Canal", desc: "Monitore canais ilimitados simultaneamente. Escale sem limitação técnica." },
        { icon: "☁️", title: "Supabase Storage", desc: "Vídeos e clips armazenados na nuvem. Download direto do .mp4 pronto para postar." },
    ];

    const comparisons = [
        { metric: "⏱ Tempo por vídeo", cs: "2 min", manual: "3+ horas" },
        { metric: "✂️ Corte 9:16", cs: "Automático", manual: "Manual" },
        { metric: "💬 Legendas", cs: "Auto-geradas", manual: "Manual" },
        { metric: "📲 Post nas redes", cs: "Automático", manual: "Upload manual" },
        { metric: "🔔 Detecção uploads", cs: "Tempo real", manual: "Você vê manualmente" },
        { metric: "🧠 Análise viral", cs: "IA inclusa", manual: "Achismo" },
    ];

    return (
        <div className="min-h-screen bg-[#080808] text-white font-sans overflow-x-hidden">

            {/* ── NAV ── */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 h-16 bg-[#080808]/85 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-sm font-bold">⚡</div>
                    <span className="font-black text-xl tracking-tight">Clip<span className="text-orange-500">Strike</span></span>
                </div>
                <div className="hidden md:flex gap-8 text-sm text-zinc-400">
                    <a href="#features" className="hover:text-white transition-colors cursor-pointer">Funcionalidades</a>
                    <a href="#how" className="hover:text-white transition-colors cursor-pointer">Como Funciona</a>
                    <a href="#pricing" className="hover:text-white transition-colors cursor-pointer">Preços</a>
                    <a href="#faq" className="hover:text-white transition-colors cursor-pointer">FAQ</a>
                </div>
                <div className="flex gap-3 items-center">
                    <button
                        onClick={() => navigate("/login")}
                        className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2 border border-white/10 rounded-lg hover:border-white/20"
                    >
                        Entrar
                    </button>
                    <button
                        onClick={() => navigate("/signup")}
                        className="text-sm font-semibold px-5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 hover:opacity-90 transition-opacity shadow-lg shadow-orange-900/30"
                    >
                        Começar Grátis
                    </button>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="relative pt-40 pb-24 px-6 text-center overflow-hidden">
                {/* Glow background */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-orange-600/10 blur-[120px]" />
                    <div className="absolute top-40 left-1/3 w-[300px] h-[300px] rounded-full bg-red-700/8 blur-[80px]" />
                </div>

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
                        backgroundSize: "60px 60px",
                    }}
                />

                <div className="relative max-w-5xl mx-auto">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/8 text-orange-400 text-xs font-semibold tracking-widest uppercase mb-10 animate-pulse">
                        <span>⚡</span> NOVO — AUTOMAÇÃO TOTAL COM IA
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8">
                        <span className="block text-white">CLIPS VIRAIS.</span>
                        <span className="block bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                            ZERO ESFORÇO.
                        </span>
                        <span className="block text-white text-4xl md:text-6xl mt-2 font-black tracking-tight">
                            100% AUTOMÁTICO.
                        </span>
                    </h1>

                    <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 font-light">
                        O ClipStrike monitora seu canal, detecta uploads, usa IA para identificar os melhores momentos
                        e publica clips prontos no TikTok, Reels e Shorts.{" "}
                        <span className="text-orange-400 font-medium">Sem você fazer nada.</span>
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-wrap gap-4 justify-center mb-12">
                        <button
                            onClick={() => navigate("/signup")}
                            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 font-bold text-lg hover:opacity-90 transition-all hover:-translate-y-0.5 shadow-xl shadow-orange-900/40"
                        >
                            Conectar Meu Canal <span>→</span>
                        </button>
                        <a
                            href="#how"
                            className="flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-zinc-300 hover:border-white/20 hover:text-white transition-all text-lg"
                        >
                            ▶ Ver Como Funciona
                        </a>
                    </div>

                    {/* Live proof */}
                    <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/8 text-sm text-zinc-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        +4.367 criadores automatizados agora mesmo
                    </div>
                </div>
            </section>

            {/* ── DIVIDER ── */}
            <div className="h-px bg-gradient-to-r from-transparent via-orange-600/50 to-transparent mx-12" />

            {/* ── PLATFORMS BAR ── */}
            <div className="py-10 border-b border-white/5 text-center">
                <p className="text-xs font-bold tracking-[4px] text-zinc-600 uppercase mb-5">PUBLICA AUTOMATICAMENTE EM</p>
                <div className="flex gap-10 justify-center items-center flex-wrap text-zinc-400 text-sm font-medium">
                    {["🎵  TikTok", "📸  Instagram Reels", "📺  YouTube Shorts", "✖  X / Twitter"].map((p) => (
                        <span key={p} className="hover:text-white transition-colors cursor-default">{p}</span>
                    ))}
                </div>
            </div>

            {/* ── STATS ── */}
            <div ref={statsRef} className="py-20 px-6">
                <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
                    {[
                        { value: clipsCount.toLocaleString(), label: "Clips gerados" },
                        { value: creatorsCount.toLocaleString(), label: "Criadores ativos" },
                        { value: hoursCount.toLocaleString() + "h", label: "Horas economizadas" },
                    ].map((s) => (
                        <div key={s.label} className="p-8 rounded-2xl bg-white/3 border border-white/6">
                            <div className="text-4xl md:text-5xl font-black text-white mb-2 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                                {s.value}
                            </div>
                            <div className="text-zinc-500 text-sm">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── HOW IT WORKS ── */}
            <section id="how" className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-xs font-bold tracking-[4px] text-orange-500 uppercase mb-4">Processo</p>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white">COMO FUNCIONA</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-0.5">
                        {steps.map((step, i) => (
                            <div
                                key={step.num}
                                className="relative bg-[#111] border border-white/6 p-7 group hover:bg-[#161616] transition-colors"
                                style={{
                                    borderRadius: i === 0 ? "16px 0 0 16px" : i === steps.length - 1 ? "0 16px 16px 0" : "0",
                                }}
                            >
                                <div className="text-[10px] font-black tracking-[3px] text-orange-500 mb-5">{step.num}</div>
                                <div className="w-11 h-11 rounded-xl bg-orange-500/10 flex items-center justify-center text-xl mb-5">
                                    {step.icon}
                                </div>
                                <h3 className="font-bold text-white text-sm mb-2">{step.title}</h3>
                                <p className="text-zinc-500 text-xs leading-relaxed">{step.desc}</p>
                                {i < steps.length - 1 && (
                                    <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 text-xs">
                                        →
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section id="features" className="py-24 px-6 bg-[#080808]">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-xs font-bold tracking-[4px] text-orange-500 uppercase mb-4">Ferramentas</p>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-4">TUDO QUE VOCÊ PRECISA</h2>
                        <p className="text-zinc-500 max-w-lg mx-auto">Ferramentas profissionais de edição, agora no piloto automático.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5">
                        {features.map((f, i) => (
                            <div
                                key={f.title}
                                className="bg-[#111] border border-white/6 p-9 hover:bg-[#161616] transition-all hover:-translate-y-0.5 cursor-default"
                                style={{
                                    borderRadius:
                                        i === 0 ? "16px 0 0 0" : i === 2 ? "0 16px 0 0" :
                                            i === 3 ? "0 0 0 16px" : i === 5 ? "0 0 16px 0" : "0",
                                }}
                            >
                                <div className="w-12 h-12 rounded-[14px] bg-orange-500/8 border border-orange-500/15 flex items-center justify-center text-2xl mb-6">
                                    {f.icon}
                                </div>
                                <h3 className="font-bold text-white text-base mb-2">{f.title}</h3>
                                <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── COMPARISON ── */}
            <section className="py-24 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-xs font-bold tracking-[4px] text-orange-500 uppercase mb-4">Comparação</p>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">POR QUE CLIPSTRIKE?</h2>
                    </div>

                    {/* Header */}
                    <div className="grid grid-cols-3 gap-0.5 mb-0.5">
                        <div />
                        <div className="bg-orange-500/8 border border-orange-500/25 rounded-t-xl p-4 text-center">
                            <div className="font-black text-orange-400 text-sm">ClipStrike ⚡</div>
                            <div className="text-zinc-500 text-xs mt-1">Automático</div>
                        </div>
                        <div className="bg-[#111] border border-white/6 rounded-t-xl p-4 text-center">
                            <div className="font-bold text-zinc-400 text-sm">Manual</div>
                            <div className="text-zinc-600 text-xs mt-1">Tradicional</div>
                        </div>
                    </div>

                    {comparisons.map((row, i) => (
                        <div key={row.metric} className="grid grid-cols-3 gap-0.5 mb-0.5">
                            <div className={`bg-[#111] border border-white/6 px-4 py-4 text-sm text-zinc-300 font-medium ${i === comparisons.length - 1 ? "rounded-bl-xl" : ""}`}>
                                {row.metric}
                            </div>
                            <div className="bg-orange-500/5 border border-orange-500/15 px-4 py-4 text-center text-sm font-semibold text-orange-300">
                                {row.cs}
                            </div>
                            <div className={`bg-[#111] border border-white/6 px-4 py-4 text-center text-sm text-zinc-500 ${i === comparisons.length - 1 ? "rounded-br-xl" : ""}`}>
                                {row.manual}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── PRICING ── */}
            <section id="pricing" className="py-24 px-6 bg-[#080808]">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-xs font-bold tracking-[4px] text-orange-500 uppercase mb-4">Planos</p>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">SIMPLES E TRANSPARENTE</h2>
                        <p className="text-zinc-500 mt-4">Sem surpresas. Cancele quando quiser.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Free */}
                        <div className="bg-[#111] border border-white/8 rounded-2xl p-9">
                            <div className="text-xs font-bold tracking-[3px] text-zinc-500 uppercase mb-3">Plano Free</div>
                            <div className="flex items-end gap-1 mb-1">
                                <span className="text-5xl font-black text-white">R$0</span>
                            </div>
                            <div className="text-zinc-600 text-sm mb-8">para sempre</div>
                            <ul className="space-y-3 mb-8">
                                {["3 clips por vídeo", "Legendas básicas", "1 plataforma", "1 canal monitorado"].map((f) => (
                                    <li key={f} className="flex gap-3 text-sm text-zinc-300">
                                        <span className="text-orange-500 font-bold mt-0.5">✓</span> {f}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => navigate("/signup")}
                                className="w-full py-3.5 rounded-xl border border-white/10 text-white font-semibold hover:border-white/25 transition-colors"
                            >
                                Começar Grátis
                            </button>
                        </div>

                        {/* Pro */}
                        <div className="relative bg-gradient-to-b from-orange-950/40 to-[#111] border border-orange-500/35 rounded-2xl p-9">
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-5 py-1 rounded-full bg-gradient-to-r from-red-600 to-orange-500 text-xs font-bold text-white whitespace-nowrap">
                                MAIS POPULAR
                            </div>
                            <div className="text-xs font-bold tracking-[3px] text-orange-400 uppercase mb-3">Plano Pro</div>
                            <div className="flex items-end gap-1 mb-1">
                                <span className="text-xl text-zinc-400 mb-2">R$</span>
                                <span className="text-5xl font-black text-white">47</span>
                            </div>
                            <div className="text-zinc-500 text-sm mb-8">por mês</div>
                            <ul className="space-y-3 mb-8">
                                {["Clips ilimitados", "Detecção facial avançada", "Todas as plataformas", "Canais ilimitados", "Suporte prioritário", "Analytics completo"].map((f) => (
                                    <li key={f} className="flex gap-3 text-sm text-zinc-200">
                                        <span className="text-orange-400 font-bold mt-0.5">✓</span> {f}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => navigate("/signup")}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-orange-900/40"
                            >
                                Assinar Pro →
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section id="faq" className="py-24 px-6">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-xs font-bold tracking-[4px] text-orange-500 uppercase mb-4">Dúvidas</p>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">PERGUNTAS FREQUENTES</h2>
                    </div>
                    <FaqItem q="Funciona com qualquer canal do YouTube?" a="Sim! Cole a URL do canal ou autentique com Google. Funciona com canais de qualquer tamanho e nicho, desde nano-influencers até canais com milhões de inscritos." />
                    <FaqItem q="Quanto tempo leva para gerar o primeiro clip?" a="Após conectar o canal, os primeiros clips são gerados em menos de 1 hora. Novos vídeos são detectados e processados automaticamente em minutos após o upload." />
                    <FaqItem q="Preciso instalar algum software?" a="Não. O ClipStrike roda 100% na nuvem. Sem instalação, sem configuração técnica. Só conectar e esquecer." />
                    <FaqItem q="As legendas funcionam em português?" a="Sim! A transcrição suporta português, inglês, espanhol e mais de 20 idiomas. As legendas são geradas e sincronizadas automaticamente com timestamps por palavra." />
                    <FaqItem q="Posso cancelar a qualquer momento?" a="Sim, sem multa ou fidelidade. Cancele quando quiser diretamente pelo painel. Você continua tendo acesso até o fim do período pago." />
                    <FaqItem q="O auto-post funciona para todas as redes?" a="Atualmente suportamos YouTube Shorts, TikTok, Instagram Reels e Facebook. Mais plataformas sendo adicionadas." />
                </div>
            </section>

            {/* ── CTA BANNER ── */}
            <section className="mx-6 mb-20">
                <div className="relative bg-gradient-to-r from-red-700 via-orange-600 to-orange-500 rounded-3xl p-16 text-center overflow-hidden">
                    <div
                        className="absolute inset-0 opacity-5"
                        style={{
                            backgroundImage: `repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)`,
                            backgroundSize: "20px 20px",
                        }}
                    />
                    <h2 className="relative text-4xl md:text-6xl font-black tracking-tighter text-white mb-4">
                        COMECE A AUTOMATIZAR HOJE
                    </h2>
                    <p className="relative text-white/80 text-lg mb-10">
                        Configure em 2 minutos. Seus primeiros clips em menos de 1 hora.
                    </p>
                    <button
                        onClick={() => navigate("/signup")}
                        className="relative bg-white text-orange-600 font-black text-lg px-10 py-4 rounded-xl hover:-translate-y-1 hover:shadow-2xl transition-all"
                    >
                        Conectar Meu Canal Agora →
                    </button>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="bg-[#0d0d0d] border-t border-white/5 px-8 pt-16 pb-8">
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-sm">⚡</div>
                            <span className="font-black text-lg">Clip<span className="text-orange-500">Strike</span></span>
                        </div>
                        <p className="text-zinc-500 text-sm leading-relaxed max-w-[220px]">Clips no piloto automático. Escale seu conteúdo sem esforço.</p>
                    </div>
                    {[
                        { title: "Produto", links: ["Funcionalidades", "Como Funciona", "Preços"] },
                        { title: "Empresa", links: ["Contato", "Blog", "Afiliados"] },
                        { title: "Legal", links: ["Privacidade", "Termos de Uso", "Reembolso"] },
                    ].map((col) => (
                        <div key={col.title}>
                            <h4 className="font-bold text-white text-sm mb-4">{col.title}</h4>
                            {col.links.map((link) => (
                                <a key={link} className="block text-zinc-500 text-sm mb-3 hover:text-white transition-colors cursor-pointer">{link}</a>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="max-w-6xl mx-auto border-t border-white/5 pt-6 flex justify-between text-zinc-600 text-xs">
                    <span>© 2026 ClipStrike. Todos os direitos reservados.</span>
                    <span>Clips no piloto automático.</span>
                </div>
            </footer>
        </div>
    );
}
