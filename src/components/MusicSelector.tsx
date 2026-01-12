import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Track } from "@/contexts/AudioPlayerContext";

interface MusicSelectorProps {
  tracks: Track[];
  currentIndex: number;
  onSelectTrack: (index: number) => void;
  isPlaying: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function MusicSelector({
  tracks,
  currentIndex,
  onSelectTrack,
  isPlaying,
  className = "",
  style
}: MusicSelectorProps) {
  const [open, setOpen] = useState(false);

  if (!tracks || tracks.length === 0) return null;

  const currentTrack = tracks[currentIndex];
  const currentValue = currentIndex.toString();

  const handleValueChange = (value: string) => {
    const index = parseInt(value, 10);
    onSelectTrack(index);
  };

  const formatNumber = (index: number) => String(index + 1).padStart(2, "0");

  return (
    <div 
      className={`font-mono ${className}`}
      style={style}
    >
      <Select
        value={currentValue}
        onValueChange={handleValueChange}
        open={open}
        onOpenChange={setOpen}
      >
        <SelectTrigger
          className={`
            w-full md:w-[240px]
            h-9 px-4 border border-neutral-900 rounded-full
            bg-black text-white
            backdrop-blur-sm
            transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]
            hover:border-neutral-700 hover:bg-neutral-900
            focus:ring-0 focus:ring-offset-0
          `}
        >
          <SelectValue>
            {currentTrack ? (
              <div className="flex items-center gap-2 w-full flex-1 min-w-0 pr-2 text-left">
                {/* 编号 */}
                <span className="text-sm w-5 opacity-40 shrink-0 min-w-content font-mono">
                  {formatNumber(currentIndex)}
                </span>

                {/* 标题 */}
                <span className="text-sm flex-1 tracking-wide font-mono min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                  {currentTrack.title}
                </span>

                {/* 播放状态指示器 */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative flex h-2 w-2">
                    {isPlaying && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    )}
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"></span>
                  </div>
                </div>
              </div>
            ) : (
              <span>选择音乐</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          className="
            bg-black border-neutral-900 backdrop-blur-sm
            rounded-lg overflow-hidden
            w-[var(--radix-select-trigger-width)]
          "
          position="popper"
        >
          {tracks.map((track, index) => (
            <SelectItem
              key={track.id}
              value={index.toString()}
              className={`
                text-white cursor-pointer
                focus:bg-neutral-900 focus:text-white
                data-[highlighted]:bg-neutral-900 data-[highlighted]:text-white
              `}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-sm w-5 opacity-40 shrink-0 font-mono">
                  {formatNumber(index)}
                </span>
                <span className="text-sm truncate flex-1 tracking-wide font-mono">
                  {track.title}
                </span>
                {track.artist && (
                  <span className="text-xs text-neutral-500 truncate">
                    {track.artist}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
