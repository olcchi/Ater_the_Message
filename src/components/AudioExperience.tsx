import { useState, useEffect } from 'react';
// import GradualBlur from '@components/ui/GradualBlur/GradualBlur';
import DarkVeil from './DarkVeil';
import AudioWaveform from '@components/AudioWaveform';
import AudioPlayerProvider from '@components/AudioPlayerProvider';
import AudioPlayerControls from '@components/AudioPlayerControls';
import MusicSelector from './MusicSelector';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { PLAYLIST } from '@/data/playlist';

function AudioExperienceContent() {
  const { state, controls } = useAudioPlayer();
  const [currentIndex, setCurrentIndex] = useState(0);

  // 当音乐切换时，更新当前索引
  useEffect(() => {
    const index = PLAYLIST.findIndex(music => music.src === state.audioUrl);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }, [state.audioUrl]);

  // 处理音乐选择
  const handleSelectMusic = (index: number) => {
    const music = PLAYLIST[index];
    if (music) {
      setCurrentIndex(index);
      controls.loadAudio(music.src, music.title, music.cover);
    }
  };

  // 获取当前音乐的封面
  const currentMusic = PLAYLIST[currentIndex] || PLAYLIST[0];
  const currentCover = state.cover || currentMusic?.cover || '/covers/cover.png';

  return (
    <>
      <div className="w-full h-full relative overflow-hidden flex justify-center pb-20">
        {/* <div className="absolute inset-0 bg-black/50 z-1" /> */}
        <div className="absolute inset-0 z-0">
          <DarkVeil
            hueShift={25}
            noiseIntensity={0}
            scanlineIntensity={0.1}
            speed={1}
            scanlineFrequency={5}
            warpAmount={0.2}
            resolutionScale={1}
          />
        </div>
        <div className="absolute inset-0 flex flex-col gap-10 items-center justify-center z-10">
          <img 
            src={currentCover} 
            alt={state.title || 'Untitled Music'} 
            width={250} 
            height={250} 
            decoding="async"
            className="shadow-2xl shadow-blue-900 animate-fade-in-up" 
            style={{ animationDelay: '0ms', animationFillMode: 'both' }}
          />
          <div className="w-full flex justify-center animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
            <AudioWaveform className="w-4/5 max-w-2xl" waveColor="#233169" progressColor="#141C3A" cursorColor="#4A2665" />
          </div>
        </div>
        {/* <GradualBlur
          position="top"
          height="12rem"
          strength={3}
        /> */}
        <AudioPlayerControls />
        <MusicSelector
          musicList={PLAYLIST}
          currentIndex={currentIndex}
          onSelectMusic={handleSelectMusic}
          isPlaying={state.isPlaying}
        />
      </div>
    </>
  );
}

export default function AudioExperience() {
  const defaultMusic = PLAYLIST[0];
  
  return (
    <AudioPlayerProvider
      defaultAudioUrl={defaultMusic?.src}
      defaultTitle={defaultMusic?.title}
      defaultCover={defaultMusic?.cover}
    >
      <AudioExperienceContent />
    </AudioPlayerProvider>
  );
}