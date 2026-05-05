import React from "react";
import { motion } from "motion/react";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="pt-32 pb-40 px-4 max-w-7xl mx-auto min-h-[calc(100vh-64px)] bg-luxury-black">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block px-6 py-2 rounded-full border border-blush/20 bg-blush/5 mb-8">
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-blush">Channel Connection</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-medium mb-10 italic uppercase tracking-tight">Initiate <br/><span className="text-blush">Communication</span></h1>
            <p className="text-lg text-luxury-gray mb-16 leading-relaxed font-light tracking-wide italic">
              Have inquiries regarding the SaFro pilot? Interested in strategic collaboration or contributing security intelligence? Our channels are open for refined dialogue.
            </p>
          </motion.div>

          <div className="space-y-12">
            <ContactInfo 
              icon={<Mail className="h-4 w-4 text-blush" />}
              label="Digital Correspondence"
              value="safety@trichysmartcity.in"
            />
            <ContactInfo 
              icon={<Phone className="h-4 w-4 text-rose" />}
              label="Direct Line"
              value="+91 (431) 234-5678"
            />
            <ContactInfo 
              icon={<MapPin className="h-4 w-4 text-blush" />}
              label="Regional Headquarters"
              value="Cantonment, Tiruchirappalli, Tamil Nadu 620001"
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="bg-soft-black p-10 md:p-14 rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] border border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-60 h-60 bg-blush/5 rounded-full blur-[100px] -z-10" />
          
          <form className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-luxury-gray ml-1">Identity</label>
                <input type="text" className="luxury-input w-full p-4" placeholder="Your Name" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-luxury-gray ml-1">Channel</label>
                <input type="email" className="luxury-input w-full p-4" placeholder="Your Email" />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-luxury-gray ml-1">Inquiry Context</label>
              <input type="text" className="luxury-input w-full p-4" placeholder="Subject of Discussion" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-luxury-gray ml-1">Narrative</label>
              <textarea rows={5} className="luxury-input w-full p-4 resize-none" placeholder="Provide detailed context..."></textarea>
            </div>
            <button className="luxury-button-primary w-full py-5 text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center space-x-3">
              <Send className="h-3 w-3" />
              <span>Dispatch Message</span>
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

function ContactInfo({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center space-x-4">
      <div className="h-10 w-10 glass rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
        <p className="text-gray-900 dark:text-white font-medium">{value}</p>
      </div>
    </div>
  );
}
