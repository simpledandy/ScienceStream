import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db, doc, onSnapshot, updateDoc, increment, setDoc, handleFirestoreError, OperationType, serverTimestamp } from '../lib/firebase';
import { Song, UserProfile } from '../types';
import { useAuth, usePlayer } from '../App';
import { Play, Pause, Heart, ThumbsDown, Share2, Mic2, BookOpen, User, Music } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import ReactPlayer from 'react-player';

const PlayerWrapper = ReactPlayer as any;

export const SongDetailView = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { currentSong, isPlaying, togglePlay, setCurrentSong, setPlaylist } = usePlayer();
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(doc(db, 'songs', id), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Song;
        setSong(data);
      }
      setLoading(false);
    });

    if (user) {
      import('../services/activityService').then(m => {
        m.checkIsLiked(user.uid, id).then(setIsLiked);
      });
    }

    return () => unsubscribe();
  }, [id, user]);

  const isYouTube = song?.audioUrl.includes('youtube.com') || song?.audioUrl.includes('youtu.be');

  const handlePlay = () => {
    if (!song) return;
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      setPlaylist([song]);
      setCurrentSong(song);
      // Increment stream count
      updateDoc(doc(db, 'songs', song.id), {
        streamsCount: increment(1)
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, 'songs'));
    }
  };

  const handleLike = async () => {
    if (!user || !song) return;
    const { toggleLike } = await import('../services/activityService');
    const newState = await toggleLike(user.uid, song.id);
    setIsLiked(newState);
  };

  const handleDislike = async () => {
    if (!user || !song) return;
    try {
      const activityRef = doc(db, 'songs', song.id, 'activity', user.uid);
      await setDoc(activityRef, { type: 'dislike', timestamp: serverTimestamp() });
      await updateDoc(doc(db, 'songs', song.id), { dislikesCount: increment(1) });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'activity');
    }
  };

  const handleShare = async () => {
    if (!song) return;
    const shareData = {
      title: song.title,
      text: `Check out this STEM anthem: ${song.title} by ${song.artistName}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Experiment link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 text-[#4CC9F0]">
      <Mic2 className="w-12 h-12 animate-bounce mb-4" />
      <p className="font-mono text-xs uppercase tracking-widest">Initializing Laboratory Waves...</p>
    </div>
  );

  if (!song) return <div className="text-center py-20 text-zinc-500">Experiment not found.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row gap-12 items-start md:items-end">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full md:w-96 aspect-square md:aspect-video lg:aspect-square flex-shrink-0 rounded-3xl overflow-hidden shadow-2xl bg-[#16181D] border border-[#2D3139] group relative flex items-center justify-center"
        >
          {isYouTube ? (
            <div className="w-full h-full relative">
              <PlayerWrapper 
                url={song.audioUrl}
                playing={isPlaying && currentSong?.id === song.id}
                controls={true}
                width="100%"
                height="100%"
                onPlay={() => {
                  if (currentSong?.id !== song.id) {
                    setPlaylist([song]);
                    setCurrentSong(song);
                  }
                }}
                onDuration={undefined}
              />
            </div>
          ) : (
            <>
              {song.coverUrl && song.coverUrl !== "" ? (
                <img src={song.coverUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
              ) : (
                <Music className="w-24 h-24 text-zinc-800" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={handlePlay}
                  className="w-20 h-20 bg-[#4CC9F0] rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-2xl"
                >
                  {currentSong?.id === song.id && isPlaying ? (
                    <Pause className="w-10 h-10 text-black fill-black" />
                  ) : (
                    <Play className="w-10 h-10 text-black fill-black ml-2" />
                  )}
                </button>
              </div>
            </>
          )}

          {/* Persistent Indicator for Synced Playback */}
          {currentSong?.id === song.id && isPlaying && (
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 z-10">
               <div className="flex gap-0.5 items-end h-3">
                 <div className="w-0.5 bg-[#4CC9F0] animate-[music-bar_0.8s_infinite] h-2" />
                 <div className="w-0.5 bg-[#4CC9F0] animate-[music-bar_1.2s_infinite] h-3" />
                 <div className="w-0.5 bg-[#4CC9F0] animate-[music-bar_1.0s_infinite] h-2" />
               </div>
               <span className="text-[9px] font-black uppercase tracking-widest text-[#4CC9F0]">Synced Stream</span>
            </div>
          )}
        </motion.div>

        <div className="flex-1 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-black tracking-[0.2em] text-[#4CC9F0] uppercase">{song.topic}</span>
              <div className="h-0.5 w-8 bg-[#4CC9F0]/30" />
            </div>
            <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-tight text-white drop-shadow-lg">{song.title}</h1>
            <div className="flex flex-wrap items-center gap-6 pt-4">
              <Link to={`/profile/${song.artistId}`} className="flex items-center gap-3 group bg-[#16181D] px-4 py-2 rounded-full border border-[#2D3139] hover:bg-[#23262D] transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#4CC9F0] overflow-hidden flex items-center justify-center">
                  <User className="w-5 h-5 text-black" />
                </div>
                <span className="font-bold text-[14px] text-white group-hover:text-[#4CC9F0] transition-colors">{song.artistName}</span>
              </Link>
              <div className="flex items-center gap-2 text-[#B0B3B8] font-mono text-[11px] uppercase tracking-widest bg-white/[0.03] px-4 py-2 rounded-full">
                <span>{song.streamsCount.toLocaleString()} Streams</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-6">
            <button 
              onClick={handlePlay}
              className="bg-white text-black font-black px-10 py-4 rounded-xl flex items-center gap-3 hover:scale-105 transition-all shadow-xl text-sm tracking-widest active:scale-95"
            >
              {currentSong?.id === song.id && isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" />}
              {currentSong?.id === song.id && isPlaying ? 'PAUSE' : 'PLAY ANTHEM'}
            </button>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleLike}
                className={cn(
                  "w-14 h-14 rounded-xl border flex items-center justify-center transition-all scale-100 active:scale-95",
                  isLiked 
                    ? "bg-[#4CC9F0]/10 border-[#4CC9F0] text-[#4CC9F0]" 
                    : "border-[#2D3139] text-[#B0B3B8] hover:text-[#4CC9F0] hover:bg-[#23262D]"
                )}
              >
                <Heart className={cn("w-5 h-5", isLiked && "fill-[#4CC9F0]")} />
              </button>
              <button 
                onClick={handleDislike}
                className="w-14 h-14 rounded-xl border border-[#2D3139] flex items-center justify-center hover:bg-[#23262D] text-[#B0B3B8] hover:text-[#FA5252] transition-all"
              >
                <ThumbsDown className="w-5 h-5" />
              </button>
              <button 
                onClick={handleShare}
                className="w-14 h-14 rounded-xl border border-[#2D3139] flex items-center justify-center hover:bg-[#23262D] text-[#B0B3B8] hover:text-white transition-all scale-100 active:scale-95"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-16 border-t border-[#2D3139]">
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic2 className="w-4 h-4 text-[#4CC9F0]" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#B0B3B8]">Scientific Lyrics</h2>
            </div>
            <Link to={`/song/${song.id}/lyrics`} className="text-[11px] font-bold text-[#4CC9F0] uppercase tracking-widest hover:underline transition-all">Full View</Link>
          </div>
          <div className="bg-[#16181D] border border-[#2D3139] rounded-2xl p-8 whitespace-pre-wrap max-h-[400px] overflow-hidden relative font-serif italic text-xl text-zinc-300 leading-relaxed shadow-inner">
            {song.lyrics}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#16181D] to-transparent pointer-events-none" />
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#4CC9F0]" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#4CC9F0]">Research Breakdown</h2>
            </div>
            <Link to={`/song/${song.id}/breakdown`} className="text-[11px] font-bold text-[#B0B3B8] uppercase tracking-widest hover:text-white transition-all">Read More</Link>
          </div>
          <div className="bg-[#16181D] border border-[#2D3139] rounded-2xl p-8 shadow-inner">
            <h4 className="text-[12px] font-black text-[#4CC9F0] uppercase tracking-widest mb-4 flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-[#4CC9F0] animate-pulse" />
               Technical Analysis
            </h4>
            <p className="text-[15px] text-zinc-400 leading-[1.8] line-clamp-[9]">
              {song.breakdown}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export const LyricsView = () => {
  const { id } = useParams();
  const [song, setSong] = useState<Song | null>(null);

  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, 'songs', id), (snap) => {
      setSong({ id: snap.id, ...snap.data() } as Song);
    });
  }, [id]);

  if (!song) return null;

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-16">
      <Link to={`/song/${song.id}`} className="text-emerald-500 hover:underline font-bold text-sm uppercase tracking-widest">Back to song</Link>
      <div className="space-y-8">
        <h1 className="text-6xl font-black italic tracking-tighter">{song.title}</h1>
        <div className="lyric-content whitespace-pre-wrap text-4xl md:text-6xl font-serif text-white/40 leading-tight">
          {song.lyrics.split('\n').map((line, i) => (
            <motion.p 
              key={i} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="hover:text-white transition-colors cursor-default py-4"
            >
              {line}
            </motion.p>
          ))}
        </div>
      </div>
    </div>
  );
};

export const BreakdownView = () => {
  const { id } = useParams();
  const [song, setSong] = useState<Song | null>(null);

  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, 'songs', id), (snap) => {
      setSong({ id: snap.id, ...snap.data() } as Song);
    });
  }, [id]);

  if (!song) return null;

  return (
    <div className="max-w-3xl mx-auto py-12 space-y-12">
      <Link to={`/song/${song.id}`} className="text-emerald-500 hover:underline font-bold text-sm uppercase tracking-widest">Back to song</Link>
      <div className="space-y-6">
        <h1 className="text-5xl font-black italic tracking-tighter leading-none">The Science of<br /><span className="text-emerald-500">{song.title}</span></h1>
        <p className="text-zinc-500 font-mono text-sm leading-relaxed uppercase tracking-widest">Topic: {song.topic} • Technical Reference 0x4A2</p>
      </div>
      <div className="prose prose-invert max-w-none">
        <div className="p-10 rounded-[40px] bg-zinc-900 border border-white/10 shadow-3xl text-xl leading-loose font-medium text-zinc-200 indent-8">
          {song.breakdown}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6 pt-12">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
          <h4 className="text-[10px] font-black uppercase text-zinc-500 mb-2">Key Hypothesis</h4>
          <p className="font-bold italic">Music improves retention of complex STEM concepts up to 85%.</p>
        </div>
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
          <h4 className="text-[10px] font-black uppercase text-zinc-500 mb-2">Experimental Conclusion</h4>
          <p className="font-bold italic">This track provides accurate pedagogical mapping for {song.topic}.</p>
        </div>
      </div>
    </div>
  );
};
