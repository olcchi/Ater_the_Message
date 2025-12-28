import { useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { AudioPlayerContext } from '@/contexts/AudioPlayerContext';
import type { AudioPlayerState, AudioPlayerControls } from '@/contexts/AudioPlayerContext';

interface AudioPlayerProviderProps {
  children: ReactNode;
  defaultAudioUrl?: string;
  defaultTitle?: string;
  defaultCover?: string;
}

export default function AudioPlayerProvider({
  children,
  defaultAudioUrl,
  defaultTitle,
  defaultCover
}: AudioPlayerProviderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(defaultAudioUrl || null);
  const [title, setTitle] = useState<string | undefined>(defaultTitle);
  const [cover, setCover] = useState<string | undefined>(defaultCover);
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  const togglePlayPause = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (wavesurferRef.current) {
      if (isMuted) {
        const newVolume = volume > 0 ? volume : 0.5;
        setVolume(newVolume);
        wavesurferRef.current.setVolume(newVolume);
        setIsMuted(false);
      } else {
        wavesurferRef.current.setVolume(0);
        setIsMuted(true);
      }
    }
  }, [isMuted, volume]);

  const seekTo = useCallback((time: number) => {
    if (wavesurferRef.current && duration > 0) {
      wavesurferRef.current.seekTo(time / duration);
    }
  }, [duration]);

  const loadAudio = useCallback((url: string, newTitle?: string, newCover?: string) => {
    if (wavesurferRef.current) {
      setAudioUrl(url);
      setTitle(newTitle);
      setCover(newCover);
      setIsLoading(true);
      try {
        wavesurferRef.current.load(url);
      } catch (err) {
        console.error('Failed to load audio:', err);
        setError(`无法加载音频文件: ${url}`);
        setIsLoading(false);
      }
    }
  }, []);

  // 同步 ref
  useEffect(() => {
    wavesurferRef.current = wavesurfer;
  }, [wavesurfer]);

  // 注册事件监听器
  const registerWavesurfer = useCallback((ws: WaveSurfer | null) => {
    // 移除旧的事件监听器 - 销毁旧实例
    if (wavesurferRef.current) {
      const oldWs = wavesurferRef.current;
      // WaveSurfer 的 un 方法需要回调函数，但我们直接销毁实例会更简单
      // 或者我们可以使用 off 方法移除所有监听器
      try {
        oldWs.destroy();
      } catch (e) {
        // 忽略销毁错误
      }
    }

    if (!ws) {
      wavesurferRef.current = null;
      setWavesurfer(null);
      return;
    }

    wavesurferRef.current = ws;
    setWavesurfer(ws);
    
    // 设置初始音量
    ws.setVolume(volume);

    // 监听错误
    ws.on('error', (error) => {
      console.error('WaveSurfer error:', error);
      setError(`加载音频失败: ${error.message || '未知错误'}`);
      setIsLoading(false);
    });

    // 监听播放状态
    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));

    // 监听时间更新
    ws.on('timeupdate', (currentTime) => {
      setCurrentTime(currentTime);
    });

    // 监听时长更新
    ws.on('ready', () => {
      setDuration(ws.getDuration());
      setIsLoading(false);
      setError(null);
    });

    // 监听加载开始
    ws.on('loading', () => {
      setIsLoading(true);
      setError(null);
    });

    // 如果提供了默认音频 URL，则加载
    if (defaultAudioUrl) {
      try {
        ws.load(defaultAudioUrl);
      } catch (err) {
        console.error('Failed to load audio:', err);
        setError(`无法加载音频文件: ${defaultAudioUrl}`);
        setIsLoading(false);
      }
    }
  }, [volume, defaultAudioUrl]);

  const state: AudioPlayerState = {
    isPlaying,
    duration,
    currentTime,
    isLoading,
    error,
    volume,
    isMuted,
    audioUrl,
    title,
    cover
  };

  const controls: AudioPlayerControls = {
    togglePlayPause,
    setVolume: handleVolumeChange,
    toggleMute,
    seekTo,
    loadAudio
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        state,
        controls,
        wavesurfer,
        setWavesurfer: registerWavesurfer
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}
