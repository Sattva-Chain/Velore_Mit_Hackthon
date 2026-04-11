import React from "react";
import { FaBell, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Navbar: React.FC = () => {
    const Nvgates = useNavigate()
    return (
        <div className="flex justify-between items-center p-4 bg-white shadow-md">
            <div className="flex items-center space-x-4">
                <h1 className="font-bold text-xl  cursor-pointer" onClick={() => Nvgates("/")}>MarketPulse</h1>
                <input
                    type="text"
                    placeholder="Search stocks, indices..."
                    className="border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div className="flex items-center space-x-4">
                <FaBell className="text-gray-600 cursor-pointer" />
                <FaUserCircle className="text-gray-600 cursor-pointer text-2xl" />
            </div>
        </div>
    );
};

export default Navbar;
