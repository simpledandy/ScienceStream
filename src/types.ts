export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
  createdAt: any;
  role?: 'admin' | 'user';
}

export interface Song {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  audioUrl: string;
  lyrics: string;
  breakdown: string;
  topic: string;
  likesCount: number;
  dislikesCount: number;
  streamsCount: number;
  coverUrl?: string;
  createdAt: any;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  iconName: string;
  color: string;
}

export interface Playlist {
  id: string;
  title: string;
  ownerId: string;
  songIds: string[];
  isPublic: boolean;
  createdAt: any;
}
