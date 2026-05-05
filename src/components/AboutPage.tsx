import React from "react";
import { motion } from "motion/react";
import { Info, Target, Users, Landmark } from "lucide-react";
import Logo from "./Logo";

export default function AboutPage() {
  return (
    <div className="pt-32 pb-40 px-4 max-w-6xl mx-auto bg-luxury-black min-h-[calc(100vh-64px)]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-32"
      >
        <div className="inline-block px-6 py-2 rounded-full border border-blush/20 bg-blush/5 mb-8">
          <span className="text-[10px] font-black tracking-[0.3em] uppercase text-blush">Urban Security Protocol</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-display font-medium mb-8 italic uppercase tracking-tight">The <span className="text-blush">SaFro</span> Narrative</h1>
        <p className="text-luxury-gray text-lg max-w-3xl mx-auto font-light tracking-wide leading-relaxed italic">
          SaFro is a specialized location-intelligence ecosystem designed to redefine urban mobility for women through high-fidelity data and predictive modeling.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
        <section className="space-y-8 luxury-card group hover:border-blush/20 transition-all">
          <div className="h-16 w-16 bg-luxury-black border border-white/5 rounded-[1.5rem] flex items-center justify-center shadow-2xl group-hover:bg-blush/5 transition-colors">
            <Target className="h-6 w-6 text-blush" />
          </div>
          <h2 className="text-2xl font-medium font-display italic uppercase tracking-widest">Our Mandate</h2>
          <p className="text-luxury-gray leading-relaxed font-light text-sm tracking-wide">
            We transcend conventional "fastest path" logistics to prioritize human safety. By synthesizing urban indicators—dynamic lighting data, crowd resonance, and verified local reports—we enable sophisticated navigation without compromise.
          </p>
        </section>

        <section className="space-y-8 luxury-card group hover:border-blush/20 transition-all">
          <div className="h-16 w-16 bg-luxury-black border border-white/5 rounded-[1.5rem] flex items-center justify-center shadow-2xl group-hover:bg-rose/5 transition-colors">
            <Logo className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-medium font-display italic uppercase tracking-widest">Explainable Intelligence</h2>
          <p className="text-luxury-gray leading-relaxed font-light text-sm tracking-wide">
            Intelligence is only as valuable as its transparency. Our AI provides explainable security reports for every path, ensuring you understand the ecological factors—from luminosity levels to commercial activity—that define your safety.
          </p>
        </section>
      </div>

      <div className="mt-32 p-12 glass rounded-[3rem] border border-white/5 shadow-2xl bg-soft-black/40">
        <div className="flex flex-col md:flex-row items-center space-y-10 md:space-y-0 md:space-x-12">
          <div className="h-32 w-32 bg-luxury-black border border-white/5 rounded-[2.5rem] flex-shrink-0 flex items-center justify-center shadow-inner group">
            <Landmark className="h-14 w-14 text-blush opacity-30 group-hover:opacity-60 transition-opacity" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-medium mb-4 italic uppercase tracking-widest">Precision Engineered <span className="text-blush">for Trichy</span></h3>
            <p className="text-sm text-luxury-gray font-light tracking-widest leading-loose">
              This ecosystem is a pilot study focused on the distinct urban architecture of Tiruchirappalli. From the ancient paths of Srirangam to the modern industrial corridors of BHEL, every coordinate is mapped with localized security intent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
