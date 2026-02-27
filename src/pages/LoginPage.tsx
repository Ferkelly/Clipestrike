import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Youtube } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
    const { login, loading } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#080808] relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-40" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md mx-4"
            >
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-10">
                    <Zap className="h-8 w-8 text-primary" fill="currentColor" />
                    <span className="font-display text-3xl tracking-wider pt-1">CLIPSTRIKE</span>
                </div>

                {/* Card */}
                <div className="glass-card rounded-2xl p-8 text-center">
                    <h1 className="font-display text-3xl mb-2">Bem-vindo</h1>
                    <p className="text-muted-foreground text-sm mb-8">
                        Conecte-se com sua conta Google para começar a automatizar seus clips.
                    </p>

                    <button
                        onClick={login}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold rounded-full py-4 px-6 hover:bg-gray-100 hover:scale-105 transition-all duration-200 disabled:opacity-60"
                    >
                        {/* Google icon */}
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Entrar com Google
                    </button>

                    <p className="mt-6 text-xs text-muted-foreground">
                        Ao entrar, você concorda com os nossos termos de uso e política de privacidade.
                    </p>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    <a href="/" className="hover:text-primary transition-colors">← Voltar para a página inicial</a>
                </p>
            </motion.div>
        </div>
    );
}
