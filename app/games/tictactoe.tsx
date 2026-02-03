import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { RotateCcw, Zap, Brain, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { addGamePoints } from '@/lib/gamePoints';

type Player = 'X' | 'O' | null;
type Board = Player[];
type Difficulty = 'easy' | 'hard';

interface GameStats {
  playerWins: number;
  aiWins: number;
  draws: number;
}

const { width } = Dimensions.get('window');
const BOARD_SIZE = width - 80;
const BOARD_PADDING = 8;
const GAP = 8;
const CELL_SIZE = (BOARD_SIZE - (BOARD_PADDING * 2) - (GAP * 2)) / 3;

export default function TicTacToeGame() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(true);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [stats, setStats] = useState<GameStats>({ playerWins: 0, aiWins: 0, draws: 0 });
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  
  const cellAnimations = useRef(Array(9).fill(null).map(() => new Animated.Value(0))).current;
  const winLineAnimation = useRef(new Animated.Value(0)).current;
  const sounds = useRef<{ [key: string]: Audio.Sound }>({});

  useEffect(() => {
    const loadSounds = async () => {
      try {
        const { sound: popSound } = await Audio.Sound.createAsync({ uri: 'https://actions.google.com/sounds/v1/cartoon/pop.ogg' });
        const { sound: boingSound } = await Audio.Sound.createAsync({ uri: 'https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg' });
        const { sound: clangSound } = await Audio.Sound.createAsync({ uri: 'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg' });
        
        sounds.current = {
          pop: popSound,
          boing: boingSound,
          clang: clangSound,
        };
      } catch (error) {
        console.log('Error loading sounds:', error);
      }
    };

    loadSounds();

    return () => {
      Object.values(sounds.current).forEach(sound => {
        sound.unloadAsync();
      });
    };
  }, []);

  const playSound = async (soundName: string) => {
    try {
      const sound = sounds.current[soundName];
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  const checkWinner = useCallback((currentBoard: Board): { winner: Player | 'draw'; line: number[] | null } | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];

    for (const line of lines) {
      const [a, b, c] = line;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return { winner: currentBoard[a], line };
      }
    }

    if (currentBoard.every(cell => cell !== null)) {
      return { winner: 'draw', line: null };
    }

    return null;
  }, []);

  const minimax = useCallback((currentBoard: Board, depth: number, isMaximizing: boolean): number => {
    const result = checkWinner(currentBoard);
    
    if (result?.winner === 'O') return 10 - depth;
    if (result?.winner === 'X') return depth - 10;
    if (result?.winner === 'draw') return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === null) {
          currentBoard[i] = 'O';
          const score = minimax(currentBoard, depth + 1, false);
          currentBoard[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === null) {
          currentBoard[i] = 'X';
          const score = minimax(currentBoard, depth + 1, true);
          currentBoard[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  }, [checkWinner]);

  const handleCellPress = useCallback((index: number, isAI: boolean = false) => {
    if (board[index] || winner) return;
    
    if (!isAI && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    playSound('pop');

    const newBoard = [...board];
    newBoard[index] = isPlayerTurn ? 'X' : 'O';
    setBoard(newBoard);
    setIsPlayerTurn(!isPlayerTurn);

    Animated.spring(cellAnimations[index], {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [board, winner, isPlayerTurn, cellAnimations]);

  const makeAIMove = useCallback(() => {
    const availableMoves = board.map((cell, index) => cell === null ? index : null).filter(i => i !== null) as number[];
    
    if (availableMoves.length === 0) return;

    let move: number;

    if (difficulty === 'easy' && Math.random() < 0.5) {
      move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    } else {
      let bestScore = -Infinity;
      move = availableMoves[0];

      for (const index of availableMoves) {
        const newBoard = [...board];
        newBoard[index] = 'O';
        const score = minimax(newBoard, 0, false);
        if (score > bestScore) {
          bestScore = score;
          move = index;
        }
      }
    }

    handleCellPress(move, true);
  }, [board, difficulty, minimax, handleCellPress]);

  useEffect(() => {
    if (!isPlayerTurn && !winner) {
      const timer = setTimeout(() => {
        makeAIMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, winner, makeAIMove]);

  useEffect(() => {
    const result = checkWinner(board);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      
      if (result.winner === 'X') {
        playSound('boing');
        addGamePoints(100);
        setStats(prev => ({ ...prev, playerWins: prev.playerWins + 1 }));
      } else if (result.winner === 'O') {
        playSound('clang');
        addGamePoints(25);
        setStats(prev => ({ ...prev, aiWins: prev.aiWins + 1 }));
      } else if (result.winner === 'draw') {
        playSound('clang');
        addGamePoints(50);
        setStats(prev => ({ ...prev, draws: prev.draws + 1 }));
      }
      
      if (result.line) {
        Animated.spring(winLineAnimation, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }).start();
      }
    }
  }, [board, checkWinner, winLineAnimation]);

  const resetGame = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    playSound('pop');
    
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setWinner(null);
    setWinningLine(null);
    cellAnimations.forEach(anim => anim.setValue(0));
    winLineAnimation.setValue(0);
  };

  const toggleDifficulty = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setDifficulty(prev => prev === 'easy' ? 'hard' : 'easy');
    resetGame();
  };

  const renderCell = (index: number) => {
    const value = board[index];
    const isWinningCell = winningLine?.includes(index);

    const scale = cellAnimations[index].interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.cell,
          isWinningCell && styles.winningCell,
        ]}
        onPress={() => handleCellPress(index)}
        disabled={!!winner || !isPlayerTurn}
        activeOpacity={0.7}
      >
        {value && (
          <Animated.View style={{ transform: [{ scale }] }}>
            <Text style={[
              styles.cellText,
              value === 'X' ? styles.playerX : styles.playerO,
              isWinningCell && styles.winningText,
            ]}>
              {value}
            </Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    );
  };

  const getStatusText = () => {
    if (winner === 'X') return 'You Win! 🎉';
    if (winner === 'O') return 'AI Wins! 🤖';
    if (winner === 'draw') return "It's a Draw!";
    return isPlayerTurn ? 'Your Turn' : 'AI Thinking...';
  };

  const getStatusColor = () => {
    if (winner === 'X') return '#10B981';
    if (winner === 'O') return '#EF4444';
    if (winner === 'draw') return '#F59E0B';
    return '#FFFFFF';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#334155']}
        style={StyleSheet.absoluteFillObject}
      />
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft color="#FFFFFF" size={24} />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Tic Tac Toe</Text>
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>AI</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.difficultyButton}
          onPress={toggleDifficulty}
          activeOpacity={0.7}
        >
          {difficulty === 'hard' ? (
            <Brain color="#F59E0B" size={20} />
          ) : (
            <Zap color="#10B981" size={20} />
          )}
          <Text style={styles.difficultyButtonText}>
            {difficulty === 'hard' ? 'Hard' : 'Easy'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.playerWins}</Text>
          <Text style={styles.statLabel}>You</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.draws}</Text>
          <Text style={styles.statLabel}>Draws</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.aiWins}</Text>
          <Text style={styles.statLabel}>AI</Text>
        </View>
      </View>

      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>

      <View style={styles.boardContainer}>
        <View style={styles.board}>
          {Array(9).fill(null).map((_, index) => renderCell(index))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.resetButton}
        onPress={resetGame}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#3B82F6', '#2563EB']}
          style={styles.resetButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <RotateCcw color="#FFFFFF" size={20} />
          <Text style={styles.resetButtonText}>New Game</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  difficultyBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  difficultyText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  difficultyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  difficultyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 90,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500' as const,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 32,
    height: 40,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 24,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  board: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: BOARD_PADDING,
    gap: GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  winningCell: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  cellText: {
    fontSize: 64,
    fontWeight: '700' as const,
  },
  playerX: {
    color: '#60A5FA',
  },
  playerO: {
    color: '#F472B6',
  },
  winningText: {
    color: '#10B981',
  },
  resetButton: {
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  resetButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600' as const,
  },
});