"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '../ui/button';

const plans = [
  {
    name: "Plano Free",
    price: "R$ 0",
    period: "/mês",
    features: [
      "3 vídeos/mês",
      "2 clips por vídeo",
      "Legendas básicas",
      "1 plataforma"
    ],
    cta: "Começar Grátis",
    highlight: false
  },
  {
    name: "Plano Pro",
    price: "R$ 47",
    period: "/mês",
    badge: "MAIS POPULAR",
    features: [
      "Vídeos ilimitados",
      "10 clips por vídeo",
      "Legendas avançadas com IA",
      "Todas as plataformas",
      "Auto-publicação"
    ],
    cta: "Assinar Pro",
    highlight: true
  },
  {
    name: "Plano Creator",
    price: "R$ 97",
    period: "/mês",
    features: [
      "Tudo do Pro",
      "Clips ilimitados",
      "Detecção facial avançada",
      "Dashboard analytics",
      "Suporte prioritário"
    ],
    cta: "Assinar Creator",
    highlight: false
  }
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-background relative">
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
            SIMPLES E TRANSPARENTE
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground font-sans text-lg max-w-2xl mx-auto"
          >
            Escolha o plano ideal para o seu canal.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`relative rounded-3xl p-8 flex flex-col ${plan.highlight
                ? 'border-gradient shadow-2xl shadow-primary/20 scale-105 z-10'
                : 'glass-card border border-white/10'
                }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white font-mono text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
                  {plan.badge}
                </div>
              )}

              <h3 className="font-display text-3xl mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="font-display text-5xl">{plan.price}</span>
                <span className="text-muted-foreground font-sans">{plan.period}</span>
              </div>

              <ul className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-3 font-sans text-muted-foreground">
                    <Check className={`w-5 h-5 shrink-0 ${plan.highlight ? 'text-primary' : 'text-white/40'}`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full h-12 rounded-full font-medium transition-all ${plan.highlight
                  ? 'bg-primary text-white hover:scale-105 shadow-[0_0_30px_rgba(255,90,31,0.4)] border-0'
                  : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                  }`}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
