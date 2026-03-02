"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Link, Radio, Scissors, Rocket, TrendingUp } from 'lucide-react';

const steps = [
  {
    icon: <Link className="w-8 h-8 text-primary" />,
    title: "Conectar Canal",
    desc: "Cole a URL do seu canal YouTube ou conecte via Google OAuth",
    badge: null
  },
  {
    icon: <Radio className="w-8 h-8 text-accent" />,
    title: "Detecta Uploads",
    desc: "Monitoramento automático — novos vídeos são detectados em instantes",
    badge: null
  },
  {
    icon: <Scissors className="w-8 h-8 text-primary" />,
    title: "IA Cria os Clips",
    desc: "Nossa IA analisa engajamento, identifica os melhores momentos e corta automaticamente",
    badge: "POWERED BY AI"
  },
  {
    icon: <Rocket className="w-8 h-8 text-accent" />,
    title: "Publica Sozinho",
    desc: "Clips vão direto para TikTok, Instagram e Shorts sem sua intervenção",
    badge: null
  },
  {
    icon: <TrendingUp className="w-8 h-8 text-yellow-400" />,
    title: "Cresce & Monetiza",
    desc: "Mais alcance, mais seguidores, mais receita — no piloto automático",
    badge: "NOVO!"
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-background relative overflow-hidden">
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
            COMO FUNCIONA
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground font-sans text-lg max-w-2xl mx-auto"
          >
            Configure uma vez. Deixe o ClipStrike trabalhar para sempre.
          </motion.p>
        </div>

        <div className="flex overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar gap-6 md:grid md:grid-cols-5 md:overflow-visible md:gap-4 relative">
          {/* Connector Line Background */}
          <div className="hidden md:block absolute top-[100px] left-[10%] right-[10%] h-[1px] bg-white/10" />
          
          {/* Animated Connector Line */}
          <motion.div 
            initial={{ width: "0%" }}
            whileInView={{ width: "80%" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
            className="hidden md:block absolute top-[100px] left-[10%] h-[1px] bg-gradient-to-r from-primary via-accent to-transparent" 
          />

          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              whileHover={{ y: -8 }}
              className="snap-center shrink-0 w-[280px] md:w-auto glass-card rounded-2xl p-6 relative group hover:border-primary/50 hover:shadow-[0_0_20px_rgba(255,59,59,0.2)] transition-all duration-300 bg-[#0f0f0f]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              
              {step.badge && (
                <div className={`absolute -top-3 right-4 text-[10px] font-mono font-bold px-2 py-1 rounded-full ${
                  step.badge === 'NOVO!' 
                    ? 'bg-gradient-primary text-white' 
                    : 'bg-primary/20 text-primary border border-primary/30'
                }`}>
                  {step.badge}
                </div>
              )}

              <div className="mb-6 bg-white/5 w-16 h-16 rounded-xl flex items-center justify-center border border-white/10 hover-bounce-icon transition-transform relative z-10 mx-auto md:mx-0">
                {step.icon}
              </div>
              
              <h3 className="font-display text-2xl mb-3 text-center md:text-left">{step.title}</h3>
              <p className="text-sm text-muted-foreground font-sans leading-relaxed text-center md:text-left">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
