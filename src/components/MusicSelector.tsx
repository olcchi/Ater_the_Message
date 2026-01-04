import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  isPlaying: boolean;
}

export default function MusicSelector({
  musicList,
  currentIndex,
  onSelectMusic,
  isPlaying,
}: MusicSelectorProps) {
  const [open, setOpen] = useState(false);

  if (!musicList || musicList.length === 0) return null;

  const currentItem = musicList[currentIndex];
  const currentValue = currentIndex.toString();

  const handleValueChange = (value: string) => {
    const index = parseInt(value, 10);
    onSelectMusic(index);
  };

  return (
    <div
      className="fixed z-50 font-mono 
                  top-4 left-4 right-4 
                  md:top-auto md:right-auto md:left-6 md:bottom-4 md:w-auto"
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
            bg-black text-white font-bold
            backdrop-blur-sm
            transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]
            hover:border-neutral-700 hover:bg-neutral-900
            focus:ring-0 focus:ring-offset-0
          `}
        >
          <SelectValue>
            {currentItem ? (
              <div className="flex items-center gap-3 w-full flex-1 min-w-0">
                {/* 编号 */}
                <span className="text-[10px] w-5 opacity-40 font-light shrink-0">
                  {String(currentItem.number).padStart(2, "0")}
                </span>

                {/* 标题 */}
                <span className="text-sm truncate flex-1 tracking-wide">
                  {currentItem.title}
                </span>

                {/* 播放状态指示器 */}
                <div className="flex items-center p-2 gap-2 shrink-0">
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
          {musicList.map((item, index) => {
            const isSelected = index === currentIndex;
            return (
              <SelectItem
                key={item.url}
                value={index.toString()}
                className={`
                  text-white cursor-pointer
                  focus:bg-neutral-900 focus:text-white
                  data-[highlighted]:bg-neutral-900 data-[highlighted]:text-white
                  ${isSelected ? "font-bold" : ""}
                `}
              >
                <div className="flex items-center gap-3 w-full">
                  {/* 编号 */}
                  <span className="text-[10px] w-5 opacity-40 font-light shrink-0">
                    {String(item.number).padStart(2, "0")}
                  </span>

                  {/* 标题 */}
                  <span className="text-sm truncate flex-1 tracking-wide">
                    {item.title}
                  </span>

                  {/* 播放状态指示器（仅在选中项显示） */}
                  {isSelected && (
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative flex h-2 w-2">
                        {isPlaying && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        )}
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"></span>
                      </div>
                    </div>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
