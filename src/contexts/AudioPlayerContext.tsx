import { createContext, useContext, ReactNode } from 'react';
import WaveSurfer from 'wavesurfer.js';

export interface AudioPlayerState {
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  isLoading: boolean;
  error: string | null;
  volume: number;
  isMuted: boolean;
  audioUrl: string | null;
  title?: string;
  cover?: string;
}

export interface AudioPlayerControls {
  togglePlayPause: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  seekTo: (time: number) => void;
  loadAudio: (url: string, title?: string, cover?: string) => void;
}

export interface AudioPlayerContextValue {
  state: AudioPlayerState;
  controls: AudioPlayerControls;
  wavesurfer: WaveSurfer | null;
  setWavesurfer: (wavesurfer: WaveSurfer | null) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  // 这个 provider 将在 AudioWaveform 中实现
  return <>{children}</>;
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  }
  return context;
}

export { AudioPlayerContext };




