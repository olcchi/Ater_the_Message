import { useState, useEffect } from 'react';
import DarkVeil from './DarkVeil';
import AudioWaveform from '@components/AudioWaveform';
import AudioPlayerProvider from '@components/AudioPlayerProvider';
import AudioPlayerControls from '@components/AudioPlayerControls';
import MusicSelector from './MusicSelector';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { PLAYLIST } from '@/data/playlist';
import { Button } from './ui/button';

function AudioExperienceContent() {
  const { state, controls, wavesurfer } = useAudioPlayer();
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [showCover, setShowCover] = useState(true);

  // 设置音频分析器用于可视化效果
  useEffect(() => {
    if (!wavesurfer) return;
    const media = wavesurfer.getMediaElement();
    if (!media) return;

    let ana: AnalyserNode | null = null;
    let ctx: AudioContext | null = null;

    try {
      // 使用共享的 AudioContext 避免重复创建
      if (!(window as any)._sharedAudioContext) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        (window as any)._sharedAudioContext = new AudioContext();
      }
      ctx = (window as any)._sharedAudioContext as AudioContext;
      
      if (!(window as any)._sharedMediaSources) {
        (window as any)._sharedMediaSources = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();
      }
      const sources = (window as any)._sharedMediaSources as WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>;

      ana = ctx.createAnalyser();
      ana.fftSize = 2048;
      ana.smoothingTimeConstant = 0.8;

      let source: MediaElementAudioSourceNode;
      if (sources.has(media)) {
        source = sources.get(media)!;
      } else {
        source = ctx.createMediaElementSource(media);
        sources.set(media, source);
      }

      try {
        source.connect(ana);
        ana.connect(ctx.destination);
      } catch (err) {
        console.warn("Audio node connection warning:", err);
      }

      setAnalyser(ana);
      
      const handlePlay = () => {
        if (ctx && ctx.state === 'suspended') {
          ctx.resume();
        }
      };
      
      wavesurfer.on('play', handlePlay);
      
      return () => {
        wavesurfer.un('play', handlePlay);
        if (ana) {
          try { 
            ana.disconnect(); 
          } catch(e) {}
        }
        setAnalyser(null);
      };

    } catch (e) {
      console.warn("Audio analysis setup failed:", e);
    }
  }, [wavesurfer]);

  // 处理曲目选择
  const handleSelectTrack = (index: number) => {
    controls.playTrack(index);
  };

  // 获取当前封面
  const currentCover = state.currentTrack?.cover || '/covers/cover.png';

  return (
    <>
      <div className="w-full h-full relative overflow-hidden flex justify-center pb-20">
        {/* 背景可视化 */}
        <div className="absolute inset-0 z-0">
          <DarkVeil
            hueShift={32}
            noiseIntensity={0}
            scanlineIntensity={0.1}
            speed={1}
            scanlineFrequency={5}
            warpAmount={0.2}
            resolutionScale={1}
            analyser={analyser}
          />
        </div>
        
        {/* 工具栏：视觉开关 + 音乐选择器 */}
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
            tracks={state.playlist}
            currentIndex={state.currentIndex}
            onSelectTrack={handleSelectTrack}
            isPlaying={state.isPlaying}
          />
        </div>

        {/* 主内容区 */}
        <div className="absolute inset-0 flex flex-col gap-10 items-center justify-center z-10 transition-all duration-500">
          {/* 封面 */}
          <div 
            className={`
              transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden
              ${showCover ? 'opacity-100 scale-100 max-h-[250px]' : 'opacity-0 scale-90 max-h-0'}
            `}
          >
            <img 
              src={currentCover} 
              alt={state.currentTrack?.title || 'Music Cover'} 
              width={250} 
              height={250} 
              decoding="async"
              className="shadow-2xl shadow-blue-900 animate-fade-in-up rounded-lg" 
              style={{ animationDelay: '0ms', animationFillMode: 'both' }}
            />
          </div>

          {/* 波形可视化 */}
          <div className="w-full flex justify-center animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
            <AudioWaveform 
              className="w-4/5 max-w-2xl transition-all duration-500"
              waveColor="#233169" 
              progressColor="#141C3A" 
              cursorColor="#4A2665" 
            />
          </div>
        </div>
        
        {/* 播放控制器 */}
        <AudioPlayerControls />
      </div>
    </>
  );
}

export default function AudioExperience() {
  return (
    <AudioPlayerProvider initialPlaylist={PLAYLIST} initialIndex={0}>
      <AudioExperienceContent />
    </AudioPlayerProvider>
  );
}
