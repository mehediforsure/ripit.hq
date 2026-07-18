import React from "react";
import { DownloadHistoryItem } from "../types";
import { History, ExternalLink, Calendar, Trash2, Clock, Music } from "lucide-react";

interface HistoryListProps {
  items: DownloadHistoryItem[];
  onSelect: (url: string) => void;
  onClear: () => void;
  onDelete: (id: string) => void;
}

export function HistoryList({ items, onSelect, onClear, onDelete }: HistoryListProps) {
  const formatDuration = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (items.length === 0) {
    return (
      <div id="history-empty-state" className="flex flex-col items-center justify-center p-8 bg-m3-surface-container border border-dashed border-m3-outline rounded-[16px] text-center">
        <div className="p-3 bg-m3-secondary-container text-m3-primary border border-m3-outline rounded-[12px] mb-3">
          <History size={20} />
        </div>
        <h4 className="text-sm font-semibold text-m3-on-surface tracking-wider uppercase">No Extraction History</h4>
        <p className="text-xs text-m3-on-surface-variant font-mono mt-1.5 max-w-[280px] leading-relaxed">
          Successfully processed and downloaded audio streams will appear here for subsequent retrieval.
        </p>
      </div>
    );
  }

  return (
    <div id="history-card" className="flex flex-col gap-3.5">
      <div className="flex justify-between items-center pb-3 border-b border-m3-outline">
        <div className="flex items-center gap-2 text-m3-on-surface">
          <History size={16} className="text-m3-primary" />
          <span className="text-xs uppercase tracking-[0.2em] font-bold">Recent Extractions</span>
          <span className="text-[10px] font-mono bg-m3-secondary-container text-m3-primary border border-m3-outline px-2.5 py-0.5 rounded-full font-bold">
            {items.length}
          </span>
        </div>
        <button
          id="history-clear-all-btn"
          onClick={onClear}
          className="text-[11px] text-m3-primary hover:text-m3-primary/80 font-mono font-bold uppercase tracking-widest transition-colors cursor-pointer"
        >
          Purge History
        </button>
      </div>

      <div id="history-items-container" className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            id={`history-item-${item.id}`}
            key={item.id}
            className="flex items-start justify-between gap-4 p-4 bg-m3-surface-container border border-m3-outline rounded-[12px] transition-all hover:bg-m3-surface-container-high group"
          >
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              <div className="p-2.5 bg-m3-secondary-container text-m3-primary border border-m3-outline rounded-[8px] shrink-0 mt-0.5">
                <Music size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <h5
                  id={`history-item-title-${item.id}`}
                  onClick={() => onSelect(item.url)}
                  className="text-m3-on-surface text-xs sm:text-sm font-semibold leading-tight truncate hover:text-m3-primary cursor-pointer hover:underline transition-colors tracking-wide"
                  title="Click to analyze again"
                >
                  {item.title}
                </h5>
                <p className="text-[11px] text-m3-on-surface-variant font-mono truncate mt-0.5">
                  {item.artist || "Unknown Artist"}
                </p>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mt-3 text-[10px] font-mono font-medium text-m3-on-surface-variant">
                  <span className="bg-m3-secondary-container text-m3-primary border border-m3-outline px-2 py-0.5 rounded-full uppercase tracking-wider text-[9px] font-bold">
                    {item.format} {item.bitrate ? `(${item.bitrate})` : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} className="text-m3-primary" />
                    {formatDuration(item.duration)}
                  </span>
                  {item.size && (
                    <span>
                      {formatSize(item.size)}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[9px] italic">
                    <Calendar size={11} className="text-m3-primary/70" />
                    {formatDate(item.timestamp)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                id={`history-item-reload-${item.id}`}
                onClick={() => onSelect(item.url)}
                className="p-2 rounded-full hover:bg-m3-primary-container text-m3-on-surface-variant hover:text-m3-primary transition-colors cursor-pointer"
                title="Reload and download again"
              >
                <ExternalLink size={14} />
              </button>
              <button
                id={`history-item-delete-${item.id}`}
                onClick={() => onDelete(item.id)}
                className="p-2 rounded-full hover:bg-m3-primary-container text-m3-on-surface-variant hover:text-rose-400 transition-colors cursor-pointer"
                title="Delete from history"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
