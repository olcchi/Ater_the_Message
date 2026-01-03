import { useState, useEffect } from 'react';
import GradualBlur from '@components/ui/GradualBlur/GradualBlur';
import DarkVeil from './DarkVeil';
import AudioWaveform from '@components/AudioWaveform';
import AudioPlayerProvider from '@components/AudioPlayerProvider';
import AudioPlayerControls from '@components/AudioPlayerControls';
import MusicSelector, { type MusicItem } from './MusicSelector';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';

// 音乐列表数据
const MUSIC_LIST: MusicItem[] = [
  {
    url: '/After the Message.mp3',
    title: 'After the Message',
    cover: '/cover.png',
    number: 1
  },
  {
    url: '/After the Message copy2.mp3',
    title: 'After the Message copy2',
    cover: '/cover.png',
    number: 2
  },
  {
    url: '/After the Message copy.mp3',
    title: 'After the Message copy',
    cover: '/cover.png',
    number: 3
  },
];

function AudioExperienceContent() {
  const { state, controls } = useAudioPlayer();
  const [currentIndex, setCurrentIndex] = useState(0);

  // 当音乐切换时，更新当前索引
  useEffect(() => {
    const index = MUSIC_LIST.findIndex(music => music.url === state.audioUrl);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }, [state.audioUrl]);

  // 处理音乐选择
  const handleSelectMusic = (index: number) => {
    const music = MUSIC_LIST[index];
    if (music) {
      setCurrentIndex(index);
      controls.loadAudio(music.url, music.title, music.cover);
    }
  };

  // 获取当前音乐的封面
  const currentMusic = MUSIC_LIST[currentIndex] || MUSIC_LIST[0];
  const currentCover = state.cover || currentMusic?.cover || '/cover.png';

  return (
    <>
      <div className="w-screen h-screen relative overflow-hidden flex justify-center pb-20">
        <div className="absolute inset-0 bg-black/50 z-1" />
        <div className="absolute inset-0 z-0">
          <DarkVeil
            hueShift={21}
            noiseIntensity={0.02}
            scanlineIntensity={0.1}
            speed={0.8}
            scanlineFrequency={5}
            warpAmount={0.2}
            resolutionScale={1}
          />
        </div>
        <div className="absolute inset-0 flex flex-col gap-10 items-center justify-center z-10">
          <img src={currentCover} alt={state.title || 'Untitled Music'} width={250} height={250} className="shadow-2xl shadow-blue-900" />
          <AudioWaveform className="w-4/5 max-w-2xl" waveColor="#233169" progressColor="#141C3A" cursorColor="#4A2665" />
        </div>
        <GradualBlur
          position="top"
          height="12rem"
          strength={3}
        />
        <AudioPlayerControls />
        <MusicSelector
          musicList={MUSIC_LIST}
          currentIndex={currentIndex}
          onSelectMusic={handleSelectMusic}
        />
      </div>
    </>
  );
}

export default function AudioExperience() {
  const defaultMusic = MUSIC_LIST[0];
  
  return (
    <AudioPlayerProvider
      defaultAudioUrl={defaultMusic?.url}
      defaultTitle={defaultMusic?.title}
      defaultCover={defaultMusic?.cover}
    >
      <AudioExperienceContent />
    </AudioPlayerProvider>
  );
}