import { Button } from "@/components/ui/button";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useEffect, useRef, useState } from "react";

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
          // 设置 CSS 变量，增加一点缓冲距离让两端不那么贴边
          containerRef.current.style.setProperty('--scroll-distance', `-${distance}px`);
          // 动态计算时间：基础时间 3s + 每 30px 增加 1s
          const duration = 3 + (distance / 30);
          containerRef.current.style.setProperty('--scroll-duration', `${duration}s`);
        }
      }
    };

    checkOverflow();
    // 监听窗口大小变化
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

export default function AudioPlayerControls() {
  const { state, controls } = useAudioPlayer();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getVolumeIcon = () => {
    if (state.isMuted || state.volume === 0) return "i-carbon-volume-mute";
    if (state.volume < 0.5) return "i-carbon-volume-down";
    return "i-carbon-volume-up";
  };

  if (!state.audioUrl) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes scroll-horizontal {
          0% { transform: translateX(0); }
          10% { transform: translateX(0); } /* 停留一会 */
          90% { transform: translateX(var(--scroll-distance)); } /* 停留一会 */
          100% { transform: translateX(var(--scroll-distance)); }
        }
        .animate-scroll-horizontal {
          animation: scroll-horizontal var(--scroll-duration) linear infinite alternate;
        }
      `}</style>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[95vw]">
        <div 
          className="bg-black rounded-md border shadow-2xl shadow-blue-900/30 border-white/10 px-4 py-2 sm:px-6 sm:py-3 animate-fade-in-up"
          style={{ animationDelay: '200ms', animationFillMode: 'both' }}
        >
          <div className="flex items-center justify-between gap-4 sm:gap-6">
            {/* 音乐封面和名称 */}
            <div className="flex items-center gap-3 min-w-[100px] sm:min-w-[140px]">
              {state.cover ? (
                <img
                  src={state.cover}
                  alt={state.title || "音乐封面"}
                  className="w-10 h-10 rounded-lg object-cover border border-white/10"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                  <span className="i-carbon-music text-neutral-500 text-xl" />
                </div>
              )}
              <div className="flex flex-col min-w-0 max-w-[120px] sm:max-w-[200px]">
                <ScrollingText 
                  text={state.title || "未知音乐"} 
                  className="text-sm font-medium text-white"
                />
                {state.artist && (
                  <ScrollingText 
                    text={state.artist} 
                    className="text-xs text-neutral-400"
                  />
                )}
                <div className="text-xs text-neutral-400 mt-0.5">
                  {formatTime(state.currentTime)} / {formatTime(state.duration)}
                </div>
              </div>
            </div>

          {/* 播放控制按钮 */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              onClick={controls.skipToPrevious}
              disabled={!state.hasPrevious}
              size="sm"
              variant="ghost"
              className={`text-white hover:scale-110 ${
                !state.hasPrevious ? "opacity-20 cursor-not-allowed" : ""
              }`}
              aria-label="上一曲"
            >
              <span className="i-carbon-skip-back-filled text-xl" />
            </Button>

            <Button
              onClick={controls.togglePlayPause}
              disabled={state.isLoading || !!state.error}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-neutral-900"
              aria-label={state.isPlaying ? "暂停" : "播放"}
            >
              {state.isLoading ? (
                <span className="i-carbon-circle-dash animate-spin text-2xl" />
              ) : state.isPlaying ? (
                <span className="i-carbon-pause text-2xl" />
              ) : (
                <span className="i-carbon-play text-2xl" />
              )}
            </Button>

            <Button
              onClick={controls.skipToNext}
              disabled={!state.hasNext}
              size="sm"
              variant="ghost"
              className={`text-white hover:bg-neutral-900 ${
                !state.hasNext ? "opacity-20 cursor-not-allowed" : ""
              }`}
              aria-label="下一曲"
            >
              <span className="i-carbon-skip-forward-filled text-xl" />
            </Button>

            <Button
              onClick={controls.togglePlayMode}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-neutral-900 relative"
              aria-label={
                state.playMode === 'sequence' ? "列表循环" :
                state.playMode === 'loop' ? "单曲循环" : "随机播放"
              }
            >
              {state.playMode === 'sequence' && <span className="i-carbon-repeat text-xl" />}
              {state.playMode === 'loop' && <span className="i-carbon-repeat-one text-xl" />}
              {state.playMode === 'shuffle' && <span className="i-carbon-shuffle text-xl" />}
            </Button>
          </div>

          {/* 音量控制 */}
          <div className="hidden sm:flex items-center gap-2 min-w-[100px]">
            <Button
              onClick={controls.toggleMute}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10"
              aria-label={state.isMuted ? "取消静音" : "静音"}
            >
              <span className={`${getVolumeIcon()} text-xl`} />
            </Button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={state.isMuted ? 0 : state.volume}
              onChange={(e) => controls.setVolume(parseFloat(e.target.value))}
              className="w-20 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-white"
              aria-label="音量"
            />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
