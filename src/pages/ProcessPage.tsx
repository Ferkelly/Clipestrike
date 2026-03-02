import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, Zap, Clock, TrendingUp, Download, Loader2, Play } from 'lucide-react';
import { apiGet, apiPost } from '../lib/api';
import { useSocketEvent } from '../lib/socket';

interface Video {
    id: string;
    title: string;
    thumbnail_url: string;
    published_at: string;
    status: string;
    youtube_video_id: string;
}

interface Clip {
    id: string;
    title: string;
    viral_score: number;
    hook: string;
    file_url: string;
    status: string;
    start_time: string;
    end_time: string;
}

interface ProcessEvent {
    event?: string;
    step?: string;
    message?: string;
    status?: string;
    clipsCount?: number;
}

const STATUS_LABELS: Record<string, string> = {
    pending: 'Aguardando',
    processing: 'Processando',
    completed: 'Concluído',
    failed: 'Erro',
};

const STATUS_COLORS: Record<string, string> = {
    pending: 'text-muted-foreground',
    processing: 'text-yellow-400',
    completed: 'text-emerald-400',
    failed: 'text-red-400',
};

export function ProcessPage() {
    const { channelId } = useParams<{ channelId: string }>();
    const navigate = useNavigate();

    const [videos, setVideos] = useState<Video[]>([]);
    const [clips, setClips] = useState<Record<string, Clip[]>>({});
    const [loadingVideos, setLoadingVideos] = useState(true);
    const [importing, setImporting] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [progressMsg, setProgressMsg] = useState<Record<string, string>>({});
    const [progressPercent, setProgressPercent] = useState<Record<string, number>>({});
    const [expandedVideo, setExpandedVideo] = useState<string | null>(null);

    const loadVideos = useCallback(() => {
        setLoadingVideos(true);
        apiGet<{ videos: Video[] }>(`/videos?channelId=${channelId}`)
            .then(({ videos }) => setVideos(videos))
            .finally(() => setLoadingVideos(false));
    }, [channelId]);

    useEffect(() => { loadVideos(); }, [loadVideos]);

    // Socket.IO: ouvir progresso de todos os vídeos em processamento
    useSocketEvent('video-progress', (data: unknown) => {
        const d = data as { videoId: string; percent?: number } & ProcessEvent;
        if (d.message) {
            setProgressMsg((prev) => ({ ...prev, [d.videoId]: d.message! }));
        }
        if (typeof d.percent === 'number') {
            setProgressPercent((prev) => ({ ...prev, [d.videoId]: d.percent! }));
        }
        if (d.status === 'done' || d.status === 'error' || d.event === 'done' || d.event === 'error') {
            setProcessingId(null);
            loadVideos();
        }
    });

    const handleImport = async () => {
        setImporting(true);
        await apiPost(`/videos/fetch`, { channelId, maxResults: 10 });
        loadVideos();
        setImporting(false);
    };

    const handleProcess = async (video: Video) => {
        setProcessingId(video.id);
        setProgressMsg((prev) => ({ ...prev, [video.id]: 'Iniciando...' }));
        await apiPost(`/clips/video/${video.id}/process`, {});
    };

    const handleLoadClips = async (videoId: string) => {
        if (expandedVideo === videoId) { setExpandedVideo(null); return; }
        setExpandedVideo(videoId);
        if (!clips[videoId]) {
            const { clips: c } = await apiGet<{ clips: Clip[] }>(`/clips?videoId=${videoId}`);
            setClips((prev) => ({ ...prev, [videoId]: c }));
        }
    };

    return (
        <div className="min-h-screen bg-[#080808]">
            {/* Header */}
            <header className="border-b border-white/7 bg-[#080808]/90 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-primary transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" fill="currentColor" />
                        <span className="font-display text-xl tracking-wider pt-1">CLIPSTRIKE</span>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="font-display text-4xl tracking-wide">VÍDEOS & CLIPS</h1>
                        <p className="text-muted-foreground text-sm mt-1">Processe vídeos e gere clips virais automaticamente</p>
                    </div>
                    <button
                        onClick={handleImport}
                        disabled={importing}
                        className="flex items-center gap-2 border border-white/10 rounded-full px-4 py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                    >
                        {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Importar do YouTube
                    </button>
                </div>

                {loadingVideos ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : videos.length === 0 ? (
                    <div className="text-center py-24 glass-card rounded-2xl">
                        <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Nenhum vídeo ainda.</p>
                        <button onClick={handleImport} className="mt-4 text-primary text-sm hover:underline">
                            Importar do YouTube →
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {videos.map((video) => (
                            <motion.div
                                key={video.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card rounded-2xl overflow-hidden"
                            >
                                {/* Video row */}
                                <div className="flex items-center gap-4 p-4">
                                    <img
                                        src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`}
                                        alt={video.title}
                                        className="w-24 h-14 object-cover rounded-lg flex-shrink-0 bg-white/5"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{video.title}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className={`text-xs flex items-center gap-1 ${STATUS_COLORS[video.status] || 'text-muted-foreground'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full bg-current ${video.status === 'processing' ? 'animate-pulse' : ''}`} />
                                                {STATUS_LABELS[video.status] || video.status}
                                            </span>
                                            {processingId === video.id && progressMsg[video.id] && (
                                                <span className="text-xs text-yellow-400/70 truncate">{progressMsg[video.id]}</span>
                                            )}
                                        </div>

                                        {/* Progress Bar */}
                                        {video.status === 'processing' && progressPercent[video.id] !== undefined && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progressPercent[video.id]}%` }}
                                                        className="h-full bg-gradient-to-r from-primary to-orange-500"
                                                    />
                                                </div>
                                                <span className="text-[10px] font-mono text-muted-foreground w-8">
                                                    {progressPercent[video.id]}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {video.status === 'completed' && (
                                            <button
                                                onClick={() => handleLoadClips(video.id)}
                                                className="flex items-center gap-1.5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                                            >
                                                <Scissors className="h-3 w-3" />
                                                Ver Clips
                                            </button>
                                        )}
                                        {(video.status === 'pending' || video.status === 'failed') && (
                                            <button
                                                onClick={() => handleProcess(video)}
                                                disabled={processingId === video.id}
                                                className="flex items-center gap-1.5 bg-gradient-primary text-white rounded-full px-3 py-1.5 text-xs font-medium hover:scale-105 transition-transform border-0 disabled:opacity-60 disabled:scale-100"
                                            >
                                                {processingId === video.id
                                                    ? <><Loader2 className="h-3 w-3 animate-spin" /> Processando</>
                                                    : <><Zap className="h-3 w-3" /> Processar</>
                                                }
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Clips panel */}
                                <AnimatePresence>
                                    {expandedVideo === video.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="border-t border-white/7 p-4">
                                                {!clips[video.id] ? (
                                                    <div className="flex justify-center py-4">
                                                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                                    </div>
                                                ) : clips[video.id].length === 0 ? (
                                                    <p className="text-muted-foreground text-xs text-center py-4">Nenhum clip gerado ainda.</p>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {clips[video.id].map((clip) => (
                                                            <div key={clip.id} className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-primary/30 transition-colors">
                                                                <div className="flex items-start justify-between mb-2">
                                                                    <p className="text-xs font-medium leading-tight flex-1">{clip.title}</p>
                                                                    <div className="flex items-center gap-1 ml-2 flex-shrink-0 bg-primary/20 rounded-full px-2 py-0.5">
                                                                        <TrendingUp className="h-3 w-3 text-primary" />
                                                                        <span className="text-xs text-primary font-mono">{clip.viral_score}</span>
                                                                    </div>
                                                                </div>
                                                                {clip.hook && (
                                                                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">"{clip.hook}"</p>
                                                                )}
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                        <Clock className="h-3 w-3" />
                                                                        {clip.start_time} → {clip.end_time}
                                                                    </span>
                                                                    {clip.file_url && (
                                                                        <a
                                                                            href={clip.file_url}
                                                                            download
                                                                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                                                                        >
                                                                            <Download className="h-3 w-3" />
                                                                            Download
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

// Fix missing import
function Scissors({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
        </svg>
    );
}
