"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Subtitles, Smartphone, Clock, BarChart3, Share2 } from 'lucide-react';

const features = [
  {
    icon: <BrainCircuit className="w-8 h-8 text-primary transition-transform duration-300 group-hover:rotate-12" />,
    title: "IA de Análise de Momentos",
    desc: "Detecta picos de engajamento, falas impactantes e momentos virais automaticamente."
  },
  {
    icon: <Subtitles className="w-8 h-8 text-accent transition-transform duration-300 group-hover:rotate-12" />,
    title: "Legendas Automáticas",
    desc: "Legendas geradas e sincronizadas com IA, prontas para TikTok e Reels."
  },
  {
    icon: <Smartphone className="w-8 h-8 text-primary transition-transform duration-300 group-hover:rotate-12" />,
    title: "Formato Vertical Inteligente",
    desc: "Recorte automático para 9:16 com foco no rosto via detecção facial."
  },
  {
    icon: <Clock className="w-8 h-8 text-accent transition-transform duration-300 group-hover:rotate-12" />,
    title: "Monitoramento 24/7",
    desc: "Nenhum vídeo passa sem ser transformado em clips. Nunca."
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-primary transition-transform duration-300 group-hover:rotate-12" />,
    title: "Dashboard de Desempenho",
    desc: "Veja quais clips performaram melhor e otimize sua estratégia."
  },
  {
    icon: <Share2 className="w-8 h-8 text-accent transition-transform duration-300 group-hover:rotate-12" />,
    title: "Multi-Plataforma",
    desc: "Publica em TikTok, Instagram, Shorts e X com uma única conexão."
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-[#0a0a0a] relative">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { clipPath: "inset(0 100% 0 0)" },
              visible: { clipPath: "inset(0 0% 0 0)", transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }
            }}
            className="font-display text-4xl md:text-6xl tracking-wide mb-4"
          >
            TUDO QUE VOCÊ PRECISA
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground font-sans text-lg max-w-2xl mx-auto"
          >
            Ferramentas profissionais de edição, agora no piloto automático.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: (Math.floor(idx / 3) * 0.1) + ((idx % 3) * 0.1) }}
              className="glass-card p-8 rounded-2xl transition-all duration-300 group feature-card-hover hover:border-primary/50 hover:shadow-[0_0_20px_rgba(255,59,59,0.2)]"
            >
              <div className="mb-6 w-14 h-14 rounded-xl bg-background flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-colors relative z-10">
                {feature.icon}
              </div>
              <h3 className="font-display text-2xl mb-3 tracking-wide relative z-10">{feature.title}</h3>
              <p className="text-muted-foreground font-sans leading-relaxed relative z-10">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
