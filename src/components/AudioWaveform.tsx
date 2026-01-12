import { useRef, useEffect, useState } from 'react';
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
  
  // 波形切换动画状态
  const [animationState, setAnimationState] = useState<'entering' | 'visible' | 'exiting' | 'hidden'>('hidden');
  const prevTrackIdRef = useRef<string | null>(null);
  const pendingEnterRef = useRef(false); // 标记是否需要在 exit 完成后进入
  
  // 监听曲目切换，触发 fade out
  useEffect(() => {
    const currentTrackId = state.currentTrack?.id || null;
    
    // 曲目切换检测
    if (prevTrackIdRef.current !== currentTrackId && currentTrackId) {
      // 如果已经有波形显示，先 fade out
      if (animationState === 'visible' || animationState === 'entering') {
        setAnimationState('exiting');
        pendingEnterRef.current = true; // 标记需要在退出后重新进入
      }
      prevTrackIdRef.current = currentTrackId;
    }
  }, [state.currentTrack?.id, animationState]);
  
  // 监听加载状态，触发 fade in
  useEffect(() => {
    if (!state.isLoading && !state.error && state.currentTrack?.id) {
      // 首次加载或已经隐藏状态时直接进入
      if (animationState === 'hidden') {
        setAnimationState('entering');
      }
    }
  }, [state.isLoading, state.error, state.currentTrack?.id, animationState]);
  
  // 动画结束后更新状态
  const handleAnimationEnd = () => {
    if (animationState === 'entering') {
      setAnimationState('visible');
    } else if (animationState === 'exiting') {
      // 退出完成后，检查是否需要重新进入
      if (pendingEnterRef.current) {
        pendingEnterRef.current = false;
        // 等待新波形加载完成，状态变化会触发上面的 useEffect
        setAnimationState('hidden');
      } else {
        setAnimationState('hidden');
      }
    }
  };

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
        @keyframes waveform-exit {
          0% {
            opacity: 1;
            transform: scaleY(1);
            filter: blur(0);
          }
          100% {
            opacity: 0;
            transform: scaleY(0.5);
            filter: blur(4px);
          }
        }
        .animate-waveform-enter {
          animation: waveform-enter 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .animate-waveform-exit {
          animation: waveform-exit 0.3s cubic-bezier(0.4, 0, 1, 1) forwards;
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
        onAnimationEnd={handleAnimationEnd}
        className={`w-full ${
          animationState === 'entering' ? 'animate-waveform-enter' : 
          animationState === 'exiting' ? 'animate-waveform-exit' : 
          animationState === 'visible' ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
