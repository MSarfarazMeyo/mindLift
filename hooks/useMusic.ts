// hooks/useMusic.ts
import { useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';

// Local music files configuration
export const musicFiles = {
  gemcatcher: require('@/assets/audio/gemcatcher.mp3'),
  colormatch: require('@/assets/audio/colormatch.mp3'),
  endlessrunner: require('@/assets/audio/endlessrunner.mp3'),
  breakout: require('@/assets/audio/breakout.mp3'),
};

type MusicName = keyof typeof musicFiles;

// Global singleton music manager
class MusicManager {
  private static instance: MusicManager;
  private sounds: Map<MusicName, Audio.Sound> = new Map();
  private loaded: Set<MusicName> = new Set();
  private loading: Set<MusicName> = new Set();

  private constructor() {}

  static getInstance(): MusicManager {
    if (!MusicManager.instance) {
      MusicManager.instance = new MusicManager();
    }
    return MusicManager.instance;
  }

  async loadAll() {
    const names = Object.keys(musicFiles) as MusicName[];
    await Promise.all(names.map((name) => this.load(name)));
  }

  async load(name: MusicName) {
    if (this.loaded.has(name) || this.loading.has(name)) return;

    this.loading.add(name);
    try {
      const { sound } = await Audio.Sound.createAsync(musicFiles[name], {
        isLooping: true,
        volume: 0.3,
        shouldPlay: false,
      });
      this.sounds.set(name, sound);
      this.loaded.add(name);
    } catch (error) {
      console.error(`Error loading ${name}:`, error);
    } finally {
      this.loading.delete(name);
    }
  }

  async play(name: MusicName) {
    const sound = this.sounds.get(name);
    if (!sound) {
      console.warn(`Music "${name}" not loaded`);
      return;
    }

    try {
      // Pause all other tracks
      for (const [key, s] of this.sounds) {
        if (key !== name) {
          await s.pauseAsync();
        }
      }

      // Play this track
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await sound.stopAsync();
        }
        await sound.playAsync();
      }
    } catch (error) {
      console.error(`Error playing ${name}:`, error);
    }
  }

  async pause(name: MusicName) {
    const sound = this.sounds.get(name);
    if (!sound) return;

    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await sound.pauseAsync();
      }
    } catch (error) {
      console.error(`Error pausing ${name}:`, error);
    }
  }

  async unloadAll() {
    for (const sound of this.sounds.values()) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.error('Error unloading:', error);
      }
    }
    this.sounds.clear();
    this.loaded.clear();
  }

  isLoaded(): boolean {
    return this.loaded.size === Object.keys(musicFiles).length;
  }
}

export function useMusic() {
  const [isLoaded, setIsLoaded] = useState(false);
  const manager = useRef(MusicManager.getInstance()).current;

  useEffect(() => {
    const checkLoaded = () => {
      setIsLoaded(manager.isLoaded());
    };

    // Check immediately
    checkLoaded();

    // Check periodically until loaded
    const interval = setInterval(() => {
      if (manager.isLoaded()) {
        setIsLoaded(true);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [manager]);

  return {
    isLoaded,
    loadAll: () => manager.loadAll(),
    unloadAll: () => manager.unloadAll(),
    play: (name: MusicName) => manager.play(name),
    pause: (name: MusicName) => manager.pause(name),
  };
}
