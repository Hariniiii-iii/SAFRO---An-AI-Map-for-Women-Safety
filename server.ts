import express from "express";
import path from "path";
import axios from "axios";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Proxy Route: Nominatim Geocoding
  app.get("/api/geocoding/search", async (req, res) => {
    try {
      const { q, limit, viewbox, bounded } = req.query;
      const nominatimRes = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: {
          q,
          format: 'json',
          limit: limit || 10,
          viewbox,
          bounded
        },
        headers: {
          'User-Agent': 'TrichySafeRouteAI/1.0 (Safe Travel App Proxy)'
        }
      });
      res.json(nominatimRes.data);
    } catch (error) {
      console.error("Server-side Geocoding Error:", error);
      res.status(500).json({ error: "Geocoding service unavailable" });
    }
  });

  // API Proxy Route: OSRM Routing
  app.get("/api/routing/:profile/:coords", async (req, res) => {
    try {
      const { profile, coords } = req.params;
      const { overview, geometries, steps } = req.query;
      
      const osrmRes = await axios.get(`https://router.project-osrm.org/route/v1/${profile}/${coords}`, {
        params: {
          overview,
          geometries,
          steps
        }
      });
      res.json(osrmRes.data);
    } catch (error) {
      console.error("Server-side Routing Error:", error);
      res.status(500).json({ error: "Routing service unavailable" });
    }
  });

  // Simulated Trichy Safety Dataset
  const trichySafetyData = {
    areas: [
      { name: "Srirangam", type: "Safe", dayScore: 95, nightScore: 85, lighting: 90, crowd: 95, risk: "Low" },
      { name: "Thillai Nagar", type: "Safe", dayScore: 98, nightScore: 88, lighting: 95, crowd: 90, risk: "Low" },
      { name: "Cantonment", type: "Safe", dayScore: 92, nightScore: 85, lighting: 92, crowd: 85, risk: "Low" },
      { name: "Woraiyur", type: "Moderate", dayScore: 85, nightScore: 70, lighting: 75, crowd: 80, risk: "Low" },
      { name: "KK Nagar", type: "Safe", dayScore: 90, nightScore: 80, lighting: 85, crowd: 75, risk: "Low" },
      { name: "Chatram Bus Stand", type: "Safe", dayScore: 95, nightScore: 75, lighting: 85, crowd: 98, risk: "Moderate" },
      { name: "Central Bus Stand", type: "Safe", dayScore: 95, nightScore: 75, lighting: 85, crowd: 98, risk: "Moderate" },
      { name: "Railway Junction", type: "Safe", dayScore: 98, nightScore: 85, lighting: 95, crowd: 98, risk: "Low" },
      { name: "Airport Area", type: "Safe", dayScore: 90, nightScore: 80, lighting: 95, crowd: 60, risk: "Low" },
      { name: "BHEL Township", type: "Safe", dayScore: 92, nightScore: 85, lighting: 90, crowd: 70, risk: "Low" },
      { name: "Cauvery Bridge", type: "Moderate", dayScore: 80, nightScore: 60, lighting: 70, crowd: 75, risk: "Moderate" },
      { name: "Palakkarai", type: "Moderate", dayScore: 85, nightScore: 65, lighting: 65, crowd: 85, risk: "Moderate" },
      { name: "Manapparai Outskirts", type: "Risk", dayScore: 70, nightScore: 40, lighting: 30, crowd: 20, risk: "High" }
    ],
    safeZones: [
      { name: "Cantonment Police Station", lat: 10.8037, lng: 78.6874 },
      { name: "Thillai Nagar Police Station", lat: 10.8285, lng: 78.6826 },
      { name: "Srirangam Police Station", lat: 10.8631, lng: 78.6908 },
      { name: "K.A.P. Viswanathan Government Medical College", lat: 10.7937, lng: 78.7024 }
    ]
  };

  // API Route: Get Safety Data
  app.get("/api/safety/data", (req, res) => {
    res.json(trichySafetyData);
  });

  // API Route: Analyze Route Safety (Mocked logic for Trichy)
  app.post("/api/safety/analyze", async (req, res) => {
    const { from, to, mode, time } = req.body;
    
    const hour = new Date(time || Date.now()).getHours();
    const isNight = hour >= 19 || hour < 5;

    const routes = [
      {
        id: "route-a",
        name: "Main Arterial Route",
        distance: "5.2 km",
        duration: "12 min",
        safetyScore: isNight ? 88 : 95,
        status: "Safe",
        details: {
          lighting: isNight ? 85 : 95,
          crowd: isNight ? 70 : 95,
          crimeRisk: "Low",
          roadIsolation: "Low"
        },
        path: [
          [10.7937, 78.7024] as [number, number],
          [10.8037, 78.6874] as [number, number],
          [10.8285, 78.6826] as [number, number],
          [10.8305, 78.6947] as [number, number]
        ]
      },
      {
        id: "route-b",
        name: "Optimal Balance",
        distance: "4.8 km",
        duration: "10 min",
        safetyScore: isNight ? 72 : 85,
        status: "Moderate",
        details: {
          lighting: isNight ? 60 : 85,
          crowd: isNight ? 40 : 80,
          crimeRisk: "Low",
          roadIsolation: "Medium"
        },
        path: [
          [10.7937, 78.7024] as [number, number],
          [10.7905, 78.7047] as [number, number],
          [10.8105, 78.7147] as [number, number],
          [10.8305, 78.6947] as [number, number]
        ]
      },
      {
        id: "route-c",
        name: "Quickest Path",
        distance: "4.2 km",
        duration: "8 min",
        safetyScore: isNight ? 55 : 80,
        status: isNight ? "Unsafe" : "Moderate",
        details: {
          lighting: isNight ? 30 : 75,
          crowd: isNight ? 10 : 70,
          crimeRisk: "Low",
          roadIsolation: "High"
        },
        path: [
          [10.7937, 78.7024] as [number, number],
          [10.8137, 78.7024] as [number, number],
          [10.8305, 78.6947] as [number, number]
        ]
      }
    ];

    res.json({ routes });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
