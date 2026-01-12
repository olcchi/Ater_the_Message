import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { AudioPlayerContext } from '@/contexts/AudioPlayerContext';
import type { AudioPlayerState, AudioPlayerControls, Track, PlayMode } from '@/contexts/AudioPlayerContext';

interface AudioPlayerProviderProps {
  children: ReactNode;
  defaultAudioUrl?: string;
  defaultTitle?: string;
  defaultCover?: string;
  defaultArtist?: string;
}

export default function AudioPlayerProvider({
  children,
  defaultAudioUrl,
  defaultTitle,
  defaultCover,
  defaultArtist
}: AudioPlayerProviderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>('sequence');
  const [audioUrl, setAudioUrl] = useState<string | null>(defaultAudioUrl || null);
  const [title, setTitle] = useState<string | undefined>(defaultTitle);
  const [artist, setArtist] = useState<string | undefined>(defaultArtist);
  const [cover, setCover] = useState<string | undefined>(defaultCover);
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
  
  // 播放列表状态
  const [playlist, setPlaylistState] = useState<Track[]>(() => {
    if (defaultAudioUrl) {
      return [{
        url: defaultAudioUrl,
        title: defaultTitle,
        artist: defaultArtist,
        cover: defaultCover
      }];
    }
    return [];
  });
  const [currentIndex, setCurrentIndexState] = useState(defaultAudioUrl ? 0 : -1);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);

  const wavesurferRef = useRef<WaveSurfer | null>(null);
  
  // Refs 确保在回调中访问到最新状态
  const playlistRef = useRef<Track[]>(playlist);
  const currentIndexRef = useRef(currentIndex);
  const audioUrlRef = useRef(audioUrl);
  const playModeRef = useRef(playMode);
  const shuffledIndicesRef = useRef(shuffledIndices);

  useEffect(() => {
    playlistRef.current = playlist;
    // 当播放列表变化时，如果处于随机模式，重新生成随机索引
    if (playModeRef.current === 'shuffle') {
      generateShuffledIndices(playlist.length);
    }
  }, [playlist]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    audioUrlRef.current = audioUrl;
  }, [audioUrl]);

  useEffect(() => {
    playModeRef.current = playMode;
    // 如果切换到随机模式，生成随机索引
    if (playMode === 'shuffle' && shuffledIndicesRef.current.length !== playlistRef.current.length) {
      generateShuffledIndices(playlistRef.current.length);
    }
  }, [playMode]);

  useEffect(() => {
    shuffledIndicesRef.current = shuffledIndices;
  }, [shuffledIndices]);

  const generateShuffledIndices = (length: number) => {
    const indices = Array.from({ length }, (_, i) => i);
    // Fisher-Yates Shuffle
    for (let i = length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffledIndices(indices);
    shuffledIndicesRef.current = indices;
  };

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
    setArtist(track.artist);
    setCover(track.cover);
    
    if (wavesurferRef.current) {
      setIsLoading(true);
      try {
        wavesurferRef.current.load(track.url);
        if (autoPlay) {
          // 不等待波形生成完毕(ready事件)，直接播放以支持流式传输
          wavesurferRef.current.play().catch(err => {
             console.warn('Auto-play failed:', err);
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
      setArtist(undefined);
      setCover(undefined);
      wavesurferRef.current?.empty();
    }
  }, [loadTrack]);

  const loadAudio = useCallback((url: string, newTitle?: string, newCover?: string, newArtist?: string) => {
    const track: Track = { url, title: newTitle, cover: newCover, artist: newArtist };
    setPlaylist([track], 0);
  }, [setPlaylist]);

  const getNextIndex = useCallback(() => {
    const currentMode = playModeRef.current;
    const currentIdx = currentIndexRef.current;
    const tracks = playlistRef.current;
    const count = tracks.length;

    if (count === 0) return -1;

    if (currentMode === 'shuffle') {
      const indices = shuffledIndicesRef.current;
      // 找到当前歌曲在随机列表中的位置
      const shuffleIdx = indices.indexOf(currentIdx);
      if (shuffleIdx === -1 || shuffleIdx === indices.length - 1) {
        // 如果找不到或已经是最后一个，回到随机列表的第一个
        return indices[0];
      }
      return indices[shuffleIdx + 1];
    }

    // Sequence & Loop (manual next)
    // 列表循环：如果到底了，回到开头
    if (currentIdx >= count - 1) {
      return 0; 
    }
    return currentIdx + 1;
  }, []);

  const getPreviousIndex = useCallback(() => {
    const currentMode = playModeRef.current;
    const currentIdx = currentIndexRef.current;
    const tracks = playlistRef.current;
    const count = tracks.length;

    if (count === 0) return -1;

    if (currentMode === 'shuffle') {
      const indices = shuffledIndicesRef.current;
      const shuffleIdx = indices.indexOf(currentIdx);
      if (shuffleIdx <= 0) {
        // 如果找不到或已经是第一个，回到随机列表的最后一个
        return indices[indices.length - 1];
      }
      return indices[shuffleIdx - 1];
    }

    // Sequence & Loop (manual prev)
    // 列表循环
    if (currentIdx <= 0) {
      return count - 1;
    }
    return currentIdx - 1;
  }, []);

  const skipToNext = useCallback(() => {
    const nextIndex = getNextIndex();
    if (nextIndex !== -1) {
      loadTrack(nextIndex, true);
    }
  }, [loadTrack, getNextIndex]);

  const skipToPrevious = useCallback(() => {
    const prevIndex = getPreviousIndex();
    if (prevIndex !== -1) {
      loadTrack(prevIndex, true);
    }
  }, [loadTrack, getPreviousIndex]);

  const togglePlayMode = useCallback(() => {
    setPlayMode(prev => {
      if (prev === 'sequence') return 'loop';
      if (prev === 'loop') return 'shuffle';
      return 'sequence';
    });
  }, []);

  // 同步 ref
  useEffect(() => {
    wavesurferRef.current = wavesurfer;
  }, [wavesurfer]);

  // Media Session API 集成
  useEffect(() => {
    if ('mediaSession' in navigator) {
      // 更新元数据
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title || 'Unknown Title',
        artist: artist || 'Unknown Artist',
        artwork: cover ? [{ src: cover, sizes: '512x512', type: 'image/png' }] : []
      });

      // 设置播放状态
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      // 设置动作处理器
      const actionHandlers: [MediaSessionAction, MediaSessionActionHandler][] = [
        ['play', () => wavesurferRef.current?.play()],
        ['pause', () => wavesurferRef.current?.pause()],
        ['previoustrack', () => skipToPrevious()],
        ['nexttrack', () => skipToNext()],
        ['seekto', (details) => {
          if (details.seekTime !== undefined) {
             seekTo(details.seekTime);
          }
        }]
      ];

      actionHandlers.forEach(([action, handler]) => {
        try {
          navigator.mediaSession.setActionHandler(action, handler);
        } catch (error) {
          console.warn(`Media Session action ${action} not supported`);
        }
      });
    }
  }, [title, artist, cover, isPlaying, skipToNext, skipToPrevious, seekTo]);

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
      const mode = playModeRef.current;
      
      if (mode === 'loop') {
        // 单曲循环：重新播放当前曲目
        ws.seekTo(0);
        ws.play();
      } else {
        // 列表循环 或 随机播放：自动播放下一首
        const nextIndex = getNextIndex();
        if (nextIndex !== -1) {
            loadTrack(nextIndex, true);
        }
      }
    });

    // 监听时间更新
    ws.on('timeupdate', (currentTime) => {
      setCurrentTime(currentTime);
    });

    // 监听时长更新
    ws.on('ready', () => {
      setDuration(ws.getDuration());
      setError(null);
    });

    ws.on('loading', (percent) => {
      console.log('Waveform loading:', percent);
    });

    // 针对流式播放的优化：监听 media 元素事件
    const media = ws.getMediaElement();
    if (media) {
      media.addEventListener('canplay', () => {
        setIsLoading(false);
      });
      media.addEventListener('waiting', () => {
        setIsLoading(true);
      });
      media.addEventListener('playing', () => {
        setIsLoading(false);
      });
      media.addEventListener('loadedmetadata', () => {
        setDuration(media.duration);
      });
    }

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
  }, [volume, loadTrack, getNextIndex]); 
  
  // 计算 hasPrevious 和 hasNext 状态
  const hasPrevious = useMemo(() => {
    // 列表为空
    if (playlist.length === 0) return false;
    // 单曲循环或随机播放模式下，总是允许切换（除非列表只有一首）
    if (playMode === 'loop' || playMode === 'shuffle') return playlist.length > 1;
    // 列表循环模式
    // 如果是第一首，上一曲会回到最后一首，所以只要列表大于1就有上一曲
    return playlist.length > 1; 
  }, [playlist.length, playMode]);

  const hasNext = useMemo(() => {
    // 列表为空
    if (playlist.length === 0) return false;
    // 单曲循环或随机播放模式下，总是允许切换（除非列表只有一首）
    if (playMode === 'loop' || playMode === 'shuffle') return playlist.length > 1;
    // 列表循环模式
    // 如果是最后一首，下一曲会回到第一首，所以只要列表大于1就有下一曲
    return playlist.length > 1; 
  }, [playlist.length, playMode]);

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
    artist,
    cover,
    playlist,
    currentIndex,
    hasPrevious,
    hasNext,
    playMode
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
    togglePlayMode
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
