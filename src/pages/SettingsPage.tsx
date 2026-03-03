import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    User,
    CreditCard,
    Bell,
    Shield,
    Zap,
    LogOut,
    CheckCircle,
    ArrowLeft,
    Trash2,
    Lock,
    Mail,
    ChevronRight,
    Loader2
} from "lucide-react";
import { Button } from "../components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface UserProfile {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    plan: 'free' | 'pro';
    isGoogleLogin: boolean;
    google_id?: string;
}

interface NotificationSettings {
    clipGenerated: boolean;
    newVideo: boolean;
    errors: boolean;
    newsletter: boolean;
}

// Custom Toast Component
function Toast({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(() => onClose(), 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-right-10 fade-in duration-300">
            <div className={`px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 ${type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                } backdrop-blur-xl`}>
                {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                <span className="font-bold text-sm tracking-tight">{message}</span>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<"profile" | "plan" | "notifications" | "account">("profile");
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [notifications, setNotifications] = useState<NotificationSettings>({
        clipGenerated: true,
        newVideo: true,
        errors: true,
        newsletter: false
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Form states
    const [name, setName] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [showPlanModal, setShowPlanModal] = useState(false);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
    };

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem("clipstrike_token");
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.user) {
                setProfile(data.user);
                setName(data.user.name || "");
            }
        } catch (err) {
            console.error("Erro ao buscar usuário:", err);
        }
    };

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem("clipstrike_token");
            const res = await fetch(`${API_URL}/user/settings`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.notifications) {
                setNotifications(data.notifications);
            }
        } catch (err) {
            console.error("Erro ao buscar configurações:", err);
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchUser(), fetchSettings()]);
            setLoading(false);
        };
        init();
    }, []);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem("clipstrike_token");
            const res = await fetch(`${API_URL}/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name })
            });
            if (res.ok) {
                showToast("✅ Perfil atualizado");
                fetchUser();
            } else {
                const data = await res.json();
                showToast(data.error || "Erro ao atualizar perfil", 'error');
            }
        } catch (err) {
            showToast("Erro de conexão.", 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateToggle = async (key: keyof NotificationSettings) => {
        const newSettings = { ...notifications, [key]: !notifications[key] };
        setNotifications(newSettings);

        try {
            const token = localStorage.getItem("clipstrike_token");
            await fetch(`${API_URL}/user/settings`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ notifications: newSettings })
            });
        } catch (err) {
            console.error("Erro ao salvar settings:", err);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword.length < 6) {
            showToast("A senha deve ter pelo menos 6 caracteres", 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast("As senhas não coincidem", 'error');
            return;
        }
        setSaving(true);
        try {
            const token = localStorage.getItem("clipstrike_token");
            const res = await fetch(`${API_URL}/auth/password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            if (res.ok) {
                showToast("✅ Senha alterada com sucesso");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                const data = await res.json();
                showToast(data.error || "Erro ao alterar senha", 'error');
            }
        } catch (err: any) {
            showToast("Erro ao alterar senha", 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirm !== "EXCLUIR") return;

        try {
            const token = localStorage.getItem("clipstrike_token");
            const res = await fetch(`${API_URL}/auth/account`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                localStorage.clear();
                window.location.href = "/";
            }
        } catch (err) {
            showToast("Erro ao excluir conta", 'error');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#080808] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <span className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20">Carregando Preferências</span>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: "profile", label: "Perfil", icon: User },
        { id: "plan", label: "Plano", icon: CreditCard },
        { id: "notifications", label: "Notificações", icon: Bell },
        { id: "account", label: "Conta", icon: Shield },
    ];

    return (
        <div className="min-h-screen bg-[#080808] text-white font-sans flex overflow-hidden">
            {/* Sidebar Mock for consistency (could be a component) */}
            <aside className="w-20 lg:w-64 border-r border-white/5 flex flex-col bg-black/20 backdrop-blur-3xl z-40">
                <div className="p-6 flex justify-center lg:justify-start">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/app/dashboard")}>
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(255,90,31,0.5)]">
                            <Zap className="h-5 w-5 text-white" fill="currentColor" />
                        </div>
                        <span className="hidden lg:block font-bold tracking-tight text-primary pt-0.5 uppercase tracking-tighter">
                            CLIPSTRIKE
                        </span>
                    </div>
                </div>
                <div className="flex-1 mt-8">
                    <button onClick={() => navigate("/app/dashboard")} className="w-full flex items-center justify-center lg:justify-start gap-4 px-8 py-4 text-white/40 hover:text-white transition-all group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="hidden lg:block font-bold text-sm tracking-tight">Voltar ao Painel</span>
                    </button>
                </div>
                <div className="p-8 border-t border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center font-bold text-sm shadow-lg shadow-primary/20">
                            {profile?.name?.charAt(0)}
                        </div>
                        <div className="hidden lg:block overflow-hidden">
                            <p className="font-bold text-sm truncate">{profile?.name}</p>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-black truncate">{profile?.plan}</p>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto px-8 lg:px-20 py-16 no-scrollbar">
                <header className="mb-16 animate-in slide-in-from-top-10 fade-in duration-500">
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tighter mb-4">CONFIGURAÇÕES</h1>
                    <p className="text-white/40 font-medium tracking-tight">Gerencie sua identidade, biling e segurança na plataforma.</p>
                </header>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Secondary Nav */}
                    <nav className="flex lg:flex-col gap-1 w-full lg:w-64 overflow-x-auto no-scrollbar pb-4 lg:pb-0">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-white/5 text-primary border border-white/5" : "text-white/30 hover:text-white"
                                    }`}
                            >
                                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-primary" : "text-white/10"}`} />
                                {tab.label}
                                {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto hidden lg:block" />}
                            </button>
                        ))}
                    </nav>

                    {/* Content */}
                    <div className="flex-1 space-y-8 pb-20 max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">

                        {/* ── PROFILE ────────────────────────────────────────────────── */}
                        {activeTab === "profile" && (
                            <div className="space-y-10 group">
                                <div className="flex items-center gap-8">
                                    <div className="w-24 h-24 rounded-[40px] bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-4xl font-black shadow-[0_10px_40px_rgba(255,90,31,0.3)] border-2 border-white/10">
                                        {profile?.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold mb-1 tracking-tight">Editar Perfil</h3>
                                        <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Sua identidade digital</p>
                                    </div>
                                </div>

                                <div className="grid gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Nome Completo</label>
                                        <input
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            className="w-full bg-[#111] border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-primary outline-none transition-all placeholder:text-white/10"
                                            placeholder="Ex: Dom Pedro"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Endereço de Email</label>
                                        <div className="relative">
                                            <input
                                                value={profile?.email}
                                                readOnly
                                                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white/20 outline-none cursor-not-allowed"
                                            />
                                            {profile?.isGoogleLogin && <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-primary/40 bg-primary/5 px-2 py-1 rounded-md border border-primary/10 tracking-widest">Google Login</span>}
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={saving || !name.trim()}
                                    className="w-full lg:w-auto px-12 h-14 bg-gradient-to-r from-primary to-orange-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:grayscale"
                                >
                                    {saving ? <Loader2 className="animate-spin w-5 h-5 mr-3" /> : null}
                                    {saving ? "Salvando..." : "Salvar Alterações"}
                                </Button>
                            </div>
                        )}

                        {/* ── PLAN ───────────────────────────────────────────────────── */}
                        {activeTab === "plan" && (
                            <div className="space-y-8">
                                <section className="p-8 rounded-[40px] bg-white/[0.03] border border-white/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                                        <Zap className="w-32 h-32" />
                                    </div>
                                    <div className="flex items-start justify-between mb-8 relative z-10">
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-2">Plano Atual</h3>
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-4xl font-black tracking-tighter">{profile?.plan === 'pro' ? 'PROFISSIONAL' : 'GRATUITO'}</h2>
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${profile?.plan === 'pro' ? 'bg-primary text-white border-primary shadow-[0_0_15px_rgba(255,107,53,0.3)]' : 'bg-white/10 text-white border-white/10'
                                                    }`}>
                                                    {profile?.plan === 'pro' ? 'Ativo ⚡' : 'FREE'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 relative z-10">
                                        <div className="p-6 rounded-3xl bg-black/40 border border-white/5">
                                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Limite de Clips</p>
                                            <p className="text-2xl font-black tracking-tight">{profile?.plan === 'pro' ? 'Ilimitado' : '3 clips / vídeo'}</p>
                                        </div>
                                        <div className="p-6 rounded-3xl bg-black/40 border border-white/5">
                                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Canais Ativos</p>
                                            <p className="text-2xl font-black tracking-tight">{profile?.plan === 'pro' ? 'Ilimitado' : '2 canais'}</p>
                                        </div>
                                    </div>

                                    <div className="mt-8 relative z-10">
                                        {profile?.plan === 'free' ? (
                                            <Button
                                                onClick={() => setShowPlanModal(true)}
                                                className="w-full h-14 bg-primary text-white font-black text-sm rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all"
                                            >
                                                ⚡ FAZER UPGRADE PARA PRO
                                            </Button>
                                        ) : (
                                            <Button className="w-full h-14 bg-white/5 hover:bg-white/10 text-white/60 font-black text-sm rounded-2xl border border-white/10 transition-all">
                                                GERENCIAR ASSINATURA
                                            </Button>
                                        )}
                                    </div>
                                </section>

                                <div className="p-8 rounded-[40px] border border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent">
                                    <h4 className="text-sm font-bold mb-6 tracking-tight">Vantagens do Plano Pro:</h4>
                                    <ul className="grid gap-4">
                                        {[
                                            "Clips ilimitados com IA Profissional",
                                            "Monitoramento de canais ilimitados",
                                            "Postagem direta no TikTok e Instagram",
                                            "IA avançada para hooks virais",
                                            "Suporte prioritário via WhatsApp"
                                        ].map(item => (
                                            <li key={item} className="flex items-center gap-3 text-sm text-white/40">
                                                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                                                    <CheckCircle className="w-3 h-3" />
                                                </div>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* ── NOTIFICATIONS ─────────────────────────────────────────── */}
                        {activeTab === "notifications" && (
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold tracking-tight">Avisos e Canais</h3>
                                    <p className="text-white/40 text-xs font-medium">Controle exatamente o que você recebe por email e push.</p>
                                </div>

                                <div className="space-y-2">
                                    {[
                                        { key: "clipGenerated", label: "Clip Gerado", desc: "Aviso instantâneo quando a IA terminar de criar um clip." },
                                        { key: "newVideo", label: "Novo vídeo detectado", desc: "Notificar quando o monitor encontrar novos conteúdos nos canais." },
                                        { key: "errors", label: "Erros de processamento", desc: "Ocorreu uma falha no download ou na transcrição." },
                                        { key: "newsletter", label: "Novidades e atualizações", desc: "Dicas de viralização e novas funcionalidades do ClipStrike." }
                                    ].map(item => (
                                        <div key={item.key} className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all flex items-center justify-between group">
                                            <div className="max-w-[70%]">
                                                <h4 className="text-sm font-bold mb-1 tracking-tight group-hover:text-primary transition-colors">{item.label}</h4>
                                                <p className="text-white/40 text-[10px] leading-relaxed font-medium">{item.desc}</p>
                                            </div>
                                            <button
                                                onClick={() => handleUpdateToggle(item.key as any)}
                                                className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${notifications[item.key as keyof NotificationSettings] ? "bg-primary" : "bg-white/10"
                                                    }`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-lg ${notifications[item.key as keyof NotificationSettings] ? "left-7" : "left-1"
                                                    }`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-white/20 text-center uppercase tracking-widest font-black">As alterações são salvas automaticamente</p>
                            </div>
                        )}

                        {/* ── ACCOUNT ────────────────────────────────────────────────── */}
                        {activeTab === "account" && (
                            <div className="space-y-12">
                                {/* Only for Email users */}
                                {!profile?.isGoogleLogin && (
                                    <div className="space-y-8 p-10 rounded-[40px] bg-white/[0.02] border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                <Lock className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-xl font-bold tracking-tight">Alterar Senha</h3>
                                        </div>

                                        <div className="space-y-6 max-w-lg">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Senha Atual</label>
                                                <input
                                                    type="password"
                                                    value={currentPassword}
                                                    onChange={e => setCurrentPassword(e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-red-500/50 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Nova Senha</label>
                                                    <input
                                                        type="password"
                                                        value={newPassword}
                                                        onChange={e => setNewPassword(e.target.value)}
                                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-primary outline-none transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Confirmar</label>
                                                    <input
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={e => setConfirmPassword(e.target.value)}
                                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-primary outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                onClick={handleChangePassword}
                                                disabled={saving || !newPassword}
                                                className="w-full h-14 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all"
                                            >
                                                {saving ? "Salvando..." : "Alterar Senha"}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Danger Zone */}
                                <div className="p-10 rounded-[40px] bg-red-950/10 border border-red-900/20 group hover:border-red-600/30 transition-all">
                                    <div className="flex items-center gap-4 mb-4">
                                        <Shield className="w-8 h-8 text-red-500" />
                                        <h3 className="text-2xl font-black tracking-tighter text-red-500 uppercase">Zona de Perigo</h3>
                                    </div>
                                    <p className="text-red-900 font-medium text-sm mb-10 max-w-md leading-relaxed">
                                        Esta ação é irreversível. Todos os seus dados, vídeos, canais e clips processados serão excluídos permanentemente de nossos servidores.
                                    </p>

                                    <Button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="w-full lg:w-auto h-14 px-10 rounded-2xl bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white border border-red-600/30 font-black text-xs uppercase tracking-widest transition-all"
                                    >
                                        Excluir minha conta
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modals */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-[#111] border border-red-600/30 rounded-[40px] p-10 shadow-2xl">
                        <h2 className="text-3xl font-black tracking-tighter text-red-500 mb-4 uppercase text-center">Confirmar Exclusão</h2>
                        <p className="text-white/40 text-center text-sm mb-8 leading-relaxed">
                            Para prosseguir com a exclusão total da sua conta, digite <span className="text-red-500 font-bold tracking-widest">EXCLUIR</span> abaixo.
                        </p>

                        <input
                            value={deleteConfirm}
                            onChange={e => setDeleteConfirm(e.target.value)}
                            placeholder="EXCLUIR"
                            className="w-full bg-black/60 border border-red-600/20 rounded-2xl px-6 py-4 text-red-500 font-black text-center text-sm mb-6 outline-none focus:border-red-500 transition-all placeholder:text-red-900/30"
                        />

                        <div className="flex gap-4">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 font-bold text-white/40 hover:text-white transition-all text-sm">Cancelar</button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirm !== "EXCLUIR"}
                                className="flex-[2] py-4 bg-red-600 rounded-2xl text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-red-600/20 disabled:opacity-20 transition-all"
                            >
                                Excluir Permanentemente
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPlanModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in zoom-in-95 duration-300">
                    <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-[40px] p-10 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
                            <Zap className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-black mb-4 tracking-tighter">EM BREVE!</h2>
                        <p className="text-white/40 mb-10 leading-relaxed font-medium">
                            Estamos finalizando as integrações de pagamento. Para garantir acesso antecipado ao Plano Pro com desconto vitalício, entre em contato:
                        </p>

                        <a href="mailto:contato@clipstrike.tech" className="block w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-primary mb-6 hover:bg-white/10 transition-all">
                            contato@clipstrike.tech
                        </a>

                        <button onClick={() => setShowPlanModal(false)} className="font-bold text-white/40 hover:text-white transition-all text-xs uppercase tracking-widest">Fechar</button>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .fade-in { animation: fadeIn 0.8s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}

