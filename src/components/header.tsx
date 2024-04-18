import React from 'react';
import Image from "next/image";
import HeaderImage from "@public/header.png";

const Header: React.FC = () => (
    <div className="bg-teal-800">
        <div className="container mx-auto px-4">
            <div className="flex p-2 justify-center">
                <Image src={HeaderImage} className="h-64 w-auto" alt="Popcorn time!" />
            </div>
        </div>
    </div>
);

export default Header;