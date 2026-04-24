import { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useNavigate, 
  useLocation 
} from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut,
  doc,
  getDocFromServer,
  setDoc,
  serverTimestamp,
  handleFirestoreError,
  OperationType
} from './lib/firebase';
import { UserProfile, Song } from './types';
import { 
  Home, 
  Search, 
  Music, 
  User, 
  PlusCircle, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Volume2, 
  Heart, 
  ThumbsDown,
  ChevronRight,
  Menu,
  X,
  Mic2,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { cn } from './lib/utils';

// --- Contexts ---
interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  setCurrentSong: (song: Song | null) => void;
  togglePlay: () => void;
  playlist: Song[];
  setPlaylist: (songs: Song[]) => void;
  volume: number;
  setVolume: (v: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
};

// --- Components ---

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const links = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Search', path: '/search', icon: Search },
    { name: 'Your Library', path: '/library', icon: Music },
  ];

  const topics = [
    { name: 'Astrophysics', icon: '🔬' },
    { name: 'Genetics', icon: '🧬' },
    { name: 'Calculus', icon: '🧮' },
  ];

  return (
    <aside className="w-[220px] bg-black border-r border-[#2D3139] flex flex-col h-full overflow-y-auto hidden md:flex shrink-0">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2 text-[#4CC9F0] font-extrabold text-xl tracking-tighter">
          <span>⚛️</span> ScienceStream
        </Link>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1">
        {links.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-[14px] font-semibold",
              location.pathname === link.path 
                ? "text-[#4CC9F0]" 
                : "text-[#B0B3B8] hover:text-white"
            )}
          >
            <link.icon className={cn("w-4 h-4", location.pathname === link.path ? "text-[#4CC9F0]" : "group-hover:scale-110 transition-transform")} />
            {link.name}
          </Link>
        ))}

        <div className="pt-6 pb-2 px-3 text-[11px] font-bold uppercase text-[#B0B3B8] tracking-widest">Your Topics</div>
        {topics.map((topic) => (
          <div key={topic.name} className="flex items-center gap-3 px-3 py-2 text-[14px] font-semibold text-[#B0B3B8] hover:text-white cursor-pointer group">
            <span className="text-lg">{topic.icon}</span>
            {topic.name}
          </div>
        ))}
        
        <Link 
          to="/publish"
          className="flex items-center justify-center gap-2 mt-6 w-full bg-[#4CC9F0] text-black font-bold py-2.5 px-4 rounded-md transition-all hover:opacity-90 active:scale-95 text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Create Song
        </Link>
      </nav>

      <div className="p-6 border-t border-[#2D3139] mt-auto">
        {user ? (
          <div className="flex items-center gap-3">
            {user.photoURL && user.photoURL !== "" ? (
              <img src={user.photoURL} className="w-8 h-8 rounded-full bg-[#4CC9F0]" referrerPolicy="no-referrer" alt="" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#4CC9F0] flex items-center justify-center text-[10px] font-bold text-black uppercase">
                {user.displayName.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white truncate leading-tight">{user.displayName}</p>
              <p className="text-[11px] text-[#B0B3B8] leading-tight">{user.followerCount || 0} Followers</p>
            </div>
            <button onClick={logout} className="text-[#B0B3B8] hover:text-[#FA5252] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={() => {}} className="text-[13px] font-bold text-[#4CC9F0]">Sign In</button>
        )}
      </div>
    </aside>
  );
};

import ReactPlayer from 'react-player';

const PlayerWrapper = ReactPlayer as any;

const Player = () => {
  const { currentSong, isPlaying, togglePlay, playlist, setCurrentSong, volume, setVolume } = usePlayer();
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [played, setPlayed] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const playerRef = useRef<any>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);

  useEffect(() => {
    if (user && currentSong) {
      import('./services/activityService').then(m => {
        m.checkIsLiked(user.uid, currentSong.id).then(setIsLiked);
      });
    }
  }, [user, currentSong]);

  if (!currentSong) return null;
  
  const isYouTube = currentSong.audioUrl.includes('youtube.com') || currentSong.audioUrl.includes('youtu.be');

  const handleLike = async () => {
    if (!user || !currentSong) return;
    const { toggleLike } = await import('./services/activityService');
    const newState = await toggleLike(user.uid, currentSong.id);
    setIsLiked(newState);
  };

  const handleSkipNext = () => {
    if (playlist.length === 0) return;
    const currentIndex = playlist.findIndex(s => s.id === currentSong.id);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentSong(playlist[nextIndex]);
  };

  const handleSkipPrev = () => {
    if (playlist.length === 0) return;
    const currentIndex = playlist.findIndex(s => s.id === currentSong.id);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    setCurrentSong(playlist[prevIndex]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    setPlayed(state.playedSeconds);
    setProgress(state.played * 100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    playerRef.current.seekTo(percent);
  };

  const updateVolume = (e: React.MouseEvent | MouseEvent) => {
    const volumeBar = document.getElementById('volume-bar-container');
    if (!volumeBar) return;
    const rect = volumeBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    setVolume(percent);
  };

  const engine = !isYouTube ? (
    <PlayerWrapper
      ref={playerRef}
      url={currentSong.audioUrl}
      playing={isPlaying}
      volume={volume}
      onProgress={handleProgress}
      onDuration={setDuration}
      onEnded={handleSkipNext}
      width="100%"
      height="100%"
      style={{ position: 'absolute', top: 0, left: 0 }}
      config={{
        file: {
          attributes: {
            onContextMenu: (e: any) => e.preventDefault(),
          }
        }
      }}
    />
  ) : null;

  if (isYouTube) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[95px] bg-[#0A0B0E]/95 backdrop-blur-xl border-t border-[#2D3139] px-6 flex items-center justify-between z-50">
      {/* Persistent Player Engine - hidden off-screen */}
      <div className="fixed top-[-1000px] left-[-1000px] pointer-events-none opacity-0 w-[64px] h-[64px]">
        {engine}
      </div>
      
      <div className="flex items-center gap-4 w-[300px]">
        <div className="w-16 h-16 bg-[#16181D] rounded-xl flex items-center justify-center text-2xl overflow-hidden shrink-0 border border-[#2D3139] group relative">
          {currentSong.coverUrl && currentSong.coverUrl !== "" ? (
            <img src={currentSong.coverUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" alt="" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-[#4CC9F0]"><Music className="w-6 h-6" /></div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <button onClick={togglePlay} className="text-white">
                {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white" />}
             </button>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <Link to={`/song/${currentSong.id}`} className="text-[14px] font-bold text-white hover:text-[#4CC9F0] truncate block transition-colors mt-1">
            {currentSong.title}
          </Link>
          <Link to={`/profile/${currentSong.artistId}`} className="text-[11px] text-[#B0B3B8] hover:text-white truncate block uppercase tracking-wider font-bold">
            {currentSong.artistName}
          </Link>
        </div>
        <div className="flex items-center gap-3 ml-2 text-[#B0B3B8]">
          <button onClick={handleLike} className="hover:scale-110 transition-transform active:scale-95">
            <Heart className={cn("w-4 h-4 transition-colors", isLiked ? "text-[#4CC9F0] fill-[#4CC9F0]" : "hover:text-[#4CC9F0]")} />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 flex-1 max-w-[500px]">
        <div className="flex items-center gap-8 text-[#B0B3B8]">
          <Shuffle className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
          <SkipBack 
            onClick={handleSkipPrev}
            className="w-5 h-5 text-white hover:text-[#4CC9F0] transition-colors cursor-pointer" 
          />
          <button 
            onClick={togglePlay}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-lg active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-black fill-black" />
            ) : (
              <Play className="w-5 h-5 text-black fill-black ml-0.5" />
            )}
          </button>
          <SkipForward 
            onClick={handleSkipNext}
            className="w-5 h-5 text-white hover:text-[#4CC9F0] transition-colors cursor-pointer" 
          />
          <Repeat className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
        </div>
        <div className="w-full flex items-center gap-3 text-[10px] font-mono font-bold text-[#B0B3B8]">
          <span className="w-10 text-right">{formatTime(played)}</span>
          <div 
            className="flex-1 h-1.5 bg-[#16181D] rounded-full relative group cursor-pointer overflow-hidden border border-[#2D3139]"
            onClick={handleSeek}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-[#4CC9F0] transition-all duration-100 shadow-[0_0_10px_rgba(76,201,240,0.5)]" 
              style={{ width: `${progress}%` }} 
            />
          </div>
          <span className="w-10">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-5 w-[300px] text-[#B0B3B8]">
        <div className="flex items-center gap-3 group">
          <Volume2 className="w-4 h-4 group-hover:text-[#4CC9F0] cursor-pointer transition-colors" />
          <div 
            id="volume-bar-container"
            className="w-24 h-1 bg-[#16181D] rounded-full relative border border-[#2D3139] cursor-pointer"
            onMouseDown={(e) => {
              setIsDraggingVolume(true);
              updateVolume(e);
            }}
            onMouseMove={(e) => {
              if (isDraggingVolume) updateVolume(e);
            }}
            onMouseUp={() => setIsDraggingVolume(false)}
            onMouseLeave={() => setIsDraggingVolume(false)}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-[#4CC9F0] rounded-full shadow-[0_0_5px_rgba(76,201,240,0.3)] transition-all duration-200" 
              style={{ width: `${volume * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-4 border-l border-[#2D3139] pl-5 ml-2">
          <Mic2 
            onClick={() => navigate(`/song/${currentSong.id}/lyrics`)}
            className="w-4 h-4 hover:text-[#4CC9F0] cursor-pointer transition-colors" 
          />
          <BookOpen 
            onClick={() => navigate(`/song/${currentSong.id}/breakdown`)}
            className="w-4 h-4 hover:text-[#4CC9F0] cursor-pointer transition-colors" 
          />
        </div>
      </div>
    </div>
  );
};

// --- Pages ---
const LandingPage = () => {
  const { signIn } = useAuth();
  
  return (
    <div className="min-h-screen bg-[#0A0B0E] flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 atmosphere z-0 opacity-20" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="z-10 max-w-2xl"
      >
        <div className="logo text-[40px] mb-8 text-[#4CC9F0] font-black justify-center">
          <span>⚛️</span> ScienceStream
        </div>
        <h1 className="text-6xl md:text-8xl font-extrabold text-white tracking-tighter leading-tight mb-8">
          STEM Learning Through <span className="text-[#4CC9F0]">Music</span>
        </h1>
        <p className="text-lg text-[#B0B3B8] mb-12 font-medium max-w-lg mx-auto">
          Catchy hooks, real scientific research. Level up your understanding while you vibe.
        </p>
        <button 
          onClick={signIn}
          className="bg-[#4CC9F0] text-black text-lg font-bold px-12 py-4 rounded-md transition-all hover:opacity-90 active:scale-95 shadow-xl"
        >
          GENERATE & LISTEN
        </button>
      </motion.div>
    </div>
  );
};

// --- Main App Logic ---

const AppContent = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
      <p className="text-emerald-500 font-mono text-xs animate-pulse">SYNCHRONIZING SUBJECT MATTER...</p>
    </div>
  );

  if (!user && location.pathname === '/') return <LandingPage />;

  return (
    <div className="flex h-screen bg-[#0A0B0E] text-white overflow-hidden">
      {user && <Sidebar />}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative main-gradient">
        <div className="flex-1 overflow-y-auto px-6 pb-[120px] pt-8 scroll-smooth">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/search" element={<SearchView />} />
            <Route path="/song/:id" element={<SongDetailView />} />
            <Route path="/song/:id/lyrics" element={<LyricsView />} />
            <Route path="/song/:id/breakdown" element={<BreakdownView />} />
            <Route path="/profile/:id" element={<ProfileView />} />
            <Route path="/publish" element={<PublishView />} />
            <Route path="/library" element={<LibraryView />} />
          </Routes>
        </div>
        {user && <Player />}
      </main>
    </div>
  );
};

import { HomeView } from './components/HomeView';
import { SearchView } from './components/SearchView';
import { SongDetailView, LyricsView, BreakdownView } from './components/SongDetailView';
import { ProfileView } from './components/ProfileView';
import { PublishView } from './components/PublishView';
import { LibraryView } from './components/LibraryView';
import { SongList } from './components/SongList';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [volume, setVolume] = useState(0.8);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const userRef = doc(db, 'users', authUser.uid);
          const snap = await getDocFromServer(userRef);
          
          if (snap.exists()) {
            setUser({ uid: authUser.uid, ...snap.data() } as UserProfile);
          } else {
            const newUser: UserProfile = {
              uid: authUser.uid,
              displayName: authUser.displayName || 'Researcher',
              email: authUser.email || '',
              photoURL: authUser.photoURL || undefined,
              followerCount: 0,
              followingCount: 0,
              createdAt: serverTimestamp()
            };
            await setDoc(userRef, newUser);
            setUser(newUser);
          }
        } catch (error) {
          console.error("Auth sync error:", error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign in failed:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  return (
    <Router>
      <AuthContext.Provider value={{ user, loading, signIn, logout }}>
        <PlayerContext.Provider value={{ currentSong, isPlaying, setCurrentSong, togglePlay, playlist, setPlaylist, volume, setVolume }}>
          <AppContent />
        </PlayerContext.Provider>
      </AuthContext.Provider>
    </Router>
  );
}
