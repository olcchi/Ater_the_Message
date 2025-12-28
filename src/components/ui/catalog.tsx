import GradualBlur from './GradualBlur/GradualBlur';
import DarkVeil from '../../components/DarkVeil';
import AudioWaveform from '../AudioWaveform';
import AudioPlayerProvider from '../AudioPlayerProvider';
import AudioPlayerControls from '../AudioPlayerControls';

export default function Catalog() {
  return (
    <AudioPlayerProvider
      defaultAudioUrl="/After the Message.mp3"
      defaultTitle="After the Message"
      defaultCover="/cover.png"
    >
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
          <img src="/cover.png" alt="Untitled Music" width={250} height={250} className="" />
          <AudioWaveform className="w-4/5 max-w-2xl" waveColor="#233169" progressColor="#141C3A" cursorColor="#4A2665" />
        </div>
        <GradualBlur
          position="top"
          height="12rem"
          strength={3}
        />
        <AudioPlayerControls
         />
      </div>
    </AudioPlayerProvider>
  );
}