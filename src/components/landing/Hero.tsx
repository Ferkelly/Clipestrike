"use client";

import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Play, Zap } from 'lucide-react';
import { Button } from '../ui/button';

function AnimatedCounter({ from, to }: { from: number; to: number }) {
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString('pt-BR'));

  useEffect(() => {
    const controls = animate(count, to, { duration: 2, ease: "easeOut" });
    return controls.stop;
  }, [count, to]);

  return <motion.span>{rounded}</motion.span>;
}

export function Hero() {
  const headlineWords = ["CLIPS", "VIRAIS.", "ZERO", "ESFORÇO.", "100%", "AUTOMÁTICO."];

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] opacity-50 mix-blend-screen" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px] opacity-30 mix-blend-screen" />
        
        {/* Particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's',
              animationDuration: Math.random() * 10 + 10 + 's'
            }}
          />
        ))}

        {/* Diagonal Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF3B3B" stopOpacity="0" />
              <stop offset="50%" stopColor="#FF7A00" stopOpacity="1" />
              <stop offset="100%" stopColor="#FFD600" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            d="M-100,100 L1000,1200"
            stroke="url(#line-grad)"
            strokeWidth="2"
            fill="none"
          />
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
            d="M200,-100 L1400,1100"
            stroke="url(#line-grad)"
            strokeWidth="1"
            fill="none"
          />
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
            d="M-200,500 L800,1500"
            stroke="url(#line-grad)"
            strokeWidth="3"
            fill="none"
          />
        </svg>
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-6 text-center flex flex-col items-center">
        {/* Animated Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative inline-flex items-center justify-center rounded-full p-[1px] mb-8 overflow-hidden group"
        >
          <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#080808_0%,#FF3B3B_50%,#FF7A00_100%)]" />
          <div className="inline-flex items-center justify-center w-full px-4 py-1.5 text-xs font-mono rounded-full bg-background/90 backdrop-blur-xl text-foreground/90 uppercase tracking-wider">
            <span className="text-primary mr-2">✦</span> NOVO — Automação Total de Clips com IA
          </div>
        </motion.div>

        {/* Headline */}
        <h1 className="font-display text-[56px] leading-[0.9] md:text-[96px] tracking-wide mb-6 flex flex-col">
          <div className="overflow-hidden">
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-block mr-4"
            >
              {headlineWords[0]}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-block"
            >
              {headlineWords[1]}
            </motion.span>
          </div>
          <div className="overflow-hidden text-gradient">
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-block mr-4"
            >
              {headlineWords[2]}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="inline-block"
            >
              {headlineWords[3]}
            </motion.span>
          </div>
          <div className="overflow-hidden">
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="inline-block mr-4"
            >
              {headlineWords[4]}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="inline-block"
            >
              {headlineWords[5]}
            </motion.span>
          </div>
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed font-sans"
        >
          O ClipStrike monitora seu canal do YouTube, detecta novos uploads, corta os melhores momentos com IA e publica automaticamente no TikTok, Instagram Reels e YouTube Shorts — sem você precisar fazer nada.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-12"
        >
          <Button size="lg" className="h-14 px-8 rounded-full bg-gradient-primary text-white text-lg font-medium hover:scale-105 transition-transform glow-effect border-0 w-full sm:w-auto hover:shadow-[0_0_30px_rgba(255,59,59,0.5)]">
            Conectar Meu Canal
          </Button>
          <Button size="lg" variant="outline" className="h-14 px-8 rounded-full border-white/20 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 hover:text-white transition-all group w-full sm:w-auto hover:scale-105">
            <Play className="mr-2 h-5 w-5 fill-current opacity-70 group-hover:opacity-100 transition-opacity" />
            Ver Como Funciona
          </Button>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="flex items-center gap-2 font-mono text-xs text-muted-foreground bg-white/5 py-2 px-4 rounded-full border border-white/10"
        >
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
          </div>
          <Zap className="h-3 w-3 text-primary" />
          <span><AnimatedCounter from={0} to={2847} /> criadores automatizando seus canais agora</span>
        </motion.div>
      </div>
    </section>
  );
}
