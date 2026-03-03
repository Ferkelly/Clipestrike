import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ─── Icons ───────────────────────────────────────────────────────────────────
const Icon = {
    Bolt: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
    ),
    YouTube: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6a3 3 0 0 0-2.1 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z" /></svg>
    ),
    Eye: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
    ),
    Scissors: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></svg>
    ),
    Share: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
    ),
    DollarSign: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
    ),
    Check: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
    ),
    X: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
    ),
    Clock: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
    ),
    User: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
    ),
    Menu: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
    ),
};

// ─── Animated Wave ─────────────────────────────────────────────────────────
function AnimatedWave() {
    return (
        <div style={{ width: "100%", overflow: "hidden", lineHeight: 0, marginTop: "-2px" }}>
            <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: "60px" }}>
                <defs>
                    <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.6" />
                        <stop offset="40%" stopColor="#ec4899" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#eab308" stopOpacity="0.4" />
                    </linearGradient>
                </defs>
                <path fill="url(#waveGrad)" d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z" style={{ animation: "waveAnim 6s ease-in-out infinite alternate" }} />
            </svg>
            <style>{`@keyframes waveAnim { from { d: path('M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z'); } to { d: path('M0,20 C240,50 480,10 720,40 C960,10 1200,50 1440,20 L1440,60 L0,60 Z'); } }`}</style>
        </div>
    );
}

// ─── Logo Component ─────────────────────────────────────────────────────────
function Logo({ size = 24 }: { size?: number }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
                width: size + 8, height: size + 8,
                background: "linear-gradient(135deg, #a855f7, #ec4899, #eab308)",
                borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 16px rgba(168,85,247,0.5)"
            }}>
                <svg width={size - 2} height={size - 2} viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
            </div>
            <span style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: size === 24 ? 20 : 16,
                background: "linear-gradient(90deg, #a855f7, #ec4899, #eab308)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.5px"
            }}>EasySlice.AI</span>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function LandingPage() {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 30);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        setMenuOpen(false);
    };

    const steps = [
        { icon: <Icon.YouTube />, color: "#ff4444", title: "Connect Channel", desc: "Paste your YouTube channel URL. EasySlice monitors it 24/7 automatically." },
        { icon: <Icon.Eye />, color: "#a855f7", title: "Detect Uploads", desc: "The moment a new video is published, our AI engine gets to work instantly." },
        { icon: <Icon.Scissors />, color: "#ec4899", title: "Auto-Clip AI", desc: "AI analyzes every second — finding viral hooks, punchlines and highlights." },
        { icon: <Icon.Share />, color: "#06b6d4", title: "Auto-Post", desc: "Clips are formatted for each platform and scheduled or posted automatically." },
        { icon: <Icon.DollarSign />, color: "#eab308", title: "Earn Money", desc: "Monetize clips via Whop. Your audience grows while you sleep.", badge: "NEW" },
    ];

    const comparisonRows = [
        { label: "Time Investment", easy: "Zero — fully automated", manual: "4–8 hours per video", icon: <Icon.Clock /> },
        { label: "Consistency", easy: "Every upload, every time", manual: "Only when you have time", icon: <Icon.Check /> },
        { label: "AI Analysis", easy: "Smart viral detection", manual: "Guesswork & intuition", icon: <Icon.Bolt /> },
        { label: "Multi-Platform", easy: "All platforms at once", manual: "One platform at a time", icon: <Icon.Share /> },
    ];

    return (
        <div style={{ minHeight: "100vh", background: "#0B0F19", color: "#fff", fontFamily: "'Inter', sans-serif", overflowX: "hidden" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(168,85,247,0.3); }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0B0F19; } ::-webkit-scrollbar-thumb { background: #a855f7; border-radius: 3px; }
        .nav-link { color: rgba(255,255,255,0.65); font-size: 14px; font-weight: 500; cursor: pointer; transition: color 0.2s; text-decoration: none; }
        .nav-link:hover { color: #fff; }
        .glass { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(12px); }
        .glow-btn { background: linear-gradient(90deg, #a855f7, #ec4899, #eab308); border: none; cursor: pointer; color: #fff; font-weight: 700; border-radius: 12px; transition: all 0.3s; position: relative; overflow: hidden; }
        .glow-btn:hover { transform: translateY(-2px); box-shadow: 0 0 32px rgba(168,85,247,0.5); }
        .glow-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, #a855f7, #ec4899, #eab308); opacity: 0; transition: opacity 0.3s; }
        .step-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 28px; transition: all 0.3s; cursor: default; }
        .step-card:hover { background: rgba(255,255,255,0.07); border-color: rgba(168,85,247,0.3); transform: translateY(-4px); }
        .fade-in { animation: fadeIn 0.8s ease both; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(168,85,247,0.4); } 50% { box-shadow: 0 0 0 12px rgba(168,85,247,0); } }
        .pulse { animation: pulse 2.5s infinite; }
      `}</style>

            {/* ── Navbar ─────────────────────────────────────────────────── */}
            <nav style={{
                position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
                padding: "0 40px", height: 68,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: scrolled ? "rgba(11,15,25,0.92)" : "transparent",
                backdropFilter: scrolled ? "blur(20px)" : "none",
                borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
                transition: "all 0.3s"
            }}>
                <Logo />
                {/* Desktop Links */}
                <div style={{ display: "flex", gap: 36, alignItems: "center" }} className="desktop-nav">
                    {["Features", "How it Works", "Monetize with Whop", "Contact"].map((item, i) => (
                        <span key={i} className="nav-link" onClick={() => scrollTo(["features", "how-it-works", "monetize", "contact"][i])}>
                            {item}
                        </span>
                    ))}
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <button
                        onClick={() => navigate("/login")}
                        style={{
                            width: 40, height: 40, borderRadius: "50%",
                            background: "linear-gradient(135deg, #a855f7, #ec4899)",
                            border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 0 12px rgba(168,85,247,0.4)"
                        }}
                        className="pulse"
                        title="Login"
                    >
                        <Icon.User />
                    </button>
                    <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "none" }} id="hamburger">
                        <Icon.Menu />
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            {menuOpen && (
                <div style={{ position: "fixed", top: 68, left: 0, right: 0, zIndex: 99, background: "#0B0F19", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "16px 24px" }}>
                    {["Features", "How it Works", "Monetize with Whop", "Contact"].map((item, i) => (
                        <div key={i} style={{ padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", color: "rgba(255,255,255,0.75)", fontSize: 15 }}
                            onClick={() => scrollTo(["features", "how-it-works", "monetize", "contact"][i])}>
                            {item}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Hero ───────────────────────────────────────────────────── */}
            <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 0", position: "relative" }}>
                {/* Background glow */}
                <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 700, height: 700, background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: "40%", left: "20%", width: 300, height: 300, background: "radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

                <div className="fade-in" style={{ maxWidth: 800, position: "relative", zIndex: 1 }}>
                    {/* Badge */}
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28, padding: "6px 16px", borderRadius: 100, background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)", fontSize: 13, color: "#c084fc" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7", display: "inline-block" }} />
                        Fully Automated AI Clipping
                    </div>

                    <h1 style={{ fontSize: "clamp(44px, 8vw, 80px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-2px", marginBottom: 24 }}>
                        Automated Clips.<br />
                        <span style={{ background: "linear-gradient(90deg, #a855f7, #ec4899, #eab308)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            Zero Effort.
                        </span>
                    </h1>

                    <p style={{ fontSize: "clamp(17px, 2.5vw, 20px)", color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 44, maxWidth: 620, margin: "0 auto 44px" }}>
                        EasySlice.AI turns new YouTube uploads into social-ready highlight clips.<br />
                        No downloading. No editing. No uploading. Just passive clips.
                    </p>

                    <button
                        className="glow-btn"
                        onClick={() => navigate("/login")}
                        style={{ fontSize: 17, fontWeight: 700, padding: "18px 44px", borderRadius: 14, letterSpacing: "-0.3px", marginBottom: 28 }}
                    >
                        Start Passively Today →
                    </button>

                    {/* Notification banner */}
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 20px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdrop: "blur(12px)", fontSize: 13, color: "rgba(255,255,255,0.55)", maxWidth: 460 }}>
                        <span style={{ fontSize: 18 }}>⚡</span>
                        Set once and let the content flow. EasySlice.AI handles everything after upload.
                    </div>
                </div>

                {/* Wave */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
                    <AnimatedWave />
                </div>
            </section>

            {/* ── How It Works ────────────────────────────────────────────── */}
            <section id="how-it-works" style={{ padding: "100px 24px", background: "linear-gradient(180deg, rgba(168,85,247,0.03) 0%, transparent 100%)" }}>
                <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: 60 }}>
                        <p style={{ color: "#a855f7", fontSize: 13, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>Simple Process</p>
                        <h2 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-1px" }}>How It Works</h2>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }} id="features">
                        {steps.map((step, i) => (
                            <div key={i} className="step-card" style={{ position: "relative" }}>
                                {step.badge && (
                                    <span style={{ position: "absolute", top: 16, right: 16, background: "linear-gradient(90deg, #a855f7, #ec4899)", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, letterSpacing: 1 }}>
                                        {step.badge}
                                    </span>
                                )}
                                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${step.color}18`, border: `1px solid ${step.color}30`, display: "flex", alignItems: "center", justifyContent: "center", color: step.color, marginBottom: 16 }}>
                                    {step.icon}
                                </div>
                                <div style={{ fontSize: 11, color: "#a855f7", fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Step {i + 1}</div>
                                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{step.title}</h3>
                                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Why Choose ──────────────────────────────────────────────── */}
            <section id="monetize" style={{ padding: "100px 24px" }}>
                <div style={{ maxWidth: 900, margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: 60 }}>
                        <p style={{ color: "#ec4899", fontSize: 13, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>The Smart Choice</p>
                        <h2 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-1px" }}>Why Choose EasySlice.AI?</h2>
                    </div>

                    {/* Comparison Table */}
                    <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                        {/* Header */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: "rgba(255,255,255,0.03)" }}>
                            <div style={{ padding: "16px 24px", fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Feature</div>
                            <div style={{ padding: "16px 24px", background: "rgba(168,85,247,0.08)", borderLeft: "2px solid #a855f7", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                                <span style={{ fontSize: 15, fontWeight: 700, background: "linear-gradient(90deg, #a855f7, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>EasySlice.AI</span>
                            </div>
                            <div style={{ padding: "16px 24px", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
                                <span style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Manual Editing</span>
                            </div>
                        </div>

                        {comparisonRows.map((row, i) => (
                            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                                <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ color: "#a855f7" }}>{row.icon}</span>
                                    <span style={{ fontSize: 14, fontWeight: 600 }}>{row.label}</span>
                                </div>
                                <div style={{ padding: "20px 24px", background: "rgba(168,85,247,0.05)", borderLeft: "2px solid #a855f7", borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ color: "#4ade80" }}><Icon.Check /></span>
                                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{row.easy}</span>
                                </div>
                                <div style={{ padding: "20px 24px", borderLeft: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ color: "#f87171" }}><Icon.X /></span>
                                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{row.manual}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Banner ──────────────────────────────────────────────── */}
            <section style={{ padding: "60px 24px 100px" }}>
                <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center", padding: "60px 40px", borderRadius: 24, background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.1))", border: "1px solid rgba(168,85,247,0.2)" }}>
                    <h2 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, marginBottom: 16, letterSpacing: "-1px" }}>Ready to go passive?</h2>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, marginBottom: 36, lineHeight: 1.6 }}>
                        Start clipping, start growing, start earning — all on autopilot.
                    </p>
                    <button className="glow-btn" onClick={() => navigate("/login")} style={{ fontSize: 16, fontWeight: 700, padding: "16px 40px" }}>
                        Start Passively Today →
                    </button>
                </div>
            </section>

            {/* ── Footer ──────────────────────────────────────────────────── */}
            <footer id="contact" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "60px 40px 32px" }}>
                <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 48, marginBottom: 56 }}>
                        <div>
                            <Logo size={20} />
                            <p style={{ marginTop: 14, fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, maxWidth: 220 }}>
                                AI-powered automatic clip generation from YouTube uploads. Set it once, earn forever.
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>Product</p>
                            {["Dashboard", "Features", "How it Works", "Pricing"].map(l => (
                                <p key={l} style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 10, cursor: "pointer" }}
                                    onMouseOver={e => (e.currentTarget.style.color = "#fff")}
                                    onMouseOut={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>{l}</p>
                            ))}
                        </div>
                        <div>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>Company</p>
                            {["About Us", "Blog", "Careers", "Contact"].map(l => (
                                <p key={l} style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 10, cursor: "pointer" }}
                                    onMouseOver={e => (e.currentTarget.style.color = "#fff")}
                                    onMouseOut={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>{l}</p>
                            ))}
                        </div>
                        <div>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>Legal</p>
                            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(l => (
                                <p key={l} style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 10, cursor: "pointer" }}
                                    onMouseOver={e => (e.currentTarget.style.color = "#fff")}
                                    onMouseOut={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>{l}</p>
                            ))}
                        </div>
                    </div>

                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>© 2026 EasySlice.AI. All rights reserved.</p>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>Made with ❤️ for creators</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
