import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function AuthLayout({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-[#080808] text-white font-sans flex flex-col">
            {/* BG Glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-orange-600/8 blur-[100px]" />
            </div>

            {/* Nav */}
            <nav className="flex items-center justify-between px-8 h-16 border-b border-white/5">
                <div
                    className="flex items-center gap-2.5 cursor-pointer"
                    onClick={() => navigate("/")}
                >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-sm">⚡</div>
                    <span className="font-black text-xl tracking-tight">Clip<span className="text-orange-500">Strike</span></span>
                </div>
                <button onClick={() => navigate("/")} className="text-sm text-zinc-600 hover:text-white transition-colors">
                    ← Voltar
                </button>
            </nav>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                {children}
            </div>

            {/* Footer */}
            <div className="text-center py-6 text-xs text-zinc-700 border-t border-white/5">
                © 2026 ClipStrike. Todos os direitos reservados.
            </div>
        </div>
    );
}

export function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro ao entrar");
            localStorage.setItem("token", data.token);
            navigate("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function handleGoogle() {
        window.location.href = `${API_URL}/auth/google`;
    }

    return (
        <AuthLayout>
            <div className="w-full max-w-[420px]">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black tracking-tight mb-2">Entrar</h1>
                    <p className="text-zinc-500 text-sm">Bem-vindo de volta ao ClipStrike</p>
                </div>

                <div className="bg-[#111] border border-white/8 rounded-2xl p-8">
                    {/* Google */}
                    <button
                        onClick={handleGoogle}
                        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 text-sm font-medium text-zinc-300 hover:border-white/20 hover:text-white transition-colors mb-5"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Entrar com Google
                    </button>

                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex-1 h-px bg-white/6" />
                        <span className="text-xs text-zinc-600">ou</span>
                        <div className="flex-1 h-px bg-white/6" />
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="voce@email.com"
                                required
                                className="w-full bg-[#0d0d0d] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-700 outline-none focus:border-orange-500/40 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Sua senha"
                                required
                                className="w-full bg-[#0d0d0d] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-700 outline-none focus:border-orange-500/40 transition-colors"
                            />
                        </div>
                        {error && (
                            <div className="text-xs text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2">{error}</div>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Entrando..." : "Entrar →"}
                        </button>
                    </form>

                    <p className="text-center text-xs text-zinc-600 mt-5">
                        Não tem conta?{" "}
                        <button onClick={() => navigate("/signup")} className="text-orange-400 hover:text-orange-300 transition-colors">
                            Criar conta grátis
                        </button>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
}

export function SignupPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro ao criar conta");
            localStorage.setItem("token", data.token);
            navigate("/setup/channel");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function handleGoogle() {
        window.location.href = `${API_URL}/auth/google`;
    }

    return (
        <AuthLayout>
            <div className="w-full max-w-[420px]">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black tracking-tight mb-2">Criar Conta</h1>
                    <p className="text-zinc-500 text-sm">Comece a automatizar seus clips gratuitamente</p>
                </div>

                <div className="bg-[#111] border border-white/8 rounded-2xl p-8">
                    <button
                        onClick={handleGoogle}
                        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 text-sm font-medium text-zinc-300 hover:border-white/20 hover:text-white transition-colors mb-5"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Registrar com Google
                    </button>

                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex-1 h-px bg-white/6" />
                        <span className="text-xs text-zinc-600">ou</span>
                        <div className="flex-1 h-px bg-white/6" />
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nome</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Seu nome"
                                required
                                className="w-full bg-[#0d0d0d] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-700 outline-none focus:border-orange-500/40 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="voce@email.com"
                                required
                                className="w-full bg-[#0d0d0d] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-700 outline-none focus:border-orange-500/40 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Crie uma senha forte"
                                required
                                minLength={6}
                                className="w-full bg-[#0d0d0d] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-700 outline-none focus:border-orange-500/40 transition-colors"
                            />
                        </div>
                        {error && (
                            <div className="text-xs text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2">{error}</div>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Criando conta..." : "Criar Conta Grátis →"}
                        </button>
                    </form>

                    <p className="text-center text-xs text-zinc-600 mt-5">
                        Já tem conta?{" "}
                        <button onClick={() => navigate("/login")} className="text-orange-400 hover:text-orange-300 transition-colors">
                            Entrar
                        </button>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
}
