import { create } from 'zustand';

const usePlayerStore = create((set, get) => ({
  currentMusic: null,
  playlist: [],
  currentIndex: 0,
  isPlaying: false,
  volume: 0.7,

  setCurrentMusic: (music) => {
    const { playlist } = get();
    const index = playlist.findIndex(m => m.id === music.id);
    if (index >= 0) {
      set({ currentMusic: music, currentIndex: index, isPlaying: true });
    } else {
      set({ currentMusic: music, playlist: [music], currentIndex: 0, isPlaying: true });
    }
  },

  setPlaylist: (musics) => set({ playlist: musics }),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),

  next: () => {
    const { playlist, currentIndex, isPlaying } = get();
    if (playlist.length > 0) {
      const nextIndex = (currentIndex + 1) % playlist.length;
      set({ 
        currentMusic: playlist[nextIndex], 
        currentIndex: nextIndex,
        isPlaying: isPlaying
      });
    }
  },

  prev: () => {
    const { playlist, currentIndex, isPlaying } = get();
    if (playlist.length > 0) {
      const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
      set({ 
        currentMusic: playlist[prevIndex], 
        currentIndex: prevIndex,
        isPlaying: isPlaying
      });
    }
  },

  setVolume: (volume) => set({ volume }),
}));

export default usePlayerStore;
