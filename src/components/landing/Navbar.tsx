"use client";

import React, { useState, useEffect } from 'react';
import { Zap, Menu, X } from 'lucide-react';
import { Button } from '../ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? 'bg-[#080808]/90 backdrop-blur-md border-b border-primary/20 py-3'
        : 'bg-transparent py-5'
        }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary animate-flicker" fill="currentColor" />
          <span className="font-display text-2xl tracking-wider pt-1">CLIPSTRIKE</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="nav-link text-sm text-muted-foreground hover:text-foreground transition-colors">Funcionalidades</a>
          <a href="#how-it-works" className="nav-link text-sm text-muted-foreground hover:text-foreground transition-colors">Como Funciona</a>
          <a href="#pricing" className="nav-link text-sm text-muted-foreground hover:text-foreground transition-colors">Preços</a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="nav-link text-sm text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link to="/login"><Button variant="ghost" className="text-sm hover:text-primary">Login</Button></Link>
          <Link to="/login"><Button className="bg-primary text-white rounded-full px-6 hover:scale-105 transition-transform glow-effect border-0 shimmer-effect">Começar Grátis</Button></Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-white/10 bg-background/95 backdrop-blur-xl"
          >
            <div className="flex flex-col px-4 py-6 gap-4">
              <a href="#features" className="text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>Funcionalidades</a>
              <a href="#how-it-works" className="text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>Como Funciona</a>
              <a href="#pricing" className="text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>Preços</a>
              <div className="h-px bg-white/10 my-2" />
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}><Button variant="outline" className="w-full justify-center border-white/10">Login</Button></Link>
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}><Button className="w-full justify-center bg-primary text-white rounded-full border-0 shimmer-effect">Começar Grátis</Button></Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
