import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Zap,
    Youtube,
    Upload,
    ArrowRight,
    CheckCircle2,
    ChevronRight,
    X,
    Play,
    Clock,
    Video as VideoIcon,
    Scissors,
    Expand,
    Layers,
    Type,
    Globe,
    ExternalLink,
    AlertCircle,
    Loader2,
    RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket } from "../lib/socket";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || "";

// --- Types ---
interface YouTubePreview {
    id: string;
    title: string;
    thumbnail: string;
    duration: string;
    channelTitle: string;
}

interface ProcessingOptions {
    maxClips: number;
    minDuration: number;
    maxDuration: number;
    silenceCut: boolean;
    dynamicZoom: boolean;
    broll: boolean;
    subtitles: boolean;
    subtitleStyle: string;
    subtitleLang: string;
    autoPublish: boolean;
}

// --- Helper: Format Duration ---
const formatYouTubeDuration = (pt: string) => {
    const match = pt.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return "0:00";
    const h = parseInt(match[1] || "0");
    const m = parseInt(match[2] || "0");
    const s = parseInt(match[3] || "0");
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function NovoVideoPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Upload, 2: Configure, 3: Processing

    // Step 1: Upload Source
    const [uploadTab, setUploadTab] = useState<"url" | "file">("url");
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [ytPreview, setYtPreview] = useState<YouTubePreview | null>(null);
    const [ytLoading, setYtLoading] = useState(false);
    const [ytError, setYtError] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [fileUploading, setFileUploading] = useState(false);
    const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
    const [fileError, setFileError] = useState("");

    // Step 2: Configuration
    const [options, setOptions] = useState<ProcessingOptions>({
        maxClips: 5,
        minDuration: 30,
        maxDuration: 60,
        silenceCut: true,
        dynamicZoom: true,
        broll: false,
        subtitles: true,
        subtitleStyle: "hormozi",
        subtitleLang: "pt",
        autoPublish: false
    });

    // Step 3: Processing Status
    const [videoProcessedId, setVideoProcessedId] = useState<string | null>(null);
    const [processingPercent, setProcessingPercent] = useState(0);
    const [processingMsg, setProcessingMsg] = useState("Iniciando pipeline...");
    const [processingError, setProcessingError] = useState("");
    const [isSlow, setIsSlow] = useState(false);

    // --- YT URL Logic ---
    useEffect(() => {
        const fetchPreview = async () => {
            if (!youtubeUrl) {
                setYtPreview(null);
                setYtError("");
                return;
            }

            const videoIdMatch = youtubeUrl.match(/(?:v=|youtu\.be\/|shorts\/)([^&?/\s]+)/);
            const channelMatch = youtubeUrl.match(/youtube\.com\/(@|channel\/|c\/|user\/)([^&?/\s]+)/);

            if (!videoIdMatch && !channelMatch) {
                setYtError("URL inválida ou formato não suportado.");
                return;
            }

            setYtLoading(true);
            setYtError("");

            try {
                let videoId = videoIdMatch?.[1];

                if (channelMatch && !videoId) {
                    // Se for link de canal, buscar vídeo mais recente (via backend ou API direta)
                    // Para simplificar aqui, vamos focar em links diretos de vídeo primeiro
                    // ou você pode chamar seu backend para resolver o canal
                    setYtError("Por favor, cole a URL direta de um vídeo.");
                    setYtLoading(false);
                    return;
                }

                if (!YOUTUBE_API_KEY) {
                    // Sem chave API, só mostra que o formato está ok
                    setYtPreview({
                        id: videoId!,
                        title: "Vídeo do YouTube",
                        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                        duration: "--:--",
                        channelTitle: "Canal"
                    });
                } else {
                    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`);
                    const data = await res.json();
                    if (data.items?.length > 0) {
                        const item = data.items[0];
                        setYtPreview({
                            id: videoId!,
                            title: item.snippet.title,
                            thumbnail: item.snippet.thumbnails.high.url,
                            duration: formatYouTubeDuration(item.contentDetails.duration),
                            channelTitle: item.snippet.channelTitle
                        });
                    } else {
                        setYtError("Vídeo não encontrado.");
                    }
                }
            } catch (err) {
                setYtError("Erro ao carregar preview.");
            } finally {
                setYtLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchPreview, 500);
        return () => clearTimeout(timeoutId);
    }, [youtubeUrl]);

    // --- Timeout Logic for Step 3 ---
    useEffect(() => {
        if (step !== 3) return;

        const slowTimeout = setTimeout(() => {
            setIsSlow(true);
            setProcessingMsg("⚠️ Processamento demorado. O pipeline ainda está rodando...");
        }, 120_000); // 2 minutos

        const hardTimeout = setTimeout(() => {
            setProcessingError("Timeout: o processamento demorou mais de 30 minutos. Tente novamente.");
        }, 1_800_000); // 30 minutos

        return () => {
            clearTimeout(slowTimeout);
            clearTimeout(hardTimeout);
        };
    }, [step]);

    // --- File Upload Logic ---
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowed = [".mp4", ".mov", ".avi", ".mkv"];
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

        if (!allowed.includes(ext)) {
            setFileError("Formato não suportado. Use MP4, MOV, AVI ou MKV.");
            return;
        }

        if (file.size > 2 * 1024 * 1024 * 1024) {
            setFileError("Arquivo muito grande. Máximo 2GB.");
            return;
        }

        setSelectedFile(file);
        setFileError("");
        startFileUpload(file);
    };

    const startFileUpload = async (file: File) => {
        setFileUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append("video", file);
        formData.append("originalName", file.name);

        const token = localStorage.getItem("clipstrike_token");

        try {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", `${API_URL}/videos/upload-file`, true);
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percent);
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    const data = JSON.parse(xhr.responseText);
                    setUploadedVideoId(data.videoId);
                    setFileUploading(false);
                } else {
                    setFileError("Erro no upload do arquivo.");
                    setFileUploading(false);
                }
            };

            xhr.onerror = () => {
                setFileError("Erro de conexão no upload.");
                setFileUploading(false);
            };

            xhr.send(formData);
        } catch (err) {
            setFileError("Erro ao iniciar upload.");
            setFileUploading(false);
        }
    };

    const handleNextToStep2 = () => {
        if (uploadTab === "url" && ytPreview) setStep(2);
        if (uploadTab === "file" && uploadedVideoId) setStep(2);
    };

    const handleStartProcess = async () => {
        setStep(3);
        setProcessingError("");
        setProcessingPercent(0);
        setProcessingMsg("Iniciando pipeline...");
        setIsSlow(false);

        const token = localStorage.getItem("clipstrike_token");
        const socket = getSocket();

        try {
            const payload = {
                videoId: uploadedVideoId,
                youtubeUrl: uploadTab === "url" ? youtubeUrl : null,
                options
            };

            const res = await fetch(`${API_URL}/videos/process-with-options`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.videoId) {
                setVideoProcessedId(data.videoId);

                // Escutar progresso real
                socket.on("video-progress", (progressData: any) => {
                    if (progressData.videoId === data.videoId || progressData.id === data.videoId) {
                        setProcessingPercent(progressData.percent);
                        setProcessingMsg(progressData.message);

                        if (progressData.status === 'done' || progressData.percent >= 100) {
                            setProcessingMsg("Clips prontos! ✅");
                            setTimeout(() => navigate("/app/dashboard/runs"), 2000);
                        }
                    }
                });

                socket.on("video-error", (errorData: any) => {
                    if (errorData.videoId === data.videoId || errorData.id === data.videoId) {
                        setProcessingError(errorData.message || "Erro no pipeline.");
                    }
                });
            } else {
                throw new Error(data.error || "Erro ao iniciar processamento.");
            }
        } catch (err: any) {
            setProcessingError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center p-6 selection:bg-primary/30">
            <div className="w-full max-w-4xl">
                {/* Header & Back */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate("/app/dashboard")}
                        className="flex items-center gap-2 text-white/40 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                    >
                        <X className="w-4 h-4" /> Fechar
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(255,90,31,0.5)]">
                            <Zap className="h-5 w-5 text-white" fill="currentColor" />
                        </div>
                        <span className="font-bold tracking-tight text-white pt-0.5">CLIPSTRIKE <span className="text-primary">NOVO VÍDEO</span></span>
                    </div>
                </div>

                {/* Stepper */}
                <div className="flex items-center justify-between px-12 mb-12">
                    {[1, 2, 3].map(s => (
                        <div key={s} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? "bg-primary text-white shadow-[0_0_15px_rgba(255,90,31,0.4)]" : "bg-white/5 text-white/20"}`}>
                                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                            </div>
                            <span className={`text-[10px] uppercase font-bold tracking-widest transition-all ${step >= s ? "text-white" : "text-white/20"}`}>
                                {s === 1 ? "Vídeo" : s === 2 ? "Edições" : "Processando"}
                            </span>
                            {s < 3 && <div className={`w-16 h-[1px] ml-4 ${step > s ? "bg-primary" : "bg-white/5"}`} />}
                        </div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            <div className="text-center mb-10">
                                <h1 className="text-3xl font-black tracking-tighter mb-2">De onde vem seu vídeo?</h1>
                                <p className="text-white/40 text-sm">Escolha uma URL do YouTube ou faça o upload de um arquivo local.</p>
                            </div>

                            <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/5 w-fit mx-auto mb-8">
                                <button
                                    onClick={() => setUploadTab("url")}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${uploadTab === "url" ? "bg-white/10 text-white shadow-md" : "text-white/30 hover:text-white"}`}
                                >
                                    <Youtube className={`w-4 h-4 ${uploadTab === "url" ? "text-primary" : ""}`} /> YouTube URL
                                </button>
                                <button
                                    onClick={() => setUploadTab("file")}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${uploadTab === "file" ? "bg-white/10 text-white shadow-md" : "text-white/30 hover:text-white"}`}
                                >
                                    <Upload className={`w-4 h-4 ${uploadTab === "file" ? "text-primary" : ""}`} /> Upload de Arquivo
                                </button>
                            </div>

                            <div className="bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                                {uploadTab === "url" ? (
                                    <div className="space-y-6">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={youtubeUrl}
                                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                                placeholder="Cole a URL do vídeo (ex: youtube.com/watch?v=...)"
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-sm focus:border-primary outline-none transition-all placeholder:text-white/20"
                                            />
                                            {ytLoading && <div className="absolute right-6 top-5"><RefreshCw className="w-5 h-5 text-primary animate-spin" /></div>}
                                        </div>

                                        {ytError && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-500 font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {ytError}</div>}

                                        {ytPreview && (
                                            <div className="flex gap-6 p-4 bg-white/5 rounded-2xl border border-white/5 animate-in fade-in zoom-in duration-300">
                                                <div className="w-40 aspect-video rounded-xl overflow-hidden relative flex-shrink-0 bg-black">
                                                    <img src={ytPreview.thumbnail} className="w-full h-full object-cover" />
                                                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-[10px] font-bold">{ytPreview.duration}</div>
                                                </div>
                                                <div className="flex-1 py-1">
                                                    <h3 className="font-bold text-sm line-clamp-2 mb-1">{ytPreview.title}</h3>
                                                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{ytPreview.channelTitle}</p>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleNextToStep2}
                                            disabled={!ytPreview || ytLoading}
                                            className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(255,90,31,0.3)] hover:scale-[1.01] transition-all disabled:opacity-20 disabled:scale-100"
                                        >
                                            Usar este vídeo <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {!selectedFile ? (
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border-2 border-dashed border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center gap-4 bg-black/20 hover:bg-white/[0.02] hover:border-primary/40 transition-all cursor-pointer group"
                                            >
                                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <Upload className="w-8 h-8 text-white/40 group-hover:text-primary" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-bold">Arraste seu MP4 aqui ou clique para selecionar</p>
                                                    <p className="text-xs text-white/20 mt-1">MP4, MOV, AVI até 2GB</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                                        <VideoIcon className="w-6 h-6 text-primary" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold truncate">{selectedFile.name}</p>
                                                        <p className="text-[10px] text-white/40 uppercase font-bold">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                                                    </div>
                                                    <button onClick={() => { setSelectedFile(null); setUploadedVideoId(null); }} className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white"><X className="w-5 h-5" /></button>
                                                </div>

                                                {fileUploading && (
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                                                            <span>Enviando...</span>
                                                            <span>{uploadProgress}%</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                                        </div>
                                                    </div>
                                                )}

                                                {uploadedVideoId && !fileUploading && (
                                                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                                                        <CheckCircle2 className="w-4 h-4" /> Upload concluído com sucesso!
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".mp4,.mov,.avi,.mkv" />

                                        {fileError && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-500 font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {fileError}</div>}

                                        <button
                                            onClick={handleNextToStep2}
                                            disabled={!uploadedVideoId || fileUploading}
                                            className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(255,90,31,0.3)] hover:scale-[1.01] transition-all disabled:opacity-20 disabled:scale-100"
                                        >
                                            Prosseguir para edições <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-black tracking-tighter mb-2">Configurações de Processamento</h1>
                                <p className="text-white/40 text-sm">Personalize como a IA deve extrair e editar seus clips.</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Clips Config */}
                                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Layers className="w-5 h-5 text-primary" />
                                        <h3 className="font-bold text-lg">Geração de Clips</h3>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-white/40">Máximo de Clips</label>
                                            <span className="text-primary font-bold">{options.maxClips} clips</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1" max="10"
                                            value={options.maxClips}
                                            onChange={(e) => setOptions({ ...options, maxClips: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Duração Mínima</label>
                                            <select
                                                value={options.minDuration}
                                                onChange={(e) => setOptions({ ...options, minDuration: parseInt(e.target.value) })}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
                                            >
                                                <option value={15}>15s</option>
                                                <option value={30}>30s</option>
                                                <option value={45}>45s</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Duração Máxima</label>
                                            <select
                                                value={options.maxDuration}
                                                onChange={(e) => setOptions({ ...options, maxDuration: parseInt(e.target.value) })}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
                                            >
                                                <option value={30}>30s</option>
                                                <option value={45}>45s</option>
                                                <option value={60}>60s</option>
                                                <option value={90}>90s</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* EdicoesConfig */}
                                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Scissors className="w-5 h-5 text-primary" />
                                        <h3 className="font-bold text-lg">Edições Automáticas</h3>
                                    </div>

                                    {/* Toggle: Silence Cut */}
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500"><Scissors className="w-4 h-4" /></div>
                                            <div>
                                                <p className="text-xs font-bold">Corte de Silêncio</p>
                                                <p className="text-[10px] text-white/30">Remove pausas longas</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setOptions({ ...options, silenceCut: !options.silenceCut })}
                                            className={`w-10 h-5 rounded-full transition-all relative ${options.silenceCut ? "bg-primary" : "bg-white/10"}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${options.silenceCut ? "left-6" : "left-1"}`} />
                                        </button>
                                    </div>

                                    {/* Toggle: Zoom */}
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><Expand className="w-4 h-4" /></div>
                                            <div>
                                                <p className="text-xs font-bold">Zoom Dinâmico</p>
                                                <p className="text-[10px] text-white/30">Movimento suave de câmera</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setOptions({ ...options, dynamicZoom: !options.dynamicZoom })}
                                            className={`w-10 h-5 rounded-full transition-all relative ${options.dynamicZoom ? "bg-primary" : "bg-white/10"}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${options.dynamicZoom ? "left-6" : "left-1"}`} />
                                        </button>
                                    </div>

                                    {/* Toggle: B-roll */}
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><VideoIcon className="w-4 h-4" /></div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-bold">B-Roll Automático (IA)</p>
                                                </div>
                                                <p className="text-[10px] text-white/30">Insere vídeos contextuais do Pexels</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setOptions({ ...options, broll: !options.broll })}
                                            className={`w-10 h-5 rounded-full transition-all relative ${options.broll ? "bg-primary" : "bg-white/10"}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${options.broll ? "left-6" : "left-1"}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Legendas Config */}
                                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Type className="w-5 h-5 text-primary" />
                                        <h3 className="font-bold text-lg">Legendas</h3>
                                    </div>

                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-bold text-white/60">Ativar legendas Hormozi</p>
                                        <button
                                            onClick={() => setOptions({ ...options, subtitles: !options.subtitles })}
                                            className={`w-10 h-5 rounded-full transition-all relative ${options.subtitles ? "bg-primary" : "bg-white/10"}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${options.subtitles ? "left-6" : "left-1"}`} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Idioma Base</label>
                                            <select
                                                value={options.subtitleLang}
                                                onChange={(e) => setOptions({ ...options, subtitleLang: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
                                            >
                                                <option value="pt">Português</option>
                                                <option value="en">Inglês</option>
                                                <option value="es">Espanhol</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Estilo Visual</label>
                                            <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none opacity-50 pointer-events-none">
                                                <option>Hormozi (Default)</option>
                                                <option>Minimalista</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Publicação & Ação Final */}
                                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Globe className="w-5 h-5 text-primary" />
                                            <h3 className="font-bold text-lg">Publicação</h3>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <div>
                                                <p className="text-xs font-bold">Publicar no YouTube</p>
                                                <p className="text-[10px] text-white/30">Postar Shorts automaticamente</p>
                                            </div>
                                            <button
                                                onClick={() => setOptions({ ...options, autoPublish: !options.autoPublish })}
                                                className={`w-10 h-5 rounded-full transition-all relative ${options.autoPublish ? "bg-primary" : "bg-white/10"}`}
                                            >
                                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${options.autoPublish ? "left-6" : "left-1"}`} />
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleStartProcess}
                                        className="mt-6 w-full py-5 rounded-3xl bg-gradient-to-r from-primary to-orange-600 text-white font-black uppercase tracking-widest text-sm shadow-[0_10px_30px_rgba(255,90,31,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center gap-3 group"
                                    >
                                        Foguete Iniciar <Zap className="w-5 h-5 group-hover:animate-bounce" />
                                    </button>
                                </div>
                            </div>

                            <button onClick={() => setStep(1)} className="text-xs font-bold text-white/20 hover:text-white transition-all mx-auto block">← Voltar e mudar vídeo</button>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20 space-y-8"
                        >
                            <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                                <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" style={{
                                    borderTopColor: processingError ? '#ef4444' : '#FF5A1F',
                                    animationDuration: processingPercent >= 100 ? '0s' : '1s'
                                }} />
                                {processingError ? (
                                    <AlertCircle className="h-12 w-12 text-red-500" />
                                ) : processingPercent >= 100 ? (
                                    <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                                ) : (
                                    <Zap className="h-12 w-12 text-primary shadow-[0_0_30px_rgba(255,90,31,0.5)]" fill="currentColor" />
                                )}
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-3xl font-black tracking-tighter">
                                    {processingError ? "Algo deu errado" : processingPercent >= 100 ? "Tudo pronto!" : "Processando seu vídeo..."}
                                </h2>
                                <p className="text-white/40 max-w-sm mx-auto">
                                    {processingError || "Sua solicitação está sendo processada por nossa IA. Não feche esta janela."}
                                </p>
                            </div>

                            {!processingError && (
                                <div className="max-w-md mx-auto w-full space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                        <span className={isSlow ? "text-amber-500" : "text-primary"}>{processingMsg}</span>
                                        <span className="text-white">{processingPercent}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${processingPercent}%` }}
                                            className={`h-full transition-all duration-500 ${processingPercent >= 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                                        />
                                    </div>
                                </div>
                            )}

                            {processingError && (
                                <button
                                    onClick={() => setStep(2)}
                                    className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold hover:bg-white/10 transition-all"
                                >
                                    Voltar e tentar novamente
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style>{`
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 16px;
                    width: 16px;
                    border-radius: 50%;
                    background: #FF5A1F;
                    box-shadow: 0 0 10px rgba(255,90,31,0.5);
                    cursor: pointer;
                    margin-top: -4px;
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .animate-in { animation: animateIn 0.3s ease-out; }
                @keyframes animateIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>
    );
}
