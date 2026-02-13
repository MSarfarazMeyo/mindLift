import { EnemyType, PowerUpType } from '@/constants/game';

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  vx: number;
  vy: number;
}

export interface Player extends Position {
  health: number;
  maxHealth: number;
  shield: boolean;
  rapidFire: boolean;
  spreadShot: boolean;
}

export interface Bullet extends Position, Velocity {
  id: string;
}

export interface Enemy extends Position, Velocity {
  id: string;
  type: EnemyType;
  health: number;
}

export interface PowerUp extends Position {
  id: string;
  type: PowerUpType;
}

export interface Particle extends Position, Velocity {
  id: string;
  life: number;
  color: string;
}

export interface EnemyLaser extends Position, Velocity {
  id: string;
}

export interface Star extends Position {
  id: string;
  speed: number;
  size: number;
  opacity: number;
}

export interface GameState {
  player: Player;
  bullets: Bullet[];
  enemies: Enemy[];
  powerUps: PowerUp[];
  particles: Particle[];
  enemyLasers: EnemyLaser[];
  stars: Star[];
  score: number;
  wave: number;
  gameOver: boolean;
  victory: boolean;
  isPaused: boolean;
  combo: number;
  comboTimer: number;
}
