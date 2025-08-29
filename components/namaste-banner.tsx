
import Image from "next/image";
import { useAuth } from "./auth/auth-context";
import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';


export default function NamasteBanner() {
  const { user } = useAuth();
  return (
    <div className="w-full p-2 md:p-4 mb-0 backdrop-blur-md relative overflow-hidden">
      {/* Aurora background inside the box */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
      <div className="flex flex-col md:flex-row gap-0.5 md:gap-1 w-full h-full relative z-10">
        <div className="flex flex-col justify-start">
          <h2 className="text-2xl md:text-5xl font-extrabold mb-0.5 md:mb-1 text-sky-500 drop-shadow-lg text-center">Hello !!</h2>
          <p className="text-sm md:text-2xl font-bold text-gray-900 drop-shadow-lg text-center mt-1">
            {user?.name || user?.email || "Welcome!"}
          </p>
        </div>
      </div>
    </div>
  );
}
