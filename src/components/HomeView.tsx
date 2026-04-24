import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db, collection, getDocs, orderBy, limit, query, onSnapshot, where } from '../lib/firebase';
import { Song, Topic } from '../types';
import { SongList } from './SongList';
import { ChevronRight, Play, Youtube, ArrowRight, X, Music } from 'lucide-react';
import { cn } from '../lib/utils';
import { fetchChannelVideos } from '../services/youtubeService';
import { usePlayer } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import ReactPlayer from 'react-player';

const PlayerWrapper = ReactPlayer as any;

export const HomeView = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [labContent, setLabContent] = useState<Song[]>([]);
  const [ytVideos, setYtVideos] = useState<Song[]>([]);
  const { setCurrentSong, setPlaylist } = usePlayer();

  useEffect(() => {
    // Fetch Global Recent Content
    const q = query(collection(db, 'songs'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const songsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song));
      setSongs(songsData);
    });

    // Fetch Curated @ilmnavo Content from Firestore
    const qLab = query(
      collection(db, 'songs'), 
      where('artistName', '==', '@ilmnavo'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    const unsubscribeLab = onSnapshot(qLab, (snapshot) => {
      const labData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song));
      setLabContent(labData);
    });

    // Fetch YouTube Videos
    const loadYT = async () => {
      const vids = await fetchChannelVideos();
      const transformed: Song[] = vids.map(v => ({
        id: v.id,
        title: v.title,
        artistName: '@ilmnavo',
        artistId: 'youtube',
        audioUrl: `https://www.youtube.com/watch?v=${v.id}`,
        coverUrl: v.thumbnail,
        topic: 'Scientific Discovery',
        lyrics: 'Official YouTube Content',
        breakdown: 'Stream directly from YouTube',
        likesCount: 0,
        dislikesCount: 0,
        streamsCount: 0,
        createdAt: new Date(v.publishedAt),
      }));
      setYtVideos(transformed);
    };
    loadYT();

    return () => {
      unsubscribe();
      unsubscribeLab();
    };
  }, []);

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const [activeVideo, setActiveVideo] = useState<Song | null>(null);

  const playYTVideo = (song: Song) => {
    setActiveVideo(song);
  };

  return (
    <div className="space-y-16 pb-12">
      <AnimatePresence>
        {activeVideo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveVideo(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            >
              <button 
                onClick={() => setActiveVideo(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <PlayerWrapper 
                url={activeVideo.audioUrl}
                playing={true}
                controls={true}
                width="100%"
                height="100%"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h2 className="text-3xl font-black tracking-tighter uppercase italic text-white flex items-center gap-3">
          <span className="w-1.5 h-8 bg-[#4CC9F0] rounded-full" />
          The Field Lab
        </h2>
        <form onSubmit={handleSearch} className="search-bar w-full md:w-[400px] group transition-all focus-within:ring-2 ring-[#4CC9F0]/20">
          <span className="text-[#B0B3B8] group-focus-within:text-[#4CC9F0] transition-colors">🔍</span>
          <input 
            type="text" 
            placeholder="Search concepts, researchers, anthems..." 
            className="bg-transparent border-none outline-none ml-2 text-sm w-full font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </form>
      </section>

      {/* YouTube Reel Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#FF0000] p-1.5 rounded-md">
              <Youtube className="text-white w-4 h-4" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white">Broadcasts / @ilmnavo</h3>
          </div>
          <a href="https://youtube.com/@ilmnavo" target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase tracking-widest text-[#B0B3B8] hover:text-white flex items-center gap-2 transition-colors">
            Channel <ArrowRight className="w-3 h-3" />
          </a>
        </div>
        
        <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
          {ytVideos.map((video) => (
            <div 
              key={video.id}
              onClick={() => playYTVideo(video)}
              className="w-72 shrink-0 group cursor-pointer space-y-3"
            >
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-[#2D3139] group-hover:border-[#4CC9F0] transition-all bg-[#16181D] flex items-center justify-center">
                {video.coverUrl && video.coverUrl !== "" ? (
                  <img src={video.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                ) : (
                  <Music className="w-8 h-8 text-zinc-800" />
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl">
                    <Play className="w-5 h-5 text-black fill-black ml-1" />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm line-clamp-2 leading-snug group-hover:text-[#4CC9F0] transition-colors">{video.title}</h4>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{video.topic}</span>
                </div>
              </div>
            </div>
          ))}
          {ytVideos.length === 0 && (
            <div className="flex gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-72 h-40 rounded-2xl bg-[#16181D] border border-[#2D3139] animate-pulse" />
              ))}
            </div>
          )}
        </div>
      </section>

      {labContent.length > 0 && (
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#4CC9F0]/10">
              <ChevronRight className="text-[#4CC9F0] w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Verified Experimental Data</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Enhanced with Lyrics & Analysis</p>
            </div>
          </div>
          <SongList songs={labContent} />
        </div>
      )}

      <div className="space-y-8">
        <div className="flex justify-between items-baseline">
          <div className="space-y-1">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Global Feed</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Recent Laboratory Activity</p>
          </div>
          <Link to="/search" className="text-[10px] font-black uppercase tracking-widest text-[#4CC9F0] hover:underline">View All Research</Link>
        </div>
        <SongList songs={songs} />
      </div>
    </div>
  );
};

