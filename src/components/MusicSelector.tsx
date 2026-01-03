import { useState } from "react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

export interface MusicItem {
  url: string;
  title: string;
  cover?: string;
  number: number;
}

interface MusicSelectorProps {
  musicList: MusicItem[];
  currentIndex: number;
  onSelectMusic: (index: number) => void;
}

export default function MusicSelector({
  musicList,
  currentIndex,
  onSelectMusic,
}: MusicSelectorProps) {
  const { state } = useAudioPlayer();
  const [isHovered, setIsHovered] = useState(false);

  if (!musicList || musicList.length === 0) return null;

  const current = musicList[currentIndex];
  // 边界检查：第一首没有prev，最后一首没有next
  const prev = currentIndex > 0 ? musicList[currentIndex - 1] : null;
  const next = currentIndex < musicList.length - 1 ? musicList[currentIndex + 1] : null;

  const itemsToRender = [
    next ? { item: next, type: 'next', index: currentIndex + 1 } : null,
    { item: current, type: 'current', index: currentIndex },
    prev ? { item: prev, type: 'prev', index: currentIndex - 1 } : null,
  ].filter((d): d is { item: MusicItem, type: string, index: number } => Boolean(d));

  return (
    <div 
      className="fixed left-4 bottom-4 z-50 font-mono"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col-reverse items-start">
        {itemsToRender.map(({ item, type, index }) => {
          const isCurrent = type === 'current';
          const isSelected = item.url === state.audioUrl;
          
          const show = isCurrent || isHovered;

          return (
            <button
              key={item.url}
              onClick={() => onSelectMusic(index)}
              style={{
                // 修改点：移除 marginBottom 的动态计算
                // 当元素折叠时(maxHeight:0)，它应该完全不占空间，
                // 这样无论下方有没有 'next' 元素，当前元素的底部基准线都是一致的。
                maxHeight: show ? '40px' : '0px',
                opacity: show ? 1 : 0,
                marginBottom: '0px', 
              }}
              className={`
                flex items-center gap-3 w-[240px] px-3 rounded-md text-left overflow-hidden
                /* 稍微调整一下缓动曲线，让收起时更干脆 */
                transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]
                ${isCurrent ? "z-20" : "z-10"} 
                ${isSelected ? "text-white" : "text-white/60 hover:text-white"}
                hover:bg-white/10
              `}
            >
              <span className={`text-xs ${isSelected ? "text-white" : "opacity-30"}`}>
                {String(item.number).padStart(2, '0')}
              </span>
              
              <span className={`text-sm truncate flex-1 ${isSelected ? "font-bold" : ""}`}>
                {item.title}
              </span>

              {isSelected && (
                <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              )}
            </button>
          );
        })}
      </div>
      
      {/* 鼠标热区垫片 */}
      <div className={`absolute bottom-0 left-0 w-full bg-transparent transition-all duration-300 ${isHovered ? 'h-[130px]' : 'h-[40px]'}`} style={{ zIndex: -1 }} />
    </div>
  );
}