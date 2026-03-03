import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, ShieldCheck } from "lucide-react";

export default function RedirectPage() {
    const navigate = useNavigate();
    useEffect(() => {
        const timer = setTimeout(() => {
            navigate("/auth/google/accounts");
        }, 2000);
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white font-sans flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] opacity-30 mix-blend-screen" />
            </div>

            <div className="relative z-10 w-full max-w-md px-6 fade-in">
                <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-gradient-s text-center">
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF4D00] to-[#FF8C00] flex items-center justify-center shadow-[0_0_30px_rgba(255,77,0,0.4)] animate-pulse">
                                <Zap className="h-10 w-10 text-white" fill="currentColor" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-black p-1.5 rounded-lg shadow-lg">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight mb-4">Redirecionando...</h2>
                    <p className="text-white/50 text-sm leading-relaxed mb-10">
                        Redirecionando para o Google para autorizar sua conta do YouTube. Esta é uma conexão segura.
                    </p>

                    {/* Loading Animation */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#FF4D00] via-[#FF8C00] to-orange-400 animate-loading-bar" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">Estabelecendo Sessão Segura</span>
                    </div>

                    <div className="mt-10 flex items-center justify-center gap-2 text-white/30">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-xs">OAuth 2.0 Criptografado</span>
                    </div>
                </div>
            </div>

            <style>{`
                .fade-in { animation: fadeIn 0.6s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
                
                .animate-loading-bar {
                    width: 30%;
                    animation: loadingMove 2s infinite ease-in-out;
                }
                @keyframes loadingMove {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(333%); }
                }

                .border-gradient-s { position: relative; }
                .border-gradient-s::after { content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1px; background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05)); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
            `}</style>
        </div>
    );
}
