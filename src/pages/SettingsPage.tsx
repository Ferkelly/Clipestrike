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
    XCircle,
    ArrowLeft,
    Trash2,
    Lock,
    Mail
} from "lucide-react";
import { Button } from "../components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface UserProfile {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    plan: string;
    google_id?: string;
}

interface NotificationSettings {
    clipGenerated: boolean;
    newVideo: boolean;
    errors: boolean;
    newsletter: boolean;
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

    // Form states
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState("");

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.user) {
                setProfile(data.user);
                setName(data.user.name || "");
                setEmail(data.user.email || "");
            }
        } catch (err) {
            console.error("Erro ao buscar usuário:", err);
        }
    };

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem("token");
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
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name, email })
            });
            if (res.ok) {
                alert("Perfil atualizado ✅");
                fetchUser();
            } else {
                const data = await res.json();
                alert(data.error || "Erro ao atualizar perfil");
            }
        } catch (err) {
            console.error("Erro ao salvar perfil:", err);
            alert("Erro de conexão.");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateToggle = async (key: keyof NotificationSettings) => {
        const newSettings = { ...notifications, [key]: !notifications[key] };
        setNotifications(newSettings);

        try {
            const token = localStorage.getItem("token");
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
        if (newPassword !== confirmPassword) {
            alert("As senhas não coincidem.");
            return;
        }
        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/auth/password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            if (res.ok) {
                alert("Senha alterada com sucesso ✅");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                const data = await res.json();
                alert(data.error || "Erro ao alterar senha");
            }
        } catch (err) {
            console.error("Erro ao alterar senha:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirm !== "EXCLUIR") return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/auth/account`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                localStorage.clear();
                navigate("/");
            }
        } catch (err) {
            console.error("Erro ao excluir conta:", err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#080808] flex items-center justify-center">
                <Zap className="h-10 w-10 text-primary animate-pulse" fill="currentColor" />
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
        <div className="min-h-screen bg-[#080808] text-foreground font-sans flex flex-col">
            <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 sticky top-0 bg-[#080808]/80 backdrop-blur-md z-30">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate("/dashboard")} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-2xl font-display uppercase tracking-wider">Configurações</h2>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary p-[1px]">
                        <div className="w-full h-full rounded-full bg-[#080808] flex items-center justify-center font-bold text-xs uppercase">
                            {profile?.name?.charAt(0) || "U"}
                        </div>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{profile?.name.split(' ')[0]}</span>
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full p-10">
                <div className="flex gap-2 p-1 bg-white/[0.03] rounded-2xl mb-12 border border-white/5">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* SECTION: PROFILE */}
                    {activeTab === "profile" && (
                        <div className="glass-card rounded-3xl p-10 border border-white/5 bg-[#111]">
                            <h3 className="text-xl font-display mb-8">Informações de Perfil</h3>
                            <div className="space-y-6 max-w-lg">
                                <div className="space-y-2">
                                    <label className="text-xs font-mono uppercase text-muted-foreground tracking-widest">Nome Completo</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-mono uppercase text-muted-foreground tracking-widest">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                                        <input
                                            type="email"
                                            value={email}
                                            readOnly={!!profile?.google_id}
                                            className={`w-full bg-[#0d0d0d] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none ${profile?.google_id ? "text-zinc-500 opacity-60" : ""}`}
                                        />
                                    </div>
                                    {profile?.google_id && <p className="text-[10px] text-zinc-500 mt-1">Sincronizado via Google</p>}
                                </div>
                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                    className="bg-primary text-white px-8 h-12 rounded-xl font-bold mt-4"
                                >
                                    {saving ? "Salvando..." : "Salvar Alterações"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* SECTION: PLAN */}
                    {activeTab === "plan" && (
                        <div className="space-y-6">
                            <div className="glass-card rounded-3xl p-10 border border-white/5 bg-[#111]">
                                <div className="flex items-start justify-between mb-10">
                                    <div>
                                        <h3 className="text-xl font-display mb-2">Assinatura Atual</h3>
                                        <p className="text-muted-foreground text-sm">Você está no plano de iniciante do ClipStrike.</p>
                                    </div>
                                    <div className={`px-4 py-2 rounded-full font-mono text-[10px] font-bold tracking-widest ${profile?.plan === 'pro' ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-white/10 text-white border border-white/10'
                                        }`}>
                                        {profile?.plan?.toUpperCase() || "FREE"} {profile?.plan === 'pro' ? "⚡" : ""}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                                            {profile?.plan === 'pro' ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <div className="h-4 w-4 rounded-full border border-white/20" />}
                                            Clips Gerados
                                        </h4>
                                        <p className="text-2xl font-display">{profile?.plan === 'pro' ? "∞" : "3"} <span className="text-xs font-sans text-muted-foreground">/ vídeo</span></p>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                                            {profile?.plan === 'pro' ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <div className="h-4 w-4 rounded-full border border-white/20" />}
                                            Canais Monitorados
                                        </h4>
                                        <p className="text-2xl font-display">{profile?.plan === 'pro' ? "∞" : "1"} <span className="text-xs font-sans text-muted-foreground">/ conta</span></p>
                                    </div>
                                </div>

                                <div className="mt-10 flex gap-4">
                                    {profile?.plan === 'free' ? (
                                        <Button
                                            onClick={() => alert("Em breve! Entre em contato: contato@clipstrike.tech")}
                                            className="bg-primary text-white px-8 h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
                                        >
                                            Fazer Upgrade para Pro
                                        </Button>
                                    ) : (
                                        <Button className="bg-white/10 text-white px-8 h-12 rounded-xl font-bold border border-white/5 hover:bg-white/20">
                                            Gerenciar Assinatura
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION: NOTIFICATIONS */}
                    {activeTab === "notifications" && (
                        <div className="glass-card rounded-3xl p-10 border border-white/5 bg-[#111]">
                            <h3 className="text-xl font-display mb-8">Preferências de Notificação</h3>
                            <div className="space-y-6">
                                {[
                                    { key: "clipGenerated", label: "Clip Gerado", desc: "Receba um aviso quando um novo clip for criado pela IA." },
                                    { key: "newVideo", label: "Novo Vídeo Detectado", desc: "Notificar quando o monitor encontrar novo conteúdo nos canais." },
                                    { key: "errors", label: "Erros de Processamento", desc: "Alertar quando houver falha no download ou clipping." },
                                    { key: "newsletter", label: "Newsletter e Novidades", desc: "Dicas de como viralizar e atualizações da plataforma." }
                                ].map(notif => (
                                    <div key={notif.key} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
                                        <div>
                                            <h4 className="text-sm font-bold mb-1">{notif.label}</h4>
                                            <p className="text-xs text-muted-foreground">{notif.desc}</p>
                                        </div>
                                        <button
                                            onClick={() => handleUpdateToggle(notif.key as any)}
                                            className={`w-12 h-6 rounded-full transition-all relative ${notifications[notif.key as keyof NotificationSettings] ? "bg-emerald-500" : "bg-white/10"
                                                }`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifications[notif.key as keyof NotificationSettings] ? "left-7" : "left-1"
                                                }`} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SECTION: ACCOUNT */}
                    {activeTab === "account" && (
                        <div className="space-y-8">
                            {/* Password Change (Only for email users) */}
                            {!profile?.google_id && (
                                <div className="glass-card rounded-3xl p-10 border border-white/5 bg-[#111]">
                                    <h3 className="text-xl font-display mb-8">Segurança da Conta</h3>
                                    <div className="space-y-4 max-w-lg">
                                        <div className="space-y-2">
                                            <label className="text-xs font-mono uppercase text-muted-foreground tracking-widest">Senha Atual</label>
                                            <input
                                                type="password"
                                                value={currentPassword}
                                                onChange={e => setCurrentPassword(e.target.value)}
                                                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-mono uppercase text-muted-foreground tracking-widest">Nova Senha</label>
                                                <input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={e => setNewPassword(e.target.value)}
                                                    className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-mono uppercase text-muted-foreground tracking-widest">Confirmar</label>
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={e => setConfirmPassword(e.target.value)}
                                                    className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50"
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleChangePassword}
                                            disabled={saving || !newPassword}
                                            className="bg-white/10 text-white px-8 h-12 rounded-xl font-bold mt-4 border border-white/5"
                                        >
                                            Alterar Senha
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Danger Zone */}
                            <div className="rounded-3xl p-10 bg-red-500/5 border border-red-500/10">
                                <h3 className="text-xl font-display text-red-500 mb-4 uppercase tracking-wider">Danger Zone</h3>
                                <p className="text-zinc-500 text-sm mb-8">A exclusão da sua conta é permanente e removerá todos os seus canais, vídeos e clips gerados.</p>

                                {!showDeleteModal ? (
                                    <Button
                                        onClick={() => setShowDeleteModal(true)}
                                        variant="ghost"
                                        className="text-red-500 border border-red-500/20 hover:bg-red-500/10 px-8 h-12 rounded-xl font-bold gap-2"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Excluir Conta Permanentemente
                                    </Button>
                                ) : (
                                    <div className="space-y-4 max-w-md animate-in slide-in-from-top-2">
                                        <p className="text-xs text-red-400 font-bold uppercase tracking-widest">Digite "EXCLUIR" para confirmar:</p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={deleteConfirm}
                                                onChange={e => setDeleteConfirm(e.target.value)}
                                                placeholder="EXCLUIR"
                                                className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-sm text-red-500 font-bold focus:outline-none"
                                            />
                                            <Button
                                                onClick={handleDeleteAccount}
                                                disabled={deleteConfirm !== "EXCLUIR"}
                                                className="bg-red-500 text-white font-bold h-11 px-6 rounded-xl hover:bg-red-600 disabled:opacity-30"
                                            >
                                                Confirmar
                                            </Button>
                                            <Button
                                                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}
                                                variant="ghost"
                                                className="text-muted-foreground h-11 px-4"
                                            >
                                                Cancelar
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
