/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bike,
  Car,
  IndianRupee,
  Clock, 
  Zap, 
  Footprints, 
  Home, 
  Accessibility, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Loader2,
  ChevronRight,
  Info,
  Calendar,
  Save,
  History,
  Trash2,
  ExternalLink,
  Cloud,
  Sun,
  CloudRain,
  Wind,
  Crosshair,
  MessageSquare
} from 'lucide-react';
import { cn } from './types';
import type { ConstraintSet, PlanResponse, SavedPlanHeader, ItineraryItem } from './types';
import { generateItinerary } from './services/aiService';
import Markdown from 'react-markdown';
import FlowMap from './components/FlowMap';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [savedPlans, setSavedPlans] = useState<SavedPlanHeader[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [currentWeather, setCurrentWeather] = useState<{ temp: number; condition: string; rainProb: number } | null>(null);
  const [temporalMode, setTemporalMode] = useState<'range' | 'duration'>('range');
  const [constraints, setConstraints] = useState<ConstraintSet>({
    timeRange: '09:00 - 17:00',
    timeDuration: 120,
    timeLimit: '18:00',
    budget: 500,
    energyLevel: 'medium',
    walkingTolerance: 10,
    walkDistance: 2,
    travelMode: 'walking',
    indoorPreference: false,
    accessibilityNeeds: [],
    collegeLocation: 'Banashankari 2nd Stage'
  });

  const isWalking = constraints.travelMode === 'walking';

  useEffect(() => {
    fetchSavedPlans();
    handleUseLiveLocation();
    fetchCurrentWeather();
  }, []);

  const fetchCurrentWeather = async () => {
    try {
      // Using Open-Meteo for real-time weather (no key required)
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=12.9250&longitude=77.5650&current=temperature_2m,weather_code&hourly=precipitation_probability&forecast_days=1');
      const data = await res.json();
      if (data.current) {
        // Get the current hour's precipitation probability
        const currentHour = new Date().getHours();
        const rainProb = data.hourly.precipitation_probability[currentHour] || 0;
        
        setCurrentWeather({
          temp: data.current.temperature_2m,
          condition: 'Active',
          rainProb: rainProb
        });
      }
    } catch (error) {
      console.error("Failed to fetch weather:", error);
    }
  };

  const fetchSavedPlans = async () => {
    try {
      const res = await fetch('/api/plans');
      if (res.ok) {
        const data = await res.json();
        setSavedPlans(data);
      }
    } catch (error) {
      console.error("Failed to fetch saved plans:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await generateItinerary(constraints);
      setPlan(result);
    } catch (error) {
      console.error("Failed to generate plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!plan) return;
    const name = prompt("Enter a name for this flow:", `Flow ${new Date().toLocaleDateString()}`);
    if (!name) return;

    const id = crypto.randomUUID();
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...plan,
          id,
          name,
          constraints
        })
      });
      if (res.ok) {
        fetchSavedPlans();
        alert("Flow saved successfully!");
      }
    } catch (error) {
      console.error("Failed to save plan:", error);
    }
  };

  const loadPlan = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/plans/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
        setConstraints(data.constraints);
        setShowSaved(false);
      }
    } catch (error) {
      console.error("Failed to load plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this flow?")) return;
    try {
      const res = await fetch(`/api/plans/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSavedPlans();
      }
    } catch (error) {
      console.error("Failed to delete plan:", error);
    }
  };

  const [locating, setLocating] = useState(false);

  const handleUseLiveLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setConstraints({
          ...constraints,
          collegeLocation: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          userLat: latitude,
          userLng: longitude
        });
        setLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocating(false);
        alert("Failed to get location. Please ensure permissions are granted.");
      },
      { enableHighAccuracy: true }
    );
  };

  const scrollToMap = () => {
    const mapElement = document.getElementById('map-view');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth' });
    } else {
      const query = encodeURIComponent(constraints.collegeLocation);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  const calculateWalkability = (item: ItineraryItem) => {
    if (!item.travelTime) return null;
    const mins = parseInt(item.travelTime.replace(/[^0-9]/g, ''));
    if (isNaN(mins)) return null;
    
    const tolerance = constraints.walkingTolerance || 15;
    // Walkability score: 100% if time is 0, 0% if time is >= tolerance
    const score = Math.max(0, Math.min(100, ((tolerance - mins) / tolerance) * 100));
    return Math.round(score);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border bg-surface flex items-center px-6 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rotate-45" />
          </div>
          <h1 className="font-mono font-bold tracking-tighter text-lg text-text">BETWEEN_AI</h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-muted">
          {currentWeather && (
            <div className="flex items-center gap-4 px-3 py-1 border border-border bg-bg/50 rounded-sm">
              <div className="flex items-center gap-2">
                <Sun className="w-3 h-3 text-highlight" />
                <span className="text-text">{currentWeather.temp}°C</span>
              </div>
              <div className="flex items-center gap-2 border-l border-border pl-4">
                <CloudRain className={cn("w-3 h-3", currentWeather.rainProb > 30 ? "text-blue-400" : "text-muted")} />
                <span className={cn("text-text", currentWeather.rainProb > 30 ? "text-blue-400" : "text-muted")}>{currentWeather.rainProb}%</span>
                <span className="text-[8px] uppercase tracking-tighter">RAIN_PROB</span>
              </div>
              <span className="opacity-50">|</span>
              <span className="text-[10px] uppercase tracking-widest">{currentWeather.condition}</span>
            </div>
          )}
          <button 
            onClick={() => setShowSaved(!showSaved)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 border transition-colors",
              showSaved ? "bg-accent text-white border-accent" : "hover:bg-bg border-border text-text"
            )}
          >
            <History className="w-3 h-3" /> SAVED_FLOWS ({savedPlans.length})
          </button>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> SYSTEM_ACTIVE</span>
          <span>v1.0.4-BETA</span>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[400px_1fr] overflow-hidden">
        {/* Sidebar: Constraints or Saved Plans */}
        <aside className="border-r border-border bg-surface overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {showSaved ? (
              <motion.div 
                key="saved"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="technical-label text-highlight">Stored Sequences</h2>
                  <button onClick={() => setShowSaved(false)} className="text-[10px] font-mono hover:underline text-text">BACK_TO_INPUT</button>
                </div>
                
                {savedPlans.length === 0 ? (
                  <div className="p-8 border border-dashed border-border text-center">
                    <p className="text-xs text-muted font-mono">NO_SAVED_DATA_FOUND</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedPlans.map(p => (
                      <div 
                        key={p.id}
                        onClick={() => loadPlan(p.id)}
                        className="p-4 border border-border bg-bg hover:border-accent cursor-pointer group transition-all"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-sm truncate pr-4 text-text">{p.name}</div>
                          <button 
                            onClick={(e) => deletePlan(e, p.id)}
                            className="text-muted hover:text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[10px] font-mono text-muted flex justify-between">
                          <span className="text-accent">SCORE: {(p.overallScore * 100).toFixed(0)}%</span>
                          <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="input"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="technical-label mb-2 text-highlight">Input Parameters</h2>
                    <p className="text-sm text-muted">Define your operational constraints for the upcoming cycle.</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="technical-label flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-accent" /> Base Coordinates
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={constraints.collegeLocation}
                          onChange={e => setConstraints({...constraints, collegeLocation: e.target.value, userLat: undefined, userLng: undefined})}
                          className="flex-1 bg-bg border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors text-text"
                          placeholder="e.g. UC Berkeley"
                        />
                        <button
                          type="button"
                          onClick={handleUseLiveLocation}
                          disabled={locating}
                          className="px-3 border border-border hover:border-accent transition-colors flex items-center justify-center disabled:opacity-50"
                          title="Use my current location"
                        >
                          {locating ? <Loader2 className="w-4 h-4 animate-spin text-accent" /> : <Crosshair className="w-4 h-4 text-accent" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="technical-label flex items-center gap-2">
                          <Clock className="w-3 h-3 text-accent" /> Temporal Window
                        </label>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => setTemporalMode('range')}
                            className={cn("text-[8px] font-mono px-1.5 py-0.5 border", temporalMode === 'range' ? "bg-accent text-white border-accent" : "border-border text-muted")}
                          >
                            RANGE
                          </button>
                          <button 
                            type="button"
                            onClick={() => setTemporalMode('duration')}
                            className={cn("text-[8px] font-mono px-1.5 py-0.5 border", temporalMode === 'duration' ? "bg-accent text-white border-accent" : "border-border text-muted")}
                          >
                            DURATION
                          </button>
                        </div>
                      </div>
                      
                      {temporalMode === 'range' ? (
                        <input 
                          type="text" 
                          value={constraints.timeRange}
                          onChange={e => setConstraints({...constraints, timeRange: e.target.value})}
                          className="w-full bg-bg border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors text-text"
                          placeholder="09:00 - 17:00"
                        />
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <input 
                              type="number" 
                              value={constraints.timeDuration}
                              onChange={e => setConstraints({...constraints, timeDuration: Number(e.target.value)})}
                              className="w-full bg-bg border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors text-text"
                              placeholder="Duration"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-[10px] font-mono">MIN</span>
                          </div>
                          <div className="relative">
                            <input 
                              type="text" 
                              value={constraints.timeLimit}
                              onChange={e => setConstraints({...constraints, timeLimit: e.target.value})}
                              className="w-full bg-bg border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors text-text"
                              placeholder="End Limit"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-[10px] font-mono">LIMIT</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="technical-label flex items-center gap-2">
                          <IndianRupee className="w-3 h-3 text-accent" /> Budget Cap
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₹</span>
                          <input 
                            type="number" 
                            value={constraints.budget}
                            onChange={e => setConstraints({...constraints, budget: Number(e.target.value)})}
                            className="w-full bg-bg border border-border pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors text-text"
                          />
                        </div>
                      </div>
                      {isWalking && (
                        <div className="space-y-1.5">
                          <label className="technical-label flex items-center gap-2">
                            <Footprints className="w-3 h-3 text-accent" /> Walk Limit
                          </label>
                          <div className="relative">
                            <input 
                              type="number" 
                              value={constraints.walkingTolerance}
                              onChange={e => setConstraints({...constraints, walkingTolerance: Number(e.target.value)})}
                              className="w-full bg-bg border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors text-text"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-[10px] font-mono">MIN</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {isWalking && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="technical-label flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-accent" /> Walk Distance
                          </label>
                          <div className="relative">
                            <input 
                              type="number" 
                              step="0.1"
                              value={constraints.walkDistance}
                              onChange={e => setConstraints({...constraints, walkDistance: Number(e.target.value)})}
                              className="w-full bg-bg border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors text-text"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-[10px] font-mono">KM</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="technical-label flex items-center gap-2">
                            <Zap className="w-3 h-3 text-accent" /> Energy State
                          </label>
                          <div className="grid grid-cols-3 gap-1">
                            {(['low', 'medium', 'high'] as const).map(level => (
                              <button
                                key={level}
                                type="button"
                                onClick={() => setConstraints({...constraints, energyLevel: level})}
                                className={cn(
                                  "py-2 text-[8px] font-mono uppercase border transition-all",
                                  constraints.energyLevel === level 
                                    ? "bg-accent text-white border-accent shadow-[0_0_10px_rgba(255,106,0,0.3)]" 
                                    : "bg-bg text-muted border-border hover:border-highlight hover:text-highlight"
                                )}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="technical-label flex items-center gap-2">
                        <Car className="w-3 h-3 text-accent" /> Travel Mode
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'walking', label: 'Walk', icon: Footprints },
                          { id: 'two-wheeler', label: '2-Wheel', icon: Bike },
                          { id: 'four-wheeler', label: '4-Wheel', icon: Car }
                        ].map(mode => (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => setConstraints({...constraints, travelMode: mode.id as any})}
                            className={cn(
                              "py-2 flex flex-col items-center gap-1 text-[10px] font-mono uppercase border transition-all",
                              constraints.travelMode === mode.id 
                                ? "bg-accent text-white border-accent shadow-[0_0_10px_rgba(255,106,0,0.3)]" 
                                : "bg-bg text-muted border-border hover:border-highlight hover:text-highlight"
                            )}
                          >
                            <mode.icon className="w-3 h-3" />
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="technical-label flex items-center gap-2">
                        <Home className="w-4 h-4 text-muted" />
                        <span className="text-xs font-medium text-text">Indoor Preference</span>
                      </label>
                      <div className="flex items-center justify-between p-3 bg-bg border border-border">
                        <span className="text-xs text-muted">Prioritize indoor routes</span>
                        <button
                          type="button"
                          onClick={() => setConstraints({...constraints, indoorPreference: !constraints.indoorPreference})}
                          className={cn(
                            "w-10 h-5 rounded-full transition-colors relative",
                            constraints.indoorPreference ? "bg-accent" : "bg-border"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                            constraints.indoorPreference ? "left-6" : "left-1"
                          )} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="technical-label flex items-center gap-2">
                        <Accessibility className="w-3 h-3 text-accent" /> Accessibility Needs
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['Wheelchair', 'No Stairs', 'Visual Aid', 'Quiet Zones'].map(need => (
                          <button
                            key={need}
                            type="button"
                            onClick={() => {
                              const newNeeds = constraints.accessibilityNeeds.includes(need)
                                ? constraints.accessibilityNeeds.filter(n => n !== need)
                                : [...constraints.accessibilityNeeds, need];
                              setConstraints({...constraints, accessibilityNeeds: newNeeds});
                            }}
                            className={cn(
                              "px-3 py-1.5 text-[10px] font-mono border transition-all",
                              constraints.accessibilityNeeds.includes(need)
                                ? "bg-accent text-white border-accent"
                                : "bg-bg text-muted border-border hover:border-highlight hover:text-highlight"
                            )}
                          >
                            {need}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button 
                    disabled={loading}
                    className="w-full bg-accent text-white py-4 font-mono text-sm tracking-widest hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_4px_14px_0_rgba(255,106,0,0.39)]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        PROCESSING_REQUEST
                      </>
                    ) : (
                      <>
                        GENERATE_FLOW
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

        {/* Main Content: Output */}
        <section className="bg-bg overflow-y-auto relative">
          <AnimatePresence mode="wait">
            {!plan && !loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center p-12 text-center"
              >
                <div className="w-16 h-16 border border-border flex items-center justify-center mb-6">
                  <Info className="w-6 h-6 text-muted" />
                </div>
                <h3 className="text-xl font-medium mb-2">No Active Flow</h3>
                <p className="text-muted max-w-md text-sm">
                  Initialize system parameters in the sidebar to generate a constraint-optimized campus micro-itinerary.
                </p>
              </motion.div>
            )}

            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center p-12"
              >
                <div className="w-full max-w-md space-y-8">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-mono text-muted">
                      <span>ANALYZING_CONSTRAINTS</span>
                      <span>84%</span>
                    </div>
                    <div className="h-1 bg-border overflow-hidden">
                      <motion.div 
                        className="h-full bg-black"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-20 border border-border bg-white animate-pulse" />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {plan && !loading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 max-w-5xl mx-auto space-y-8"
              >
                {/* Summary Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-muted uppercase tracking-widest">
                      <Calendar className="w-3 h-3" /> Operational Plan Output
                    </div>
                    <div className="flex items-center gap-4">
                      <h2 className="text-3xl font-bold tracking-tight text-text">{plan.name || "Daily Operational Plan"}</h2>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleSave}
                          className="p-2 border border-border hover:border-accent transition-colors rounded-full text-text"
                          title="Save Flow"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-muted text-sm max-w-xl">{plan.summary}</p>

                    {plan.missingParameters && plan.missingParameters.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mt-4 p-4 bg-amber-900/20 border border-amber-500/50 rounded-sm flex items-start gap-3"
                      >
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-bold text-amber-400 uppercase tracking-wider">System Alert: Missing Parameters</div>
                          <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                            The AI requires additional context for a more definitive plan. Please provide: 
                            <span className="font-bold text-amber-400 ml-1">
                              {plan.missingParameters.join(', ')}
                            </span>
                          </p>
                        </div>
                      </motion.div>
                    )}
                    
                    <div className="flex flex-wrap gap-4 mt-4">
                      {plan.weather && (
                        <div className="flex items-center gap-3 p-3 bg-surface border border-border rounded-sm w-fit">
                          <div className="p-2 bg-bg rounded-full">
                            <Cloud className="w-4 h-4 text-highlight" />
                          </div>
                          <div>
                            <div className="technical-label">Current Conditions</div>
                            <div className="text-sm font-medium text-text">
                              {typeof plan.weather === 'string' ? plan.weather : 
                               plan.weather ? `${(plan.weather as any).current_temp || ''} ${(plan.weather as any).condition || ''}` : 'N/A'}
                            </div>
                          </div>
                        </div>
                      )}

                      {plan.rainProbability !== undefined && (
                        <div className="flex items-center gap-3 p-3 bg-surface border border-border rounded-sm w-fit">
                          <div className="p-2 bg-bg rounded-full">
                            <CloudRain className={cn("w-4 h-4", plan.rainProbability > 30 ? "text-blue-400" : "text-muted")} />
                          </div>
                          <div>
                            <div className="technical-label">Rain Probability</div>
                            <div className="text-sm font-medium text-text">
                              {plan.rainProbability}%
                            </div>
                          </div>
                        </div>
                      )}

                      {plan.forecast && (
                        <div className="flex gap-2">
                          {plan.forecast.map((day, i) => (
                            <div key={i} className="flex flex-col items-center p-2 bg-surface border border-border rounded-sm min-w-[80px]">
                              <span className="text-[9px] font-mono text-muted uppercase">{day.date}</span>
                              {day.icon === 'sun' ? <Sun className="w-4 h-4 text-highlight my-1" /> :
                               day.icon === 'rain' ? <CloudRain className="w-4 h-4 text-blue-400 my-1" /> :
                               day.icon === 'wind' ? <Wind className="w-4 h-4 text-zinc-400 my-1" /> :
                               <Cloud className="w-4 h-4 text-muted my-1" />}
                              <span className="text-xs font-bold text-text">{day.temp}</span>
                              <span className="text-[8px] text-muted text-center leading-tight">{day.condition}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="technical-label">Efficiency Score</div>
                      <div className="text-3xl font-mono font-bold text-accent">{(plan.overallScore * 100).toFixed(0)}%</div>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent animate-spin" />
                  </div>
                </div>

                {/* Map Visualization */}
                <motion.div 
                  id="map-view"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="overflow-hidden rounded-sm border border-border bg-surface"
                >
                  <div className="px-4 py-2 border-b border-border bg-bg flex items-center justify-between">
                    <div className="technical-label flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-accent" /> Spatial_Flow_Visualization
                    </div>
                    <div className="text-[9px] font-mono text-muted">LAYER: OSM_STANDARD</div>
                  </div>
                  <FlowMap 
                    items={plan.items || []} 
                    userLat={constraints.userLat} 
                    userLng={constraints.userLng} 
                  />
                </motion.div>

                {/* Itinerary Grid */}
                <div className="space-y-4">
                  {plan.items?.map((item, idx) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4"
                    >
                      <div className="pt-4">
                        <div className="text-sm font-mono font-bold text-text">{item.time}</div>
                        <div className="text-[10px] font-mono text-muted uppercase">{item.duration}</div>
                      </div>
                      
                      <div className="bg-surface border border-border p-6 group-hover:border-accent transition-colors relative overflow-hidden">
                        {/* Type Indicator */}
                        <div className={cn(
                          "absolute top-0 right-0 px-3 py-1 text-[9px] font-mono uppercase tracking-tighter",
                          item.type === 'class' ? "bg-blue-900/30 text-blue-400" :
                          item.type === 'meal' ? "bg-orange-900/30 text-orange-400" :
                          item.type === 'transit' ? "bg-zinc-800 text-zinc-400" :
                          "bg-emerald-900/30 text-emerald-400"
                        )}>
                          {item.type}
                        </div>

                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Walkability Gauge - Prominent */}
                          {calculateWalkability(item) !== null && (
                            <div className="flex flex-col items-center justify-center p-4 bg-bg border border-border rounded-sm min-w-[120px]">
                              <div className="relative w-16 h-16">
                                <svg className="w-full h-full transform -rotate-90">
                                  <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    className="text-border"
                                  />
                                  <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    strokeDasharray={2 * Math.PI * 28}
                                    strokeDashoffset={2 * Math.PI * 28 * (1 - calculateWalkability(item)! / 100)}
                                    className={cn(
                                      "transition-all duration-1000",
                                      calculateWalkability(item)! > 70 ? "text-emerald-500" :
                                      calculateWalkability(item)! > 40 ? "text-amber-500" : "text-secondary"
                                    )}
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold">
                                  {calculateWalkability(item)}%
                                </div>
                              </div>
                              <span className="technical-label mt-2">Walkability</span>
                              <span className={cn(
                                "text-[8px] font-mono uppercase mt-1",
                                calculateWalkability(item)! > 70 ? "text-emerald-400" :
                                calculateWalkability(item)! > 40 ? "text-amber-400" : "text-secondary"
                              )}>
                                {calculateWalkability(item)! > 70 ? "Optimal" :
                                 calculateWalkability(item)! > 40 ? "Moderate" : "Low"}
                              </span>
                            </div>
                          )}

                          <div className="flex-1 space-y-3">
                            <div>
                              <h4 className="text-lg font-bold flex items-center gap-2 text-text">
                                {item.activity}
                              </h4>
                              <div className="flex items-center gap-1.5 text-xs text-muted mt-1">
                                <MapPin className="w-3 h-3 text-secondary" /> {item.location}
                                {(item.distance || item.travelTime) && (
                                  <span className="flex items-center gap-2 ml-2 border-l border-border pl-2">
                                    {item.distance && <span className="text-[10px] font-mono">DIST: {item.distance}</span>}
                                    {item.travelTime && <span className="text-[10px] font-mono">TIME: {item.travelTime}</span>}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-sm text-muted leading-relaxed">
                              <Markdown>{item.reasoning}</Markdown>
                            </div>
                          </div>

                          <div className="md:w-64 space-y-3 pt-2">
                            <div className="technical-label">Constraint Validation</div>
                            <div className="space-y-2">
                              {item.constraints.map((c, i) => (
                                <div key={i} className="flex items-start gap-2 text-[11px]">
                                  {c.status === 'met' ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                  ) : c.status === 'warning' ? (
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5 text-secondary mt-0.5 shrink-0" />
                                  )}
                                  <div className="flex flex-col">
                                    <span className={cn(
                                      "font-bold uppercase text-[9px] tracking-tighter",
                                      c.status === 'met' ? "text-emerald-400" :
                                      c.status === 'warning' ? "text-amber-400" :
                                      "text-secondary"
                                    )}>
                                      {c.label}
                                    </span>
                                    <span className="text-muted leading-tight">{c.detail}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Footer Action */}
                <div className="pt-12 flex justify-center">
                  <button className="flex items-center gap-2 text-xs font-mono text-muted hover:text-accent transition-colors group">
                    EXPORT_SYSTEM_LOG <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Footer Status Bar */}
      <footer className="h-8 border-t border-border bg-surface px-6 flex items-center justify-between text-[10px] font-mono text-muted">
        <div className="flex gap-6">
          <span>LAT: 12.9250° N</span>
          <span>LNG: 77.5650° E</span>
          <button 
            onClick={scrollToMap}
            title="View location on map"
            className="hover:text-accent transition-colors cursor-pointer uppercase flex items-center gap-1"
          >
            <MapPin className="w-2 h-2" /> LOC: {constraints.collegeLocation}
          </button>
        </div>
        <div className="flex gap-4">
          <span>MEM: 12.4GB/16GB</span>
          <span>CPU: 14%</span>
        </div>
      </footer>
    </div>
  );
}
