import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  RotateCcw,
  Trophy,
  Cpu,
  User,
  Zap,
  X,
  Trash2,
  Award,
  TrendingUp,
  Flame,
  Target,
  BarChart3,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { addGamePoints } from '@/lib/gamePoints';
import { connectFourColors } from '@/constants/colors';
import {
  Board,
  Player,
  WinLine,
  ROWS,
  COLS,
  createEmptyBoard,
  cloneBoard,
  dropPiece,
  checkWin,
  isBoardFull,
  getAvailableColumns,
} from '@/utils/connect-four-logic';
import { getAIMove } from '@/utils/connect-four-ai';
const Colors = connectFourColors;
const SCORE_KEY = 'connect4_scores';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_PADDING = 8;
const BOARD_MARGIN = 12;
const CELL_GAP = 4;
const BOARD_WIDTH = Math.min(SCREEN_WIDTH - BOARD_MARGIN * 2, 420);
const CELL_SIZE = Math.floor(
  (BOARD_WIDTH - BOARD_PADDING * 2 - CELL_GAP * (COLS + 1)) / COLS,
);
const ACTUAL_BOARD_WIDTH =
  CELL_SIZE * COLS + CELL_GAP * (COLS + 1) + BOARD_PADDING * 2;

type GameState = 'playing' | 'won' | 'draw';

interface Scores {
  player: number;
  ai: number;
  draws: number;
  currentStreak: number;
  bestStreak: number;
  lastResult: 'win' | 'loss' | 'draw' | null;
}

export default function ConnectFourScreen() {
  const insets = useSafeAreaInsets();
  const [board, setBoard] = useState<Board>(createEmptyBoard);
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [winner, setWinner] = useState<Player | null>(null);
  const [winLine, setWinLine] = useState<WinLine | null>(null);
  const [scores, setScores] = useState<Scores>({
    player: 0,
    ai: 0,
    draws: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastResult: null,
  });
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const lastDropRow = useRef<number>(-1);
  const lastDropCol = useRef<number>(-1);

  const dropAnims = useRef<Animated.Value[][]>(
    Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => new Animated.Value(1)),
    ),
  ).current;

  const winPulse = useRef(new Animated.Value(1)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const boardScale = useRef(new Animated.Value(0.95)).current;
  const turnIndicator = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(boardScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerAnim, boardScale]);

  const migrateScores = useCallback((raw: Record<string, unknown>): Scores => {
    return {
      player: (raw.player as number) ?? 0,
      ai: (raw.ai as number) ?? 0,
      draws: (raw.draws as number) ?? 0,
      currentStreak: (raw.currentStreak as number) ?? 0,
      bestStreak: (raw.bestStreak as number) ?? 0,
      lastResult: (raw.lastResult as Scores['lastResult']) ?? null,
    };
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(SCORE_KEY).then((stored) => {
      if (stored) {
        try {
          setScores(migrateScores(JSON.parse(stored)));
        } catch (e) {
          console.log('Failed to parse scores', e);
        }
      }
    });
  }, [migrateScores]);

  const saveScores = useCallback(async (newScores: Scores) => {
    setScores(newScores);
    try {
      await AsyncStorage.setItem(SCORE_KEY, JSON.stringify(newScores));
    } catch (e) {
      console.log('Failed to save scores', e);
    }
  }, []);

  useEffect(() => {
    if (winLine) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(winPulse, {
            toValue: 1.15,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(winPulse, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      winPulse.setValue(1);
    }
  }, [winLine, winPulse]);

  useEffect(() => {
    Animated.timing(turnIndicator, {
      toValue: currentPlayer === 1 ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentPlayer, turnIndicator]);

  const animateDrop = useCallback(
    (row: number, col: number, callback?: () => void) => {
      dropAnims[row][col].setValue(0);
      Animated.spring(dropAnims[row][col], {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start(callback);
    },
    [dropAnims],
  );

  const handleAITurn = useCallback(
    (currentBoard: Board) => {
      setIsAIThinking(true);
      setTimeout(() => {
        const aiCol = getAIMove(currentBoard, 5);
        const newBoard = cloneBoard(currentBoard);
        const row = dropPiece(newBoard, aiCol, 2);

        if (row === -1) {
          setIsAIThinking(false);
          return;
        }

        setBoard(newBoard);
        lastDropRow.current = row;
        lastDropCol.current = aiCol;
        animateDrop(row, aiCol);

        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        const aiWin = checkWin(newBoard, 2);
        if (aiWin) {
          setWinner(2);
          setWinLine(aiWin);
          setGameState('won');
          addGamePoints(25);
          const newStreak = 0;
          const newScores: Scores = {
            ...scores,
            ai: scores.ai + 1,
            currentStreak: newStreak,
            lastResult: 'loss',
          };
          saveScores(newScores);
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
        } else if (isBoardFull(newBoard)) {
          setGameState('draw');
          addGamePoints(50);
          const newScores: Scores = {
            ...scores,
            draws: scores.draws + 1,
            currentStreak: 0,
            lastResult: 'draw',
          };
          saveScores(newScores);
        } else {
          setCurrentPlayer(1);
        }
        setIsAIThinking(false);
      }, 400);
    },
    [scores, saveScores, animateDrop],
  );

  const handleColumnPress = useCallback(
    (col: number) => {
      if (gameState !== 'playing' || currentPlayer !== 1 || isAIThinking)
        return;
      if (board[0][col] !== 0) return;

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const newBoard = cloneBoard(board);
      const row = dropPiece(newBoard, col, 1);
      if (row === -1) return;

      setBoard(newBoard);
      lastDropRow.current = row;
      lastDropCol.current = col;
      setCurrentPlayer(2);
      animateDrop(row, col);

      const playerWin = checkWin(newBoard, 1);
      if (playerWin) {
        setWinner(1);
        setWinLine(playerWin);
        setGameState('won');
        addGamePoints(100);
        const newStreak =
          (scores.lastResult === 'win' ? scores.currentStreak : 0) + 1;
        const newBest = Math.max(scores.bestStreak, newStreak);
        const newScores: Scores = {
          ...scores,
          player: scores.player + 1,
          currentStreak: newStreak,
          bestStreak: newBest,
          lastResult: 'win',
        };
        saveScores(newScores);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        return;
      }

      if (isBoardFull(newBoard)) {
        setGameState('draw');
        addGamePoints(50);
        const newScores: Scores = {
          ...scores,
          draws: scores.draws + 1,
          currentStreak: 0,
          lastResult: 'draw',
        };
        saveScores(newScores);
        return;
      }

      handleAITurn(newBoard);
    },
    [
      board,
      gameState,
      currentPlayer,
      isAIThinking,
      scores,
      saveScores,
      animateDrop,
      handleAITurn,
    ],
  );

  const resetGame = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    const newBoard = createEmptyBoard();
    setBoard(newBoard);
    setCurrentPlayer(1);
    setGameState('playing');
    setWinner(null);
    setWinLine(null);
    setIsAIThinking(false);
    lastDropRow.current = -1;
    lastDropCol.current = -1;
    dropAnims.forEach((row) => row.forEach((anim) => anim.setValue(1)));
  }, [dropAnims]);

  const resetScores = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    saveScores({
      player: 0,
      ai: 0,
      draws: 0,
      currentStreak: 0,
      bestStreak: 0,
      lastResult: null,
    });
  }, [saveScores]);

  const totalGames = scores.player + scores.ai + scores.draws;
  const winRate =
    totalGames > 0 ? Math.round((scores.player / totalGames) * 100) : 0;

  const isWinCell = useCallback(
    (row: number, col: number): boolean => {
      if (!winLine) return false;
      return winLine.cells.some(([r, c]) => r === row && c === col);
    },
    [winLine],
  );

  const statusText = useMemo(() => {
    if (gameState === 'won') {
      return winner === 1 ? 'You Win!' : 'AI Wins!';
    }
    if (gameState === 'draw') return "It's a Draw!";
    if (isAIThinking) return 'AI is thinking...';
    return 'Your Turn';
  }, [gameState, winner, isAIThinking]);

  const statusColor = useMemo(() => {
    if (gameState === 'won') {
      return winner === 1 ? Colors.success : Colors.red;
    }
    if (gameState === 'draw') return Colors.yellow;
    if (isAIThinking) return Colors.yellow;
    return Colors.accent;
  }, [gameState, winner, isAIThinking]);

  const renderCell = useCallback(
    (row: number, col: number) => {
      const cellValue = board[row][col];
      const isWin = isWinCell(row, col);
      let pieceColor = 'transparent';
      let glowColor = 'transparent';
      if (cellValue === 1) {
        pieceColor = Colors.red;
        glowColor = Colors.redGlow;
      } else if (cellValue === 2) {
        pieceColor = Colors.yellow;
        glowColor = Colors.yellowGlow;
      }

      const scale = isWin ? winPulse : dropAnims[row][col];

      return (
        <TouchableOpacity
          key={`${row}-${col}`}
          testID={`cell-${row}-${col}`}
          onPress={() => handleColumnPress(col)}
          activeOpacity={0.7}
          style={styles.cellContainer}
        >
          <View style={styles.cellOuter}>
            {cellValue === 0 ? (
              <View style={styles.emptyCell} />
            ) : (
              <Animated.View
                style={[
                  styles.piece,
                  {
                    backgroundColor: pieceColor,
                    transform: [{ scale }],
                    shadowColor: glowColor,
                    shadowOpacity: isWin ? 0.8 : 0.4,
                    shadowRadius: isWin ? 12 : 6,
                    shadowOffset: { width: 0, height: 0 },
                  },
                ]}
              >
                {isWin && (
                  <View
                    style={[styles.pieceHighlight, { borderColor: glowColor }]}
                  />
                )}
                <View
                  style={[styles.pieceShine, { backgroundColor: glowColor }]}
                />
              </Animated.View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [board, isWinCell, winPulse, dropAnims, handleColumnPress],
  );

  const columnIndicators = useMemo(() => {
    const available = getAvailableColumns(board);
    return (
      <View style={styles.columnIndicators}>
        {Array.from({ length: COLS }, (_, col) => (
          <TouchableOpacity
            key={`indicator-${col}`}
            testID={`col-indicator-${col}`}
            onPress={() => handleColumnPress(col)}
            style={[
              styles.columnIndicator,
              {
                opacity:
                  gameState === 'playing' &&
                  !isAIThinking &&
                  available.includes(col)
                    ? 1
                    : 0.2,
              },
            ]}
            activeOpacity={0.6}
          >
            <View
              style={[styles.indicatorDot, { backgroundColor: Colors.red }]}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [board, gameState, isAIThinking, handleColumnPress]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Connect Four</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              testID="stats-btn"
              onPress={() => setShowStats(true)}
              style={styles.headerButton}
            >
              <Trophy size={18} color={Colors.yellow} />
            </TouchableOpacity>
            <TouchableOpacity
              testID="new-game-btn"
              onPress={resetGame}
              style={styles.headerButton}
            >
              <RotateCcw size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.scoreBoard}>
          <View style={styles.scoreItem}>
            <View style={styles.scoreLabel}>
              <User size={14} color={Colors.red} />
              <Text style={styles.scoreLabelText}>You</Text>
            </View>
            <Text style={[styles.scoreValue, { color: Colors.red }]}>
              {scores.player}
            </Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreItem}>
            <View style={styles.scoreLabel}>
              <Zap size={14} color={Colors.yellow} />
              <Text style={styles.scoreLabelText}>Draws</Text>
            </View>
            <Text style={[styles.scoreValue, { color: Colors.yellow }]}>
              {scores.draws}
            </Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreItem}>
            <View style={styles.scoreLabel}>
              <Cpu size={14} color={Colors.accent} />
              <Text style={styles.scoreLabelText}>AI</Text>
            </View>
            <Text style={[styles.scoreValue, { color: Colors.accent }]}>
              {scores.ai}
            </Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>
          {statusText}
        </Text>
      </View>

      {columnIndicators}

      <Animated.View
        style={[styles.boardContainer, { transform: [{ scale: boardScale }] }]}
      >
        <View style={styles.board}>
          {Array.from({ length: ROWS }, (_, row) => (
            <View key={`row-${row}`} style={styles.row}>
              {Array.from({ length: COLS }, (_, col) => renderCell(row, col))}
            </View>
          ))}
        </View>
      </Animated.View>

      {gameState !== 'playing' && (
        <TouchableOpacity
          testID="play-again-btn"
          onPress={resetGame}
          style={styles.playAgainButton}
          activeOpacity={0.8}
        >
          <RotateCcw size={18} color={Colors.background} />
          <Text style={styles.playAgainText}>Play Again</Text>
        </TouchableOpacity>
      )}

      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <Text style={styles.footerText}>You are Red • AI is Yellow</Text>
      </View>

      <Modal
        visible={showStats}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStats(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowStats(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Trophy size={22} color={Colors.yellow} />
                <Text style={styles.modalTitle}>Game Stats</Text>
              </View>
              <TouchableOpacity
                testID="close-stats-btn"
                onPress={() => setShowStats(false)}
                style={styles.closeButton}
              >
                <X size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.statCards}>
              <View style={[styles.statCard, { borderColor: Colors.accent }]}>
                <BarChart3 size={20} color={Colors.accent} />
                <Text style={styles.statCardValue}>{totalGames}</Text>
                <Text style={styles.statCardLabel}>Total Games</Text>
              </View>
              <View style={[styles.statCard, { borderColor: Colors.success }]}>
                <Target size={20} color={Colors.success} />
                <Text style={styles.statCardValue}>{winRate}%</Text>
                <Text style={styles.statCardLabel}>Win Rate</Text>
              </View>
            </View>

            <View style={styles.statCards}>
              <View style={[styles.statCard, { borderColor: Colors.yellow }]}>
                <Flame size={20} color={Colors.yellow} />
                <Text style={styles.statCardValue}>{scores.currentStreak}</Text>
                <Text style={styles.statCardLabel}>Current Streak</Text>
              </View>
              <View style={[styles.statCard, { borderColor: Colors.red }]}>
                <Award size={20} color={Colors.red} />
                <Text style={styles.statCardValue}>{scores.bestStreak}</Text>
                <Text style={styles.statCardLabel}>Best Streak</Text>
              </View>
            </View>

            <View style={styles.statsList}>
              <View style={styles.statsRow}>
                <View style={styles.statsRowLeft}>
                  <View
                    style={[
                      styles.statsRowDot,
                      { backgroundColor: Colors.red },
                    ]}
                  />
                  <Text style={styles.statsRowLabel}>Your Wins</Text>
                </View>
                <Text style={[styles.statsRowValue, { color: Colors.red }]}>
                  {scores.player}
                </Text>
              </View>
              <View style={styles.statsRowDivider} />
              <View style={styles.statsRow}>
                <View style={styles.statsRowLeft}>
                  <View
                    style={[
                      styles.statsRowDot,
                      { backgroundColor: Colors.accent },
                    ]}
                  />
                  <Text style={styles.statsRowLabel}>AI Wins</Text>
                </View>
                <Text style={[styles.statsRowValue, { color: Colors.accent }]}>
                  {scores.ai}
                </Text>
              </View>
              <View style={styles.statsRowDivider} />
              <View style={styles.statsRow}>
                <View style={styles.statsRowLeft}>
                  <View
                    style={[
                      styles.statsRowDot,
                      { backgroundColor: Colors.yellow },
                    ]}
                  />
                  <Text style={styles.statsRowLabel}>Draws</Text>
                </View>
                <Text style={[styles.statsRowValue, { color: Colors.yellow }]}>
                  {scores.draws}
                </Text>
              </View>
            </View>

            {totalGames > 0 && (
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  {scores.player > 0 && (
                    <View
                      style={[
                        styles.progressSegment,
                        {
                          flex: scores.player,
                          backgroundColor: Colors.red,
                          borderTopLeftRadius: 6,
                          borderBottomLeftRadius: 6,
                        },
                      ]}
                    />
                  )}
                  {scores.draws > 0 && (
                    <View
                      style={[
                        styles.progressSegment,
                        { flex: scores.draws, backgroundColor: Colors.yellow },
                      ]}
                    />
                  )}
                  {scores.ai > 0 && (
                    <View
                      style={[
                        styles.progressSegment,
                        {
                          flex: scores.ai,
                          backgroundColor: Colors.accent,
                          borderTopRightRadius: 6,
                          borderBottomRightRadius: 6,
                        },
                      ]}
                    />
                  )}
                </View>
              </View>
            )}

            <TouchableOpacity
              testID="reset-scores-btn"
              onPress={() => {
                resetScores();
                setShowStats(false);
              }}
              style={styles.resetScoresButton}
              activeOpacity={0.7}
            >
              <Trash2 size={16} color={Colors.red} />
              <Text style={styles.resetScoresText}>Reset All Stats</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreBoard: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  scoreLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreLabelText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '800' as const,
  },
  scoreDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  columnIndicators: {
    flexDirection: 'row',
    width: ACTUAL_BOARD_WIDTH,
    paddingHorizontal: BOARD_PADDING + CELL_GAP,
    marginTop: 8,
    marginBottom: 4,
  },
  columnIndicator: {
    width: CELL_SIZE,
    marginHorizontal: CELL_GAP / 2,
    alignItems: 'center',
    paddingVertical: 4,
  },
  indicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    opacity: 0.6,
  },
  boardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  board: {
    backgroundColor: Colors.board,
    borderRadius: 20,
    padding: BOARD_PADDING,
    paddingVertical: BOARD_PADDING + 2,
    borderWidth: 2,
    borderColor: Colors.boardDark,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cellContainer: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    margin: CELL_GAP / 2,
    borderRadius: CELL_SIZE / 2,
  },
  cellOuter: {
    flex: 1,
    borderRadius: CELL_SIZE / 2,
    overflow: 'hidden',
  },
  emptyCell: {
    flex: 1,
    borderRadius: CELL_SIZE / 2,
    backgroundColor: Colors.boardSlot,
    borderWidth: 1.5,
    borderColor: Colors.boardDark,
  },
  piece: {
    flex: 1,
    borderRadius: CELL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  pieceHighlight: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: CELL_SIZE / 2,
    borderWidth: 2,
  },
  pieceShine: {
    width: '40%',
    height: '40%',
    borderRadius: CELL_SIZE / 4,
    opacity: 0.25,
    position: 'absolute',
    top: '15%',
    left: '15%',
  },
  playAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    elevation: 4,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  playAgainText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  footer: {
    marginTop: 'auto' as const,
    paddingTop: 12,
  },
  footerText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  statCardValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
  },
  statCardLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  statsList: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statsRowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statsRowLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  statsRowValue: {
    fontSize: 20,
    fontWeight: '800' as const,
  },
  statsRowDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  progressSegment: {
    height: '100%',
  },
  resetScoresButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resetScoresText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.red,
  },
});
