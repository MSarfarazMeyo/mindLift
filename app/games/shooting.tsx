import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  PanResponder,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { addGamePoints } from '@/lib/gamePoints';
import {
  GAME_CONFIG,
  COLORS,
  EnemyType,
  PowerUpType,
} from '@/constants/shootingGame';
import type {
  GameState,
  Enemy,
  Bullet,
  PowerUp,
  Particle,
  EnemyLaser,
  Star,
} from '@/types/shootingGame';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const [gameState, setGameState] = useState<GameState>({
    player: {
      x: SCREEN_WIDTH / 2,
      y: SCREEN_HEIGHT - 150 - insets.bottom,
      health: 100,
      maxHealth: 100,
      shield: false,
      rapidFire: false,
      spreadShot: false,
    },
    bullets: [],
    enemies: [],
    powerUps: [],
    particles: [],
    enemyLasers: [],
    stars: [],
    score: 0,
    wave: 1,
    gameOver: false,
    victory: false,
    isPaused: false,
    combo: 0,
    comboTimer: 0,
  });

  const [isStarted, setIsStarted] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(false);
  const lastFireTime = useRef(0);
  const lastEnemyFireTime = useRef<{ [key: string]: number }>({});
  const powerUpTimers = useRef<{
    [key: string]: ReturnType<typeof setTimeout>;
  }>({});
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const enemySpawnRef = useRef<NodeJS.Timeout | null>(null);
  const waveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const comboTimerRef = useRef<NodeJS.Timeout | null>(null);

  const playerPosition = useRef({
    x: SCREEN_WIDTH / 2,
    y: SCREEN_HEIGHT - 150 - insets.bottom,
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
        }
      },
      onPanResponderMove: (_, gestureState) => {
        const newX = Math.max(
          GAME_CONFIG.PLAYER_SIZE / 2,
          Math.min(
            SCREEN_WIDTH - GAME_CONFIG.PLAYER_SIZE / 2,
            gestureState.moveX,
          ),
        );
        const newY = Math.max(
          insets.top + 100,
          Math.min(
            SCREEN_HEIGHT - GAME_CONFIG.PLAYER_SIZE / 2 - insets.bottom,
            gestureState.moveY,
          ),
        );

        playerPosition.current = { x: newX, y: newY };

        setGameState((prev) => ({
          ...prev,
          player: { ...prev.player, x: newX, y: newY },
        }));
      },
    }),
  ).current;

  const createBullet = useCallback(() => {
    const now = Date.now();
    const fireRate = gameState.player.rapidFire
      ? GAME_CONFIG.RAPID_FIRE_RATE
      : GAME_CONFIG.FIRE_RATE;

    if (now - lastFireTime.current < fireRate) return;
    lastFireTime.current = now;

    const bullets: Bullet[] = [];

    if (gameState.player.spreadShot) {
      const angles = [-0.3, 0, 0.3];
      angles.forEach((angle) => {
        bullets.push({
          id: `bullet-${now}-${Math.random()}`,
          x: playerPosition.current.x,
          y: playerPosition.current.y - GAME_CONFIG.PLAYER_SIZE / 2,
          vx: Math.sin(angle) * GAME_CONFIG.BULLET_SPEED,
          vy: -Math.cos(angle) * GAME_CONFIG.BULLET_SPEED,
        });
      });
    } else {
      bullets.push({
        id: `bullet-${now}-${Math.random()}`,
        x: playerPosition.current.x,
        y: playerPosition.current.y - GAME_CONFIG.PLAYER_SIZE / 2,
        vx: 0,
        vy: -GAME_CONFIG.BULLET_SPEED,
      });
    }

    setGameState((prev) => ({
      ...prev,
      bullets: [...prev.bullets, ...bullets],
    }));

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [gameState.player.rapidFire, gameState.player.spreadShot]);

  const spawnEnemy = useCallback((wave: number) => {
    const types: EnemyType[] = ['SMALL', 'MEDIUM'];
    if (wave >= 3) types.push('LARGE');
    if (wave >= 5 && wave % 5 === 0) types.push('BOSS');

    const type = types[Math.floor(Math.random() * types.length)];
    const size = GAME_CONFIG.ENEMY_SIZES[type];
    const baseSpeed = GAME_CONFIG.ENEMY_SPEEDS[type];
    const speedMultiplier = 1 + (wave - 1) * 0.15;
    const speed = baseSpeed * speedMultiplier;

    const baseHealth =
      type === 'BOSS' ? 10 : type === 'LARGE' ? 3 : type === 'MEDIUM' ? 2 : 1;
    const healthMultiplier = 1 + Math.floor((wave - 1) / 2) * 0.5;
    const health = Math.ceil(baseHealth * healthMultiplier);

    const enemy: Enemy = {
      id: `enemy-${Date.now()}-${Math.random()}`,
      x: Math.random() * (SCREEN_WIDTH - size) + size / 2,
      y: -size,
      vx: (Math.random() - 0.5) * (2 + wave * 0.2),
      vy: speed,
      type,
      health,
    };

    setGameState((prev) => ({
      ...prev,
      enemies: [...prev.enemies, enemy],
    }));
  }, []);

  const spawnPowerUp = useCallback((wave: number) => {
    const spawnChance = Math.max(0.12, 0.18 - (wave - 1) * 0.008);
    if (Math.random() > spawnChance) return;

    const types: PowerUpType[] = [
      'RAPID_FIRE',
      'SHIELD',
      'HEALTH',
      'SPREAD_SHOT',
    ];
    const type = types[Math.floor(Math.random() * types.length)];

    const powerUp: PowerUp = {
      id: `powerup-${Date.now()}-${Math.random()}`,
      x:
        Math.random() * (SCREEN_WIDTH - GAME_CONFIG.POWERUP_SIZE) +
        GAME_CONFIG.POWERUP_SIZE / 2,
      y: -GAME_CONFIG.POWERUP_SIZE,
      type,
    };

    setGameState((prev) => ({
      ...prev,
      powerUps: [...prev.powerUps, powerUp],
    }));
  }, []);

  const createExplosion = useCallback(
    (x: number, y: number, color: string, count: number = 10) => {
      const particles: Particle[] = [];
      const baseId = `${Date.now()}-${Math.random()}`;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = 3 + Math.random() * 4;
        particles.push({
          id: `particle-${baseId}-${i}`,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color,
        });
      }

      setGameState((prev) => ({
        ...prev,
        particles: [...prev.particles, ...particles],
      }));
    },
    [],
  );

  const initStars = useCallback(() => {
    const stars: Star[] = [];
    for (let i = 0; i < GAME_CONFIG.STAR_COUNT; i++) {
      stars.push({
        id: `star-${i}`,
        x: Math.random() * SCREEN_WIDTH,
        y: Math.random() * SCREEN_HEIGHT,
        speed: 0.5 + Math.random() * 2,
        size: 1 + Math.random() * 2,
        opacity: 0.3 + Math.random() * 0.7,
      });
    }
    return stars;
  }, []);

  const checkCollision = useCallback(
    (
      x1: number,
      y1: number,
      size1: number,
      x2: number,
      y2: number,
      size2: number,
    ): boolean => {
      const dx = x1 - x2;
      const dy = y1 - y2;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < (size1 + size2) / 2;
    },
    [],
  );

  const gameLoop = useCallback(() => {
    setGameState((prev) => {
      if (prev.gameOver || prev.isPaused) return prev;

      let newState = { ...prev };
      let scoreIncrease = 0;

      newState.bullets = newState.bullets
        .map((bullet) => ({
          ...bullet,
          x: bullet.x + bullet.vx,
          y: bullet.y + bullet.vy,
        }))
        .filter((bullet) => bullet.y > -20);

      newState.enemies = newState.enemies.map((enemy) => {
        const size =
          GAME_CONFIG.ENEMY_SIZES[
            enemy.type as keyof typeof GAME_CONFIG.ENEMY_SIZES
          ];
        let newX = enemy.x + enemy.vx;

        if (newX - size / 2 < 0 || newX + size / 2 > SCREEN_WIDTH) {
          enemy.vx *= -1;
          newX = enemy.x + enemy.vx;
        }

        return {
          ...enemy,
          x: newX,
          y: enemy.y + enemy.vy,
        };
      });

      newState.enemies.forEach((enemy) => {
        if (enemy.y > SCREEN_HEIGHT + 50) {
          newState.enemies = newState.enemies.filter((e) => e.id !== enemy.id);
          return;
        }

        const enemySize =
          GAME_CONFIG.ENEMY_SIZES[
            enemy.type as keyof typeof GAME_CONFIG.ENEMY_SIZES
          ];

        newState.bullets.forEach((bullet) => {
          if (
            checkCollision(
              bullet.x,
              bullet.y,
              GAME_CONFIG.BULLET_SIZE,
              enemy.x,
              enemy.y,
              enemySize,
            )
          ) {
            enemy.health -= 1;

            newState.bullets = newState.bullets.filter(
              (b) => b.id !== bullet.id,
            );

            if (enemy.health <= 0) {
              newState.combo += 1;
              const basePoints =
                enemy.type === 'BOSS'
                  ? 500
                  : enemy.type === 'LARGE'
                    ? 50
                    : enemy.type === 'MEDIUM'
                      ? 20
                      : 10;
              const multiplier = Math.min(newState.combo, 10);
              scoreIncrease += basePoints * multiplier;

              if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
              comboTimerRef.current = setTimeout(() => {
                setGameState((s) => ({ ...s, combo: 0 }));
              }, GAME_CONFIG.COMBO_TIMEOUT);

              createExplosion(
                enemy.x,
                enemy.y,
                enemy.type === 'BOSS'
                  ? COLORS.ENEMY_BOSS
                  : enemy.type === 'LARGE'
                    ? COLORS.ENEMY_LARGE
                    : enemy.type === 'MEDIUM'
                      ? COLORS.ENEMY_MEDIUM
                      : COLORS.ENEMY_SMALL,
                enemy.type === 'BOSS' ? 20 : 10,
              );

              newState.enemies = newState.enemies.filter(
                (e) => e.id !== enemy.id,
              );

              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
                  () => {},
                );
              }
            }
          }
        });

        if (
          checkCollision(
            newState.player.x,
            newState.player.y,
            GAME_CONFIG.PLAYER_SIZE,
            enemy.x,
            enemy.y,
            enemySize,
          )
        ) {
          if (newState.player.shield) {
            newState.player.shield = false;
            createExplosion(enemy.x, enemy.y, COLORS.SHIELD, 15);
          } else {
            newState.player.health -=
              enemy.type === 'BOSS' ? 30 : enemy.type === 'LARGE' ? 20 : 10;
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error,
              ).catch(() => {});
            }
          }

          newState.enemies = newState.enemies.filter((e) => e.id !== enemy.id);
          createExplosion(enemy.x, enemy.y, COLORS.ENEMY_SMALL, 10);
          newState.combo = 0;
          if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
        }
      });

      newState.enemies.forEach((enemy) => {
        const now = Date.now();
        const lastFire = lastEnemyFireTime.current[enemy.id] || 0;
        const fireRateMultiplier = Math.max(
          0.4,
          1 - (newState.wave - 1) * 0.08,
        );
        const adjustedFireRate =
          GAME_CONFIG.ENEMY_FIRE_RATE * fireRateMultiplier;
        const shootProbability = Math.min(
          0.02 + (newState.wave - 1) * 0.005,
          0.06,
        );

        if (
          enemy.y > 100 &&
          enemy.y < SCREEN_HEIGHT - 200 &&
          now - lastFire > adjustedFireRate
        ) {
          if (Math.random() < shootProbability) {
            lastEnemyFireTime.current[enemy.id] = now;
            const dx = newState.player.x - enemy.x;
            const dy = newState.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const laserSpeedMultiplier = 1 + (newState.wave - 1) * 0.1;
            const vx =
              (dx / distance) *
              GAME_CONFIG.ENEMY_LASER_SPEED *
              laserSpeedMultiplier;
            const vy =
              (dy / distance) *
              GAME_CONFIG.ENEMY_LASER_SPEED *
              laserSpeedMultiplier;

            const laser: EnemyLaser = {
              id: `laser-${now}-${Math.random()}`,
              x: enemy.x,
              y:
                enemy.y +
                GAME_CONFIG.ENEMY_SIZES[
                  enemy.type as keyof typeof GAME_CONFIG.ENEMY_SIZES
                ] /
                  2,
              vx,
              vy,
            };

            newState.enemyLasers = [...newState.enemyLasers, laser];
          }
        }
      });

      newState.powerUps = newState.powerUps.map((powerUp) => ({
        ...powerUp,
        y: powerUp.y + GAME_CONFIG.POWERUP_SPEED,
      }));

      newState.powerUps.forEach((powerUp) => {
        if (
          checkCollision(
            newState.player.x,
            newState.player.y,
            GAME_CONFIG.PLAYER_SIZE,
            powerUp.x,
            powerUp.y,
            GAME_CONFIG.POWERUP_SIZE,
          )
        ) {
          if (powerUp.type === 'RAPID_FIRE') {
            newState.player.rapidFire = true;
            if (powerUpTimers.current.rapidFire) {
              clearTimeout(powerUpTimers.current.rapidFire);
            }
            powerUpTimers.current.rapidFire = setTimeout(() => {
              setGameState((s) => ({
                ...s,
                player: { ...s.player, rapidFire: false },
              }));
            }, GAME_CONFIG.POWERUP_DURATION);
          } else if (powerUp.type === 'SHIELD') {
            newState.player.shield = true;
          } else if (powerUp.type === 'HEALTH') {
            newState.player.health = Math.min(
              newState.player.maxHealth,
              newState.player.health + 30,
            );
          } else if (powerUp.type === 'SPREAD_SHOT') {
            newState.player.spreadShot = true;
            if (powerUpTimers.current.spreadShot) {
              clearTimeout(powerUpTimers.current.spreadShot);
            }
            powerUpTimers.current.spreadShot = setTimeout(() => {
              setGameState((s) => ({
                ...s,
                player: { ...s.player, spreadShot: false },
              }));
            }, GAME_CONFIG.POWERUP_DURATION);
          }

          newState.powerUps = newState.powerUps.filter(
            (p) => p.id !== powerUp.id,
          );

          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            ).catch(() => {});
          }
        }
      });

      newState.powerUps = newState.powerUps.filter(
        (powerUp) => powerUp.y < SCREEN_HEIGHT + 50,
      );

      newState.enemyLasers = newState.enemyLasers
        .map((laser) => ({
          ...laser,
          x: laser.x + laser.vx,
          y: laser.y + laser.vy,
        }))
        .filter((laser) => laser.y < SCREEN_HEIGHT + 20);

      newState.enemyLasers.forEach((laser) => {
        if (
          checkCollision(
            newState.player.x,
            newState.player.y,
            GAME_CONFIG.PLAYER_SIZE,
            laser.x,
            laser.y,
            GAME_CONFIG.ENEMY_LASER_SIZE,
          )
        ) {
          if (newState.player.shield) {
            newState.player.shield = false;
            createExplosion(laser.x, laser.y, COLORS.SHIELD, 12);
          } else {
            newState.player.health -= 15;
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(
                () => {},
              );
            }
          }
          newState.enemyLasers = newState.enemyLasers.filter(
            (l) => l.id !== laser.id,
          );
          newState.combo = 0;
          if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
        }
      });

      newState.stars = newState.stars.map((star) => {
        let newY = star.y + star.speed;
        if (newY > SCREEN_HEIGHT) {
          newY = -10;
        }
        return { ...star, y: newY };
      });

      newState.particles = newState.particles
        .map((particle) => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          life: particle.life - 0.02,
        }))
        .filter((particle) => particle.life > 0);

      if (newState.player.health <= 0) {
        newState.gameOver = true;
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error,
          ).catch(() => {});
        }
      }

      newState.score += scoreIncrease;

      return newState;
    });
  }, [createExplosion, checkCollision]);

  const startWave = useCallback(
    (wave: number) => {
      const enemyCount = GAME_CONFIG.WAVE_ENEMY_COUNT_BASE + (wave - 1) * 2;
      let spawnedCount = 0;
      const spawnRate = Math.max(500, 1000 - (wave - 1) * 50);

      const spawnInterval = setInterval(() => {
        if (spawnedCount >= enemyCount) {
          clearInterval(spawnInterval);
          return;
        }

        spawnEnemy(wave);
        spawnedCount++;

        if (spawnedCount % 3 === 0) {
          spawnPowerUp(wave);
        }
      }, spawnRate);

      enemySpawnRef.current = spawnInterval;
    },
    [spawnEnemy, spawnPowerUp],
  );

  useEffect(() => {
    if (!isStarted || gameState.gameOver || gameState.isPaused) return;

    createBullet();
    const bulletInterval = setInterval(
      () => {
        createBullet();
      },
      gameState.player.rapidFire
        ? GAME_CONFIG.RAPID_FIRE_RATE
        : GAME_CONFIG.FIRE_RATE,
    );

    return () => clearInterval(bulletInterval);
  }, [
    isStarted,
    gameState.gameOver,
    gameState.isPaused,
    gameState.player.rapidFire,
    createBullet,
  ]);

  useEffect(() => {
    if (!isStarted || gameState.gameOver || gameState.isPaused) return;

    gameLoopRef.current = setInterval(gameLoop, 1000 / 60);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isStarted, gameState.gameOver, gameState.isPaused, gameLoop]);

  useEffect(() => {
    if (!isStarted || gameState.gameOver) return;

    startWave(gameState.wave);

    return () => {
      if (enemySpawnRef.current) clearInterval(enemySpawnRef.current);
    };
  }, [isStarted, gameState.wave, startWave, gameState.gameOver]);

  useEffect(() => {
    if (!isStarted || gameState.gameOver || gameState.isPaused) return;

    if (gameState.enemies.length === 0 && gameState.wave < 10) {
      waveTimerRef.current = setTimeout(() => {
        setGameState((prev) => ({ ...prev, wave: prev.wave + 1 }));
      }, GAME_CONFIG.WAVE_DELAY);
    } else if (gameState.enemies.length === 0 && gameState.wave >= 10) {
      setGameState((prev) => ({ ...prev, victory: true }));
    }

    return () => {
      if (waveTimerRef.current) clearTimeout(waveTimerRef.current);
    };
  }, [
    isStarted,
    gameState.enemies.length,
    gameState.wave,
    gameState.gameOver,
    gameState.isPaused,
  ]);

  const handleStart = () => {
    setIsStarted(true);
    setPointsAwarded(false);
    setGameState({
      player: {
        x: SCREEN_WIDTH / 2,
        y: SCREEN_HEIGHT - 150 - insets.bottom,
        health: 100,
        maxHealth: 100,
        shield: false,
        rapidFire: false,
        spreadShot: false,
      },
      bullets: [],
      enemies: [],
      powerUps: [],
      particles: [],
      enemyLasers: [],
      stars: initStars(),
      score: 0,
      wave: 1,
      gameOver: false,
      victory: false,
      isPaused: false,
      combo: 0,
      comboTimer: 0,
    });
    playerPosition.current = {
      x: SCREEN_WIDTH / 2,
      y: SCREEN_HEIGHT - 150 - insets.bottom,
    };
  };

  const handleRestart = () => {
    handleStart();
  };

  if (!isStarted) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="gray" />
        </TouchableOpacity>
        <View style={styles.menuContainer}>
          <Text style={styles.title}>SPACE ASSAULT</Text>
          <Text style={styles.subtitle}>
            Defend the galaxy from alien invaders
          </Text>
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>START GAME</Text>
          </TouchableOpacity>
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>• Drag to move your ship</Text>
            <Text style={styles.instructionText}>• Auto-fire enabled</Text>
            <Text style={styles.instructionText}>• Collect power-ups</Text>
            <Text style={styles.instructionText}>• Survive 10 waves</Text>
          </View>
        </View>
      </View>
    );
  }

  if (gameState.gameOver || gameState.victory) {
    if (!pointsAwarded) {
      addGamePoints(gameState.score);
      setPointsAwarded(true);
    }
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="gray" />
        </TouchableOpacity>
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverTitle}>
            {gameState.victory ? 'VICTORY!' : 'GAME OVER'}
          </Text>
          <Text style={styles.finalScore}>Score: {gameState.score}</Text>
          <Text style={styles.waveReached}>Wave: {gameState.wave}</Text>
          <TouchableOpacity
            style={styles.restartButton}
            onPress={handleRestart}
          >
            <Text style={styles.restartButtonText}>PLAY AGAIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {gameState.stars.map((star) => (
        <View
          key={star.id}
          style={[
            styles.star,
            {
              width: star.size,
              height: star.size,
              opacity: star.opacity,
              transform: [{ translateX: star.x }, { translateY: star.y }],
            },
          ]}
        />
      ))}
      <View style={[styles.ui, { top: insets.top + 10 }]}>
        <View style={styles.statsRow}>
          <TouchableOpacity
            onPress={() => setIsStarted(false)}
            style={styles.closeButton2}
          >
            <MaterialIcons name="arrow-back" size={24} color="gray" />
          </TouchableOpacity>
          <Text style={styles.scoreText}>SCORE: {gameState.score}</Text>
          <Text style={styles.waveText}>WAVE: {gameState.wave}</Text>
        </View>

        <View style={styles.healthBarContainer}>
          <View style={styles.healthBarBg}>
            <View
              style={[
                styles.healthBar,
                {
                  width: `${(gameState.player.health / gameState.player.maxHealth) * 100}%`,
                  backgroundColor: gameState.player.shield
                    ? COLORS.UI_SHIELD
                    : COLORS.UI_HEALTH,
                },
              ]}
            />
          </View>
          <Text style={styles.healthText}>
            {Math.max(0, gameState.player.health)} HP
          </Text>
        </View>

        <View style={styles.powerUpsRow}>
          {gameState.player.rapidFire && (
            <View
              style={[
                styles.powerUpIndicator,
                { backgroundColor: COLORS.POWERUP_RAPID },
              ]}
            >
              <Text style={styles.powerUpText}>RAPID</Text>
            </View>
          )}
          {gameState.player.shield && (
            <View
              style={[
                styles.powerUpIndicator,
                { backgroundColor: COLORS.POWERUP_SHIELD },
              ]}
            >
              <Text style={styles.powerUpText}>SHIELD</Text>
            </View>
          )}
          {gameState.player.spreadShot && (
            <View
              style={[
                styles.powerUpIndicator,
                { backgroundColor: COLORS.POWERUP_SPREAD },
              ]}
            >
              <Text style={styles.powerUpText}>SPREAD</Text>
            </View>
          )}
        </View>
        {gameState.combo > 1 && (
          <View style={styles.comboContainer}>
            <Text style={styles.comboText}>COMBO x{gameState.combo}</Text>
          </View>
        )}
      </View>

      <View style={styles.player} pointerEvents="none">
        <View
          style={[
            styles.playerShip,
            {
              transform: [
                {
                  translateX: gameState.player.x - GAME_CONFIG.PLAYER_SIZE / 2,
                },
                {
                  translateY: gameState.player.y - GAME_CONFIG.PLAYER_SIZE / 2,
                },
              ],
            },
          ]}
        >
          <View style={styles.shipBody} />
          <View style={styles.shipWingLeft} />
          <View style={styles.shipWingRight} />
          {gameState.player.shield && <View style={styles.shieldCircle} />}
        </View>
      </View>

      {gameState.bullets.map((bullet) => (
        <View
          key={bullet.id}
          style={[
            styles.bullet,
            {
              transform: [
                { translateX: bullet.x - GAME_CONFIG.BULLET_SIZE / 2 },
                { translateY: bullet.y - GAME_CONFIG.BULLET_SIZE / 2 },
              ],
            },
          ]}
        />
      ))}

      {gameState.enemies.map((enemy) => {
        const size =
          GAME_CONFIG.ENEMY_SIZES[
            enemy.type as keyof typeof GAME_CONFIG.ENEMY_SIZES
          ];
        const color =
          enemy.type === 'BOSS'
            ? COLORS.ENEMY_BOSS
            : enemy.type === 'LARGE'
              ? COLORS.ENEMY_LARGE
              : enemy.type === 'MEDIUM'
                ? COLORS.ENEMY_MEDIUM
                : COLORS.ENEMY_SMALL;

        return (
          <View
            key={enemy.id}
            style={[
              styles.enemy,
              {
                width: size,
                height: size,
                backgroundColor: color,
                transform: [
                  { translateX: enemy.x - size / 2 },
                  { translateY: enemy.y - size / 2 },
                ],
              },
            ]}
          />
        );
      })}

      {gameState.powerUps.map((powerUp) => {
        const bgColor =
          powerUp.type === 'RAPID_FIRE'
            ? COLORS.POWERUP_RAPID
            : powerUp.type === 'SHIELD'
              ? COLORS.POWERUP_SHIELD
              : powerUp.type === 'HEALTH'
                ? COLORS.POWERUP_HEALTH
                : COLORS.POWERUP_SPREAD;

        return (
          <View
            key={powerUp.id}
            style={[
              styles.powerUp,
              {
                backgroundColor: bgColor,
                transform: [
                  { translateX: powerUp.x - GAME_CONFIG.POWERUP_SIZE / 2 },
                  { translateY: powerUp.y - GAME_CONFIG.POWERUP_SIZE / 2 },
                ],
              },
            ]}
          />
        );
      })}

      {gameState.enemyLasers.map((laser) => (
        <View
          key={laser.id}
          style={[
            styles.enemyLaser,
            {
              transform: [
                { translateX: laser.x - GAME_CONFIG.ENEMY_LASER_SIZE / 2 },
                { translateY: laser.y - GAME_CONFIG.ENEMY_LASER_SIZE / 2 },
              ],
            },
          ]}
        />
      ))}

      {gameState.particles.map((particle) => (
        <View
          key={particle.id}
          style={[
            styles.particle,
            {
              backgroundColor: particle.color,
              opacity: particle.life,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  menuBackButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  gameBackButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.PLAYER_GLOW,
    marginBottom: 10,
    textShadowColor: COLORS.PLAYER_GLOW,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.UI_TEXT,
    marginBottom: 50,
    opacity: 0.8,
  },
  startButton: {
    backgroundColor: COLORS.PLAYER,
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: COLORS.PLAYER_GLOW,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.BACKGROUND,
  },
  instructions: {
    marginTop: 60,
    alignItems: 'flex-start',
  },
  instructionText: {
    fontSize: 16,
    color: COLORS.UI_TEXT,
    marginBottom: 8,
    opacity: 0.7,
  },
  gameOverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  gameOverTitle: {
    fontSize: 56,
    fontWeight: '900',
    color: COLORS.PLAYER_GLOW,
    marginBottom: 20,
    textShadowColor: COLORS.PLAYER_GLOW,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  finalScore: {
    fontSize: 32,
    color: COLORS.UI_TEXT,
    marginBottom: 10,
    fontWeight: '700',
  },
  waveReached: {
    fontSize: 24,
    color: COLORS.UI_TEXT,
    marginBottom: 40,
    opacity: 0.8,
  },
  restartButton: {
    backgroundColor: COLORS.PLAYER,
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: COLORS.PLAYER_GLOW,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  restartButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.BACKGROUND,
  },
  ui: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 100,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingRight: 12,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.UI_TEXT,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  waveText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.PLAYER_GLOW,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  healthBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  healthBarBg: {
    flex: 1,
    height: 20,
    backgroundColor: COLORS.UI_BAR_BG,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 10,
  },
  healthBar: {
    height: '100%',
    borderRadius: 10,
  },
  healthText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.UI_TEXT,
    width: 60,
  },
  powerUpsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  powerUpIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  powerUpText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.BACKGROUND,
  },
  player: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  playerShip: {
    position: 'absolute',
    width: GAME_CONFIG.PLAYER_SIZE,
    height: GAME_CONFIG.PLAYER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shipBody: {
    width: 20,
    height: 30,
    backgroundColor: COLORS.PLAYER,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    shadowColor: COLORS.PLAYER_GLOW,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  shipWingLeft: {
    position: 'absolute',
    bottom: 5,
    left: 0,
    width: 15,
    height: 20,
    backgroundColor: COLORS.PLAYER,
    borderTopLeftRadius: 8,
  },
  shipWingRight: {
    position: 'absolute',
    bottom: 5,
    right: 0,
    width: 15,
    height: 20,
    backgroundColor: COLORS.PLAYER,
    borderTopRightRadius: 8,
  },
  shieldCircle: {
    position: 'absolute',
    width: GAME_CONFIG.PLAYER_SIZE + 10,
    height: GAME_CONFIG.PLAYER_SIZE + 10,
    borderRadius: (GAME_CONFIG.PLAYER_SIZE + 10) / 2,
    borderWidth: 3,
    borderColor: COLORS.SHIELD,
    opacity: 0.6,
  },
  bullet: {
    position: 'absolute',
    width: GAME_CONFIG.BULLET_SIZE,
    height: GAME_CONFIG.BULLET_SIZE * 2,
    backgroundColor: COLORS.BULLET,
    borderRadius: GAME_CONFIG.BULLET_SIZE,
    shadowColor: COLORS.BULLET,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  enemy: {
    position: 'absolute',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  powerUp: {
    position: 'absolute',
    width: GAME_CONFIG.POWERUP_SIZE,
    height: GAME_CONFIG.POWERUP_SIZE,
    borderRadius: GAME_CONFIG.POWERUP_SIZE / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  star: {
    position: 'absolute',
    backgroundColor: COLORS.STAR,
    borderRadius: 1,
  },
  enemyLaser: {
    position: 'absolute',
    width: GAME_CONFIG.ENEMY_LASER_SIZE,
    height: GAME_CONFIG.ENEMY_LASER_SIZE * 2,
    backgroundColor: COLORS.ENEMY_LASER,
    borderRadius: GAME_CONFIG.ENEMY_LASER_SIZE,
    shadowColor: COLORS.ENEMY_LASER,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  comboContainer: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 200, 0, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    borderWidth: 2,
    borderColor: COLORS.POWERUP_RAPID,
  },
  comboText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.POWERUP_RAPID,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  closeButton: {
    position: 'absolute',
    top: 48,
    left: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a1f3a',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },

  closeButton2: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a1f3a',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
});
