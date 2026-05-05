import React from "react";
import { motion } from "motion/react";
import { Sparkles, Navigation, MapPin, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden bg-luxury-black min-h-screen">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-40 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blush/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blush-light/5 rounded-full blur-[120px]" />
      </div>

      {/* Hero Section */}
      <section className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center space-x-3 px-6 py-2 rounded-full border border-blush/20 bg-blush/5 mb-12 shadow-inner"
          >
            <Sparkles className="h-3 w-3 text-blush" />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-blush">
              SAFRO SECURITY NETWORK
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-8xl font-display font-medium tracking-tight text-white mb-8"
          >
            Navigate with <br />
            <span className="text-blush italic">Intuition & Intelligence.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-luxury-gray max-w-3xl mx-auto mb-16 leading-relaxed font-sans font-light tracking-wide px-4"
          >
            A premium safety ecosystem engineered for the discerning traveler. 
            Real-time analysis of lighting, movement, and local intelligence to ensure your path is always refined.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center space-y-6 sm:space-y-0 sm:space-x-8"
          >
            <Link
              to="/navigation"
              className="luxury-button-primary w-full sm:w-auto px-12 py-5 text-xs uppercase tracking-[0.3em] font-black"
            >
              Start Your Journey
            </Link>
            <Link
              to="/about"
              className="w-full sm:w-auto px-12 py-5 glass-light text-white rounded-2xl font-bold text-xs uppercase tracking-[0.3em] hover:bg-white/10 transition-all border border-white/10"
            >
              The Science of Safety
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
