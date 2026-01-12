export interface MusicTrack {
  id: string;
  title: string;
  artist?: string;
  src: string;
  cover: string;
}

export const PLAYLIST: MusicTrack[] = [
  {
    id: 'after-the-message',
    title: 'After the Message',
    src: '/music/After the Message.mp3',
    cover: '/covers/cover.png',
  },
  // 后续可以在这里添加更多音乐
];
