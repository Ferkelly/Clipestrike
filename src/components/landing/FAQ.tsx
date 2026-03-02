"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: "Preciso fazer o download dos vídeos?",
    a: "Não. O ClipStrike baixa automaticamente os vídeos do seu canal do YouTube, processa na nuvem e publica nas outras redes."
  },
  {
    q: "Funciona com qualquer canal do YouTube?",
    a: "Sim, desde que os vídeos sejam públicos e você tenha os direitos autorais sobre eles."
  },
  {
    q: "Como a IA escolhe os melhores momentos?",
    a: "Nossa IA analisa picos de volume de áudio, densidade de palavras-chave, mudanças de cena e engajamento visual para encontrar os momentos com maior potencial viral."
  },
  {
    q: "Quanto tempo leva para publicar após o upload?",
    a: "Geralmente, os clips são gerados e publicados em menos de 1 hora após o vídeo original ser detectado no YouTube."
  },
  {
    q: "É seguro conectar minha conta?",
    a: "Totalmente. Usamos OAuth oficial do Google, TikTok e Meta. Não armazenamos suas senhas e você pode revogar o acesso a qualquer momento."
  }
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-[#0a0a0a] relative">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
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
            PERGUNTAS FREQUENTES
          </motion.h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="glass-card rounded-2xl overflow-hidden border border-white/5"
            >
              <button
                onClick={() => toggleFAQ(idx)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
              >
                <span className="font-display text-2xl tracking-wide">{faq.q}</span>
                <ChevronDown 
                  className={`w-6 h-6 text-primary transition-transform duration-300 ${
                    openIndex === idx ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-0 text-muted-foreground font-sans leading-relaxed border-t border-white/5">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
