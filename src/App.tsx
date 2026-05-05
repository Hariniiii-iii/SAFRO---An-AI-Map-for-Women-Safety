/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import NavigationDashboard from "./components/NavigationDashboard";
import AboutPage from "./components/AboutPage";
import ContactPage from "./components/ContactPage";
import SafetyInsightsPage from "./components/SafetyInsightsPage";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./components/AuthProvider";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/navigation" element={<NavigationDashboard />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/insights" element={<SafetyInsightsPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
