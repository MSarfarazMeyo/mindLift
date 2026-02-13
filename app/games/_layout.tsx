import { Stack } from 'expo-router';

export default function GamesLayout() {
  return (
    <Stack>
      <Stack.Screen name="memory" options={{ headerShown: false }} />
      <Stack.Screen name="breathe" options={{ headerShown: false }} />
      <Stack.Screen name="gratitude" options={{ headerShown: false }} />
      <Stack.Screen name="thought" options={{ headerShown: false }} />
      <Stack.Screen name="focus" options={{ headerShown: false }} />
      <Stack.Screen name="bubble" options={{ headerShown: false }} />
      <Stack.Screen name="emotiPet" options={{ headerShown: false }} />
      <Stack.Screen name="meditation" options={{ headerShown: false }} />

      <Stack.Screen
        name="voiceemotionscanner"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="mazeescape" options={{ headerShown: false }} />
      <Stack.Screen name="tictactoe" options={{ headerShown: false }} />
      <Stack.Screen name="gemcatcher" options={{ headerShown: false }} />
      <Stack.Screen name="breakout" options={{ headerShown: false }} />
      <Stack.Screen name="endlessrunner" options={{ headerShown: false }} />
      <Stack.Screen name="colormatch" options={{ headerShown: false }} />
      <Stack.Screen name="birdybounce" options={{ headerShown: false }} />
      <Stack.Screen name="pacman" options={{ headerShown: false }} />
      <Stack.Screen name="connectfour" options={{ headerShown: false }} />
      <Stack.Screen name="snake" options={{ headerShown: false }} />
      <Stack.Screen name="shooting" options={{ headerShown: false }} />
    </Stack>
  );
}
