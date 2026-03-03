"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';

export function CTAFinal() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="relative rounded-[2.5rem] p-12 md:p-24 overflow-hidden text-center bg-primary shadow-2xl shadow-primary/20"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

          <div className="relative z-10 flex flex-col items-center">
            <motion.h2
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                hidden: { clipPath: "inset(0 100% 0 0)" },
                visible: { clipPath: "inset(0 0% 0 0)", transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="font-display text-5xl md:text-7xl tracking-wide mb-6 text-white drop-shadow-md"
            >
              COMECE A AUTOMATIZAR HOJE
            </motion.h2>
            <p className="font-sans text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-sm">
              Configure em 2 minutos. Seus primeiros clips em menos de 1 hora.
            </p>

            <Button
              size="lg"
              className="h-16 px-10 rounded-full bg-white text-primary font-bold text-lg hover:scale-105 hover:bg-white/95 transition-all shadow-xl group border-0"
            >
              Conectar Meu Canal Agora
              <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
