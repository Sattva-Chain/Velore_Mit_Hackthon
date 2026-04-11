// LandingPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import BusinessFeatures from "../components/Features";
import { userAuth } from "../context/Auth";



const Home: React.FC = () => {
  const {user} = userAuth()!
  const navigate = useNavigate();
  console.log(user)
  return (
    <div className="bg-red flex flex-col items-center justify-center px-6 py-4">

      {/* Navbar */}
      <nav className="w-full max-w-6xl flex justify-between items-center mb-16">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <img
            src="./depositphotos_81331782-stock-illustration-wolf-logo-template-removebg-preview.png"
            alt="VaultScan Logo"
            className="w-12 h-12"
          />
          <span className="text-xl font-bold">VaultScan</span>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center space-x-4">
         {
          user ?  <button
            className="bg-gray-800 text-white px-4 py-2 rounded-full hover:bg-gray-900 transition"
            onClick={() => navigate("/Dashboard")}
          >
            Dashboard
          </button>:<button onClick={() => navigate("/login")} className="hover:underline">Log in</button>
         }
          
        </div>
      </nav>

      {/* Main Content */}
      <main className="text-center max-w-3xl">
        {/* Badge / Announcement */}
        <div className="inline-flex items-center justify-center px-3 py-1 mb-4 rounded-full bg-gray-300 text-sm text-black font-medium">
          <span className="mr-2">•</span>Free & Open-Source Desktop for Repo Security
        </div>


        {/* Heading */}
        <h1 className="text-5xl font-bold mb-6">
          Scan your code, secure your keys.
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-8">
          Streamline your financial workflows with our comprehensive fintech platform. Built for modern businesses who value efficiency, compliance, and scalable growth.
        </p>

        {/* CTA Buttons */}
        <div className="flex justify-center gap-4">
          <button className="bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-900 transition">
            Start for free
          </button>
        </div>
      </main>
      <BusinessFeatures/>
    </div>
  );
};

export default Home;
