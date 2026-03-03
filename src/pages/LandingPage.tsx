import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ─── Design Tokens ──────────────────────────────────────────────────────────
const COLORS = {
    primary: "#FF5A1F",
    accent: "#FF7A2F",
    bg: "#0B0B0F",
    bgSecondary: "#111114",
    text: "#FFFFFF",
    muted: "#A1A1AA",
    border: "rgba(255, 255, 255, 0.08)",
    glass: "rgba(255, 255, 255, 0.02)",
};

// ─── Icons ───────────────────────────────────────────────────────────────────
const Icon = {
    Bolt: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
    ),
    YouTube: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6a3 3 0 0 0-2.1 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z" /></svg>
    ),
    Search: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
    ),
    Scissors: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></svg>
    ),
    Share: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
    ),
    Check: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
    ),
    X: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
    ),
};

// ─── Components ─────────────────────────────────────────────────────────────
function Logo({ size = 24 }: { size?: number }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
                width: size + 8, height: size + 8,
                backgroundColor: COLORS.primary,
                borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 20px ${COLORS.primary}4D`
            }}>
                <svg width={size - 2} height={size - 2} viewBox="0 0 24 24" fill="white">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
            </div>
            <span style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: size === 24 ? 22 : 18,
                letterSpacing: "-0.5px", color: COLORS.text, textTransform: "uppercase"
            }}>CLIPSTRIKE</span>
        </div>
    );
}

export default function LandingPage() {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

    const steps = [
        { title: "Conecte Canal", desc: "Vincule sua conta do YouTube com um clique via OAuth seguro.", icon: <Icon.YouTube /> },
        { title: "Detecta Uploads", desc: "Monitoramos seu canal 24/7. Postou algo novo? Nós começamos.", icon: <Icon.Search /> },
        { title: "IA Encontra Momentos", desc: "Nossa IA analisa o conteúdo e identifica onde está o engajamento.", icon: <Icon.Bolt /> },
        { title: "Cria Clip Vertical", desc: "Corte automático em 9:16 com legendas dinâmicas inclusas.", icon: <Icon.Scissors /> },
        { title: "Publica Automático", desc: "Envia direto para TikTok, Instagram Reels e YouTube Shorts.", icon: <Icon.Share /> },
    ];

    const comparison = [
        { feature: "Tempo por vídeo", strike: "2 minutos", manual: "2+ horas" },
        { feature: "Esforço de Edição", strike: "Zero (IA)", manual: "Manual Intenso" },
        { feature: "Consistência de Postagem", strike: "100%", manual: "Variável" },
        { feature: "Multi-Plataforma", strike: "Automático", manual: "Manual e Lento" },
        { feature: "Custo por Clip", strike: "Centavos", manual: "R$ 50 - R$ 200" },
    ];

    return (
        <div style={{ minHeight: "100vh", backgroundColor: COLORS.bg, color: COLORS.text, fontFamily: "'Inter', sans-serif", overflowX: "hidden" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${COLORS.primary}; }
        
        .hero-glow {
          position: absolute; top: 15%; left: 50%; transform: translate(-50%, -50%);
          width: 600px; height: 400px;
          background: radial-gradient(circle, ${COLORS.primary}1A 0%, transparent 70%);
          filter: blur(80px); pointer-events: none; z-index: 0;
        }

        .cta-btn {
          background: ${COLORS.primary}; color: #fff; border: none; padding: 18px 40px;
          font-weight: 800; border-radius: 8px; cursor: pointer; transition: all 0.3s;
          text-transform: uppercase; letter-spacing: 0.5px; font-size: 16px;
        }
        .cta-btn:hover { background: ${COLORS.accent}; transform: translateY(-2px); box-shadow: 0 10px 20px ${COLORS.primary}33; }

        .outline-btn {
          background: transparent; color: #fff; border: 1px solid ${COLORS.border}; padding: 18px 40px;
          font-weight: 700; border-radius: 8px; cursor: pointer; transition: all 0.3s;
          text-transform: uppercase; letter-spacing: 0.5px; font-size: 16px;
        }
        .outline-btn:hover { background: rgba(255,255,255,0.05); border-color: ${COLORS.muted}; }

        .nav-link { color: ${COLORS.muted}; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; cursor: pointer; }
        .nav-link:hover { color: #fff; }

        .card {
          background: ${COLORS.bgSecondary}; border: 1px solid ${COLORS.border};
          padding: 32px; border-radius: 16px; transition: border-color 0.3s;
        }
        .card:hover { border-color: ${COLORS.primary}4D; }

        .condensed { letter-spacing: -2px; line-height: 0.95; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.8s ease-out forwards; }
      `}</style>

            {/* ── Navbar ─────────────────────────────────────────────────── */}
            <nav style={{
                position: "fixed", top: 0, left: 0, right: 0, height: 80, zIndex: 100,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 60px", backgroundColor: scrolled ? "rgba(11, 11, 15, 0.9)" : "transparent",
                backdropFilter: scrolled ? "blur(20px)" : "none",
                borderBottom: scrolled ? `1px solid ${COLORS.border}` : "none",
                transition: "all 0.3s"
            }}>
                <Logo />

                <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
                    {["Funcionalidades", "Como Funciona", "Preços", "GitHub"].map(link => (
                        <span key={link} className="nav-link" onClick={() => link === "GitHub" ? window.open("https://github.com/Ferkelly/Clipestrike", "_blank") : scrollTo(link.toLowerCase().replace(/ /g, '-'))}>{link}</span>
                    ))}
                </div>

                <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                    <span className="nav-link" onClick={() => navigate("/login")}>Login</span>
                    <button className="cta-btn" style={{ padding: "12px 24px", fontSize: 14 }} onClick={() => navigate("/login")}>Começar Grátis</button>
                </div>
            </nav>

            {/* ── Hero ───────────────────────────────────────────────────── */}
            <section style={{ position: "relative", paddingTop: 180, paddingBottom: 100, textAlign: "center", paddingInline: 24 }}>
                <div className="hero-glow" />

                <div className="fade-in" style={{ position: "relative", zIndex: 1 }}>
                    <h1 className="condensed" style={{ fontSize: "clamp(50px, 10vw, 100px)", fontWeight: 900, textTransform: "uppercase", marginBottom: 32 }}>
                        CLIPS VIRAIS.<br />
                        ZERO ESFORÇO.<br />
                        <span style={{ color: COLORS.primary }}>100% AUTOMÁTICO.</span>
                    </h1>

                    <p style={{ color: COLORS.muted, fontSize: "clamp(18px, 2vw, 22px)", maxWidth: 700, margin: "0 auto 48px", lineHeight: 1.6 }}>
                        O ClipStrike monitora seu canal, extrai os melhores momentos com IA avançada e publica nas redes sociais automaticamente.
                    </p>

                    <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
                        <button className="cta-btn" onClick={() => navigate("/login")}>Conectar Meu Canal</button>
                        <button className="outline-btn" onClick={() => scrollTo("como-funciona")}>Ver Como Funciona</button>
                    </div>
                </div>
            </section>

            {/* ── Como Funciona ────────────────────────────────────────────── */}
            <section id="como-funciona" style={{ padding: "120px 60px" }}>
                <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                    <h2 style={{ fontSize: 40, fontWeight: 900, textTransform: "uppercase", textAlign: "center", marginBottom: 64, letterSpacing: "-1px" }}>COMO FUNCIONA</h2>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
                        {steps.map((step, i) => (
                            <div key={i} className="card">
                                <div style={{ color: COLORS.primary, marginBottom: 20 }}>{step.icon}</div>
                                <h3 style={{ fontSize: 18, fontWeight: 800, textTransform: "uppercase", marginBottom: 12, letterSpacing: "-0.5px" }}>{step.title}</h3>
                                <p style={{ color: COLORS.muted, fontSize: 14, lineHeight: 1.6 }}>{step.desc}</p>
                                <div style={{ marginTop: 20, fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.1)" }}>STEP 0{i + 1}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Por que ClipStrike ────────────────────────────────────────── */}
            <section id="preços" style={{ padding: "120px 60px", backgroundColor: COLORS.bgSecondary }}>
                <div style={{ maxWidth: 900, margin: "0 auto" }}>
                    <h2 style={{ fontSize: 40, fontWeight: 900, textTransform: "uppercase", textAlign: "center", marginBottom: 64, letterSpacing: "-1px" }}>POR QUE CLIPSTRIKE?</h2>

                    <div style={{ borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
                        {/* Header */}
                        <div style={{ display: "flex", backgroundColor: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${COLORS.border}` }}>
                            <div style={{ flex: 1.5, padding: "20px 32px", fontSize: 14, fontWeight: 700, color: COLORS.muted }}>CARACTERÍSTICA</div>
                            <div style={{ flex: 1, padding: "20px 32px", fontSize: 14, fontWeight: 900, color: COLORS.primary, textAlign: "center", borderLeft: `1px solid ${COLORS.primary}33`, backgroundColor: `${COLORS.primary}0D` }}>CLIPSTRIKE</div>
                            <div style={{ flex: 1, padding: "20px 32px", fontSize: 14, fontWeight: 700, color: COLORS.muted, textAlign: "center", borderLeft: `1px solid ${COLORS.border}` }}>MANUAL</div>
                        </div>

                        {comparison.map((row, i) => (
                            <div key={i} style={{ display: "flex", borderBottom: i === comparison.length - 1 ? "none" : `1px solid ${COLORS.border}` }}>
                                <div style={{ flex: 1.5, padding: "24px 32px", fontSize: 16, fontWeight: 500 }}>{row.feature}</div>
                                <div style={{ flex: 1, padding: "24px 32px", textAlign: "center", fontWeight: 700, borderLeft: `1px solid ${COLORS.primary}33`, backgroundColor: `${COLORS.primary}05` }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                        <span style={{ color: "#4ade80" }}><Icon.Check /></span>
                                        {row.strike}
                                    </div>
                                </div>
                                <div style={{ flex: 1, padding: "24px 32px", textAlign: "center", color: COLORS.muted, borderLeft: `1px solid ${COLORS.border}`, fontWeight: 500, opacity: 0.6 }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                        <span style={{ color: "#f87171" }}><Icon.X /></span>
                                        {row.manual}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Banner ──────────────────────────────────────────────── */}
            <section style={{ padding: "120px 60px" }}>
                <div style={{
                    maxWidth: 1100, margin: "0 auto", padding: "80px 40px",
                    backgroundColor: "#0F0F13", border: `1px solid ${COLORS.border}`,
                    borderRadius: 24, textAlign: "center", position: "relative", overflow: "hidden",
                    boxShadow: `0 0 60px ${COLORS.primary}1A`
                }}>
                    {/* Subtle glow edge */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1.5, background: `${COLORS.primary}` }} />

                    <h2 style={{ fontSize: "clamp(30px, 5vw, 56px)", fontWeight: 900, textTransform: "uppercase", marginBottom: 24, letterSpacing: "-2px" }}>COMECE A AUTOMATIZAR HOJE</h2>
                    <p style={{ color: COLORS.muted, fontSize: 18, marginBottom: 44, maxWidth: 500, margin: "0 auto 44px" }}>Junte-se a criadores que não perdem mais tempo editando shorts.</p>
                    <button className="cta-btn" onClick={() => navigate("/login")}>Conectar Meu Canal Agora</button>
                </div>
            </section>

            {/* ── Footer ──────────────────────────────────────────────────── */}
            <footer style={{ padding: "80px 60px 40px", borderTop: `1px solid ${COLORS.border}` }}>
                <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 40 }}>
                    <div>
                        <Logo size={20} />
                        <p style={{ color: COLORS.muted, fontSize: 14, marginTop: 20, maxWidth: 280, lineHeight: 1.6 }}>
                            ClipStrike utiliza inteligência artificial para automatizar seu workflow de conteúdo vertical.
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: 80 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <span style={{ fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Produto</span>
                            <span className="nav-link">Funcionalidades</span>
                            <span className="nav-link">Como Funciona</span>
                            <span className="nav-link">Preços</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <span style={{ fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Legal</span>
                            <span className="nav-link">Privacidade</span>
                            <span className="nav-link">Termos</span>
                        </div>
                    </div>
                </div>

                <div style={{ maxWidth: 1200, margin: "60px auto 0", paddingTop: 40, borderTop: `1px solid rgba(255,255,255,0.03)`, display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
                    <span>© 2026 ClipStrike. Todos os direitos reservados.</span>
                    <span>Criado por Ferkelly</span>
                </div>
            </footer>
        </div>
    );
}
