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
  const { wavesurfer, setWavesurfer, state } = useAudioPlayer();

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
      cursorColor: cursorColor || waveColor
    } as any);

    // 注册到 context
    setWavesurfer(ws);

    // 清理函数
    return () => {
      if (ws) {
        ws.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, normalize, interact, waveColor, progressColor, cursorColor]);

  return (
    <div className={`audio-waveform h-[160px] relative flex items-center justify-center ${className}`} style={style}>
      {state.error && (
        <div className="absolute inset-0 flex items-center justify-center p-3 text-center text-zinc-400">
          错误: {state.error}
        </div>
      )}
      {state.isLoading && !state.error && (
        <div className="absolute inset-0 flex items-center justify-center p-3 text-center text-zinc-400">
          正在加载音频...
        </div>
      )}
      <div ref={waveformRef} className="w-full" />
    </div>
  );
}
