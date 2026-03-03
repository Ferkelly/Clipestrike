import React, { useState } from 'react';
import { X, Youtube, Share2, Star } from 'lucide-react';

interface EditClipModalProps {
    clip: {
        id: string;
        title: string;
        hook: string;
        viral_score: number;
        file_url: string;
        thumbnail?: string;
        description?: string;
        edit_silence_cut?: boolean;
        edit_zoom?: boolean;
        edit_broll?: boolean;
    };
    onClose: () => void;
    onPublish: (clipId: string) => void;
    API_URL: string;
}

export function EditClipModal({ clip, onClose, onPublish, API_URL }: EditClipModalProps) {
    const [title, setTitle] = useState(clip.hook || clip.title);
    const [description, setDesc] = useState(clip.description || `${clip.hook || ""}\n\n#shorts #viral`);
    const [publishing, setPublishing] = useState(false);
    const [editSilence, setEditSilence] = useState(clip.edit_silence_cut ?? true);
    const [editZoom, setEditZoom] = useState(clip.edit_zoom ?? true);
    const [editBRoll, setEditBRoll] = useState(clip.edit_broll ?? false);

    async function handlePublish() {
        setPublishing(true);
        try {
            const token = localStorage.getItem("clipstrike_token");

            // Salvar edições primeiro
            const updateRes = await fetch(`${API_URL}/clips/${clip.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    description,
                    edit_silence_cut: editSilence,
                    edit_zoom: editZoom,
                    edit_broll: editBRoll
                }),
            });

            if (!updateRes.ok) throw new Error("Erro ao salvar alterações");

            // Publicar (Rota de postagem nas plataformas)
            const publishRes = await fetch(`${API_URL}/platforms/post/${clip.id}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
            });

            if (!publishRes.ok) throw new Error("Erro ao disparar publicação");

            onPublish(clip.id);
            onClose();
        } catch (err: any) {
            alert(err.message || "Erro ao publicar. Tente novamente.");
        } finally {
            setPublishing(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-[#111] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Editar & Publicar</h2>
                        <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-bold">Prepare seu clip para o sucesso</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all text-white/40 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Viral Score & Preview */}
                    <div className="flex gap-6">
                        <div className="w-32 aspect-[9/16] bg-white/5 rounded-xl border border-white/5 overflow-hidden flex-shrink-0 relative group">
                            {clip.thumbnail ? (
                                <img src={clip.thumbnail} className="w-full h-full object-cover" alt="Preview" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/10">
                                    <Share2 className="w-8 h-8" />
                                </div>
                            )}
                            <div className="absolute top-2 right-2 px-2 py-1 bg-primary rounded-lg text-[10px] font-bold text-white shadow-lg flex items-center gap-1">
                                <Star className="w-3 h-3 fill-white" /> {clip.viral_score}
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] block mb-2">Título do Clip / Hook</label>
                                <input
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    maxLength={100}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all placeholder:text-white/20"
                                    placeholder="Hook impactante..."
                                />
                                <div className="flex justify-end mt-1">
                                    <span className={`text-[10px] font-bold ${title.length > 90 ? 'text-primary' : 'text-white/20'}`}>
                                        {title.length}/100
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] block mb-2">Descrição & Hashtags</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDesc(e.target.value)}
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all placeholder:text-white/20 resize-none"
                                    placeholder="Descrição para as redes sociais..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Advanced Edit Settings */}
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-4">
                        <h3 className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">Configurações de Edição IA</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <label className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${editSilence ? 'bg-primary/10 border-primary/50 text-white' : 'bg-white/5 border-white/5 text-white/40'}`}>
                                <input type="checkbox" checked={editSilence} onChange={e => setEditSilence(e.target.checked)} className="hidden" />
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${editSilence ? 'bg-primary text-white' : 'bg-white/10'}`}>
                                    <Share2 className="w-4 h-4 rotate-90" /> {/* Representando tesoura/corte */}
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold">Corte de Silêncio</p>
                                    <p className="text-[8px] opacity-60">IA remove vácuos</p>
                                </div>
                            </label>

                            <label className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${editZoom ? 'bg-primary/10 border-primary/50 text-white' : 'bg-white/5 border-white/5 text-white/40'}`}>
                                <input type="checkbox" checked={editZoom} onChange={e => setEditZoom(e.target.checked)} className="hidden" />
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${editZoom ? 'bg-primary text-white' : 'bg-white/10'}`}>
                                    <Star className="w-4 h-4" /> {/* Representando zoom/foco */}
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold">Zoom Dinâmico</p>
                                    <p className="text-[8px] opacity-60">Movimento fluido</p>
                                </div>
                            </label>

                            <label className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${editBRoll ? 'bg-primary/10 border-primary/50 text-white' : 'bg-white/5 border-white/5 text-white/40'}`}>
                                <input type="checkbox" checked={editBRoll} onChange={e => setEditBRoll(e.target.checked)} className="hidden" />
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${editBRoll ? 'bg-primary text-white' : 'bg-white/10'}`}>
                                    <Youtube className="w-4 h-4" /> {/* Representando B-roll/Video */}
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold">B-Roll Auto</p>
                                    <p className="text-[8px] opacity-60">Imagens Pexels</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white/[0.02] border-t border-white/5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 font-bold text-sm transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={publishing || !title.trim()}
                        className="flex-[2] flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-primary to-orange-600 text-white font-bold text-sm shadow-[0_4px_15px_rgba(255,90,31,0.3)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
                    >
                        {publishing ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Youtube className="w-5 h-5" />
                        )}
                        {publishing ? "Publicando..." : "Publicar Agora"}
                    </button>
                </div>
            </div>
        </div>
    );
}
