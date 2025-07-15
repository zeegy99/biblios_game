// src/utils/deck.js

export function buildDeck() {
  const card_q = { 1: 2, 2: 2, 3: 1, 4: 0 };
  const resourceTypes = ["Religion"]; //Leaving this out for now "Science", "Military", "Art", "Herbs"
  const tieBreakers = ["A", "B", "C", "D"];
  const deck = [];

  for (const res of resourceTypes) {
    for (const [val, quantity] of Object.entries(card_q)) {
      for (let i = 0; i < quantity; i++) {  // matching your "changed quantity to 1"
        const tie = tieBreakers[Math.floor(Math.random() * tieBreakers.length)];
        deck.push({
          value: parseInt(val),
          type: res,
          tieBreaker: tie,
          isSpecial: false,
        });
      }
    }
  }

  // Add Gold cards
  for (let i = 0; i < 3; i++) {
    for (let k = 1; k <= 2; k++) {
      deck.push({
        value: k,
        type: "Gold",
        tieBreaker: "None",
        isSpecial: false,
      });
    }
  }

  // Optional: add special cards (commented in your Python version)
  // deck.push({ value: 1, type: "Plus", isSpecial: true });
  // deck.push({ value: 1, type: "Minus", isSpecial: true });

  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}
