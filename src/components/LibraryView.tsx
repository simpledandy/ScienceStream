import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { db, collection, query, where, getDocs, orderBy, onSnapshot } from '../lib/firebase';
import { Song, Playlist } from '../types';
import { SongList } from './SongList';
import { Music, ListMusic, Heart, Loader2 } from 'lucide-react';

export const LibraryView = () => {
  const { user } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    // Fetch User's Publications
    const qPubs = query(collection(db, 'songs'), where('artistId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubPubs = onSnapshot(qPubs, (snap) => {
      setSongs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song)));
    });

    // Fetch Liked Songs (this is a bit tricky with Firestore structure)
    // For now, let's look for songs where the user has a record in the 'activity' subcollection
    // Actually, a flatter structure like 'likes' collection { userId, songId } would be better.
    // Let's stick to what we have or suggest a common pattern.
    // Given the previous handleLike implementation: doc(db, 'songs', song.id, 'activity', user.uid)
    // We can't easily query across subcollections in Firestore without Collection Groups.
    // Let's assume a 'users_likes' collection or just keep it simple for now showing user's items.
    
    setLoading(false);
    return () => unsubPubs();
  }, [user]);

  if (!user) return (
    <div className="flex flex-col items-center justify-center p-20 text-center space-y-6">
      <div className="bg-[#16181D] p-8 rounded-full">
        <Music className="w-16 h-16 text-[#4CC9F0] opacity-20" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black uppercase tracking-tighter italic">Library Locked</h2>
        <p className="text-zinc-500 max-w-xs mx-auto">Please sign in to access your research laboratory and saved components.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white">Research Library</h1>
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-[#B0B3B8]">
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#4CC9F0] rounded-full" /> {songs.length} Publications</span>
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#FF0055] rounded-full" /> 0 Components</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-3xl bg-gradient-to-br from-[#4CC9F0] to-[#4361EE] group cursor-pointer shadow-2xl transition-all hover:scale-[1.01] relative overflow-hidden active:scale-95">
          <div className="relative z-10">
            <Heart className="w-12 h-12 text-white fill-white mb-6" />
            <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Favorite Data</h3>
            <p className="text-white/70 font-bold uppercase tracking-widest text-xs mt-2">Saved Components</p>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 text-white">
            <Heart className="w-40 h-40" />
          </div>
        </div>
        
        <div className="p-8 rounded-3xl bg-[#16181D] border border-[#2D3139] group cursor-pointer hover:bg-[#23262D] transition-all relative overflow-hidden active:scale-95">
          <div className="relative z-10">
            <ListMusic className="w-12 h-12 text-[#4CC9F0] mb-6" />
            <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">The Queue</h3>
            <p className="text-[#B0B3B8] font-bold uppercase tracking-widest text-xs mt-2">Planned Hypotheses</p>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-5 text-[#4CC9F0]">
            <ListMusic className="w-40 h-40" />
          </div>
        </div>
      </div>

      <div className="space-y-8 pt-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#4CC9F0] animate-spin" />
          </div>
        ) : (
          <SongList songs={songs} title="Experimental Publications" />
        )}
        
        {!loading && songs.length === 0 && (
          <div className="border border-dashed border-[#2D3139] rounded-3xl p-20 text-center">
             <p className="text-zinc-600 font-mono italic">No publications detected in your archive. Ready to publish?</p>
          </div>
        )}
      </div>
    </div>
  );
};
