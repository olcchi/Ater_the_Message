import { Button } from '@/components/ui/button';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';

export default function AudioPlayerControls() {
  const { state, controls } = useAudioPlayer();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVolumeIcon = () => {
    if (state.isMuted || state.volume === 0) return 'i-carbon-volume-mute';
    if (state.volume < 0.5) return 'i-carbon-volume-down';
    return 'i-carbon-volume-up';
  };

  if (!state.audioUrl) {
    return null;
  }

  return (
    <div className="fixed bottom-4 z-50 bg-black/70 backdrop-blur-sm rounded-full border  border-neutral-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-4">
          {/* 音乐封面和名称 */}
          <div className="flex items-center gap-3 min-w-[200px]">
            {state.cover ? (
              <img
                src={state.cover}
                alt={state.title || '音乐封面'}
                className="w-12 h-12 rounded object-cover rounded-full border border-stone-900"
              />
            ) : (
              <div className="w-12 h-12 rounded bg-neutral-800 flex items-center justify-center">
                <span className="i-carbon-music text-neutral-500 text-xl" />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {state.title || '未知音乐'}
              </div>
              <div className="text-xs text-neutral-400">
                {formatTime(state.currentTime)} / {formatTime(state.duration)}
              </div>
            </div>
          </div>

          {/* 播放控制按钮 */}
          <div className="flex items-center gap-2">
            <Button
              onClick={controls.togglePlayPause}
              disabled={state.isLoading || !!state.error}
              size="icon"
              variant="ghost"
              className="text-white hover:bg-neutral-800"
              aria-label={state.isPlaying ? '暂停' : '播放'}
            >
              {state.isLoading ? (
                <span className="i-carbon-circle-dash animate-spin text-xl" />
              ) : state.isPlaying ? (
                <span className="i-carbon-pause text-xl" />
              ) : (
                <span className="i-carbon-play text-xl" />
              )}
            </Button>
          </div>

          {/* 音量控制 */}
          <div className="flex items-center gap-2 min-w-[120px]">
            <Button
              onClick={controls.toggleMute}
              size="icon"
              variant="ghost"
              className="text-white hover:bg-neutral-800"
              aria-label={state.isMuted ? '取消静音' : '静音'}
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
              className="flex-1 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-white"
              aria-label="音量"
            />
          </div>
        </div>
      </div>
    </div>
  );
}



