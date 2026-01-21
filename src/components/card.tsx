import React from 'react';
import type Movie from '@models/movie';

interface CardProps {
    movie: Movie;
    meta?: string;
    footer?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ movie, meta, footer }) => {
  const hasImage = Boolean(movie.imageUrl && movie.imageUrl.trim().length > 0);

  return (
    <article className="relative max-w-m overflow-hidden rounded-2xl border border-white/8 bg-slate-900/80 shadow-lg shadow-black/50 m-2 transition-transform transition-shadow hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/70">
      <div className="overflow-hidden border-b border-white/10">
        {typeof movie.rating === "number" ? (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-slate-950 shadow-md shadow-amber-900/40">
            ★ {movie.rating.toFixed(1)}
          </div>
        ) : null}
        {hasImage ? (
          <img
            className="w-full object-cover h-80"
            src={movie.imageUrl}
            alt={movie.name}
            width="400"
            height="400"
          />
        ) : (
          <div className="flex h-80 w-full items-center justify-center bg-slate-900 text-slate-300">
            No image
          </div>
        )}
      </div>
      <div className="px-4 py-3">
        <h2 className="mb-2 line-clamp-2 text-lg font-semibold text-slate-50">
          {movie.name}
        </h2>
        {meta ? (
          <p className="mb-2 line-clamp-2 text-xs text-slate-300/90">{meta}</p>
        ) : null}
        <p className="line-clamp-4 text-sm text-slate-200/90">
          {movie.description}
        </p>
        {footer ? <div className="mt-3">{footer}</div> : null}
      </div>
    </article>
  );
};

export default Card;