import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { db, collection, addDoc, serverTimestamp, handleFirestoreError, OperationType } from '../lib/firebase';
import { Youtube, Music, BookOpen, Mic2, Tag, CheckCircle2, ChevronRight, Info } from 'lucide-react';

const TOPICS = [
  'Biology', 'Chemistry', 'Physics', 'Mathematics', 
  'Computer Science', 'Astrophysics', 'Neuroscience', 
  'Geology', 'Environmental Science'
];

export const PublishView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    topic: 'Biology',
    audioUrl: '', // This will now hold the YouTube URL
    lyrics: '',
    breakdown: '',
  });

  const extractVideoId = (url: string) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    } catch (e) {
      console.error("Video ID extraction error:", e);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Attempting to publish song...", formData);
    setErrorStatus(null);
    
    if (!user) {
      setErrorStatus("You must be logged in to publish.");
      return;
    }
    
    const videoId = extractVideoId(formData.audioUrl);
    if (!videoId) {
      setErrorStatus("Please provide a valid YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)");
      return;
    }

    setLoading(true);
    try {
      // Use YouTube thumbnail as coverUrl automatically
      const coverUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      console.log("Generated coverUrl:", coverUrl);

      const songData = {
        ...formData,
        coverUrl,
        artistId: user.uid,
        artistName: user.displayName || 'Research Author',
        likesCount: 0,
        dislikesCount: 0,
        streamsCount: 0,
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'songs'), songData);
      console.log("Song published successfully! ID:", docRef.id);
      navigate('/');
    } catch (error) {
      console.error("Song publication failed:", error);
      setErrorStatus("Publication failed. Please check your data and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-[#FF0000]/10 p-2 rounded-lg">
            <Youtube className="text-[#FF0000] w-6 h-6" />
          </div>
          <h1 className="text-4xl font-black italic tracking-tight uppercase text-white">Publish to STEMstream</h1>
        </div>
        <div className="bg-[#16181D] border border-[#2D3139] p-4 rounded-xl flex items-start gap-4 mb-8">
          <Info className="text-[#4CC9F0] w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm text-zinc-400">
            Since we've transitioned to a YouTube-based ecosystem, please upload your video to YouTube first, then paste the link below. This helps maintain our free global knowledge graph.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[#B0B3B8] flex items-center gap-2">
                <Music className="w-3.5 h-3.5 text-[#4CC9F0]" /> Song Title
              </label>
              <input 
                required
                className="w-full bg-[#16181D] border border-[#2D3139] rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#4CC9F0] transition-colors"
                placeholder="e.g. Thermodynamics Breakdown"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[#B0B3B8] flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-[#4CC9F0]" /> Discipline
              </label>
              <select 
                className="w-full bg-[#16181D] border border-[#2D3139] rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#4CC9F0] transition-colors appearance-none cursor-pointer"
                value={formData.topic}
                onChange={e => setFormData({...formData, topic: e.target.value})}
              >
                {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[#B0B3B8] flex items-center gap-2">
                <Youtube className="w-3.5 h-3.5 text-[#FF0000]" /> YouTube URL
              </label>
              <input 
                required
                className="w-full bg-[#16181D] border border-[#2D3139] rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#4CC9F0] transition-colors font-mono text-sm"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.audioUrl}
                onChange={e => setFormData({...formData, audioUrl: e.target.value})}
              />
              <p className="text-[10px] text-zinc-500 italic">Example: https://youtube.com/watch?v=videoId</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[#B0B3B8] flex items-center gap-2">
                <Mic2 className="w-3.5 h-3.5 text-[#4CC9F0]" /> Lyrics
              </label>
              <textarea 
                required
                className="w-full bg-[#16181D] border border-[#2D3139] rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#4CC9F0] transition-colors resize-none h-[256px] font-serif italic text-lg leading-relaxed shadow-inner"
                placeholder="The scientific poetry behind the track..."
                value={formData.lyrics}
                onChange={e => setFormData({...formData, lyrics: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[#B0B3B8] flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-[#4CC9F0]" /> Comprehensive Scientific Breakdown
          </label>
          <textarea 
            required
            className="w-full bg-[#16181D] border border-[#2D3139] rounded-2xl px-8 py-8 text-white focus:outline-none focus:border-[#4CC9F0] transition-all resize-none min-h-[240px] text-[15px] leading-[1.8] shadow-inner"
            placeholder="How do the lyrics relate to established scientific theory?"
            value={formData.breakdown}
            onChange={e => setFormData({...formData, breakdown: e.target.value})}
          />
        </div>

        <div className="pt-8 border-t border-[#2D3139]">
          {errorStatus && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
              {errorStatus}
            </div>
          )}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#4CC9F0] hover:bg-white text-black font-black py-6 rounded-2xl transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50 uppercase tracking-[0.3em] text-sm"
          >
            {loading ? 'Validating Connection...' : 'Publish STEM Project'}
            {!loading && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </form>
    </div>
  );
};
