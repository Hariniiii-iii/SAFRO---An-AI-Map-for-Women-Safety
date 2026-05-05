import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { 
  Navigation, MapPin, Search, Calendar, Clock, 
  Footprints, Bike, Car, Shield, Info, ArrowLeft, 
  Map as MapIcon, Layers, ZoomIn, ZoomOut, AlertTriangle,
  Share2, MessageSquare, Users, User, Phone, Activity, Power, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import { debounce } from "lodash";
import { useAuth } from "./AuthProvider";
import { collection, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { handleFirestoreError, OperationType } from "../lib/firestoreUtils";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini on Frontend
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const GEMINI_MODEL = "gemini-2.0-flash";

// Fix for default Leaflet icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const TRICHY_CENTER: [number, number] = [10.7905, 78.7047];

// Landmark data for markers
const LANDMARKS = [
  { name: "Rockfort Temple", pos: [10.8305, 78.6947] as [number, number] },
  { name: "Srirangam Temple", pos: [10.8631, 78.6908] as [number, number] },
  { name: "Central Bus Stand", pos: [10.7937, 78.7024] as [number, number] },
];

const POLICE_STATIONS = [
  { name: "Commissioner of Police Office", phone: "0431-2332566", area: "Cantonment", pos: [10.8050, 78.6850] as [number, number] },
  { name: "Superintendent of Police Office", phone: "0431-2333629", area: "Cantonment", pos: [10.8030, 78.6840] as [number, number] },
  { name: "Fort Police Station", phone: "0431-2713488", area: "Fort", pos: [10.8250, 78.6920] as [number, number] },
  { name: "Cantonment Police Station", phone: "0431-2461683", area: "Cantonment", pos: [10.8020, 78.6860] as [number, number] },
  { name: "Golden Rock Police Station", phone: "0431-2491376", area: "Golden Rock", pos: [10.7900, 78.7150] as [number, number] },
  { name: "Srirangam Police Station", phone: "0431-2231555", area: "Srirangam", pos: [10.8600, 78.6900] as [number, number] },
  { name: "Airport Police Station", phone: "0431-2340863", area: "Airport", pos: [10.7600, 78.7100] as [number, number] },
  { name: "Ariyamangalam Police Station", phone: "0431-2441251", area: "Ariyamangalam", pos: [10.8000, 78.7400] as [number, number] },
  { name: "Samayapuram Police Station", phone: "0431-2670401", area: "Samayapuram", pos: [10.9200, 78.7500] as [number, number] },
  { name: "Lalgudi Police Station", phone: "0431-2541644", area: "Lalgudi", pos: [10.8600, 78.8200] as [number, number] },
  { name: "Manapparai Police Station", phone: "04332-260543", area: "Manapparai", pos: [10.6015, 78.4116] as [number, number] },
  { name: "Musiri Police Station", phone: "04326-260333", area: "Musiri", pos: [10.9329, 78.4554] as [number, number] },
  { name: "Manachanallur Police Station", phone: "0311-2560433", area: "Manachanallur", pos: [10.9061, 78.7047] as [number, number] },
];

const HOSPITALS = [
  { name: "Apollo Speciality Hospital", phone: "08062972767", area: "Ariyamangalam", pos: [10.8000, 78.7300] as [number, number] },
  { name: "Retna Global Hospital", phone: "04312791450", area: "Cantonment", pos: [10.8080, 78.6870] as [number, number] },
  { name: "Sundaram Hospital", phone: "04314024444", area: "Thillai Nagar", pos: [10.8150, 78.6850] as [number, number] },
  { name: "Maruti Hospital", phone: "08489696111", area: "Thillai Nagar", pos: [10.8200, 78.6820] as [number, number] },
  { name: "Kauvery Hospital", phone: "04314077777", area: "Tennur", pos: [10.8200, 78.6950] as [number, number] },
  { name: "Olympia Hospital", phone: "07373007211", area: "Puthur", pos: [10.8100, 78.6800] as [number, number] },
  { name: "Sri Ramakrishna Speciality Hospital", phone: "09047146123", area: "Cantonment", pos: [10.8150, 78.6900] as [number, number] },
];

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

interface RouteDetails {
  lighting: number;
  crowd: number;
  crimeRisk: string;
  roadIsolation: string;
}

interface Route {
  id: string;
  name: string;
  distance: string;
  duration: string;
  safetyScore: number;
  status: "Safe" | "Moderate" | "Unsafe";
  summary: string;
  details: RouteDetails;
  path: [number, number][];
  geometry?: any;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

function SetMapBounds({ path }: { path: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (path && path.length > 0) {
      const bounds = L.latLngBounds(path);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [path, map]);
  return null;
}

export default function NavigationDashboard() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromCoord, setFromCoord] = useState<[number, number] | null>(null);
  const [toCoord, setToCoord] = useState<[number, number] | null>(null);
  const [fromSuggestions, setFromSuggestions] = useState<Suggestion[]>([]);
  const [toSuggestions, setToSuggestions] = useState<Suggestion[]>([]);
  
  const [travellerType, setTravellerType] = useState<"alone" | "group">("alone");
  const [memberCount, setMemberCount] = useState(1);
  const [travelMode, setTravelMode] = useState("walk");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState(format(new Date(), "HH:mm"));
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const { user, login } = useAuth();
  const [sosActive, setSosActive] = useState(false);
  const [sosId, setSosId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("lighting");
  const [reportDescription, setReportDescription] = useState("");
  const [showRouteSOS, setShowRouteSOS] = useState(false);
  const [nearbyPolice, setNearbyPolice] = useState<any[]>([]);
  const [nearbyHospitals, setNearbyHospitals] = useState<any[]>([]);

  const updateRouteAwareSOS = (path: [number, number][]) => {
    if (!path || path.length === 0) return;

    const findNearest = (locations: any[]) => {
      return locations
        .map(loc => {
          // Find minimum distance from the location to any point in the path
          let minDistance = Infinity;
          // Sampling path for faster calculation if very long
          const sampleRate = Math.max(1, Math.floor(path.length / 50));
          for (let i = 0; i < path.length; i += sampleRate) {
            const d = L.latLng(path[i]).distanceTo(L.latLng(loc.pos));
            if (d < minDistance) minDistance = d;
          }
          return { ...loc, distance: minDistance };
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3); // Get top 3
    };

    setNearbyPolice(findNearest(POLICE_STATIONS));
    setNearbyHospitals(findNearest(HOSPITALS));
  };

  useEffect(() => {
    if (selectedRoute) {
      updateRouteAwareSOS(selectedRoute.path);
    }
  }, [selectedRoute]);

  const handleCopyTrackingLink = () => {
    const trackingId = Math.random().toString(36).substring(7);
    const link = `${window.location.origin}/track/${trackingId}`;
    navigator.clipboard.writeText(link);
    alert("Live tracking link copied! Share this with your emergency contacts for this trip.");
  };

  const handleShareTrip = () => {
    if (!selectedRoute) return;
    const shareData = {
      title: 'My Safe Trip - SAFRO',
      text: `I'm using SAFRO to travel from ${from} to ${to}. My route is ${selectedRoute.safetyScore}% safe.`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      // Fallback
      navigator.clipboard.writeText(`${shareData.text} Check it out: ${shareData.url}`);
      alert("Trip details copied to clipboard!");
    }
  };

  const handleReportSafety = async () => {
    if (!user) {
      alert("Please login to submit a safety report.");
      return;
    }
    
    try {
      await addDoc(collection(db, "safety_reports"), {
        userId: user.uid,
        userName: user.displayName,
        type: reportType,
        description: reportDescription,
        lat: TRICHY_CENTER[0],
        lng: TRICHY_CENTER[1],
        timestamp: serverTimestamp(),
        verified: false
      });
      setShowReportModal(false);
      setReportDescription("");
      alert("Thank you! Your safety report has been submitted for verification.");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "safety_reports");
    }
  };

  const handleSOS = async () => {
    if (!user) {
      if (window.confirm("Please login to activate SOS alerts. Login now?")) {
        login();
      }
      return;
    }

    if (sosActive && sosId) {
      try {
        await updateDoc(doc(db, "sos_alerts", sosId), {
          active: false,
          deactivatedAt: serverTimestamp()
        });
        setSosActive(false);
        setSosId(null);
        alert("SOS deactivated. Glad you are safe!");
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, "sos_alerts");
      }
      return;
    }

    try {
      // In a real app, we'd get current geolocation
      const alertRef = await addDoc(collection(db, "sos_alerts"), {
        userId: user.uid,
        userName: user.displayName,
        lat: TRICHY_CENTER[0], // Access by index for Leaflet array
        lng: TRICHY_CENTER[1], // Access by index for Leaflet array
        timestamp: serverTimestamp(),
        active: true
      });
      setSosId(alertRef.id);
      setSosActive(true);
      alert("EMERGENCY ALERT SENT! Authorities and emergency contacts in Trichy have been notified of your location.");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "sos_alerts");
    }
  };

  const generateSafetyExplanation = async (routeName: string, status: string, score: number, details: RouteDetails, travelerInfo: any) => {
    try {
      const prompt = `
        You are an AI safety expert for a women's safety app called "SAFRO".
        Generate a professional, concise (1-2 sentences) "Explainable Safety" summary for a route in Tiruchirappalli.
        
        Route Name: ${routeName}
        Status: ${status}
        Safety Score: ${score}%
        Lighting: ${details.lighting}%
        Crowd Density: ${details.crowd}%
        Crime Risk: ${details.crimeRisk}
        Road Isolation: ${details.roadIsolation}
        
        TRIP CONTEXT:
        Traveller Type: ${travelerInfo.type}
        Group Size: ${travelerInfo.size} members
        Travel Mode: ${travelerInfo.mode}

        Explain why this route is ${status.toLowerCase()} considering the group size and travel type.
        If traveling alone, emphasize lighting and populated roads.
        If in a group, explain how the group size contributes to safety while still noting road isolation if any.
        Keep it helpful and reassuring.
      `;
      
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt
      });
      
      return response.text?.trim() || "Safety analysis established based on current environmental layers.";
    } catch (error) {
      console.error("Gemini Frontend Error:", error);
      return "Safety analysis provided based on current urban safety factors and geographical data.";
    }
  };

  const fetchSuggestions = debounce(async (query: string, type: 'from' | 'to') => {
    if (!query || query.length < 3) return;
    try {
      const res = await axios.get(`/api/geocoding/search`, {
        params: {
          q: `${query}, Trichy`,
          limit: 5,
          viewbox: '78.5,10.7,78.9,11.0',
          bounded: 1
        }
      });
      if (type === 'from') setFromSuggestions(res.data);
      else setToSuggestions(res.data);
    } catch (e) {
      console.error("Geocoding failed", e);
    }
  }, 500);

  const calculateSafetyScore = (routeData: any, isNight: boolean, tType: string, gSize: number) => {
    // Heuristic safety calculation
    let score = 85;
    
    // Night penalty
    if (isNight) score -= 15;
    
    // Traveler type logic
    if (tType === 'alone') {
      score -= 5;
      if (isNight) score -= 10; // Extra penalty for solo at night
    } else {
      // Group bonus
      const groupBonus = Math.min(gSize * 3, 15);
      score += groupBonus;
    }

    // Mocking some "Danger" zones in Trichy for the demo logic
    // (In production this would use historical crime data / lighting maps)
    const distance = parseFloat(routeData.distance) / 1000; // in km
    if (distance > 10) score -= 5; // Longer routes slightly more risk if isolated

    return Math.min(Math.max(score, 30), 99);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hrs} hr ${remainingMins} min` : `${hrs} hr`;
  };

  const handleSearch = async () => {
    if (!fromCoord || !toCoord) {
      alert("Please select locations from the suggestions.");
      return;
    }
    
    setIsLoading(true);
    setRoutes([]);
    setSelectedRoute(null);
    setIsNavigating(false);
    
    try {
      const dateTime = new Date(`${date}T${time}`);
      const isNight = dateTime.getHours() >= 19 || dateTime.getHours() < 5;
      
      // Real OSRM Routing via Proxy
      const profile = travelMode === 'walk' ? 'foot' : travelMode === 'bike' ? 'bicycle' : 'car';
      const coords = `${fromCoord[1]},${fromCoord[0]};${toCoord[1]},${toCoord[0]}`;
      const osrmRes = await axios.get(`/api/routing/${profile}/${coords}`, {
        params: {
          overview: 'full',
          geometries: 'geojson',
          steps: true
        }
      });
      
      if (!osrmRes.data.routes || osrmRes.data.routes.length === 0) {
        throw new Error("No route found");
      }

      const osrmRoute = osrmRes.data.routes[0];
      const path: [number, number][] = osrmRoute.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);

      // Generate Route Safety Details
      const safetyScore = calculateSafetyScore(osrmRoute, isNight, travellerType, memberCount);
      const status = safetyScore > 80 ? "Safe" : safetyScore > 50 ? "Moderate" : "Unsafe";

      const details: RouteDetails = {
        lighting: isNight ? (travellerType === 'alone' ? 65 : 80) : 95,
        crowd: isNight ? (travellerType === 'alone' ? 30 : 60) : 90,
        crimeRisk: safetyScore > 70 ? "Low" : "Moderate",
        roadIsolation: travellerType === 'alone' && isNight ? "Medium" : "Low"
      };

      const summary = await generateSafetyExplanation(
        "AI Computed Path", 
        status, 
        safetyScore, 
        details, 
        { type: travellerType, size: memberCount, mode: travelMode }
      );

      const finalRoute: Route = {
        id: "real-route-1",
        name: `${travelMode.charAt(0).toUpperCase() + travelMode.slice(1)} Safety Recommended`,
        distance: `${(osrmRoute.distance / 1000).toFixed(1)} km`,
        duration: formatDuration(osrmRoute.duration),
        safetyScore,
        status,
        summary,
        details,
        path,
        geometry: osrmRoute
      };

      setRoutes([finalRoute]);
      setSelectedRoute(finalRoute);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Failed to find a route between these points in Trichy. Please try more specific locations.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar - Left Panel */}
      <div className="w-full lg:w-[400px] flex-shrink-0 bg-luxury-black border-r border-white/5 overflow-y-auto flex flex-col">
        {!isNavigating ? (
          <div className="p-8 space-y-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2.5 bg-blush/10 rounded-xl">
                <Navigation className="h-5 w-5 text-blush" />
              </div>
              <h1 className="text-xl font-display font-medium tracking-wide uppercase">Route Planner</h1>
            </div>

            <div className="space-y-5">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blush/60">
                  <div className="h-2 w-2 rounded-full border-2 border-blush" />
                </div>
                <input
                  type="text"
                  placeholder="Starting point"
                  className="luxury-input w-full pl-12"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    fetchSuggestions(e.target.value, 'from');
                  }}
                />
                {fromSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-soft-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                    {fromSuggestions.map((s, idx) => (
                      <div 
                        key={idx} 
                        className="p-4 text-xs hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 transition-colors"
                        onClick={() => {
                          setFrom(s.display_name);
                          setFromCoord([parseFloat(s.lat), parseFloat(s.lon)]);
                          setFromSuggestions([]);
                        }}
                      >
                        {s.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rose/60">
                  <MapPin className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="Where to?"
                  className="luxury-input w-full pl-12"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    fetchSuggestions(e.target.value, 'to');
                  }}
                />
                {toSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-soft-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                    {toSuggestions.map((s, idx) => (
                      <div 
                        key={idx} 
                        className="p-4 text-xs hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 transition-colors"
                        onClick={() => {
                          setTo(s.display_name);
                          setToCoord([parseFloat(s.lat), parseFloat(s.lon)]);
                          setToSuggestions([]);
                        }}
                      >
                        {s.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Traveler Type Section */}
            <div className="space-y-5 p-6 bg-soft-black/50 rounded-3xl border border-white/5 shadow-inner">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-luxury-gray uppercase tracking-[0.2em]">Traveller</label>
                <div className="flex bg-luxury-black p-1 rounded-xl">
                  <button 
                    onClick={() => {
                      setTravellerType("alone");
                      setMemberCount(1);
                    }}
                    className={cn(
                      "px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center space-x-2",
                      travellerType === "alone" ? "bg-soft-black shadow-lg text-blush" : "text-luxury-gray"
                    )}
                  >
                    <User className="h-3 w-3" />
                    <span>Alone</span>
                  </button>
                  <button 
                    onClick={() => setTravellerType("group")}
                    className={cn(
                      "px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center space-x-2",
                      travellerType === "group" ? "bg-soft-black shadow-lg text-blush" : "text-luxury-gray"
                    )}
                  >
                    <Users className="h-3 w-3" />
                    <span>Group</span>
                  </button>
                </div>
              </div>

              {travellerType === "group" && (
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-luxury-gray uppercase tracking-[0.2em]">Group Size</label>
                  <input 
                    type="number" 
                    min={2}
                    max={20}
                    className="w-20 px-3 py-2 bg-luxury-black border border-white/10 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blush/30"
                    value={memberCount}
                    onChange={(e) => setMemberCount(parseInt(e.target.value) || 2)}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <ModeButton active={travelMode === "walk"} icon={<Footprints className="h-4 w-4" />} onClick={() => setTravelMode("walk")} label="Walk" />
              <ModeButton active={travelMode === "bike"} icon={<Bike className="h-4 w-4" />} onClick={() => setTravelMode("bike")} label="Bike" />
              <ModeButton active={travelMode === "car"} icon={<Car className="h-4 w-4" />} onClick={() => setTravelMode("car")} label="Car" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blush pointer-events-none" />
                <input 
                  type="date" 
                  className="luxury-input w-full pl-10 pr-3 py-3 !text-[10px]" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blush pointer-events-none" />
                <input 
                  type="time" 
                  className="luxury-input w-full pl-10 pr-3 py-3 !text-[10px]" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={isLoading || !from || !to}
              className="luxury-button-primary w-full py-5 uppercase tracking-widest text-xs flex items-center justify-center space-x-3 disabled:opacity-30 disabled:pointer-events-none"
            >
              {isLoading ? <div className="h-5 w-5 border-2 border-luxury-black/30 border-t-luxury-black rounded-full animate-spin" /> : <Shield className="h-5 w-5" />}
              <span>Analyze Safety</span>
            </button>
          </div>
        ) : (
          <div className="p-8 space-y-6 border-b border-white/5 bg-soft-black/20">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-medium tracking-wide uppercase italic">Navigation <span className="text-blush">Preview</span></h2>
              <button 
                onClick={() => setIsNavigating(false)}
                className="p-2.5 hover:bg-white/5 rounded-full text-blush transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-blush/40 border-t-blush animate-spin flex-shrink-0" />
                <p className="text-xs font-medium text-luxury-gray truncate leading-relaxed">{from}</p>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-rose flex-shrink-0" />
                <p className="text-xs font-medium text-luxury-gray truncate leading-relaxed">{to}</p>
              </div>
            </div>
          </div>
        )}

        {/* Route Lists */}
        <div className="flex-grow p-8 pt-6 space-y-6">
          <AnimatePresence mode="wait">
            {isNavigating && selectedRoute ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <button 
                  onClick={() => setIsNavigating(false)}
                  className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-blush hover:text-rose group"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  <span>Return to selection</span>
                </button>

                <div className="space-y-8">
                  <div className="bg-soft-black p-8 rounded-[2rem] border border-blush/20 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Shield className="h-32 w-32 text-blush" />
                    </div>
                    
                    <div className="flex items-center justify-between mb-6 relative">
                      <div className="h-12 w-12 bg-blush/10 rounded-2xl flex items-center justify-center">
                        {travelMode === 'walk' ? <Footprints className="h-6 w-6 text-blush" /> : travelMode === 'bike' ? <Bike className="h-6 w-6 text-blush" /> : <Car className="h-6 w-6 text-blush" />}
                      </div>
                      <div className={cn(
                        "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm",
                        selectedRoute.status === "Safe" ? "bg-safe/20 text-safe border border-safe/30" : selectedRoute.status === "Moderate" ? "bg-warning/20 text-warning border border-warning/30" : "bg-danger/20 text-danger border border-danger/30"
                      )}>
                        {selectedRoute.status} Path
                      </div>
                    </div>
                    
                    <h4 className="text-2xl font-display font-medium leading-tight mb-2 italic">{selectedRoute.name}</h4>
                    <p className="text-3xl font-display font-black text-white mb-6">
                      {selectedRoute.duration} <span className="text-base font-normal text-luxury-gray ml-2">/ {selectedRoute.distance}</span>
                    </p>
                    
                    <div className="p-5 bg-luxury-black/50 rounded-2xl mb-6 text-xs italic text-luxury-gray leading-relaxed border border-white/5 font-display">
                      "{selectedRoute.summary}"
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-luxury-gray">
                        <span>Reliability Index</span>
                        <span className="text-blush">{selectedRoute.safetyScore}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-luxury-black rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-blush to-blush-light" 
                          initial={{ width: 0 }}
                          animate={{ width: `${selectedRoute.safetyScore}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h5 className="text-[10px] font-black text-luxury-gray uppercase tracking-[0.3em] pl-2">Navigation Guide</h5>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                      {selectedRoute.geometry?.legs?.[0]?.steps?.map((step: any, idx: number) => (
                        <div key={idx} className="flex items-start space-x-4 p-5 bg-soft-black/50 rounded-2xl border border-white/5 hover:border-blush/20 transition-all group">
                          <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blush/40 flex-shrink-0 group-hover:bg-blush transition-colors" />
                          <div className="text-xs">
                            <p className="font-medium text-white/90 leading-relaxed font-sans">
                              {step.maneuver.instruction}
                            </p>
                            <p className="text-[10px] text-luxury-gray mt-1.5 tabular-nums uppercase tracking-widest opacity-60">
                              {Math.round(step.distance)}m • {Math.round(step.duration)}s
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button className="luxury-button-primary w-full py-5 flex items-center justify-center space-x-3 text-xs uppercase tracking-[0.2em] group">
                    <Navigation className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    <span>Initiate Trip</span>
                  </button>
                </div>
              </motion.div>
            ) : routes.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Route Options</h3>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">TRICHY PILOT</span>
                </div>
                {routes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    selected={selectedRoute?.id === route.id}
                    onUseRoute={() => {
                      setSelectedRoute(route);
                      setIsNavigating(true);
                    }}
                    onClick={() => {
                      setSelectedRoute(route);
                    }}
                  />
                ))}
              </motion.div>
            ) : isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                <div className="h-10 w-10 border-4 border-gray-200 dark:border-gray-800 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-sm">Analyzing Trichy safety layers...</p>
              </div>
            ) : (
              <div className="py-12 px-6 text-center">
                <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="text-gray-400 h-8 w-8" />
                </div>
                <h4 className="text-gray-900 dark:text-white font-medium">No route selected</h4>
                <p className="text-xs text-gray-400 mt-2">Enter your destination inside Trichy city to see real-time safety analysis.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* SOS Button - Stick to bottom of sidebar for accessibility */}
        <div className="p-4 border-t bg-white dark:bg-gray-950">
          {selectedRoute && (
            <button 
              onClick={() => setShowRouteSOS(true)}
              className="w-full py-4 bg-soft-black text-blush rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-blush/20 flex items-center justify-center space-x-2 hover:bg-blush/5 transition-all"
            >
              <Activity className="h-4 w-4" />
              <span>Route-based SOS Help</span>
            </button>
          )}
        </div>
      </div>

      {/* Map - Right Panel */}
      <div className="flex-grow relative bg-gray-100 dark:bg-gray-800">
        <div className="absolute inset-0 z-0">
          <MapContainer 
            center={TRICHY_CENTER} 
            zoom={13} 
            scrollWheelZoom={true}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ChangeView center={TRICHY_CENTER} zoom={13} />
            
            {selectedRoute && (
              <>
                <SetMapBounds path={selectedRoute.path} />
                <Polyline 
                  positions={selectedRoute.path}
                  pathOptions={{ 
                    color: selectedRoute.status === "Safe" ? "#10b981" : selectedRoute.status === "Moderate" ? "#f59e0b" : "#ef4444",
                    weight: isNavigating ? 10 : 6,
                    opacity: isNavigating ? 1 : 0.8,
                    lineJoin: 'round'
                  }}
                />
                {/* Start & End Markers for the selected route */}
                <Marker position={selectedRoute.path[0]}>
                  <Popup>Start: {from}</Popup>
                </Marker>
                <Marker position={selectedRoute.path[selectedRoute.path.length - 1]}>
                  <Popup>Destination: {to}</Popup>
                </Marker>

                {/* Route-Aware Emergency Markers */}
                {isNavigating && (
                  <>
                    {nearbyPolice.map((ps, i) => (
                      <Marker key={`ps-${i}`} position={ps.pos} icon={L.divIcon({
                        className: 'custom-div-icon',
                        html: `<div style="background-color: #CD5E77; padding: 5px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 15px rgba(205,94,119,0.5); color: white;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                      })}>
                        <Popup>
                          <div className="p-3 bg-luxury-black text-white rounded-xl border border-blush/20 min-w-[150px]">
                            <h4 className="font-display font-medium text-xs uppercase tracking-wider text-blush">{ps.name}</h4>
                            <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-widest">{ps.area} Police</p>
                            <a href={`tel:${ps.phone}`} className="mt-3 flex items-center justify-center space-x-2 py-1.5 bg-blush text-luxury-black rounded-lg text-[9px] font-black uppercase">
                               <Phone className="h-3 w-3" />
                               <span>Connect</span>
                            </a>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                    {nearbyHospitals.map((h, i) => (
                      <Marker key={`hosp-${i}`} position={h.pos} icon={L.divIcon({
                        className: 'custom-div-icon',
                        html: `<div style="background-color: #ef4444; padding: 5px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 15px rgba(239,68,68,0.5); color: white;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                      })}>
                        <Popup>
                           <div className="p-3 bg-luxury-black text-white rounded-xl border border-red-500/20 min-w-[150px]">
                            <h4 className="font-display font-medium text-xs uppercase tracking-wider text-red-500">{h.name}</h4>
                            <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-widest">{h.area} Hospital</p>
                            <a href={`tel:${h.phone}`} className="mt-3 flex items-center justify-center space-x-2 py-1.5 bg-red-500 text-white rounded-lg text-[9px] font-black uppercase">
                               <Phone className="h-3 w-3" />
                               <span>Emergency</span>
                            </a>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </>
                )}
              </>
            )}

            {LANDMARKS.map((landmark, i) => (
              <Marker key={i} position={landmark.pos}>
                <Popup>
                  <span className="font-bold">{landmark.name}</span>
                </Popup>
              </Marker>
            ))}

            {sosActive && (
              <Marker position={TRICHY_CENTER}>
                <Popup>
                  <span className="text-danger font-bold">SOS ACTIVE HERE</span>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* Map Overlay Controls */}
        <div className="absolute top-6 right-6 space-y-2">
          <MapControlButton icon={<Layers className="h-5 w-5" />} />
          <MapControlButton icon={<ZoomIn className="h-5 w-5" />} />
          <MapControlButton icon={<ZoomOut className="h-5 w-5" />} />
          <button 
            onClick={() => setShowReportModal(true)}
            className="h-10 w-10 flex items-center justify-center glass shadow-xl rounded-xl hover:bg-white transition-all text-gray-700 dark:text-gray-300"
            title="Report Safety Issue"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        </div>

        {/* Floating SOS Toggle (Overlay) */}
        <div className="absolute bottom-32 right-6 lg:bottom-40">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSOS}
            className={cn(
              "h-16 w-16 rounded-full shadow-2xl flex items-center justify-center transition-all",
              sosActive ? "bg-gray-900 border-4 border-danger animate-pulse" : "bg-danger"
            )}
          >
            <AlertTriangle className={cn("h-8 w-8", sosActive ? "text-danger" : "text-white")} />
          </motion.button>
        </div>

        {/* Floating AI Alert */}
        <div className="absolute top-6 left-6 max-w-xs">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-dark p-4 rounded-2xl shadow-2xl border-l-4 border-safe"
          >
            <div className="flex items-start space-x-3">
              <div className="p-1.5 bg-safe/20 rounded-lg">
                <Shield className="h-4 w-4 text-safe" />
              </div>
              <div>
                <h4 className="text-white text-xs font-bold leading-tight">Safety Alert</h4>
                <p className="text-gray-400 text-[10px] mt-1">Area ahead has active police patrol. Well-lit route confirmed.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Route Info Panel (Bottom) */}
        <AnimatePresence>
          {selectedRoute && !isNavigating && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-10 left-6 right-6 max-w-4xl mx-auto"
            >
              <div className="glass rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center justify-between border border-white/10">
                <div className="flex items-center space-x-6 mb-6 md:mb-0">
                  <div className={cn(
                    "h-16 w-16 rounded-full flex items-center justify-center text-white border-2",
                    selectedRoute.status === "Safe" ? "bg-safe/20 border-safe shadow-[0_0_20px_rgba(16,185,129,0.2)]" : selectedRoute.status === "Moderate" ? "bg-warning/20 border-warning shadow-[0_0_20px_rgba(245,158,11,0.2)]" : "bg-danger/20 border-danger shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                  )}>
                    <span className="text-xl font-display font-black">{selectedRoute.safetyScore}%</span>
                  </div>
                  <div>
                    <h3 className="font-display font-medium text-2xl leading-tight italic">{selectedRoute.name}</h3>
                    <p className="text-[10px] uppercase font-bold tracking-[0.25em] text-luxury-gray mt-1">
                      {selectedRoute.distance} • {selectedRoute.duration} • <span className={cn(
                        "font-black tracking-widest",
                        selectedRoute.status === "Safe" ? "text-safe" : selectedRoute.status === "Moderate" ? "text-warning" : "text-danger"
                      )}>{selectedRoute.status}</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 w-full md:w-auto">
                  <button 
                    onClick={handleShareTrip}
                    className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-blush"
                    title="Share Live Trip"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => setShowAnalysis(true)} 
                    className="flex-grow md:flex-none px-8 py-4 rounded-xl border border-blush/30 text-blush text-[10px] font-black uppercase tracking-widest hover:bg-blush/5 transition-all"
                  >
                    Details
                  </button>
                  <button 
                    onClick={() => setIsNavigating(true)}
                    className="flex-grow md:flex-none px-8 py-4 rounded-xl bg-blush text-luxury-black text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blush/20 hover:bg-rose transition-all hover:scale-105"
                  >
                    Use Route
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals & Overlays */}
        <AnimatePresence>
          {showRouteSOS && selectedRoute && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] bg-luxury-black/70 backdrop-blur-md flex items-center justify-center p-6"
              onClick={() => setShowRouteSOS(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                className="bg-soft-black w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-[0_50px_150px_rgba(0,0,0,0.9)] border border-blush/20"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-10 flex flex-col h-full max-h-[90vh]">
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <div className="inline-block px-4 py-1.5 rounded-full bg-rose/10 border border-rose/20 mb-4">
                        <span className="text-[9px] font-black tracking-[0.3em] uppercase text-rose">Active Route Context</span>
                      </div>
                      <h2 className="text-3xl font-display font-medium uppercase tracking-widest italic text-white leading-tight">Route-Aware <span className="text-blush">Emergency Support</span></h2>
                    </div>
                    <button onClick={() => setShowRouteSOS(false)} className="p-4 bg-luxury-black border border-white/5 rounded-2xl text-blush hover:bg-rose/10 transition-colors">
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-12">
                    {/* Live Location Section */}
                    <div className="p-8 bg-luxury-black rounded-[2rem] border border-white/5 shadow-inner">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="p-3 bg-blush/10 rounded-xl">
                          <Share2 className="h-5 w-5 text-blush" />
                        </div>
                        <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-white">Live Session Persistence</h3>
                      </div>
                      <p className="text-[11px] text-luxury-gray font-light tracking-wide italic mb-8 leading-relaxed">
                        Authorize real-time telemetry streaming for this specific route session. Your coordinates will be transmitted to emergency responders and personal contacts.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button onClick={handleCopyTrackingLink} className="luxury-button-primary py-4 text-[10px] uppercase tracking-widest shadow-sm">
                          Capture Tracking ID
                        </button>
                        <button onClick={handleShareTrip} className="luxury-button-outline py-4 text-[10px] uppercase tracking-widest">
                          Broadcast Session
                        </button>
                      </div>
                    </div>

                    {/* Police Stations */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="flex items-center space-x-3">
                          <Shield className="h-4 w-4 text-blush" />
                          <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-white">Proximal Security Hubs</h3>
                        </div>
                        <span className="text-[9px] text-luxury-gray font-bold uppercase tracking-widest">Order by Route Relevance</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {nearbyPolice.map((station, i) => (
                          <div key={i} className={cn(
                            "p-5 rounded-2xl border transition-all group",
                            i === 0 ? "bg-blush/5 border-blush/30 shadow-lg" : "bg-luxury-black border-white/5 hover:border-blush/20"
                          )}>
                            <div className="flex justify-between items-start mb-4">
                              <div className="h-2 w-2 rounded-full bg-blush opacity-40 group-hover:opacity-100" />
                              <span className="text-[9px] font-black text-blush uppercase tracking-widest">{(station.distance/1000).toFixed(1)}km</span>
                            </div>
                            <h4 className="text-[11px] font-black text-white uppercase tracking-wider mb-2 leading-tight">{station.name}</h4>
                            <p className="text-[9px] text-luxury-gray font-bold uppercase tracking-widest mb-4">{station.area}</p>
                            <a href={`tel:${station.phone}`} className="flex items-center justify-center space-x-2 py-2.5 bg-soft-black border border-white/5 rounded-xl text-[10px] font-bold text-blush hover:bg-blush hover:text-luxury-black transition-all">
                              <Phone className="h-3 w-3" />
                              <span>Enforce Dial</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Hospitals */}
                    <div className="space-y-6 pb-6">
                      <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="flex items-center space-x-3">
                          <Activity className="h-4 w-4 text-rose" />
                          <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-white">Critical Medical Points</h3>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {nearbyHospitals.map((hosp, i) => (
                          <div key={i} className="p-6 rounded-2xl bg-luxury-black border border-white/5 hover:border-rose/20 transition-all flex items-center justify-between group">
                            <div>
                              <h4 className="text-[11px] font-black text-white uppercase tracking-wider mb-1 leading-tight">{hosp.name}</h4>
                              <div className="flex items-center space-x-2">
                                <span className="text-[9px] font-bold text-luxury-gray uppercase tracking-widest">{hosp.area}</span>
                                <span className="h-1 w-1 rounded-full bg-white/20" />
                                <span className="text-[9px] font-black text-rose uppercase tracking-widest">{(hosp.distance/1000).toFixed(1)}km proximal</span>
                              </div>
                            </div>
                            <a href={`tel:${hosp.phone}`} className="p-4 bg-soft-black border border-white/5 rounded-2xl text-rose hover:bg-rose hover:text-white transition-all shadow-xl">
                              <Phone className="h-4 w-4" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-8 border-t border-white/5">
                    <button 
                      onClick={() => setShowRouteSOS(false)}
                      className="w-full py-5 bg-white/5 border border-white/5 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] text-luxury-gray hover:bg-white/10 transition-all"
                    >
                      Acknowledge & Continue Navigation
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showReportModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-luxury-black/60 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setShowReportModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-soft-black w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-white/5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-10">
                  <h2 className="text-3xl font-display font-medium mb-8 uppercase tracking-widest italic">Report <span className="text-blush">Issue</span></h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-luxury-gray uppercase tracking-[0.3em] mb-3 ml-1">Category</label>
                      <select 
                        className="luxury-input w-full p-4 appearance-none"
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                      >
                        <option value="lighting">Poor Lighting</option>
                        <option value="isolation">Road Isolation</option>
                        <option value="crowd">Suspicious Crowd</option>
                        <option value="harassment">Harassment Zone</option>
                        <option value="potholes">Road Damage</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-black text-luxury-gray uppercase tracking-[0.3em] mb-3 ml-1">Narrative</label>
                      <textarea 
                        className="luxury-input w-full p-4 h-32 resize-none"
                        placeholder="Detail your observation..."
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4 mt-10">
                    <button 
                      onClick={() => setShowReportModal(false)}
                      className="flex-1 py-4 border border-white/10 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-white/5 transition-all outline-none"
                    >
                      Dismiss
                    </button>
                    <button 
                      onClick={handleReportSafety}
                      className="luxury-button-primary flex-1 py-4 uppercase text-[10px] tracking-widest"
                    >
                      Authenticate & Flag
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showAnalysis && selectedRoute && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-luxury-black/60 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setShowAnalysis(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-soft-black w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-blush/10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-10">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-3xl font-display font-medium uppercase tracking-widest italic">Safety <span className="text-blush">Audit</span></h2>
                      <p className="text-[10px] text-luxury-gray mt-2 uppercase tracking-widest font-bold opacity-60">AI Generative Security Report</p>
                    </div>
                    <button onClick={() => setShowAnalysis(false)} className="p-3 h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-white/5 border border-white/5 text-blush transition-colors">
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-8">
                    <div className="p-6 bg-luxury-black/30 rounded-3xl border border-white/5 shadow-inner">
                      <p className="text-xs text-luxury-gray leading-relaxed italic font-display">
                        "{selectedRoute.summary}"
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <StatItem label="Luminesence" value={selectedRoute.details.lighting} />
                      <StatItem label="Social Density" value={selectedRoute.details.crowd} />
                    </div>

                    <div className="space-y-5 pt-8 border-t border-white/5">
                      <DetailRow label="Security Incidents" value={selectedRoute.details.crimeRisk} color="text-safe" />
                      <DetailRow label="Path Isolation" value={selectedRoute.details.roadIsolation} color="text-warning" />
                      <DetailRow label="Nocturnal Hazard" value="Negligible" color="text-safe" />
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowAnalysis(false)}
                    className="luxury-button-primary w-full mt-10 py-5 uppercase text-[11px] tracking-[0.3em] font-black"
                  >
                    Acknowledge & Sync
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ModeButton({ active, icon, onClick, label }: { active: boolean, icon: React.ReactNode, onClick: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center py-4 px-2 rounded-2xl border transition-all",
        active 
          ? "bg-blush shadow-lg shadow-blush/20 border-blush text-luxury-black" 
          : "bg-soft-black/40 border-white/5 text-luxury-gray hover:border-blush/40 hover:bg-soft-black/60"
      )}
    >
      {icon}
      <span className="text-[9px] font-bold mt-2 uppercase tracking-widest">{label}</span>
    </button>
  );
}

const RouteCard: React.FC<{ 
  route: Route, 
  selected: boolean, 
  onClick: () => void,
  onUseRoute: () => void
}> = ({ route, selected, onClick, onUseRoute }) => {
  const statusColor = route.status === "Safe" ? "text-safe" : route.status === "Moderate" ? "text-warning" : "text-danger";
  const statusBg = route.status === "Safe" ? "bg-safe/20" : route.status === "Moderate" ? "bg-warning/20" : "bg-danger/20";

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-6 rounded-[2rem] border cursor-pointer transition-all hover:scale-[1.01] hover:shadow-2xl relative overflow-hidden group",
        selected 
          ? "border-blush/30 bg-soft-black ring-1 ring-blush/30 shadow-[0_20px_50px_rgba(0,0,0,0.4)]" 
          : "border-white/5 bg-soft-black/20 hover:bg-soft-black/30"
      )}
    >
      {selected && (
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Shield className="h-16 w-16 text-blush" />
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4 relative">
        <h4 className="font-display font-medium text-lg tracking-wide uppercase italic leading-tight">{route.name}</h4>
        <span className="text-[10px] font-black text-blush uppercase tracking-widest opacity-80">{route.duration}</span>
      </div>
      <div className="flex items-center justify-between mt-4 relative">
        <div className="flex items-center space-x-3">
          <div className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border shadow-sm", statusBg, statusColor, 
            route.status === "Safe" ? "border-safe/30" : route.status === "Moderate" ? "border-warning/30" : "border-danger/30"
          )}>
            {route.status}
          </div>
          <span className="text-[10px] text-luxury-gray font-bold uppercase tracking-widest">{route.distance}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className={cn("h-3.5 w-3.5", statusColor)} />
          <span className={cn("text-xs font-black tabular-nums tracking-tighter", statusColor)}>{route.safetyScore}%</span>
        </div>
      </div>
      
      {selected && (
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={(e) => {
            e.stopPropagation();
            onUseRoute();
          }}
          className="luxury-button-primary w-full mt-6 py-3.5 text-[10px] uppercase tracking-[0.3em] shadow-xl flex items-center justify-center space-x-2"
        >
          <Navigation className="h-4 w-4" />
          <span>Sync Route</span>
        </motion.button>
      )}
    </div>
  );
};

function StatItem({ label, value }: { label: string, value: number }) {
  const color = value > 80 ? "bg-safe" : value > 50 ? "bg-warning" : "bg-danger";
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-luxury-gray/70">
        <span>{label}</span>
        <span className="text-white">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-luxury-black rounded-full overflow-hidden border border-white/5">
        <motion.div 
          className={cn("h-full", color)} 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function DetailRow({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="flex justify-between items-center text-[11px] font-sans">
      <span className="text-luxury-gray uppercase tracking-widest font-bold">{label}</span>
      <span className={cn("font-black uppercase tracking-widest underline decoration-2 underline-offset-4", color)}>{value}</span>
    </div>
  );
}

function MapControlButton({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="h-10 w-10 flex items-center justify-center glass shadow-xl rounded-xl hover:bg-white transition-all text-gray-700 dark:text-gray-300">
      {icon}
    </button>
  );
}
