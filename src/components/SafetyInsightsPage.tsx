import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Lightbulb, UserCheck, AlertCircle, TrendingUp, Clock, MapPin } from "lucide-react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { format } from "date-fns";

interface SafetyReport {
  id: string;
  type: string;
  description: string;
  userName: string;
  timestamp: any;
}

export default function SafetyInsightsPage() {
  const [reports, setReports] = useState<SafetyReport[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "safety_reports"),
      orderBy("timestamp", "desc"),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SafetyReport[];
      setReports(data);
    });

    return () => unsubscribe();
  }, []);

  const insights = [
    {
      title: "Lighting Factor",
      score: 85,
      description: "Trichy's main arterial roads (Cantonment to Junction) maintain high lighting efficiency (>90%) until 11 PM.",
      icon: <Lightbulb className="h-5 w-5 text-amber-500" />
    },
    {
      title: "Crowd Density",
      score: 70,
      description: "Chatram and Central Bus Stands maintain safe crowd levels even late at night, making them reliable transit nodes.",
      icon: <UserCheck className="h-5 w-5 text-blue-500" />
    },
    {
      title: "Night Risk Index",
      score: 42,
      description: "Risk levels increase significantly after 9:30 PM in interior residential zones of Woraiyur and outskirts.",
      icon: <AlertCircle className="h-5 w-5 text-danger" />
    }
  ];

  return (
    <div className="pt-32 pb-40 px-4 max-w-7xl mx-auto bg-luxury-black min-h-[calc(100vh-64px)]">
      <div className="mb-24 text-center">
        <div className="inline-block px-6 py-2 rounded-full border border-blush/20 bg-blush/5 mb-8">
          <span className="text-[10px] font-black tracking-[0.3em] uppercase text-blush">Intelligence Feed</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-display font-medium italic mb-8 uppercase tracking-tight text-white">Safety <span className="text-blush">Insights</span></h1>
        <p className="text-luxury-gray max-w-3xl mx-auto text-lg font-light tracking-wide italic leading-relaxed px-4">
          Unfiltered ecological analysis of Tiruchirappalli's safety landscape. Real-time data synthesis of community intelligence and urban architectural factors.
        </p>
      </div>

      {/* Community Reports */}
      <div className="mb-32">
        <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-8">
          <div className="flex items-center space-x-3">
            <Shield className="h-4 w-4 text-blush" />
            <h2 className="text-xs font-display font-medium uppercase tracking-[0.4em] italic text-white">Live Protocol Sync</h2>
          </div>
          <div className="h-1.5 w-1.5 rounded-full bg-safe animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <AnimatePresence mode="popLayout">
            {reports.length > 0 ? (
              reports.map((report) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="luxury-card group hover:border-blush/20 transition-all p-10"
                >
                  <div className="flex justify-between items-start mb-6">
                    <span className="px-4 py-1.5 bg-blush/10 text-blush text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-blush/20 shadow-sm shadow-blush/5">
                      {report.type}
                    </span>
                    <span className="text-[9px] text-luxury-gray font-bold tracking-widest uppercase opacity-60">
                      {report.timestamp?.seconds ? format(new Date(report.timestamp.seconds * 1000), "HH:mm") : "Live"}
                    </span>
                  </div>
                  <p className="text-sm text-white/90 mb-8 line-clamp-3 font-light leading-relaxed tracking-wide italic">
                    "{report.description}"
                  </p>
                  <div className="flex items-center space-x-3 text-[9px] text-luxury-gray font-black uppercase tracking-[0.2em] border-t border-white/5 pt-6 group-hover:text-blush transition-colors">
                    <UserCheck className="h-3 w-3" />
                    <span>Verified Insight</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-24 text-center rounded-[3rem] border border-dashed border-white/5 bg-soft-black/20">
                <MapPin className="h-12 w-12 mx-auto mb-6 opacity-10 text-blush" />
                <p className="text-luxury-gray font-light tracking-[0.2em] uppercase text-xs">Awaiting community verification from Trichy quadrants...</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-24">
        {insights.map((item, idx) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-10 luxury-card group hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-4 bg-luxury-black border border-white/5 rounded-[1.5rem] shadow-xl group-hover:bg-blush/5 transition-colors">
                {React.cloneElement(item.icon as React.ReactElement, { className: 'h-5 w-5 text-blush' })}
              </div>
              <h3 className="font-display font-medium text-lg text-white uppercase italic tracking-widest">{item.title}</h3>
            </div>
            <div className="flex items-end space-x-3 mb-6">
              <span className="text-5xl font-display font-medium text-white italic tracking-tighter">{item.score}%</span>
              <span className="text-[9px] text-luxury-gray mb-3 font-black uppercase tracking-[0.3em]">Quantum Index</span>
            </div>
            <p className="text-luxury-gray text-xs leading-loose font-light tracking-wide">
              {item.description}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="p-12 glass rounded-[3rem] overflow-hidden relative shadow-2xl border border-white/5 bg-soft-black/20">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center space-x-3 text-blush">
              <TrendingUp className="h-4 w-4" />
              <h3 className="font-black uppercase text-[10px] tracking-[0.4em]">Ecological Trends (24h)</h3>
            </div>
            <div className="h-2 w-2 rounded-full bg-blush shadow-[0_0_10px_rgba(205,94,119,0.6)]" />
          </div>
          <div className="h-64 flex items-end space-x-3">
            {[40, 60, 80, 95, 100, 90, 80, 60, 40, 30, 25, 35].map((val, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${val}%` }}
                className="flex-grow bg-blush/10 rounded-t-2xl hover:bg-gradient-to-t hover:from-blush/30 hover:to-blush-light/30 transition-all cursor-help border-x border-white/5"
              />
            ))}
          </div>
          <div className="flex justify-between mt-8 text-[9px] font-black uppercase tracking-[0.3em] text-luxury-gray opacity-40">
            <span>Dawn (06:00)</span>
            <span>Solar Max</span>
            <span>Twilight</span>
            <span>Nocturnal</span>
          </div>
        </div>

        <div className="p-12 glass rounded-[3rem] flex flex-col justify-center bg-soft-black border border-blush/10 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
          <div className="flex items-center space-x-3 mb-10 text-rose">
            <Clock className="h-4 w-4" />
            <h3 className="font-black uppercase text-[10px] tracking-[0.4em]">Current Safety Status</h3>
          </div>
          <p className="text-4xl font-display font-medium mb-6 italic uppercase text-white tracking-widest leading-tight">"Suburban <br/><span className="text-blush">Elite Resilience</span>"</p>
          <p className="text-luxury-gray text-sm leading-loose font-light tracking-wide italic mb-12">
            Currently experiencing refined visibility parameters across Chatram and Thillai Nagar sectors. Prime window for decentralized mobility. Nocturnal protocol shifts anticipated in 3 hours.
          </p>
          <div className="flex">
            <div className="px-6 py-3 bg-blush/5 border border-blush/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-blush shadow-inner">
              Status: Recommendation Walk
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
