"use client";
import React, { useState, useEffect } from "react";
import { 
  DownloadCloud, 
  FileAudio, 
  HelpCircle, 
  AlertCircle, 
  Loader2, 
  CornerDownRight, 
  Info,
  Settings,
  RefreshCw,
  Github
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AudioMetadata, DownloadHistoryItem } from "../types";
import { AudioPlayer } from "../components/AudioPlayer";
import { HistoryList } from "../components/HistoryList";


export default function App() {
  const [urlInput, setUrlInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AudioMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Download settings state
  const [selectedFormat, setSelectedFormat] = useState<"mp3" | "flac">("mp3");
  const [selectedBitrate, setSelectedBitrate] = useState<"320k" | "256k" | "192k">("320k");
  const [customFilename, setCustomFilename] = useState("");
  const [trackTitle, setTrackTitle] = useState("");
  const [trackArtist, setTrackArtist] = useState("");

  // Download progress simulation state
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStep, setDownloadStep] = useState<string>("");
  const [downloadProgress, setDownloadProgress] = useState(0);

  // History state
  const [history, setHistory] = useState<DownloadHistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("audio_downloader_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  }, []);

  // Save history helper
  const saveHistory = (newHistory: DownloadHistoryItem[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem("audio_downloader_history", JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to save history:", e);
    }
  };


  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAnalysisResult(data.metadata);
        setCustomFilename(data.metadata.suggestedFileName || "downloaded_audio");
        setTrackTitle(data.metadata.title || "");
        setTrackArtist(data.metadata.artist || "");
      } else {
        setError(data.error || "Failed to analyze the link. Please make sure it points to a valid audio file.");
      }
    } catch (err: any) {
      setError("Failed to communicate with the analysis server. Please check your connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownload = () => {
    if (!analysisResult) return;

    setIsDownloading(true);
    setDownloadProgress(10);
    setDownloadStep("Initializing high-quality encoder...");

    // Simulate transcode stages for a highly polished UX
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev < 40) {
          setDownloadStep("Extracting audio stream from source...");
          return prev + 10;
        } else if (prev < 80) {
          setDownloadStep(`Transcoding to high-fidelity ${selectedFormat.toUpperCase()}...`);
          return prev + 15;
        } else if (prev < 95) {
          setDownloadStep("Mapping tags and optimizing audio headers...");
          return prev + 5;
        }
        return prev;
      });
    }, 600);

    // We can also let users customize Title and Artist! We pass those to let ffmpeg tag them if possible, or we save them in history
    const finalTitle = trackTitle.trim() || analysisResult.suggestedFileName || "Untitled Track";
    const finalArtist = trackArtist.trim() || "Unknown Artist";

    // Build API query parameters
    const queryParams = new URLSearchParams({
      url: analysisResult.url,
      format: selectedFormat,
      bitrate: selectedFormat === "mp3" ? selectedBitrate : "",
      filename: customFilename.trim() || analysisResult.suggestedFileName || "audio_file",
      title: finalTitle,
      artist: finalArtist,
    });

    // Trigger browser native download by setting location or creating temporary iframe / link
    // Standard direct link trigger handles stream-to-disk safely without keeping raw audio in tab memory
    const downloadUrl = `/api/download?${queryParams.toString()}`;
    
    // Create temporary link and click it to trigger native download manager
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", "");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Complete progress bar after a short delay to reflect the stream starting
    setTimeout(() => {
      clearInterval(interval);
      setDownloadProgress(100);
      setDownloadStep("Download started! Streaming to your device.");

      // Add to history
      const historyItem: DownloadHistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        url: analysisResult.url,
        title: finalTitle,
        artist: finalArtist,
        format: selectedFormat,
        bitrate: selectedFormat === "mp3" ? selectedBitrate : undefined,
        timestamp: Date.now(),
        size: analysisResult.size || undefined,
        duration: analysisResult.duration,
      };

      const newHistory = [historyItem, ...history.filter(item => item.url !== historyItem.url)].slice(0, 50);
      saveHistory(newHistory);

      // Reset download state after a success message delay
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
        setDownloadStep("");
      }, 4000);
    }, 3200);
  };

  const handleSelectHistoryItem = (url: string) => {
    setUrlInput(url);
    // Smooth scroll to top search bar
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Trigger analysis instantly
    setTimeout(() => {
      // Create a temporary input and submit
      const input = document.getElementById("url-search-input") as HTMLInputElement;
      if (input) {
        input.value = url;
        const btn = document.getElementById("analyze-submit-btn") as HTMLButtonElement;
        if (btn) btn.click();
      }
    }, 100);
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your download history?")) {
      saveHistory([]);
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    saveHistory(updated);
  };



  const formatDuration = (secs?: number) => {
    if (!secs || isNaN(secs)) return "00:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-m3-surface text-m3-on-surface font-sans antialiased py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        
        {/* Header section - M3 Headline & Title Large style */}
        <header id="main-header" className="text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-5 pb-8 border-b border-m3-outline">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-m3-secondary-container text-m3-on-surface border border-m3-outline rounded-[16px] shadow-sm flex items-center justify-center">
              <DownloadCloud size={24} />
            </div>
            <div className="text-left">
              <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-m3-on-surface flex items-center gap-1.5">
                RipIt.HQ
              </h1>
              <p className="text-xs text-m3-on-surface-variant font-medium mt-1 uppercase tracking-[0.12em]">
                Pristine FLAC & MP3 Transcoder
              </p>
            </div>
          </div>
          
          <a
            href="https://github.com/mehediforsure"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-m3-surface-container border border-m3-outline hover:bg-m3-outline/20 rounded-full text-m3-on-surface-variant hover:text-m3-on-surface flex items-center justify-center transition-all cursor-pointer"
            title="GitHub Profile"
            aria-label="GitHub Profile"
          >
            <Github size={16} />
          </a>
        </header>

        {/* Search bar card - M3 Elevated card rounded 16dp */}
        <section id="url-search-section">
          <form onSubmit={handleAnalyze} className="bg-m3-surface-container border border-m3-outline rounded-[16px] p-6 shadow-sm transition-all hover:shadow-md">
            <label htmlFor="url-search-input" className="block text-xs font-bold uppercase tracking-[0.15em] text-m3-primary mb-3">
              Paste Audio Link
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  id="url-search-input"
                  type="url"
                  placeholder="Paste any audio or video link (YouTube, SoundCloud, Bandcamp, TikTok, Vimeo, or direct files)..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full pl-4 pr-16 py-3 bg-m3-surface border border-m3-outline rounded-[12px] focus:outline-none focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/25 text-sm text-m3-on-surface placeholder-m3-on-surface-variant/40 font-medium transition-all"
                  required
                />
                {urlInput && (
                  <button
                    type="button"
                    onClick={() => setUrlInput("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-m3-primary hover:text-m3-primary/80 transition-colors uppercase cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <button
                id="analyze-submit-btn"
                type="submit"
                disabled={isAnalyzing || !urlInput.trim()}
                className="px-6 py-3 bg-m3-primary hover:bg-m3-primary/90 disabled:bg-m3-secondary-container/40 disabled:text-m3-on-surface-variant/40 disabled:border-m3-outline border border-transparent text-black font-bold uppercase tracking-widest text-xs rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm min-w-[155px]"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    <span>Analyze Link</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              id="error-message-box"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#2D1618] border border-[#5C2329] text-rose-200 rounded-[12px] p-4 flex items-start gap-3 shadow-sm"
            >
              <AlertCircle className="shrink-0 mt-0.5 text-rose-300" size={18} />
              <div className="text-xs sm:text-sm font-mono">
                <p className="font-bold uppercase text-xs tracking-wider text-rose-200">Analysis Failed</p>
                <p className="mt-1 text-rose-300/80 text-[11px] leading-relaxed">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analysis Result / Transcoding Dashboard */}
        <AnimatePresence>
          {analysisResult && (
            <motion.div
              id="transcoder-dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="flex flex-col gap-6"
            >
              {/* Media File Inspector - M3 Card rounded-xl with tinted container background */}
              <div className="bg-m3-surface-container border border-m3-outline rounded-[16px] p-6 shadow-sm flex flex-col gap-5">
                <div className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-m3-secondary-container text-m3-primary border border-m3-outline rounded-[12px]">
                      <FileAudio size={20} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-m3-on-surface uppercase tracking-[0.15em]">
                        Track Analysis Completed
                      </h3>
                      <p className="text-[10px] text-m3-on-surface-variant font-mono mt-1 truncate max-w-[250px] sm:max-w-[400px]">
                        {analysisResult.codecLong}
                      </p>
                    </div>
                  </div>
                  
                  <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-[#002011] text-[#2ebd6b] border border-[#0d3f22] rounded-full">
                    ONLINE & READY
                  </span>
                </div>

                {/* Metadata Grid - M3 Container Backdrop */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-m3-surface rounded-[12px] p-4 border border-m3-outline">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-m3-primary tracking-widest uppercase">Format</span>
                    <span className="text-xs font-semibold text-m3-on-surface font-mono uppercase mt-1">{analysisResult.codec}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-m3-primary tracking-widest uppercase">Channels</span>
                    <span className="text-xs font-semibold text-m3-on-surface font-mono mt-1">
                      {analysisResult.channels === 1 ? "Mono (1ch)" : "Stereo (2ch)"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-m3-primary tracking-widest uppercase">Sample Rate</span>
                    <span className="text-xs font-semibold text-m3-on-surface font-mono mt-1">{(analysisResult.sampleRate / 1000).toFixed(1)} kHz</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-m3-primary tracking-widest uppercase">Duration</span>
                    <span className="text-xs font-semibold text-m3-on-surface font-mono mt-1">{formatDuration(analysisResult.duration)}</span>
                  </div>
                </div>

                {/* Edit metadata tags before download - M3 Input Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b border-m3-outline py-5">
                  <div className="flex flex-col">
                    <label htmlFor="tag-title-input" className="text-xs font-bold text-m3-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CornerDownRight size={13} className="text-m3-primary" />
                      Track Title Tag
                    </label>
                    <input
                      id="tag-title-input"
                      type="text"
                      value={trackTitle}
                      onChange={(e) => setTrackTitle(e.target.value)}
                      placeholder="e.g. Majestic Symphonies"
                      className="px-3.5 py-2.5 bg-m3-surface border border-m3-outline rounded-[8px] focus:outline-none focus:border-m3-primary text-xs font-medium text-m3-on-surface placeholder-m3-on-surface-variant/40 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="tag-artist-input" className="text-xs font-bold text-m3-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CornerDownRight size={13} className="text-m3-primary" />
                      Artist Name Tag
                    </label>
                    <input
                      id="tag-artist-input"
                      type="text"
                      value={trackArtist}
                      onChange={(e) => setTrackArtist(e.target.value)}
                      placeholder="e.g. Master Composer"
                      className="px-3.5 py-2.5 bg-m3-surface border border-m3-outline rounded-[8px] focus:outline-none focus:border-m3-primary text-xs font-medium text-m3-on-surface placeholder-m3-on-surface-variant/40 transition-colors"
                    />
                  </div>
                </div>

                {/* Elegant Preview Player */}
                <AudioPlayer
                  url={analysisResult.previewUrl || analysisResult.url}
                  title={trackTitle || "Untitled Track"}
                  artist={trackArtist || "Unknown Artist"}
                  duration={analysisResult.duration}
                />
              </div>

              {/* Transcoder Output Options Card - M3 Elevated card rounded-xl */}
              <div id="transcoding-options-card" className="bg-m3-surface-container border border-m3-outline rounded-[16px] p-6 shadow-sm flex flex-col gap-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-m3-secondary-container text-m3-primary border border-m3-outline rounded-[10px]">
                    <Settings size={16} />
                  </div>
                  <h3 className="text-xs font-bold text-m3-on-surface uppercase tracking-[0.15em]">
                    Transcoding Engine Settings
                  </h3>
                </div>

                {/* Formats selectors - M3 Tonal Segmented Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* MP3 mode */}
                  <button
                    id="format-mp3-btn"
                    type="button"
                    onClick={() => setSelectedFormat("mp3")}
                    className={`flex flex-col p-4.5 rounded-[12px] text-left border transition-all cursor-pointer ${
                      selectedFormat === "mp3"
                        ? "bg-m3-secondary-container border-m3-primary shadow-sm"
                        : "bg-m3-surface border-m3-outline hover:bg-m3-secondary-container/20 hover:border-m3-outline-variant"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs uppercase tracking-wider text-m3-on-surface font-mono">MP3 Standard Mode</span>
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedFormat === "mp3" ? "border-m3-primary bg-m3-primary" : "border-m3-outline"
                      }`}>
                        {selectedFormat === "mp3" && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                      </span>
                    </div>
                    <p className="text-[11px] text-m3-on-surface-variant/90 font-mono mt-1.5 leading-relaxed">
                      High-quality compressed audio. Maximum compatibility for all legacy audio units, portable devices, and web systems.
                    </p>
                  </button>

                  {/* FLAC mode */}
                  <button
                    id="format-flac-btn"
                    type="button"
                    onClick={() => setSelectedFormat("flac")}
                    className={`flex flex-col p-4.5 rounded-[12px] text-left border transition-all cursor-pointer ${
                      selectedFormat === "flac"
                        ? "bg-m3-secondary-container border-m3-primary shadow-sm"
                        : "bg-m3-surface border-m3-outline hover:bg-m3-secondary-container/20 hover:border-m3-outline-variant"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs uppercase tracking-wider text-m3-on-surface font-mono">FLAC Archive Mode</span>
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedFormat === "flac" ? "border-m3-primary bg-m3-primary" : "border-m3-outline"
                      }`}>
                        {selectedFormat === "flac" && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                      </span>
                    </div>
                    <p className="text-[11px] text-m3-on-surface-variant/90 font-mono mt-1.5 leading-relaxed">
                      Pristine, mathematically lossless encoding. Retains 100% bit-for-bit studio fidelity without digital compromises.
                    </p>
                  </button>
                </div>

                {/* Sub-settings based on chosen format */}
                {selectedFormat === "mp3" ? (
                  <div className="bg-m3-surface rounded-[12px] p-4 border border-m3-outline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-m3-on-surface uppercase tracking-wider">Audio Bitrate Priority</h4>
                      <p className="text-[10px] text-m3-on-surface-variant mt-0.5">Higher bitrates retain deeper sound stages and cleaner highs.</p>
                    </div>
                    <div className="flex gap-1.5">
                      {[
                        { label: "320 kbps (Extreme)", val: "320k" },
                        { label: "256 kbps (High)", val: "256k" },
                        { label: "192 kbps (Medium)", val: "192k" }
                      ].map((bit) => (
                        <button
                          id={`bitrate-${bit.val}-btn`}
                          key={bit.val}
                          type="button"
                          onClick={() => setSelectedBitrate(bit.val as any)}
                          className={`px-3 py-1.5 text-[10px] font-bold font-mono rounded-full transition-all cursor-pointer uppercase tracking-wider border ${
                            selectedBitrate === bit.val
                              ? "bg-m3-primary text-black border-transparent shadow-sm"
                              : "bg-m3-surface border-m3-outline text-m3-on-surface-variant hover:bg-m3-secondary-container/40"
                          }`}
                          title={bit.label}
                        >
                          {bit.val.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-m3-surface rounded-[12px] p-4 border border-m3-outline flex items-start gap-3">
                    <Info size={16} className="text-m3-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-m3-on-surface uppercase tracking-wider">Lossless Preservation Stream</h4>
                      <p className="text-[10px] text-m3-on-surface-variant leading-relaxed mt-0.5 font-mono">
                        FLAC encodes uncompressed audio data perfectly. The transcoder maps the input PCM stream into pristine FLAC blocks. No signal loss will occur. Ideal for master archival storage.
                      </p>
                    </div>
                  </div>
                )}

                {/* Custom Output Filename */}
                <div className="flex flex-col gap-2 pt-1">
                  <label htmlFor="custom-filename-input" className="text-xs font-bold text-m3-primary uppercase tracking-wider">
                    Custom Output Filename
                  </label>
                  <div className="relative">
                    <input
                      id="custom-filename-input"
                      type="text"
                      value={customFilename}
                      onChange={(e) => setCustomFilename(e.target.value)}
                      placeholder="e.g. classic_symphony"
                      className="w-full px-4 py-2.5 bg-m3-surface border border-m3-outline rounded-[12px] focus:outline-none focus:border-m3-primary text-xs font-medium text-m3-on-surface placeholder-m3-on-surface-variant/40 pr-14 transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-m3-primary">
                      .{selectedFormat}
                    </span>
                  </div>
                </div>

                {/* Actions Panel - M3 Extended FAB rounded-full */}
                <div className="flex flex-col gap-3 pt-2">
                  {isDownloading ? (
                    <div id="download-progress-container" className="flex flex-col bg-m3-surface border border-m3-outline rounded-[12px] p-4">
                      <div className="flex justify-between items-center text-xs font-semibold mb-2">
                        <span className="flex items-center gap-1.5 text-xs text-m3-on-surface">
                          <Loader2 className="animate-spin text-m3-primary" size={14} />
                          {downloadStep}
                        </span>
                        <span className="font-mono text-m3-primary font-bold">{downloadProgress}%</span>
                      </div>
                      <div className="w-full bg-m3-secondary-container rounded-full h-2 overflow-hidden border border-m3-outline">
                        <div
                          id="download-progress-bar"
                          className="bg-m3-primary h-full rounded-full transition-all duration-300"
                          style={{ width: `${downloadProgress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-m3-on-surface-variant font-mono italic mt-2.5 text-center">
                        Please do not close this connection. Stream triggers natively upon master file compilation.
                      </p>
                    </div>
                  ) : (
                    <button
                      id="convert-download-btn"
                      type="button"
                      onClick={handleDownload}
                      className="w-full py-4 bg-m3-primary hover:bg-m3-primary/95 text-black font-bold text-sm uppercase tracking-[0.15em] rounded-full flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer border border-transparent transform hover:scale-[1.01]"
                    >
                      <DownloadCloud size={16} />
                      <span>Transcode & Download ({selectedFormat.toUpperCase()})</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History of Recent Downloads - M3 Surface container card */}
        <section id="history-section" className="bg-m3-surface-container border border-m3-outline rounded-[16px] p-6 shadow-sm">
          <HistoryList
            items={history}
            onSelect={handleSelectHistoryItem}
            onClear={handleClearHistory}
            onDelete={handleDeleteHistoryItem}
          />
        </section>

        {/* Usage and FAQ Section - M3 Low container card */}
        <section id="faq-section" className="bg-m3-surface-container/50 border border-m3-outline rounded-[16px] p-6 shadow-sm">
          <div className="flex items-center gap-2.5 text-m3-primary mb-4 pb-3 border-b border-m3-outline">
            <HelpCircle size={16} />
            <h4 className="text-xs font-bold uppercase tracking-[0.15em]">Downloader Manual & Specifications</h4>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <h5 className="font-bold text-m3-on-surface uppercase tracking-wider text-[11px]">What is Lossless FLAC?</h5>
              <p className="text-m3-on-surface-variant font-mono text-[10px] leading-relaxed mt-1.5">
                FLAC stands for Free Lossless Audio Codec. It compresses audio streams perfectly without discarding critical acoustic detail, preserving 100% of the acoustic fidelity.
              </p>
            </div>
            <div>
              <h5 className="font-bold text-m3-on-surface uppercase tracking-wider text-[11px]">Why analyze links first?</h5>
              <p className="text-m3-on-surface-variant font-mono text-[10px] leading-relaxed mt-1.5">
                The core engine implements deep stream verification using ffprobe. This reads formats, audio channels, and stream integrity, ensuring perfect transcode parameters.
              </p>
            </div>
            <div>
              <h5 className="font-bold text-m3-on-surface uppercase tracking-wider text-[11px]">Where are audio files stored?</h5>
              <p className="text-m3-on-surface-variant font-mono text-[10px] leading-relaxed mt-1.5">
                Files are streamed directly into your browser's native user-agent manager, downloading directly to your designated default system directories.
              </p>
            </div>
            <div>
              <h5 className="font-bold text-m3-on-surface uppercase tracking-wider text-[11px]">Are metadata tags preserved?</h5>
              <p className="text-m3-on-surface-variant font-mono text-[10px] leading-relaxed mt-1.5">
                Yes. Custom track tags entered above are written directly as stream parameters to form pristine ID3 fields during the transcode phase.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

