import React from "react";
import { Terminal, Key, ShieldCheck, CloudLightning, Link2 } from "lucide-react";

const features = [
  {
    title: "App Repository Check",
    description: "Verify the authenticity of repositories directly from your desktop app.",
    icon: Terminal,
    color: "from-black to-emerald-white",
  },
  {
    title: "API Key Validation",
    description: "Test your API keys and ensure they are valid and active in real time.",
    icon: Key,
    color: "from-black to-emerald-white",
  },
  {
    title: "Security Alerts",
    description: "Receive instant alerts for unauthorized or suspicious repository activity.",
    icon: ShieldCheck,
    color: "from-black to-emerald-white",
  },
 {
  title: "Employee & Project Verification",
  description:
    "Verify your role and project ownership. Generate a certificate confirming your work and the authenticity of the repository without exposing any sensitive API keys.",
  icon: ShieldCheck,
  color: "from-black to-emerald-white",
},
];

const AppFeatures: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16 text-center">
      <h2 className="text-4xl font-bold text-gray-900 mb-6">
        Key Features of Your Desktop App
      </h2>
      <p className="text-gray-600 mb-14 max-w-2xl mx-auto text-lg">
        Designed to help you check repository authenticity and manage API keys effortlessly.
      </p>

      <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3  text-left">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="relative bg-white/70 backdrop-blur-md border border-gray-200 p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
            >
              <div
                className={`flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} text-white mb-6`}
              >
                <Icon className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-base leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AppFeatures;
