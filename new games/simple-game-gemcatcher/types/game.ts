export interface GameObject {
  id: string;
  x: number;
  y: number;
  speed: number;
  type: 'gem' | 'bomb';
  color: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

export type GameState = 'menu' | 'playing' | 'gameOver';
