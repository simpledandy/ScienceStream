const API_KEY = (import.meta as any).env.VITE_YOUTUBE_API_KEY;
const CHANNEL_HANDLE = 'ilmnavo'; // The handle without @

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
}

export const fetchChannelVideos = async (): Promise<YouTubeVideo[]> => {
  if (!API_KEY) {
    console.warn("YouTube API Key missing. Skipping fetch.");
    return [];
  }

  try {
    // 1. Get Channel ID from Handle
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${CHANNEL_HANDLE}&key=${API_KEY}`
    );
    const channelData = await channelRes.json();
    
    if (!channelData.items || channelData.items.length === 0) {
      throw new Error("Channel not found");
    }
    
    const channelId = channelData.items[0].id;

    // 2. Get Videos from Channel
    const videoRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=20&order=date&type=video&key=${API_KEY}`
    );
    const videoData = await videoRes.json();

    return videoData.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
      publishedAt: item.snippet.publishedAt,
    }));
  } catch (error) {
    console.error("Error fetching YouTube videos:", error);
    return [];
  }
};
