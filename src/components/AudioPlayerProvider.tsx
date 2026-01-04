import { useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { AudioPlayerContext } from '@/contexts/AudioPlayerContext';
import type { AudioPlayerState, AudioPlayerControls, Track } from '@/contexts/AudioPlayerContext';

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
  const [isLooping, setIsLooping] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(defaultAudioUrl || null);
  const [title, setTitle] = useState<string | undefined>(defaultTitle);
  const [cover, setCover] = useState<string | undefined>(defaultCover);
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
  
  // 播放列表状态
  const [playlist, setPlaylistState] = useState<Track[]>(() => {
    if (defaultAudioUrl) {
      return [{
        url: defaultAudioUrl,
        title: defaultTitle,
        cover: defaultCover
      }];
    }
    return [];
  });
  const [currentIndex, setCurrentIndexState] = useState(defaultAudioUrl ? 0 : -1);

  const wavesurferRef = useRef<WaveSurfer | null>(null);
  
  // Refs 确保在回调中访问到最新状态
  const playlistRef = useRef<Track[]>(playlist);
  const currentIndexRef = useRef(currentIndex);
  const audioUrlRef = useRef(audioUrl);
  const isLoopingRef = useRef(isLooping);

  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    audioUrlRef.current = audioUrl;
  }, [audioUrl]);

  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

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

  // 加载特定索引的轨道
  const loadTrack = useCallback((index: number, autoPlay = true) => {
    const tracks = playlistRef.current;
    if (index < 0 || index >= tracks.length) return;

    const track = tracks[index];
    setCurrentIndexState(index);
    setAudioUrl(track.url);
    setTitle(track.title);
    setCover(track.cover);
    
    if (wavesurferRef.current) {
      setIsLoading(true);
      try {
        wavesurferRef.current.load(track.url);
        if (autoPlay) {
          wavesurferRef.current.once('ready', () => {
            wavesurferRef.current?.play();
          });
        }
      } catch (err) {
        console.error('Failed to load audio:', err);
        setError(`无法加载音频文件: ${track.url}`);
        setIsLoading(false);
      }
    }
  }, []);

  const setPlaylist = useCallback((tracks: Track[], startIndex = 0) => {
    setPlaylistState(tracks);
    playlistRef.current = tracks; // 立即更新 ref

    if (tracks.length > 0) {
      const index = Math.max(0, Math.min(startIndex, tracks.length - 1));
      loadTrack(index, true);
    } else {
      setCurrentIndexState(-1);
      setAudioUrl(null);
      setTitle(undefined);
      setCover(undefined);
      wavesurferRef.current?.empty();
    }
  }, [loadTrack]);

  const loadAudio = useCallback((url: string, newTitle?: string, newCover?: string) => {
    const track: Track = { url, title: newTitle, cover: newCover };
    setPlaylist([track], 0);
  }, [setPlaylist]);

  const skipToNext = useCallback(() => {
    if (currentIndexRef.current < playlistRef.current.length - 1) {
      loadTrack(currentIndexRef.current + 1, true);
    }
  }, [loadTrack]);

  const skipToPrevious = useCallback(() => {
    if (currentIndexRef.current > 0) {
      loadTrack(currentIndexRef.current - 1, true);
    }
  }, [loadTrack]);

  const toggleLoop = useCallback(() => {
    setIsLooping(prev => !prev);
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
    
    // 监听播放结束，自动播放下一首或循环播放
    ws.on('finish', () => {
      setIsPlaying(false);
      if (isLoopingRef.current) {
        // 单曲循环：重新播放当前曲目
        ws.seekTo(0);
        ws.play();
      } else if (currentIndexRef.current < playlistRef.current.length - 1) {
        // 正常播放下一首
        loadTrack(currentIndexRef.current + 1, true);
      }
    });

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

    // 初始加载逻辑
    if (audioUrlRef.current) {
       try {
         ws.load(audioUrlRef.current);
       } catch (err) {
         console.error('Failed to load audio:', err);
         setError(`无法加载音频文件: ${audioUrlRef.current}`);
         setIsLoading(false);
       }
    }
  }, [volume, loadTrack]); // audioUrlRef is a ref, stable. volume is state.

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
    cover,
    playlist,
    currentIndex,
    hasPrevious: currentIndex > 0,
    hasNext: currentIndex < playlist.length - 1,
    isLooping
  };

  const controls: AudioPlayerControls = {
    togglePlayPause,
    setVolume: handleVolumeChange,
    toggleMute,
    seekTo,
    loadAudio,
    setPlaylist,
    skipToNext,
    skipToPrevious,
    toggleLoop
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
