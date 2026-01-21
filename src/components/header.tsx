import React from 'react';
import Image from "next/image";
import HeaderImage from "@public/header.png";

const Header: React.FC = () => (
  <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur">
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-3">
          <div className="overflow-hidden rounded-xl border border-cyan-400/40 bg-slate-900/80 shadow-lg shadow-cyan-900/40">
            <Image
              src={HeaderImage}
              className="h-16 w-auto"
              alt="Popcorn time!"
              priority
            />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
              Now playing
            </div>
            <h1 className="text-2xl font-semibold text-slate-50">
              Popcorn Time
            </h1>
            <p className="text-sm text-slate-300/80">
              Discover what to watch next, fresh from TMDB.
            </p>
          </div>
        </div>
      </div>
    </div>
  </header>
);

export default Header;