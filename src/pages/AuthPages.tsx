import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { Button } from "../components/ui/button";

function AuthLayout({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-[#0B0F19] text-white font-sans flex flex-col relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[120px] opacity-30 mix-blend-screen" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-600/10 rounded-full blur-[100px] opacity-20 mix-blend-screen" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-red-900/10" />
            </div>

            {/* Nav */}
            <nav className="relative z-50 flex items-center justify-between px-8 h-20 border-b border-white/5 bg-black/20 backdrop-blur-md">
                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => navigate("/")}
                >
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(255,90,31,0.5)]">
                        <Zap className="h-5 w-5 text-white" fill="currentColor" />
                    </div>
                    <span className="font-display text-xl font-bold tracking-tight text-primary">
                        CLIPSTRIKE
                    </span>
                </div>
                <Link to="/">
                    <Button variant="ghost" className="text-sm text-white/60 hover:text-white hover:bg-white/5">Voltar para Home</Button>
                </Link>
            </nav>

            <div className="flex-1 relative z-10 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>

            <div className="relative z-10 py-6 text-center text-xs text-white/30 border-t border-white/5">
                &copy; {new Date().getFullYear()} ClipStrike. Todos os direitos reservados.
            </div>
            <style>{`
                .fade-in {
                    animation: authFadeIn 0.6s ease-out forwards;
                }
                @keyframes authFadeIn {
                    from { opacity: 0; transform: translateY(14px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

export function SignupPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSignup = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem("clipstrike_token", "dummy_token");
        navigate("/setup/channel");
    };

    return (
        <AuthLayout>
            <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] fade-in">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold tracking-tight mb-2">Criar conta</h2>
                    <p className="text-sm text-white/50">Crie sua conta no ClipStrike para começar.</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-red-500/50 transition-all placeholder:text-white/20"
                            placeholder="nome@exemplo.com"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-red-500/50 transition-all placeholder:text-white/20"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full h-12 rounded-xl bg-primary text-white font-bold text-sm shadow-[0_0_20px_rgba(255,90,31,0.3)] hover:shadow-[0_0_30px_rgba(255,90,31,0.5)] hover:scale-[1.01] transition-all mt-6"
                    >
                        Criar Conta
                    </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-white/5">
                    <p className="text-sm text-white/50">
                        Já tem uma conta?{" "}
                        <Link to="/login" className="text-white hover:text-red-400 font-bold transition-colors">
                            Entrar
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
}

export function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem("clipstrike_token", "dummy_token");
        navigate("/dashboard");
    };

    return (
        <AuthLayout>
            <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] fade-in">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold tracking-tight mb-2">Bem-vindo de volta</h2>
                    <p className="text-sm text-white/50">Entre na sua conta para continuar</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-red-500/50 transition-all placeholder:text-white/20"
                            placeholder="nome@exemplo.com"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-red-500/50 transition-all placeholder:text-white/20"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full h-12 rounded-xl bg-primary text-white font-bold text-sm shadow-[0_0_20px_rgba(255,90,31,0.3)] hover:shadow-[0_0_30px_rgba(255,90,31,0.5)] hover:scale-[1.01] transition-all mt-6"
                    >
                        Entrar
                    </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-white/5">
                    <p className="text-sm text-white/50">
                        Não tem uma conta?{" "}
                        <Link to="/signup" className="text-white hover:text-red-400 font-bold transition-colors">
                            Criar conta grátis
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
}
