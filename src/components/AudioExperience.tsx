import { useState, useEffect } from 'react';
// import GradualBlur from '@components/ui/GradualBlur/GradualBlur';
import DarkVeil from './DarkVeil';
import AudioWaveform from '@components/AudioWaveform';
import AudioPlayerProvider from '@components/AudioPlayerProvider';
import AudioPlayerControls from '@components/AudioPlayerControls';
import MusicSelector from './MusicSelector';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { PLAYLIST } from '@/data/playlist';
import { Button } from './ui/button';

function AudioExperienceContent() {
  const { state, controls } = useAudioPlayer();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCover, setShowCover] = useState(true);

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
      controls.loadAudio(music.src, music.title, music.cover, music.artist);
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
        
        {/* 工具栏区：视觉开关 + 音乐选择 */}
        <div 
          className="fixed z-50 top-4 right-4 flex items-center gap-2 animate-fade-in-up"
          style={{ animationDelay: '300ms', animationFillMode: 'both' }}
        >
           <Button
             variant="ghost"
             size="icon"
             onClick={() => setShowCover(!showCover)}
             className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm border border-neutral-900 text-white hover:bg-neutral-900 hover:text-white transition-all"
             title={showCover ? "隐藏封面" : "显示封面"}
           >
             {showCover ? (
               <span className="i-carbon-view-off text-lg" />
             ) : (
               <span className="i-carbon-view text-lg" />
             )}
           </Button>
           
           <MusicSelector
             musicList={PLAYLIST}
             currentIndex={currentIndex}
             onSelectMusic={handleSelectMusic}
             isPlaying={state.isPlaying}
             className=""
           />
        </div>

        <div className="absolute inset-0 flex flex-col gap-10 items-center justify-center z-10 transition-all duration-500">
          {/* 封面区域 - 根据 showCover 状态控制显示/隐藏 */}
          <div 
            className={`
              transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden
              ${showCover ? 'opacity-100 scale-100 max-h-[250px]' : 'opacity-0 scale-90 max-h-0'}
            `}
          >
            <img 
              src={currentCover} 
              alt={state.title || 'Untitled Music'} 
              width={250} 
              height={250} 
              decoding="async"
              className="shadow-2xl shadow-blue-900 animate-fade-in-up rounded-lg" 
              style={{ animationDelay: '0ms', animationFillMode: 'both' }}
            />
          </div>

          <div className="w-full flex justify-center animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
            <AudioWaveform 
              className="w-4/5 max-w-2xl transition-all duration-500"
              waveColor="#233169" 
              progressColor="#141C3A" 
              cursorColor="#4A2665" 
            />
          </div>
        </div>
        {/* <GradualBlur
          position="top"
          height="12rem"
          strength={3}
        /> */}
        <AudioPlayerControls />
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
      defaultArtist={defaultMusic?.artist}
    >
      <AudioExperienceContent />
    </AudioPlayerProvider>
  );
}
