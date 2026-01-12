import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { AudioPlayerContext } from '@/contexts/AudioPlayerContext';
import type { AudioPlayerState, AudioPlayerControls, Track, PlayMode } from '@/contexts/AudioPlayerContext';

interface AudioPlayerProviderProps {
  children: ReactNode;
  initialPlaylist?: Track[];
  initialIndex?: number;
}

export default function AudioPlayerProvider({
  children,
  initialPlaylist = [],
  initialIndex = 0
}: AudioPlayerProviderProps) {
  // ==================== 状态定义 ====================
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playlist, setPlaylistState] = useState<Track[]>(initialPlaylist);
  const [currentIndex, setCurrentIndex] = useState(
    initialPlaylist.length > 0 ? Math.min(initialIndex, initialPlaylist.length - 1) : -1
  );
  const [playMode, setPlayModeState] = useState<PlayMode>('repeat-all');
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
  
  // 随机播放序列
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);

  // ==================== Refs ====================
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const playlistRef = useRef(playlist);
  const currentIndexRef = useRef(currentIndex);
  const playModeRef = useRef(playMode);
  const shuffledIndicesRef = useRef(shuffledIndices);
  const volumeRef = useRef(volume);
  const currentTimeRef = useRef(currentTime);
  const volumeBeforeMuteRef = useRef(volume); // 静音前的音量
  const pendingAutoPlay = useRef(false);
  const mediaEventCleanupRef = useRef<(() => void) | null>(null); // 清理 media 事件监听器

  // 同步 refs
  useEffect(() => { playlistRef.current = playlist; }, [playlist]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { playModeRef.current = playMode; }, [playMode]);
  useEffect(() => { shuffledIndicesRef.current = shuffledIndices; }, [shuffledIndices]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
  useEffect(() => { wavesurferRef.current = wavesurfer; }, [wavesurfer]);

  // ==================== 派生状态 ====================
  const currentTrack = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < playlist.length) {
      return playlist[currentIndex];
    }
    return null;
  }, [playlist, currentIndex]);

  // ==================== 工具函数 ====================
  
  /**
   * 生成随机播放序列 (Fisher-Yates Shuffle)
   */
  const generateShuffledIndices = useCallback((length: number, currentIdx?: number) => {
    const indices = Array.from({ length }, (_, i) => i);
    for (let i = length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    // 如果有当前索引，确保它在序列开头
    if (currentIdx !== undefined && currentIdx >= 0 && currentIdx < length) {
      const pos = indices.indexOf(currentIdx);
      if (pos > 0) {
        [indices[0], indices[pos]] = [indices[pos], indices[0]];
      }
    }
    setShuffledIndices(indices);
    shuffledIndicesRef.current = indices;
    return indices;
  }, []);

  /**
   * 获取下一曲索引
   */
  const getNextIndex = useCallback((): number => {
    const len = playlistRef.current.length;
    const idx = currentIndexRef.current;
    const mode = playModeRef.current;
    
    if (len === 0) return -1;
    if (len === 1) return mode === 'sequential' ? -1 : 0;
    
    switch (mode) {
      case 'repeat-one':
        return idx;
      case 'shuffle': {
        const shuffled = shuffledIndicesRef.current;
        const pos = shuffled.indexOf(idx);
        if (pos === -1 || pos >= shuffled.length - 1) {
          // 重新生成随机序列
          const newShuffled = generateShuffledIndices(len);
          return newShuffled[0];
        }
        return shuffled[pos + 1];
      }
      case 'sequential':
        return idx >= len - 1 ? -1 : idx + 1;
      case 'repeat-all':
      default:
        return (idx + 1) % len;
    }
  }, [generateShuffledIndices]);

  /**
   * 获取上一曲索引
   */
  const getPreviousIndex = useCallback((): number => {
    const len = playlistRef.current.length;
    const idx = currentIndexRef.current;
    const mode = playModeRef.current;
    
    if (len === 0) return -1;
    if (len === 1) return 0;
    
    switch (mode) {
      case 'repeat-one':
        return idx;
      case 'shuffle': {
        const shuffled = shuffledIndicesRef.current;
        const pos = shuffled.indexOf(idx);
        if (pos <= 0) {
          return shuffled[shuffled.length - 1];
        }
        return shuffled[pos - 1];
      }
      case 'sequential':
      case 'repeat-all':
      default:
        return idx <= 0 ? len - 1 : idx - 1;
    }
  }, []);

  // ==================== 核心播放逻辑 ====================
  
  /**
   * 加载并播放指定索引的曲目
   */
  const loadAndPlayTrack = useCallback(async (index: number, autoPlay = true) => {
    const tracks = playlistRef.current;
    if (index < 0 || index >= tracks.length) return;
    
    const track = tracks[index];
    setCurrentIndex(index);
    currentIndexRef.current = index;
    setCurrentTime(0);
    setDuration(0);
    setError(null);
    
    const ws = wavesurferRef.current;
    if (!ws) {
      pendingAutoPlay.current = autoPlay;
      return;
    }
    
    setIsLoading(true);
    
    try {
      ws.empty();
      await ws.load(track.url);
      
      if (autoPlay) {
        await ws.play().catch(err => {
          console.warn('Auto-play failed:', err);
        });
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        console.log('Load aborted (expected during rapid switching)');
        return;
      }
      console.error('Failed to load audio:', err);
      setError(`无法加载音频: ${track.title}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ==================== 控制方法 ====================
  
  const play = useCallback(() => {
    wavesurferRef.current?.play();
  }, []);
  
  const pause = useCallback(() => {
    wavesurferRef.current?.pause();
  }, []);
  
  const togglePlayPause = useCallback(() => {
    wavesurferRef.current?.playPause();
  }, []);
  
  const seekTo = useCallback((time: number) => {
    const ws = wavesurferRef.current;
    if (ws && duration > 0) {
      ws.seekTo(Math.max(0, Math.min(time, duration)) / duration);
    }
  }, [duration]);
  
  const seekToPercent = useCallback((percent: number) => {
    const ws = wavesurferRef.current;
    if (ws) {
      ws.seekTo(Math.max(0, Math.min(1, percent)));
    }
  }, []);
  
  const setVolume = useCallback((newVolume: number) => {
    const vol = Math.max(0, Math.min(1, newVolume));
    setVolumeState(vol);
    wavesurferRef.current?.setVolume(vol);
    // 记录非零音量用于取消静音时恢复
    if (vol > 0) {
      volumeBeforeMuteRef.current = vol;
    }
    setIsMuted(vol === 0);
  }, []);
  
  const toggleMute = useCallback(() => {
    const ws = wavesurferRef.current;
    if (!ws) return;
    
    if (isMuted) {
      // 恢复到静音前的音量，若没有则使用 0.5
      const vol = volumeBeforeMuteRef.current > 0 ? volumeBeforeMuteRef.current : 0.5;
      ws.setVolume(vol);
      setVolumeState(vol);
      setIsMuted(false);
    } else {
      // 记录当前音量然后静音
      if (volumeRef.current > 0) {
        volumeBeforeMuteRef.current = volumeRef.current;
      }
      ws.setVolume(0);
      setIsMuted(true);
    }
  }, [isMuted]);
  
  const setPlaylist = useCallback((tracks: Track[], startIndex = 0) => {
    setPlaylistState(tracks);
    playlistRef.current = tracks;
    
    if (tracks.length > 0) {
      const idx = Math.max(0, Math.min(startIndex, tracks.length - 1));
      if (playModeRef.current === 'shuffle') {
        generateShuffledIndices(tracks.length, idx);
      }
      loadAndPlayTrack(idx, true);
    } else {
      setCurrentIndex(-1);
      currentIndexRef.current = -1;
      wavesurferRef.current?.empty();
    }
  }, [loadAndPlayTrack, generateShuffledIndices]);
  
  const playTrack = useCallback((index: number) => {
    loadAndPlayTrack(index, true);
  }, [loadAndPlayTrack]);
  
  const playTrackById = useCallback((id: string) => {
    const index = playlistRef.current.findIndex(t => t.id === id);
    if (index !== -1) {
      loadAndPlayTrack(index, true);
    }
  }, [loadAndPlayTrack]);
  
  const skipToNext = useCallback(() => {
    const nextIdx = getNextIndex();
    if (nextIdx !== -1) {
      loadAndPlayTrack(nextIdx, true);
    }
  }, [getNextIndex, loadAndPlayTrack]);
  
  const skipToPrevious = useCallback(() => {
    // 如果当前播放超过 3 秒，重新播放当前曲目（使用 ref 避免频繁重建）
    if (currentTimeRef.current > 3) {
      seekTo(0);
      return;
    }
    const prevIdx = getPreviousIndex();
    if (prevIdx !== -1) {
      loadAndPlayTrack(prevIdx, true);
    }
  }, [seekTo, getPreviousIndex, loadAndPlayTrack]);
  
  const setPlayMode = useCallback((mode: PlayMode) => {
    setPlayModeState(mode);
    if (mode === 'shuffle' && playlistRef.current.length > 0) {
      generateShuffledIndices(playlistRef.current.length, currentIndexRef.current);
    }
  }, [generateShuffledIndices]);
  
  const cyclePlayMode = useCallback(() => {
    const modes: PlayMode[] = ['repeat-all', 'repeat-one', 'shuffle', 'sequential'];
    const currentIdx = modes.indexOf(playModeRef.current);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    setPlayMode(nextMode);
  }, [setPlayMode]);

  // ==================== WaveSurfer 注册 ====================
  
  const registerWavesurfer = useCallback((ws: WaveSurfer | null) => {
    // 清理旧的 media 事件监听器
    if (mediaEventCleanupRef.current) {
      mediaEventCleanupRef.current();
      mediaEventCleanupRef.current = null;
    }
    
    // 清理旧实例
    if (wavesurferRef.current && wavesurferRef.current !== ws) {
      try {
        wavesurferRef.current.destroy();
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
    ws.setVolume(volumeRef.current);
    
    // 事件监听
    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('timeupdate', setCurrentTime);
    ws.on('ready', () => {
      setDuration(ws.getDuration());
      setError(null);
      setIsLoading(false);
    });
    
    ws.on('error', (err) => {
      if (err?.name === 'AbortError' || err?.toString().includes('aborted')) {
        return;
      }
      console.error('WaveSurfer error:', err);
      setError(`播放错误: ${err.message || '未知错误'}`);
      setIsLoading(false);
    });
    
    ws.on('finish', () => {
      setIsPlaying(false);
      const mode = playModeRef.current;
      
      if (mode === 'repeat-one') {
        ws.seekTo(0);
        ws.play();
      } else {
        const nextIdx = getNextIndex();
        if (nextIdx !== -1) {
          loadAndPlayTrack(nextIdx, true);
        }
      }
    });
    
    // 流式播放优化 - 添加 media 事件监听器并保存清理函数
    const media = ws.getMediaElement();
    if (media) {
      const handleCanPlay = () => setIsLoading(false);
      const handleWaiting = () => setIsLoading(true);
      const handlePlaying = () => setIsLoading(false);
      const handleLoadedMetadata = () => setDuration(media.duration);
      
      media.addEventListener('canplay', handleCanPlay);
      media.addEventListener('waiting', handleWaiting);
      media.addEventListener('playing', handlePlaying);
      media.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      // 保存清理函数
      mediaEventCleanupRef.current = () => {
        media.removeEventListener('canplay', handleCanPlay);
        media.removeEventListener('waiting', handleWaiting);
        media.removeEventListener('playing', handlePlaying);
        media.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
    
    // 初始加载
    const track = playlistRef.current[currentIndexRef.current];
    if (track) {
      const shouldAutoPlay = pendingAutoPlay.current;
      pendingAutoPlay.current = false;
      
      setIsLoading(true);
      ws.load(track.url).then(() => {
        if (shouldAutoPlay) {
          ws.play().catch(console.warn);
        }
      }).catch(err => {
        if (err.name !== 'AbortError') {
          setError(`无法加载音频: ${track.title}`);
        }
        setIsLoading(false);
      });
    }
  }, [getNextIndex, loadAndPlayTrack]);

  // ==================== Media Session API ====================
  
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack?.title || '未知音乐',
      artist: currentTrack?.artist || '',
      artwork: currentTrack?.cover 
        ? [{ src: currentTrack.cover, sizes: '512x512', type: 'image/png' }] 
        : []
    });
    
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', play],
      ['pause', pause],
      ['previoustrack', skipToPrevious],
      ['nexttrack', skipToNext],
      ['seekto', (details) => details.seekTime !== undefined && seekTo(details.seekTime)]
    ];
    
    handlers.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // 忽略不支持的动作
      }
    });
  }, [currentTrack, isPlaying, play, pause, skipToNext, skipToPrevious, seekTo]);

  // ==================== 构建 Context 值 ====================
  
  const state: AudioPlayerState = {
    isPlaying,
    isLoading,
    error,
    duration,
    currentTime,
    volume,
    isMuted,
    currentTrack,
    playlist,
    currentIndex,
    playMode
  };
  
  const controls: AudioPlayerControls = {
    play,
    pause,
    togglePlayPause,
    seekTo,
    seekToPercent,
    setVolume,
    toggleMute,
    setPlaylist,
    playTrack,
    playTrackById,
    skipToNext,
    skipToPrevious,
    setPlayMode,
    cyclePlayMode
  };

  return (
    <AudioPlayerContext.Provider value={{ state, controls, wavesurfer, registerWavesurfer }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}
