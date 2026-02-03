import { useStore } from './store';

export const addGamePoints = async (points: number) => {
  try {
    const store = useStore.getState();
    await store.addPoints(points);
  } catch (error) {
    console.error('Error adding game points:', error);
  }
};