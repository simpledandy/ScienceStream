import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db, collection, query, where, onSnapshot, orderBy } from '../lib/firebase';
import { Song } from '../types';
import { SongList } from './SongList';
import { Search as SearchIcon, SlidersHorizontal, ArrowDownAZ, Calendar, Flame, X } from 'lucide-react';

import { cn } from '../lib/utils';

const TOPICS = [
  'All Topics', 'Biology', 'Chemistry', 'Physics', 'Mathematics', 
  'Computer Science', 'Astrophysics', 'Neuroscience'
];

export const SearchView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedTopic, setSelectedTopic] = useState(searchParams.get('topic') || 'All Topics');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'alpha'>('recent');
  const [songs, setSongs] = useState<Song[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Sync URL params to state
  useEffect(() => {
    const q = searchParams.get('q');
    const t = searchParams.get('topic');
    if (q) setSearchTerm(q);
    if (t) setSelectedTopic(t);
  }, [searchParams]);

  useEffect(() => {
    let q = query(collection(db, 'songs'));
    
    if (selectedTopic !== 'All Topics') {
      q = query(q, where('topic', '==', selectedTopic));
    }

    if (sortBy === 'recent') {
      q = query(q, orderBy('createdAt', 'desc'));
    } else if (sortBy === 'popular') {
      q = query(q, orderBy('streamsCount', 'desc'));
    } else {
      q = query(q, orderBy('title', 'asc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song));
      
      // Client side search for title (Firestore doesn't support full text search well)
      if (searchTerm) {
        data = data.filter(s => 
          s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.artistName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setSongs(data);
    });

    return () => unsubscribe();
  }, [selectedTopic, sortBy, searchTerm]);

  const updateSearch = (newTerm: string) => {
    setSearchTerm(newTerm);
    setSearchParams(prev => {
      if (newTerm) prev.set('q', newTerm);
      else prev.delete('q');
      return prev;
    });
  };

  const updateTopic = (topic: string) => {
    setSelectedTopic(topic);
    setSearchParams(prev => {
      if (topic !== 'All Topics') prev.set('topic', topic);
      else prev.delete('topic');
      return prev;
    });
  };

  return (
    <div className="space-y-8">
      <div className="sticky top-0 bg-[#0A0B0E]/80 backdrop-blur-md pt-2 pb-6 z-20">
        <div className="search-bar group h-14 !rounded-xl !p-0 overflow-hidden bg-[#16181D] border border-[#2D3139] focus-within:border-[#4CC9F0] transition-all">
          <div className="pl-6 flex items-center justify-center">
            <SearchIcon className="text-[#B0B3B8] group-focus-within:text-[#4CC9F0] transition-colors w-5 h-5" />
          </div>
          <input 
            className="flex-1 bg-transparent border-none px-4 py-4 text-white focus:outline-none text-sm font-medium"
            placeholder="Explore the scientific knowledge graph..."
            value={searchTerm}
            onChange={e => updateSearch(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => updateSearch('')} className="pr-6 text-[#B0B3B8] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 mt-6 overflow-x-auto pb-2 no-scrollbar">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#23262D] border border-[#2D3139] text-[11px] font-bold uppercase tracking-widest text-[#B0B3B8] hover:text-white"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
          </button>
          
          <div className="h-4 w-[1px] bg-[#2D3139]" />

          {TOPICS.map(topic => (
            <button
              key={topic}
              onClick={() => updateTopic(topic)}
              className={cn(
                "px-4 py-2 rounded-md text-[11px] font-bold uppercase tracking-widest transition-all shrink-0",
                selectedTopic === topic 
                  ? "bg-[#4CC9F0] text-black shadow-lg" 
                  : "bg-[#16181D] text-[#B0B3B8] hover:bg-[#23262D] border border-[#2D3139]"
              )}
            >
              {topic}
            </button>
          ))}
        </div>

        {isFilterOpen && (
          <div className="mt-4 p-4 bg-[#16181D] rounded-xl border border-[#2D3139] absolute w-full md:w-auto md:min-w-[280px] shadow-2xl animate-in slide-in-from-top-4 duration-200">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-[#B0B3B8] mb-4 opacity-50">Sort By</h5>
            <div className="space-y-1">
              {[
                { id: 'recent', label: 'Recently Published', icon: Calendar },
                { id: 'popular', label: 'Most Streamed', icon: Flame },
                { id: 'alpha', label: 'Alphabetical', icon: ArrowDownAZ },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id as any)}
                  className={cn(
                    "flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                    sortBy === opt.id ? "bg-[#4CC9F0]/10 text-[#4CC9F0]" : "text-[#B0B3B8] hover:bg-[#23262D]"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <opt.icon className="w-4 h-4" /> {opt.label}
                  </span>
                  {sortBy === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-[#4CC9F0]" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pt-2">
        <SongList songs={songs} title={searchTerm ? `Results for "${searchTerm}"` : `Discover ${selectedTopic === 'All Topics' ? '' : selectedTopic}`} />
        {songs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-zinc-500 font-mono italic">No experimental data found for this query.</p>
          </div>
        )}
      </div>
    </div>
  );
};
