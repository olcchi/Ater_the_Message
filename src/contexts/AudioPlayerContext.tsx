import { createContext, useContext, type ReactNode } from 'react';
import WaveSurfer from 'wavesurfer.js';

/**
 * 音轨定义
 */
export interface Track {
  id: string;
  url: string;
  title: string;
  artist?: string;
  cover?: string;
}

/**
 * 播放模式
 * - sequential: 顺序播放，播完列表停止
 * - repeat-all: 列表循环，播完从头开始
 * - repeat-one: 单曲循环
 * - shuffle: 随机播放
 */
export type PlayMode = 'sequential' | 'repeat-all' | 'repeat-one' | 'shuffle';

/**
 * 播放器状态
 */
export interface AudioPlayerState {
  // 播放状态
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  
  // 时间信息
  duration: number;
  currentTime: number;
  
  // 音量
  volume: number;
  isMuted: boolean;
  
  // 当前曲目
  currentTrack: Track | null;
  
  // 播放列表
  playlist: Track[];
  currentIndex: number;
  
  // 播放模式
  playMode: PlayMode;
}

/**
 * 播放器控制方法
 */
export interface AudioPlayerControls {
  // 播放控制
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  
  // 进度控制
  seekTo: (time: number) => void;
  seekToPercent: (percent: number) => void;
  
  // 音量控制
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  
  // 列表控制
  setPlaylist: (tracks: Track[], startIndex?: number) => void;
  playTrack: (index: number) => void;
  playTrackById: (id: string) => void;
  
  // 导航
  skipToNext: () => void;
  skipToPrevious: () => void;
  
  // 播放模式
  setPlayMode: (mode: PlayMode) => void;
  cyclePlayMode: () => void;
}

/**
 * Context 值
 */
export interface AudioPlayerContextValue {
  state: AudioPlayerState;
  controls: AudioPlayerControls;
  wavesurfer: WaveSurfer | null;
  registerWavesurfer: (ws: WaveSurfer | null) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

// 注意：实际的 AudioPlayerProvider 实现在 @components/AudioPlayerProvider.tsx
// 此处不再导出空壳 Provider，避免误用

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  }
  return context;
}

export { AudioPlayerContext };
