import { Link } from 'react-router-dom';
import { Heart, Play, Clock, Youtube, Music } from 'lucide-react';
import { Song } from '../types';
import { usePlayer } from '../App';
import { cn } from '../lib/utils';

interface SongListProps {
  songs: Song[];
  title?: string;
  showRanking?: boolean;
}

export const SongList = ({ songs, title, showRanking = false }: SongListProps) => {
  const { setCurrentSong, togglePlay, currentSong, isPlaying, setPlaylist } = usePlayer();

  const handlePlay = (song: Song) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      setPlaylist(songs);
      setCurrentSong(song);
    }
  };

  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center justify-between px-2">
          <h2 className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#B0B3B8]">{title}</h2>
        </div>
      )}
      <div className="flex flex-col border border-[#2D3139] rounded-2xl overflow-hidden bg-[#16181D]/40 backdrop-blur-sm">
        {songs.map((song, index) => {
          const isCurrent = currentSong?.id === song.id;
          const isYouTube = song.artistId === 'youtube';

          return (
            <div 
              key={song.id} 
              className={cn(
                "song-row-grid px-4 py-3 transition-all cursor-pointer text-[13px] text-[#B0B3B8] group border-b border-[#2D3139]/50 last:border-0",
                isCurrent ? "bg-[#4CC9F0]/5" : "hover:bg-white/[0.03]"
              )}
              onClick={() => handlePlay(song)}
            >
              <div className="flex items-center justify-center">
                {isCurrent && isPlaying ? (
                  <div className="flex gap-0.5 items-end h-3">
                    <div className="w-0.5 h-full bg-[#4CC9F0] animate-[music-bar_0.8s_ease-in-out_infinite]" />
                    <div className="w-0.5 h-2/3 bg-[#4CC9F0] animate-[music-bar_0.5s_ease-in-out_infinite]" />
                    <div className="w-0.5 h-1/2 bg-[#4CC9F0] animate-[music-bar_1.2s_ease-in-out_infinite]" />
                  </div>
                ) : (
                  <span className={cn(
                    "font-mono text-[11px] tracking-tight",
                    isCurrent ? "text-[#4CC9F0]" : "text-zinc-600 group-hover:text-white"
                  )}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg shrink-0 bg-[#23262D] overflow-hidden border border-[#2D3139] group-hover:border-[#4CC9F0]/50 transition-colors flex items-center justify-center">
                  {song.coverUrl && song.coverUrl !== "" ? (
                    <img src={song.coverUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                  ) : (
                    <Music className="w-5 h-5 text-zinc-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-bold truncate text-[14px]",
                    isCurrent ? "text-[#4CC9F0]" : "text-white"
                  )}>
                    {song.title}
                  </p>
                  <div className="flex items-center gap-2">
                    {isYouTube && <Youtube className="w-3 h-3 text-[#FF0000]" />}
                    <p className="text-[11px] hover:text-white transition-colors truncate font-medium tracking-tight uppercase opacity-60">
                      {song.artistName}
                    </p>
                  </div>
                </div>
              </div>
              <div className="truncate px-4 text-[11px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                 <span className="w-1 h-1 rounded-full bg-zinc-600" />
                 {song.topic}
              </div>
              <div className="text-center font-mono text-[11px] font-bold opacity-40">3:45</div>
              <div className="flex justify-end gap-3 pr-2">
                <Heart className="w-3.5 h-3.5 hover:text-[#4CC9F0] transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
