'use client'
import React, { useState } from 'react';

const FilterPanel = () => {
  const [category, setCategory] = useState('movies');
  const [filter, setFilter] = useState('recommendations');

  const handleCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCategory(event.target.value);
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(event.target.value);
  };

  return (
    <div className="bg-teal-800/75 border-black border-y">
        <div className="container mx-auto px-4">
            <div className="p-4">
                <div>
                    <p className="font-bold">Category</p>
                    <div>
                        <label>
                            <input type="radio" value="movies" checked={category === 'movies'} onChange={handleCategoryChange} />
                            Movies
                        </label>
                        <label>
                            <input type="radio" value="tv" checked={category === 'tv'} onChange={handleCategoryChange} />
                            TV
                        </label>
                    </div>
                </div>
                <div>
                    <p className="font-bold">Filter</p>
                    <div>
                        <select value={filter} onChange={handleFilterChange}>
                            <option value="recommendations">Recommendations</option>
                            <option value="popular">Popular</option>
                            <option value="topRated">Top Rated</option>
                            <option value="latest">Latest</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default FilterPanel;