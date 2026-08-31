import React from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

const SIDE_IMG = "https://static.prod-images.emergentagent.com/jobs/f4c46e26-5f92-4e0f-a80a-c173853e8734/images/dbc58b158879bd4d2a275b4313bff5dc179b229d8c3ceb30a9c0a7e64b192575.jpeg";

export default function AuthShell({ title, subtitle, children, image = SIDE_IMG }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2" data-testid="auth-shell">
      <div className="relative hidden lg:block overflow-hidden">
        <img src={image} alt="Indian heritage" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 grain" />
        <div className="relative z-10 h-full flex flex-col justify-end p-12 text-white">
          <div className="w-10 h-10 rounded-full gradient-royal flex items-center justify-center heritage-glow mb-5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="font-cinzel text-2xl tracking-widest">VIRANA</div>
          <p className="mt-3 text-white/80 max-w-md leading-relaxed">
            Explore. Experience. Preserve. Your personal archive of India's living heritage awaits.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 sm:px-8 py-14">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8" data-testid="auth-logo-link">
            <div className="w-8 h-8 rounded-full gradient-royal flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-cinzel text-lg tracking-widest">VIRANA</span>
          </Link>
          <div className="caption mb-2">Living Heritage of India</div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-tight">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-3">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
