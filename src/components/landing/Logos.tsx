import React from 'react';
import { motion } from 'framer-motion';

export function Logos() {
  return (
    <section className="py-12 bg-[#0f0f0f] border-y border-white/5">
      <div className="container mx-auto px-4 md:px-6">
        <p className="text-center font-mono text-xs text-muted-foreground uppercase tracking-widest mb-8">
          Publica automaticamente em:
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {/* TikTok Logo */}
          <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
            </svg>
            <span className="font-bold text-xl tracking-tighter">TikTok</span>
          </motion.div>

          {/* Instagram Logo */}
          <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            <span className="font-bold text-xl tracking-tighter">Instagram</span>
          </motion.div>

          {/* YouTube Shorts Logo */}
          <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-red-500">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            <span className="font-bold text-xl tracking-tighter">Shorts</span>
          </motion.div>

          {/* X (Twitter) Logo */}
          <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="font-bold text-xl tracking-tighter">X</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
