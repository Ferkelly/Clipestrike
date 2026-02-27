import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Plus, Tv2, Video, Scissors, LogOut, X, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiGet, apiPost, apiDelete } from '../lib/api';

interface Channel {
    id: string;
    channel_name: string;
    youtube_channel_id: string;
    is_active: boolean;
    created_at: string;
}

export function DashboardPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        apiGet<{ channels: Channel[] }>('/channels')
            .then(({ channels }) => setChannels(channels))
            .catch((err) => console.error('[Dashboard] Failed to fetch channels:', err))
            .finally(() => setLoading(false));
    }, []);

    const handleAddChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setAdding(true);
        try {
            const { channel } = await apiPost<{ channel: Channel }>('/channels', { url });
            setChannels((prev) => [channel, ...prev]);
            setUrl('');
            setShowModal(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        await apiDelete(`/channels/${id}`);
        setChannels((prev) => prev.filter((c) => c.id !== id));
    };

    return (
        <div className="min-h-screen bg-[#080808]">
            {/* Header */}
            <header className="border-b border-white/7 bg-[#080808]/90 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" fill="currentColor" />
                        <span className="font-display text-xl tracking-wider pt-1">CLIPSTRIKE</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {user?.avatar && (
                            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-white/10" />
                        )}
                        <span className="text-sm text-muted-foreground hidden sm:block">{user?.name}</span>
                        <button onClick={logout} className="text-muted-foreground hover:text-primary transition-colors">
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-10">
                {/* Title row */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="font-display text-4xl tracking-wide">SEUS CANAIS</h1>
                        <p className="text-muted-foreground text-sm mt-1">Monitore e automatize seus clips</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-gradient-primary text-white rounded-full px-5 py-2.5 text-sm font-medium hover:scale-105 transition-transform glow-effect border-0"
                    >
                        <Plus className="h-4 w-4" />
                        Adicionar Canal
                    </button>
                </div>

                {/* Channels grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : channels.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-24 glass-card rounded-2xl"
                    >
                        <Tv2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Nenhum canal ainda.</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="mt-4 text-primary text-sm hover:underline"
                        >
                            Adicionar seu primeiro canal →
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence>
                            {channels.map((ch) => (
                                <motion.div
                                    key={ch.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="glass-card rounded-2xl p-5 feature-card-hover group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                                <Tv2 className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm truncate max-w-[160px]">
                                                    {ch.channel_name || ch.youtube_channel_id}
                                                </p>
                                                <div className={`flex items-center gap-1 mt-0.5 ${ch.is_active ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${ch.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground'}`} />
                                                    <span className="text-xs">{ch.is_active ? 'Monitorando' : 'Inativo'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(ch.id)}
                                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/dashboard/channel/${ch.id}`)}
                                        className="w-full flex items-center justify-center gap-2 border border-white/10 rounded-full py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                                    >
                                        <Video className="h-3.5 w-3.5" />
                                        Ver Vídeos e Clips
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            {/* Add Channel Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="glass-card rounded-2xl p-6 w-full max-w-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="font-display text-2xl mb-1">ADICIONAR CANAL</h2>
                            <p className="text-muted-foreground text-sm mb-5">Cole a URL ou handle do seu canal do YouTube</p>
                            <form onSubmit={handleAddChannel} className="space-y-4">
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://youtube.com/@seucanal"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                                    autoFocus
                                />
                                {error && <p className="text-red-400 text-xs">{error}</p>}
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 border border-white/10 rounded-full py-2.5 text-sm text-muted-foreground hover:border-white/30 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={adding || !url.trim()}
                                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-primary text-white rounded-full py-2.5 text-sm font-medium hover:scale-105 transition-transform border-0 disabled:opacity-60 disabled:scale-100"
                                    >
                                        {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                        {adding ? 'Adicionando...' : 'Adicionar'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
