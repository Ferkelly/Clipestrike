import React from 'react';
import { Zap } from 'lucide-react';

export function Footer() {
  return (
    <footer className="py-12 bg-[#080808] border-t border-white/5 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" fill="currentColor" />
              <span className="font-display text-2xl tracking-wider pt-1">CLIPSTRIKE</span>
            </div>
            <p className="text-muted-foreground font-sans text-sm">
              Clips virais no piloto automático
            </p>
          </div>

          <nav className="flex flex-wrap justify-center gap-6 md:gap-8 font-sans text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Preços</a>
            <a href="#" className="hover:text-foreground transition-colors">Docs</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
            <a href="#" className="hover:text-foreground transition-colors">Termos</a>
          </nav>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-muted-foreground/60">
          <p>© 2025 ClipStrike. Feito com ⚡ para criadores.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors">Discord</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
