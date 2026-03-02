import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { Button } from "../components/ui/button";

function AuthLayout({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col relative overflow-hidden">
            {/* Background Effects (Matching Hero) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-40 mix-blend-screen" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[100px] opacity-20 mix-blend-screen" />
            </div>

            {/* Nav (Matching Landing Navbar) */}
            <nav className="relative z-50 flex items-center justify-between px-8 h-20 border-b border-white/5 bg-background/50 backdrop-blur-md">
                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => navigate("/")}
                >
                    <Zap className="h-6 w-6 text-primary animate-flicker" fill="currentColor" />
                    <span className="font-display text-2xl tracking-wider pt-1">CLIPSTRIKE</span>
                </div>
                <Link to="/">
                    <Button variant="ghost" className="text-sm hover:text-primary">Voltar para Home</Button>
                </Link>
            </nav>

            <div className="flex-1 relative z-10 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>

            {/* Footer hint */}
            <div className="relative z-10 py-6 text-center text-xs text-muted-foreground border-t border-white/5">
                &copy; {new Date().getFullYear()} ClipStrike. Todos os direitos reservados.
            </div>
        </div>
    );
}

export function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Logic here
        localStorage.setItem("token", "dummy_token");
        navigate("/dashboard");
    };

    return (
        <AuthLayout>
            <div className="glass-card rounded-2xl p-8 border-gradient">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-display mb-2">Bem-vindo de volta</h2>
                    <p className="text-sm text-muted-foreground">Entre na sua conta para gerenciar seus clips</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">E-mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                            placeholder="seu@email.com"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl bg-gradient-primary text-white font-bold glow-effect hover:scale-[1.02] transition-transform border-0 mt-6"
                    >
                        Entrar
                    </Button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-white/5">
                    <p className="text-sm text-muted-foreground">
                        Não tem uma conta?{" "}
                        <Link to="/signup" className="text-primary hover:underline font-bold">
                            Cadastre-se grátis
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
}

export function SignupPage() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSignup = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem("token", "dummy_token");
        navigate("/setup/channel");
    };

    return (
        <AuthLayout>
            <div className="glass-card rounded-2xl p-8 border-gradient">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-display mb-2">Criar conta</h2>
                    <p className="text-sm text-muted-foreground">Comece a automatizar seus clips hoje mesmo</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Nome Completo</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                            placeholder="Seu Nome"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">E-mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                            placeholder="seu@email.com"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl bg-gradient-primary text-white font-bold glow-effect hover:scale-[1.02] transition-transform border-0 mt-6"
                    >
                        Cadastrar
                    </Button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-white/5">
                    <p className="text-sm text-muted-foreground">
                        Já tem uma conta?{" "}
                        <Link to="/login" className="text-primary hover:underline font-bold">
                            Fazer login
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
}
