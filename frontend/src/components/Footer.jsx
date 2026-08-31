import React from "react";
import { Link } from "react-router-dom";
import { Github, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-card/40 relative overflow-hidden">
      <div className="absolute inset-0 grain" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 relative">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="font-cinzel text-2xl font-bold tracking-widest">VIRANA</div>
            <div className="font-devanagari text-sm text-gold">विराना</div>
            <p className="mt-4 text-sm text-muted-foreground max-w-md leading-relaxed">
              Heritage survives when it is remembered. Virana is a living digital archive of India's
              monuments, festivals, dances, languages, food, crafts and voices — for every generation
              yet to discover them.
            </p>
          </div>
          <div>
            <div className="caption mb-3">Explore</div>
            <ul className="space-y-2 text-sm">
              <li><Link to="/explore" className="hover:text-gold">Interactive Map</Link></li>
              <li><Link to="/ask" className="hover:text-gold">Ask Virana AI</Link></li>
              <li><Link to="/lens" className="hover:text-gold">HeritageLens</Link></li>
              <li><Link to="/calendar" className="hover:text-gold">Cultural Calendar</Link></li>
              <li><Link to="/at-risk" className="hover:text-gold">Heritage at Risk</Link></li>
            </ul>
          </div>
          <div>
            <div className="caption mb-3">Our Mission</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Preserving yesterday. Connecting today. Inspiring tomorrow.
            </p>
            <div className="mt-4 text-xs font-mono text-muted-foreground flex items-center gap-1">
              Built with <Heart className="w-3 h-3 text-saffron" /> for India's living culture.
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border/60 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} Virana · Explore. Experience. Preserve.</div>
          <div className="font-mono">v0.1 · Open Heritage Archive</div>
        </div>
      </div>
    </footer>
  );
}
