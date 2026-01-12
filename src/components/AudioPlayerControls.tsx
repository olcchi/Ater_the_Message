import { Button } from "@/components/ui/button";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useRef, useState, useEffect } from "react";

/**
 * 滚动文字组件 - 用于超长标题自动滚动
 */
const ScrollingText = ({ text, className = "" }: { text: string; className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const textWidth = textRef.current.scrollWidth;
        const overflow = textWidth > containerWidth;
        setIsOverflowing(overflow);
        
        if (overflow) {
          const distance = textWidth - containerWidth;
          containerRef.current.style.setProperty('--scroll-distance', `-${distance}px`);
          const duration = 3 + (distance / 30);
          containerRef.current.style.setProperty('--scroll-duration', `${duration}s`);
        }
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      <div
        ref={textRef}
        className={`whitespace-nowrap w-fit ${isOverflowing ? 'animate-scroll-horizontal' : ''}`}
      >
        {text}
      </div>
    </div>
  );
};

/**
 * 格式化时间 (秒 -> mm:ss)
 */
const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * 获取播放模式图标和提示
 */
const getPlayModeInfo = (mode: string) => {
  switch (mode) {
    case 'repeat-all':
      return { icon: 'i-carbon-repeat', label: '列表循环' };
    case 'repeat-one':
      return { icon: 'i-carbon-repeat-one', label: '单曲循环' };
    case 'shuffle':
      return { icon: 'i-carbon-shuffle', label: '随机播放' };
    case 'sequential':
      return { icon: 'i-carbon-arrow-right', label: '顺序播放' };
    default:
      return { icon: 'i-carbon-repeat', label: '列表循环' };
  }
};

/**
 * 获取音量图标
 */
const getVolumeIcon = (volume: number, isMuted: boolean) => {
  if (isMuted || volume === 0) return "i-carbon-volume-mute";
  if (volume < 0.5) return "i-carbon-volume-down";
  return "i-carbon-volume-up";
};

/**
 * 音频播放器控制组件
 */
export default function AudioPlayerControls() {
  const { state, controls } = useAudioPlayer();
  const { currentTrack, isPlaying, isLoading, currentTime, duration, volume, isMuted, playMode, playlist, error } = state;

  if (!currentTrack) return null;

  const playModeInfo = getPlayModeInfo(playMode);
  const canSkip = playlist.length > 1;

  return (
    <>
      <style>{`
        @keyframes scroll-horizontal {
          0% { transform: translateX(0); }
          10% { transform: translateX(0); }
          90% { transform: translateX(var(--scroll-distance)); }
          100% { transform: translateX(var(--scroll-distance)); }
        }
        .animate-scroll-horizontal {
          animation: scroll-horizontal var(--scroll-duration) linear infinite alternate;
        }
      `}</style>
      
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[500px] max-w-[95vw]">
        <div 
          className="bg-black/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 px-4 py-3 animate-fade-in-up"
          style={{ animationDelay: '200ms', animationFillMode: 'both' }}
        >
          <div className="flex items-center gap-4">
            {/* 封面和曲目信息 */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {currentTrack.cover ? (
                <img
                  src={currentTrack.cover}
                  alt={currentTrack.title}
                  className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0">
                  <span className="i-carbon-music text-neutral-500 text-xl" />
                </div>
              )}
              
              <div className="flex flex-col min-w-0 flex-1 max-w-[180px]">
                <ScrollingText 
                  text={currentTrack.title} 
                  className="text-sm font-medium text-white"
                />
                {currentTrack.artist && (
                  <ScrollingText 
                    text={currentTrack.artist} 
                    className="text-xs text-neutral-400"
                  />
                )}
                <div className="text-xs text-neutral-500 mt-0.5 tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
            </div>

            {/* 播放控制 */}
            <div className="flex items-center gap-1">
              {/* 上一曲 */}
              <Button
                onClick={controls.skipToPrevious}
                disabled={!canSkip}
                size="sm"
                variant="ghost"
                className={`text-white hover:bg-white/10 ${!canSkip ? 'opacity-30' : ''}`}
                aria-label="上一曲"
              >
                <span className="i-carbon-skip-back-filled text-lg" />
              </Button>

              {/* 播放/暂停 */}
              <Button
                onClick={controls.togglePlayPause}
                disabled={isLoading || !!error}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10 w-10 h-10"
                aria-label={isPlaying ? "暂停" : "播放"}
              >
                {isLoading ? (
                  <span className="i-carbon-circle-dash animate-spin text-2xl" />
                ) : isPlaying ? (
                  <span className="i-carbon-pause-filled text-2xl" />
                ) : (
                  <span className="i-carbon-play-filled-alt text-2xl" />
                )}
              </Button>

              {/* 下一曲 */}
              <Button
                onClick={controls.skipToNext}
                disabled={!canSkip}
                size="sm"
                variant="ghost"
                className={`text-white hover:bg-white/10 ${!canSkip ? 'opacity-30' : ''}`}
                aria-label="下一曲"
              >
                <span className="i-carbon-skip-forward-filled text-lg" />
              </Button>

              {/* 播放模式 */}
              <Button
                onClick={controls.cyclePlayMode}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10"
                aria-label={playModeInfo.label}
                title={playModeInfo.label}
              >
                <span className={`${playModeInfo.icon} text-lg`} />
              </Button>
            </div>

            {/* 音量控制 */}
            <div className="hidden sm:flex items-center gap-2 min-w-[100px]">
              <Button
                onClick={controls.toggleMute}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10"
                aria-label={isMuted ? "取消静音" : "静音"}
              >
                <span className={`${getVolumeIcon(volume, isMuted)} text-lg`} />
              </Button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => controls.setVolume(parseFloat(e.target.value))}
                className="w-16 h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer accent-white"
                aria-label="音量"
              />
            </div>
          </div>
          
          {/* 错误提示 */}
          {error && (
            <div className="mt-3">
              <div className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                {error}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
