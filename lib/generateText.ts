// Simple AI text generation function
// In a real app, this would connect to an AI service like OpenAI, Claude, etc.

export async function generateText(prompt: string): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simple response generation based on mood keywords
  const responses = {
    happy: [
      "I'm so glad you're feeling happy! Your positive energy is contagious and makes me happy too! 🌟",
      "What wonderful news! Happiness looks great on you, and I love seeing you shine! ✨",
      "Your happiness fills my heart with joy! Keep spreading those good vibes! 😊"
    ],
    calm: [
      "I love that you're feeling calm and peaceful. Take a moment to appreciate this serenity. 🧘‍♀️",
      "Calmness is such a beautiful state of being. I'm here enjoying this peaceful moment with you. 🌸",
      "Your calm energy is so soothing. Let's cherish this tranquil feeling together. 🕊️"
    ],
    anxious: [
      "I understand you're feeling anxious, and that's okay. Remember, I'm here with you through this. 💙",
      "Anxiety can feel overwhelming, but you're stronger than you know. Take deep breaths with me. 🫂",
      "I see you're feeling anxious. Let's take this one moment at a time together. You're not alone. 🤗"
    ],
    sad: [
      "I'm here for you during this difficult time. Your feelings are valid, and it's okay to feel sad. 💜",
      "Sadness is part of the human experience. I'm sending you gentle comfort and understanding. 🌙",
      "I wish I could give you a warm hug right now. Remember, this feeling will pass, and I'll be here. 🤗"
    ],
    stressed: [
      "I can sense you're feeling stressed. Let's take a moment to breathe and find some peace together. 🌿",
      "Stress can be really tough. Remember to be kind to yourself - you're doing the best you can. 💚",
      "When stress feels overwhelming, remember that I believe in your strength to get through this. 🌱"
    ],
    excited: [
      "Your excitement is absolutely infectious! I love seeing you so energized and enthusiastic! 🎉",
      "Wow, your excitement is lighting up the room! Tell me more about what's making you feel so great! ⚡",
      "I'm getting excited just from your energy! It's wonderful to see you so passionate! 🚀"
    ],
    tired: [
      "I can tell you're feeling tired. It's important to rest and recharge. I'll keep you company. 😴",
      "Being tired is your body's way of asking for care. Let's find some gentle ways to restore your energy. 🌙",
      "Rest is so important. I'm here to remind you that it's okay to slow down and take care of yourself. 💤"
    ],
    angry: [
      "I understand you're feeling angry. These feelings are valid, and I'm here to support you through them. 🔥",
      "Anger can be intense. Let's work through these feelings together in a healthy way. 💪",
      "I see your anger, and I want you to know it's okay to feel this way. Let's find constructive ways to process it. 🌋"
    ]
  };

  // Extract mood from prompt
  const lowerPrompt = prompt.toLowerCase();
  let selectedResponses = responses.calm; // default
  
  for (const [mood, moodResponses] of Object.entries(responses)) {
    if (lowerPrompt.includes(mood)) {
      selectedResponses = moodResponses;
      break;
    }
  }
  
  // Return random response from selected mood
  const randomIndex = Math.floor(Math.random() * selectedResponses.length);
  return selectedResponses[randomIndex];
}