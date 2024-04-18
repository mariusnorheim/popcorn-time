import React from 'react';
import Image from 'next/image';
import type Movie from '@models/movie';

interface CardProps {
    movie: Movie;
}

const Card: React.FC<CardProps> = ({ movie }) => (
    <div className="max-w-m rounded-md overflow-hidden shadow-lg shadow-slate-800/50 m-2 bg-gradient-to-r from-sky-900/80 to-cyan-700/90">
        <div className="h-100 border border-slate-800 overflow-hidden">
            <Image className="w-full object-cover h-96 brightness-90 hover:brightness-105 hover:scale-105" src={movie.imageUrl} alt={movie.name} width="400" height="400" />
        </div>
        <div className="px-6 py-4">
            <h2 className="text-white font-bold text-2xl mb-2">{movie.name}</h2>
            <hr className="border-slate-800" />
            <p className="text-white text-base pt-4">{movie.description}</p>
        </div>
    </div>
);

export default Card;