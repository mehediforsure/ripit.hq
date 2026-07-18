export interface AudioMetadata {
  url: string;
  previewUrl?: string;
  codec: string;
  codecLong: string;
  duration: number; // in seconds
  size: number; // in bytes
  bitrate: number; // in bps
  channels: number;
  sampleRate: number;
  title: string;
  artist: string;
  album: string;
  year: string;
  suggestedFileName: string;
}

export interface DownloadHistoryItem {
  id: string;
  url: string;
  title: string;
  artist: string;
  format: "mp3" | "flac";
  bitrate?: string;
  timestamp: number;
  size?: number;
  duration: number;
}
