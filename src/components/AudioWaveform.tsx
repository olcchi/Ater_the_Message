import { useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';

type Props = {
  height?: number;
  normalize?: boolean;
  interact?: boolean;
  className?: string;
  style?: React.CSSProperties;
  waveColor?: string; // 波形图颜色
  progressColor?: string; // 已播放区域颜色
  cursorColor?: string; // 进度竖条（光标）颜色
};

export default function AudioWaveform({
  height = 128,
  normalize = true,
  interact = true,
  className = '',
  style,
  waveColor = '#233473',
  progressColor,
  cursorColor
}: Props) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const { wavesurfer, registerWavesurfer, state } = useAudioPlayer();

  useEffect(() => {
    if (!waveformRef.current) return;
    if (wavesurfer) return; // 如果已经存在实例，不重复创建

    // 创建 WaveSurfer 实例
    const audio = document.createElement('audio');
    const ws = WaveSurfer.create({
      container: waveformRef.current,
      media: audio,
      height,
      normalize,
      interact,
      // backend: 'WebAudio', // v7 中不需要此选项，且使用 media 选项时会自动处理
      mediaControls: false,
      waveColor,
      progressColor: progressColor || waveColor,
      cursorColor: cursorColor || waveColor,
      barWidth: 1,
      barGap: 2,
      barRadius: 0,
    } as any);

    // 注册到 context（Provider 会负责管理实例的生命周期）
    registerWavesurfer(ws);

    // 清理函数：不在这里销毁，由 Provider 统一管理
    return () => {
      // 通知 Provider 取消注册（如果需要）
      // ws.destroy() 由 Provider 的 registerWavesurfer 管理
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, normalize, interact, waveColor, progressColor, cursorColor]);

  return (
    <div className={`audio-waveform h-[160px] relative flex items-center justify-center ${className}`} style={style}>
      <style>{`
        @keyframes waveform-enter {
          0% {
            opacity: 0;
            transform: scaleY(0.5);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: scaleY(1);
            filter: blur(0);
          }
        }
        .animate-waveform-enter {
          animation: waveform-enter 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}</style>
      {state.error && (
        <div className="absolute inset-0 flex items-center justify-center p-3 text-center text-zinc-400">
          错误: {state.error}
        </div>
      )}
      {state.isLoading && !state.error && (
        <div className="absolute inset-0 flex items-center justify-center p-3 text-center text-zinc-400 animate-pulse">
          正在加载音频...
        </div>
      )}
      <div 
        ref={waveformRef} 
        className={`w-full transition-opacity duration-300 ${!state.isLoading && !state.error ? 'animate-waveform-enter' : 'opacity-0'}`}
      />
    </div>
  );
}
