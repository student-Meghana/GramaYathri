import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bus, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  ArrowLeft, 
  User, 
  CheckCircle2, 
  Megaphone,
  Navigation,
  Info
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from './lib/firebase';
import { 
  STATIC_ROUTES, 
  AVG_TIME_PER_STOP, 
  COLORS 
} from './constants';
import { 
  createPing, 
  createAlert, 
  subscribeToPings, 
  subscribeToAlerts,
  updateProfile,
  subscribeToRoutes,
  createRoute
} from './services/busService';
import { Route, Ping, Alert } from './types';
import { cn } from './lib/utils';
import { formatDistanceToNow } from 'date-fns';

// --- Components ---

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#00897B] flex flex-col items-center justify-center text-white"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 shadow-2xl">
          <Bus size={48} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Grama-Yatri</h1>
        <p className="mt-2 text-white/80 font-medium">Community Rural Mobility</p>
      </motion.div>
      <div className="absolute bottom-12 flex flex-col items-center opacity-40">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mb-2" />
        <p className="text-[10px] uppercase font-bold tracking-[0.2em]">Live Tracking</p>
      </div>
    </motion.div>
  );
};

const RouteCard: React.FC<{ route: Route; onClick: () => void | Promise<void> }> = ({ route, onClick }) => {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full bg-white p-6 rounded-[2rem] shadow-sm border border-black/[0.03] flex items-center justify-between mb-4 group hover:shadow-md transition-all text-left"
    >
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 bg-[#00897B]/5 rounded-2xl flex items-center justify-center group-hover:bg-[#00897B] group-hover:text-white transition-all">
          <Navigation size={26} className="text-[#00897B] group-hover:text-white transition-colors" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-lg leading-tight">{route.name}</h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1.5">{route.stops.length} Stops • Active</p>
        </div>
      </div>
      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-[#00897B] group-hover:bg-blue-50 transition-all">
        <ChevronRight size={20} />
      </div>
    </motion.button>
  );
};

const StopItem: React.FC<{ 
  stop: string; 
  index: number; 
  isLast: boolean;
  lastPing?: Ping;
  currentEta?: string | null;
  onPing: () => void | Promise<void>;
  isSelected?: boolean;
}> = ({ 
  stop, 
  index, 
  isLast, 
  lastPing, 
  currentEta,
  onPing,
  isSelected
}) => {
  const isBusHere = lastPing?.stopName === stop;
  const isPassed = currentEta === 'Passed';
  
  return (
    <div className="flex gap-6 min-h-[120px] relative">
      {!isLast && (
        <div className="absolute left-[11px] top-[32px] bottom-0 w-[2px] bg-gray-100/80" />
      )}
      <div className="flex flex-col items-center z-10">
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center border-4 shadow-sm transition-all duration-500",
          isBusHere ? "bg-[#43A047] border-white scale-125" : 
          isPassed ? "bg-gray-100 border-gray-200" :
          "bg-white border-gray-200"
        )}>
          {isBusHere && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
        </div>
      </div>
      <div className="flex-1 pb-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h4 className={cn(
              "font-bold text-base tracking-tight",
              isBusHere ? "text-[#141414]" : 
              isPassed ? "text-gray-300" :
              "text-gray-400"
            )}>{stop}</h4>
            
            {isBusHere ? (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mt-1.5"
              >
                <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-[#43A047]/10 rounded-full">
                  <div className="w-1.5 h-1.5 bg-[#43A047] rounded-full animate-pulse" />
                  <span className="text-[9px] font-bold text-[#43A047] uppercase tracking-widest">
                    Bus is here
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-medium">{lastPing.timestamp?.seconds ? formatDistanceToNow(lastPing.timestamp.toDate(), { addSuffix: true }) : 'Just now'}</p>
                {lastPing.userName && (
                  <p className="text-[9px] text-gray-300 uppercase font-black tracking-tighter mt-1">By {lastPing.userName}</p>
                )}
              </motion.div>
            ) : currentEta && !isPassed ? (
              <div className="mt-1.5">
                <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-[#00897B]/5 rounded-full">
                  <Clock size={10} className="text-[#00897B]" />
                  <span className="text-[9px] font-bold text-[#00897B] uppercase tracking-widest">
                    {currentEta}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-1.5 opacity-40">
                <div className="w-1 h-1 bg-gray-300 rounded-full" />
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">
                  {isPassed ? 'Bus already passed' : 'Stationary Stop'}
                </p>
              </div>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onPing}
            className={cn(
              "shrink-0 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border shadow-sm",
              isBusHere
                ? "bg-gray-50 text-gray-200 border-gray-100 cursor-not-allowed shadow-none" 
                : "bg-white text-[#00897B] border-blue-50 hover:border-blue-200 hover:bg-blue-50/30"
            )}
            disabled={isBusHere}
          >
            I'm Here
          </motion.button>
        </div>
      </div>
    </div>
  );
};

const AuthScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onComplete();
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError("Invalid email or password. If you don't have an account, please Sign Up first.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F5F5F5] flex items-center justify-center p-6 text-[#141414]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[3rem] p-10 md:p-12 shadow-xl border border-black/[0.03]"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#00897B] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-teal-100">
            <Bus size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-[#141414] tracking-tighter">GramaYathri</h2>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-black/[0.03] rounded-2xl p-4 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00897B]/20 focus:border-[#00897B] transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-black/[0.03] rounded-2xl p-4 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00897B]/20 focus:border-[#00897B] transition-all"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 font-bold text-center mt-2">{error}</p>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-[#00897B] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-teal-100 active:scale-95 transition-all disabled:opacity-50 mt-4"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="w-full text-center mt-6 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#00897B] transition-colors"
        >
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
        </button>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('yatri_name') || 'Guest');
  const [pings, setPings] = useState<Ping[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isAlerting, setIsAlerting] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isAddingRoute, setIsAddingRoute] = useState(false);
  const [newRouteName, setNewRouteName] = useState('');
  const [newRouteStops, setNewRouteStops] = useState('');

  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubRoutes = subscribeToRoutes((fetchedRoutes) => {
      if (fetchedRoutes.length === 0) {
        // Pre-populate if empty
        STATIC_ROUTES.forEach(r => createRoute(r.name, r.stops));
      } else {
        setRoutes(fetchedRoutes);
      }
    });

    return () => unsubRoutes();
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });

    let unsubPings: (() => void) | undefined;
    let unsubAlerts: (() => void) | undefined;

    if (selectedRoute) {
      unsubPings = subscribeToPings(selectedRoute.id, setPings);
      unsubAlerts = subscribeToAlerts(selectedRoute.id, setAlerts);
    } else {
      setPings([]);
      setAlerts([]);
    }

    return () => {
      unsubAuth();
      if (unsubPings) unsubPings();
      if (unsubAlerts) unsubAlerts();
    };
  }, [selectedRoute]);

  const lastPing = useMemo(() => {
    if (pings.length === 0) return undefined;
    const latest = pings[0];
    if (!latest.timestamp) return latest; // Just created pings might not have timestamp yet
    
    // Only consider pings from last 2 hours
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    if (latest.timestamp.toMillis() < twoHoursAgo) return undefined;
    
    return latest;
  }, [pings]);

  const eta = useMemo(() => {
    if (!lastPing || !selectedRoute) return null;
    const lastStopIndex = selectedRoute.stops.indexOf(lastPing.stopName);
    if (lastStopIndex === -1) return null;

    return selectedRoute.stops.map((stop, index) => {
      // Logic: If it's the exact stop, it's 'here'.
      // If it's before the last reported stop, it's 'passed'.
      // If it's after, calculate mins.
      if (index === lastStopIndex) return 'Bus is here';
      if (index < lastStopIndex) return 'Passed';
      const stopsAway = index - lastStopIndex;
      const minutesRemaining = stopsAway * AVG_TIME_PER_STOP;
      return `${minutesRemaining} mins away`;
    });
  }, [lastPing, selectedRoute]);

  const handlePing = async (stopName: string, index: number) => {
    if (!selectedRoute) return;
    await createPing(selectedRoute.id, index.toString(), stopName, userName);
  };

  const handleReportAlert = async (type: Alert['type'], message: string) => {
    if (!selectedRoute) return;
    await createAlert(selectedRoute.id, type, message, userName);
    setIsAlerting(false);
  };

  const handleUpdateName = (name: string) => {
    const cleanName = name.slice(0, 20);
    setUserName(cleanName);
    localStorage.setItem('yatri_name', cleanName);
    if (auth.currentUser) updateProfile(auth.currentUser.uid, cleanName);
  };

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    const stops = newRouteStops.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (!newRouteName || stops.length < 2) {
      alert("Please provide a name and at least 2 stops.");
      return;
    }
    await createRoute(newRouteName, stops);
    setIsAddingRoute(false);
    setNewRouteName('');
    setNewRouteStops('');
  };

  const filteredRoutes = routes.filter(route => 
    route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.stops.some(stop => stop.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-[#141414] overflow-x-hidden selection:bg-blue-100">
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      {authError && (
        <div className="bg-red-600 text-white px-6 py-3 text-sm font-bold text-center z-50 sticky top-0">
          ⚠️ {authError}
        </div>
      )}

      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-black/[0.03] px-6 py-6 sticky top-0 z-40 flex items-center justify-between">
        {selectedRoute ? (
          <button 
            onClick={() => setSelectedRoute(null)}
            className="group flex items-center gap-3 text-[#00897B] font-black uppercase text-[10px] tracking-widest"
          >
            <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
              <ArrowLeft size={16} />
            </div>
            Back to Routes
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00897B] rounded-xl flex items-center justify-center shadow-lg shadow-teal-200">
              <Bus size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-black text-[#141414] tracking-tighter">GramaYathri</h1>
          </div>
        )}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              const name = prompt("Enter your name:", userName);
              if (name) handleUpdateName(name);
            }}
            className="w-10 h-10 bg-gray-50 border border-black/[0.03] rounded-xl text-gray-500 hover:text-[#00897B] hover:bg-white transition-all flex items-center justify-center"
            title="Profile"
          >
            <User size={18} />
          </button>
          {user && (
            <button 
              onClick={() => signOut(auth)}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors"
            >
              Sign Out
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-6 py-8">
        {!user ? (
          !authLoading && <AuthScreen onComplete={() => {}} />
        ) : !selectedRoute ? (
          <div className="max-w-2xl mx-auto">
            <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-5xl font-black text-[#141414] mb-3 tracking-tighter leading-none">Your Mobility,<br/>Simplified.</h2>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Select a route or add your own</p>
              </div>
              <button 
                onClick={() => setIsAddingRoute(true)}
                className="bg-[#00897B] text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.15em] shadow-lg shadow-teal-100 hover:scale-105 transition-transform"
              >
                + Add New Route
              </button>
            </div>

            {/* Search Bar */}
            <div className="mb-8 relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-300 group-focus-within:text-[#00897B] transition-colors">
                <Bus size={20} />
              </div>
              <input 
                type="text"
                placeholder="Search village, city, or route name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-black/[0.03] rounded-[2rem] py-5 pl-16 pr-6 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00897B]/20 focus:border-[#00897B] transition-all font-bold text-gray-900 placeholder:text-gray-300"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
              {filteredRoutes.length > 0 ? (
                filteredRoutes.map(route => (
                  <RouteCard 
                    key={route.id} 
                    route={route} 
                    onClick={() => setSelectedRoute(route)} 
                  />
                ))
              ) : (
                <div className="py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No routes found for "{searchQuery}"</p>
                </div>
              )}
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 p-8 bg-white rounded-[2.5rem] border border-black/[0.03] shadow-sm flex flex-col md:flex-row gap-6 items-center md:items-start"
            >
              <div className="bg-teal-50 p-4 rounded-2xl shrink-0">
                <Info size={32} className="text-[#00897B]" />
              </div>
              <div className="text-center md:text-left">
                <h4 className="font-black text-[#141414] uppercase tracking-widest text-xs mb-2">The Ping Mechanism</h4>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Grama-Yatri relies on community reports. When you're at a stop or on the bus, use the <strong>"I'm Here"</strong> or <strong>"I'm on this bus"</strong> button. This updates the ETA for everyone else instantly using simple math, not heavy GPS.
                </p>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            {/* Minimal Header Panel */}
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white border-b border-gray-100 flex flex-wrap items-center justify-between p-8 rounded-t-[3rem] border-t border-x mb-0 shadow-sm gap-6"
            >
               <div className="flex gap-8 md:gap-12">
                 <div className="flex flex-col">
                   <span className="text-[10px] uppercase font-bold text-gray-300 tracking-widest mb-1.5 ">Bus Route</span>
                   <span className="text-sm md:text-xl font-black text-[#141414] leading-tight tracking-tight">{selectedRoute.name}</span>
                 </div>
                 <div className="w-px h-10 bg-gray-100 hidden sm:block" />
                 <div className="flex flex-col">
                   <span className="text-[10px] uppercase font-bold text-gray-300 tracking-widest mb-1.5">Live Status</span>
                   <span className="text-base md:text-xl font-bold text-[#43A047] flex items-center gap-2">
                     <div className="w-2 h-2 bg-[#43A047] rounded-full animate-ping" />
                     ON TIME
                   </span>
                 </div>
               </div>
               <button 
                onClick={() => setIsAlerting(true)}
                className="px-6 py-3 bg-white border border-[#E53935] text-[#E53935] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#E53935] hover:text-white transition-all transform active:scale-95"
              >
                Report Problem
              </button>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-x border-b rounded-b-[3rem] overflow-hidden bg-white shadow-sm mb-12">
              {/* ETA Display Card */}
              <div className="p-10 md:p-16 border-r border-gray-50 flex flex-col items-center justify-center text-center bg-white order-2 lg:order-1 relative">
                <div className="absolute top-0 left-0 w-full p-10 opacity-[0.02] pointer-events-none">
                  <Clock size={300} />
                </div>
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-6 relative z-10">Next Stop Arrival</span>
                <div className="flex items-baseline mb-3 relative z-10">
                  <span className="text-9xl md:text-[11rem] font-black tracking-tighter text-[#141414] font-mono leading-none">
                    {eta && eta.find(e => e !== 'Passed')?.split(' ')[0] || '--'}
                  </span>
                  <span className="text-2xl md:text-3xl font-black ml-2 text-gray-300 uppercase tracking-tighter">MINS</span>
                </div>
                <p className="text-gray-400 max-w-[240px] text-xs font-bold uppercase tracking-widest relative z-10 leading-relaxed">
                  Estimated to <span className="text-[#141414]">
                    {selectedRoute.stops.find((_, i) => eta && eta[i] !== 'Passed') || 'Terminal Stop'}
                  </span>
                </p>
                <div className="mt-12 h-1.5 w-20 bg-[#00897B] rounded-full relative z-10" />
              </div>

              {/* Timeline Section */}
              <div className="p-10 md:p-14 bg-[#FBFBFC] order-1 lg:order-2 border-b lg:border-b-0">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <MapPin size={12} className="text-[#00897B]" />
                    Live Progression
                  </h3>
                  <div className="text-[9px] font-black text-teal-500 uppercase tracking-widest bg-teal-50 px-2 py-1 rounded-md">
                    Synced Live
                  </div>
                </div>
                <div className="max-h-[500px] overflow-y-auto no-scrollbar pr-3 pb-8">
                  {selectedRoute.stops.map((stop, idx) => (
                    <StopItem 
                      key={stop}
                      stop={stop}
                      index={idx}
                      isLast={idx === selectedRoute.stops.length - 1}
                      lastPing={lastPing}
                      currentEta={eta ? eta[idx] : null}
                      onPing={() => handlePing(stop, idx)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Interactions / Community Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start mb-20 px-2">
              <div className="space-y-8">
                {/* Massive Reporting Button */}
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const lastIdx = lastPing ? selectedRoute.stops.indexOf(lastPing.stopName) : -1;
                    const nextIdx = Math.min(lastIdx + 1, selectedRoute.stops.length - 1);
                    handlePing(selectedRoute.stops[nextIdx], nextIdx);
                  }}
                  className="w-full bg-[#141414] p-10 md:p-12 rounded-[3.5rem] flex items-center gap-8 shadow-2xl shadow-black/10 text-white text-left group transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-10 opacity-10 scale-150 rotate-12">
                     <Bus size={120} />
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-all shadow-inner">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="relative z-10">
                    <span className="block text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none mb-2">I'm on this bus</span>
                    <span className="block text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Update location for everyone else</span>
                  </div>
                </motion.button>

                <div className="bg-[#00897B] p-10 rounded-[3rem] text-white shadow-xl shadow-teal-900/10">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-60">Community Help</h3>
                  <p className="text-xl font-bold tracking-tight mb-6">Can't see the bus? Click "I'm Here" at your stop so others know you're waiting.</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <Megaphone size={14} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Help your fellow travelers</span>
                  </div>
                </div>
              </div>

              {/* Alerts / Feed Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-[10px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-2">
                    <Megaphone size={12} />
                    Community Pulse
                  </h2>
                  <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Recent Feed</span>
                </div>
                <div className="space-y-4">
                  {alerts.length > 0 ? (
                    alerts.map(alert => (
                      <motion.div 
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        key={alert.id} 
                        className={cn(
                          "border rounded-3xl p-6 transition-all shadow-sm flex gap-4",
                          alert.type === 'delayed' ? "bg-[#FFF9EA] border-[#FBE3B2] text-[#855D10]" : "bg-[#FFF5F5] border-[#FED7D7] text-[#C53030]"
                        )}
                      >
                        <AlertTriangle size={24} className="shrink-0 opacity-40 mt-1" />
                        <div>
                          <p className="text-sm font-bold leading-relaxed mb-3">"{alert.message}"</p>
                          <div className="flex items-center justify-between pt-4 border-t border-black/5">
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-60 underline decoration-2 decoration-current underline-offset-4">{alert.userName} • Traveler</span>
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{alert.timestamp?.seconds ? formatDistanceToNow(alert.timestamp.toDate(), { addSuffix: true }) : 'Just now'}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="bg-white border border-black/[0.03] rounded-[3.5rem] p-12 text-center flex flex-col items-center justify-center shadow-sm h-full min-h-[220px]">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-5">
                        <CheckCircle2 size={24} className="text-gray-100" />
                      </div>
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2">Service is flawless</p>
                      <p className="text-xs text-gray-400 font-bold max-w-[200px] leading-relaxed uppercase tracking-widest opacity-60">No active alerts reported for this route.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Alert Modal */}
      <AnimatePresence>
        {isAlerting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#141414]/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-10 md:p-12 shadow-2xl"
            >
              <div className="w-12 h-1 bg-gray-100 rounded-full mx-auto mb-10 sm:hidden" />
              <h2 className="text-3xl font-black text-[#141414] mb-3 tracking-tighter">Report Issue</h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-8">Inform others about delays or cancellations</p>
              
              <div className="space-y-4 mb-8">
                <button 
                  onClick={() => handleReportAlert('delayed', 'Bus is running late')}
                  className="w-full p-6 rounded-2xl bg-[#FFF9EA] border border-[#FBE3B2] text-[#855D10] text-left hover:scale-[1.02] transition-transform"
                >
                  <p className="text-xs font-black uppercase tracking-widest mb-1">Delayed</p>
                  <p className="text-sm font-bold opacity-70">"The bus is running behind schedule"</p>
                </button>
                <button 
                  onClick={() => handleReportAlert('cancelled', 'Bus service cancelled')}
                  className="w-full p-6 rounded-2xl bg-[#FFF5F5] border border-[#FED7D7] text-[#C53030] text-left hover:scale-[1.02] transition-transform"
                >
                  <p className="text-xs font-black uppercase tracking-widest mb-1">Cancelled</p>
                  <p className="text-sm font-bold opacity-70">"Trip has been cancelled for today"</p>
                </button>
              </div>
              
              <button 
                onClick={() => setIsAlerting(false)}
                className="w-full py-5 text-gray-300 font-black uppercase tracking-[0.2em] text-[10px] hover:text-[#141414] transition-colors border border-dashed border-gray-100 rounded-2xl"
              >
                Go Back
              </button>
            </motion.div>
          </motion.div>
        )}

        {isAddingRoute && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#141414]/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-10 md:p-12 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.1)]"
            >
              <div className="w-12 h-1 bg-gray-100 rounded-full mx-auto mb-10 sm:hidden" />
              <h2 className="text-3xl font-black text-[#141414] mb-3 tracking-tighter">Create New Route</h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-8">Add a location or path to track</p>
              
              <form onSubmit={handleCreateRoute} className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Route Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Village A to Bus Stand"
                    value={newRouteName}
                    onChange={(e) => setNewRouteName(e.target.value)}
                    className="w-full bg-gray-50 border border-black/[0.03] rounded-2xl p-5 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00897B]/20 focus:border-[#00897B] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Stops (Comma Separated)</label>
                  <textarea 
                    placeholder="Village A, Market, Temple, City Center"
                    value={newRouteStops}
                    onChange={(e) => setNewRouteStops(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-50 border border-black/[0.03] rounded-2xl p-5 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00897B]/20 focus:border-[#00897B] transition-all resize-none"
                  />
                  <p className="text-[9px] text-gray-400 font-medium mt-2 leading-relaxed">
                    Separate each stop name with a comma. List them in order of the bus path.
                  </p>
                </div>
                
                <div className="pt-4 flex flex-col gap-3">
                  <button 
                    type="submit"
                    className="w-full py-5 bg-[#00897B] text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-teal-100 active:scale-95 transition-all"
                  >
                    Confirm & Add Route
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsAddingRoute(false)}
                    className="w-full py-5 text-gray-300 font-black uppercase tracking-[0.2em] text-[10px] hover:text-[#00897B] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert Modal */}
      <AnimatePresence>
        {isAlerting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#141414]/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-10 md:p-12 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.1)]"
            >
              <div className="w-12 h-1 bg-gray-100 rounded-full mx-auto mb-10 sm:hidden" />
              <h2 className="text-3xl font-black text-[#141414] mb-3 tracking-tighter">Report Service Issue</h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-10">Select an alert type to notify others</p>
              
              <div className="space-y-4">
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleReportAlert('delayed', 'Bus is running about 15-20 mins late.')}
                  className="w-full p-6 bg-[#FFF9EA] rounded-3xl border border-[#FBE3B2] text-left group flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-black text-[#855D10] text-lg leading-none uppercase tracking-tighter">Bus Delayed</h4>
                    <p className="text-xs text-[#855D10]/60 mt-1 font-bold">Stall / Heavy Traffic</p>
                  </div>
                  <ChevronRight size={20} className="text-[#855D10]/30 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleReportAlert('cancelled', 'The bus for this timing has been cancelled.')}
                  className="w-full p-6 bg-[#FFF5F5] rounded-3xl border border-[#FED7D7] text-left group flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-black text-[#C53030] text-lg leading-none uppercase tracking-tighter">Bus Cancelled</h4>
                    <p className="text-xs text-[#C53030]/60 mt-1 font-bold">Service Disrupted</p>
                  </div>
                  <ChevronRight size={20} className="text-[#C53030]/30 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                
                <button 
                  onClick={() => setIsAlerting(false)}
                  className="w-full py-6 text-gray-300 font-black uppercase tracking-[0.2em] text-[10px] mt-4 hover:text-[#1976D2] transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
