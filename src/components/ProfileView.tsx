import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, doc, onSnapshot, collection, query, where, getDocs, orderBy, handleFirestoreError, OperationType, updateDoc, increment, setDoc, deleteDoc, getDoc } from '../lib/firebase';
import { UserProfile, Song, Playlist } from '../types';
import { SongList } from './SongList';
import { User, Music, Users, Grid, ListMusic, Plus, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../App';

export const ProfileView = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'songs' | 'playlists'>('songs');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const unsubUser = onSnapshot(doc(db, 'users', id), (snap) => {
      if (snap.exists()) {
        setProfile({ uid: snap.id, ...snap.data() } as UserProfile);
      }
      setLoading(false);
    });

    const qSongs = query(collection(db, 'songs'), where('artistId', '==', id), orderBy('createdAt', 'desc'));
    const unsubSongs = onSnapshot(qSongs, (snap) => {
      setSongs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song)));
    });

    if (currentUser && id !== currentUser.uid) {
      const followRef = doc(db, 'users', currentUser.uid, 'following', id);
      getDoc(followRef).then(snap => setIsFollowing(snap.exists()));
    }

    return () => {
      unsubUser();
      unsubSongs();
    };
  }, [id, currentUser]);

  const toggleFollow = async () => {
    if (!currentUser || !id || !profile) return;
    setFollowLoading(true);
    try {
      const followingRef = doc(db, 'users', currentUser.uid, 'following', id);
      const followerRef = doc(db, 'users', id, 'followers', currentUser.uid);
      const userRef = doc(db, 'users', id);
      const currentUserRef = doc(db, 'users', currentUser.uid);

      if (isFollowing) {
        await deleteDoc(followingRef);
        await deleteDoc(followerRef);
        await updateDoc(userRef, { followerCount: increment(-1) });
        await updateDoc(currentUserRef, { followingCount: increment(-1) });
        setIsFollowing(false);
      } else {
        await setDoc(followingRef, { uid: id, timestamp: new Date() });
        await setDoc(followerRef, { uid: currentUser.uid, timestamp: new Date() });
        await updateDoc(userRef, { followerCount: increment(1) });
        await updateDoc(currentUserRef, { followingCount: increment(1) });
        setIsFollowing(true);
      }
    } catch (err) {
      console.error("Follow error:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const topics = Array.from(new Set(songs.map(s => s.topic))).slice(0, 3);

  if (loading) return <div className="p-20 text-center animate-pulse">Syncing profile data...</div>;
  if (!profile) return <div className="p-20 text-center">Researcher profile not found.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row gap-12 items-center md:items-end">
        <div className="w-52 h-52 rounded-full overflow-hidden shadow-2xl border-4 border-[#2D3139] shrink-0 bg-[#16181D] flex items-center justify-center">
          {profile.photoURL && profile.photoURL !== "" ? (
            <img src={profile.photoURL} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
          ) : (
            <User className="w-24 h-24 text-zinc-800" />
          )}
        </div>
        <div className="flex-1 space-y-6 text-center md:text-left">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <span className="text-[10px] font-black tracking-[0.3em] text-[#4CC9F0] uppercase px-3 py-1 bg-[#4CC9F0]/10 rounded-full inline-block">Active Researcher</span>
              {topics.map(t => (
                 <span key={t} className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase px-3 py-1 bg-white/5 rounded-full inline-block">{t}</span>
              ))}
            </div>
            <h1 className="text-6xl font-black italic tracking-tighter leading-none text-white uppercase">{profile.displayName}</h1>
          </div>
          <div className="flex items-center justify-center md:justify-start gap-12">
            <div className="text-center md:text-left">
              <span className="block text-2xl font-black">{profile.followerCount || 0}</span>
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Followers</span>
            </div>
            <div className="text-center md:text-left">
              <span className="block text-2xl font-black">{profile.followingCount || 0}</span>
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Following</span>
            </div>
            <div className="text-center md:text-left">
              <span className="block text-2xl font-black">{songs.length}</span>
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Publications</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          {currentUser?.uid !== id && (
            <button 
              onClick={toggleFollow}
              disabled={followLoading}
              className={cn(
                "px-10 py-3 rounded-full font-black uppercase tracking-widest text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2",
                isFollowing 
                  ? "bg-[#16181D] text-white border border-[#2D3139] hover:bg-[#23262D]" 
                  : "bg-[#4CC9F0] text-black hover:bg-[#4361EE] hover:text-white"
              )}
            >
              {followLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
          <button className="w-12 h-12 rounded-full border border-[#2D3139] flex items-center justify-center hover:bg-white/5 transition-colors">
            <Plus className="w-5 h-5 text-[#B0B3B8]" />
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex items-center gap-8 border-b border-white/10 pb-4">
          <button 
            onClick={() => setTab('songs')}
            className={cn(
              "text-[11px] font-black uppercase tracking-[0.2em] transition-all pb-2",
              tab === 'songs' ? "text-[#4CC9F0] border-b-2 border-[#4CC9F0]" : "text-zinc-500 hover:text-white"
            )}
          >
            Publications
          </button>
          <button 
            onClick={() => setTab('playlists')}
            className={cn(
              "text-[11px] font-black uppercase tracking-[0.2em] transition-all pb-2",
              tab === 'playlists' ? "text-[#4CC9F0] border-b-2 border-[#4CC9F0]" : "text-zinc-500 hover:text-white"
            )}
          >
            Playlists
          </button>
        </div>

        {tab === 'songs' && (
          <div className="space-y-4">
            {songs.length > 0 ? (
              <SongList songs={songs} />
            ) : (
              <div className="py-20 text-center text-zinc-500 italic">No songs published in this laboratory yet.</div>
            )}
          </div>
        )}

        {tab === 'playlists' && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <div className="aspect-square rounded-3xl bg-zinc-900 border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 group hover:border-emerald-500/50 cursor-pointer transition-colors">
              <Plus className="w-8 h-8 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">New Playlist</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
