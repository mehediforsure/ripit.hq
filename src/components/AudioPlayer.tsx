import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, RotateCcw, SkipForward, SkipBack } from "lucide-react";

interface AudioPlayerProps {
  url: string;
  title: string;
  artist: string;
  duration: number;
}

export function AudioPlayer({ url, title, artist, duration }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Reset player state when source URL changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch((err) => console.log("Audio play failed:", err));
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const seekValue = parseFloat(e.target.value);
    audio.currentTime = seekValue;
    setCurrentTime(seekValue);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const volValue = parseFloat(e.target.value);
    audio.volume = volValue;
    setVolume(volValue);
    if (volValue > 0) {
      setIsMuted(false);
      audio.muted = false;
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handlePlaybackRateChange = (rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const skipAhead = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(audio.currentTime + 10, duration || audio.duration || 0);
  };

  const skipBack = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(audio.currentTime - 10, 0);
  };

  return (
    <div id="audio-preview-player" className="bg-m3-surface-container border border-m3-outline rounded-[16px] p-6 shadow-sm transition-all hover:shadow-md">
      <audio ref={audioRef} src={url} preload="metadata" />
      
      <div className="flex flex-col gap-5">
        {/* Track info - M3 Typography (Title Medium & Body Medium) */}
        <div className="flex flex-col">
          <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-m3-primary uppercase mb-1.5">
            Audio Preview Node
          </span>
          <h4 className="text-m3-on-surface font-semibold truncate text-sm sm:text-base leading-snug tracking-wide">
            {title}
          </h4>
          <p className="text-m3-on-surface-variant text-xs font-mono truncate mt-0.5">
            {artist || "Unknown Artist"}
          </p>
        </div>

        {/* Timeline Slider - M3 Slider styling */}
        <div className="flex flex-col gap-2">
          <input
            id="player-timeline-slider"
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-m3-secondary-container rounded-full appearance-none cursor-pointer accent-m3-primary focus:outline-none focus:ring-2 focus:ring-m3-primary/30"
          />
          <div className="flex justify-between items-center text-[10px] text-m3-on-surface-variant font-mono tracking-wider">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls Layout */}
        <div className="flex flex-col sm:flex-row gap-5 justify-between items-center pt-4 border-t border-m3-outline">
          {/* Main playback buttons - Tonal standard/FAB buttons */}
          <div className="flex items-center gap-4">
            <button
              id="player-skip-back-btn"
              onClick={skipBack}
              title="Skip back 10s"
              className="p-2 rounded-full hover:bg-m3-primary-container hover:text-m3-primary text-m3-on-surface-variant transition-colors flex items-center justify-center cursor-pointer"
            >
              <SkipBack size={18} />
            </button>
            
            {/* Play/Pause Elevated M3 FAB */}
            <button
              id="player-toggle-play-btn"
              onClick={togglePlay}
              className="p-3.5 rounded-[16px] bg-m3-primary hover:bg-m3-primary/90 text-black shadow-md hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center cursor-pointer"
            >
              {isPlaying ? (
                <Pause size={20} fill="black" stroke="black" />
              ) : (
                <Play size={20} fill="black" stroke="black" />
              )}
            </button>
            
            <button
              id="player-skip-forward-btn"
              onClick={skipAhead}
              title="Skip forward 10s"
              className="p-2 rounded-full hover:bg-m3-primary-container hover:text-m3-primary text-m3-on-surface-variant transition-colors flex items-center justify-center cursor-pointer"
            >
              <SkipForward size={18} />
            </button>
          </div>

          {/* Volume control - Tonal container slider */}
          <div className="flex items-center gap-3 bg-m3-secondary-container/40 px-3 py-1.5 rounded-full w-full sm:w-auto sm:max-w-[150px] border border-m3-outline/40">
            <button
              id="player-mute-btn"
              onClick={toggleMute}
              className="text-m3-on-surface-variant hover:text-m3-primary transition-colors shrink-0 flex items-center justify-center cursor-pointer"
            >
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              id="player-volume-slider"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-full h-1 bg-m3-secondary-container rounded-full appearance-none cursor-pointer accent-m3-primary focus:outline-none"
            />
          </div>

          {/* Playback speed presets - M3 Input Chips */}
          <div className="flex items-center gap-1.5 shrink-0">
            {[1, 1.25, 1.5, 2].map((rate) => (
              <button
                id={`player-rate-${rate}x-btn`}
                key={rate}
                onClick={() => handlePlaybackRateChange(rate)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  playbackRate === rate
                    ? "bg-m3-primary text-black border border-transparent shadow-sm"
                    : "bg-m3-secondary-container/35 border border-m3-outline hover:bg-m3-secondary-container/60 text-m3-on-surface"
                }`}
              >
                {rate === 1 ? "Normal" : `${rate}x`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
