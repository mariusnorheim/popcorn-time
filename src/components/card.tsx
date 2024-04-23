import React from 'react';
import type Movie from '@models/movie';

interface CardProps {
    movie: Movie;
}

const Card: React.FC<CardProps> = ({ movie }) => (
    <div className="max-w-m rounded-md overflow-hidden shadow-lg shadow-slate-800/50 m-2 bg-gradient-to-r from-sky-900/80 to-cyan-700/90 hover:brightness-110 hover:scale-105">
        <div className="border border-slate-800 overflow-hidden brightness-90 hover:brightness-105">
            <img className="w-full object-cover h-96" src={movie.imageUrl} alt={movie.name} width="400" height="400" />
        </div>
        <div className="px-6 py-4">
            <h2 className="text-white font-bold text-2xl mb-2">{movie.name}</h2>
            <hr className="border-slate-800" />
            <p className="text-white text-base pt-4">{movie.description}</p>
        </div>
    </div>
);

export default Card;