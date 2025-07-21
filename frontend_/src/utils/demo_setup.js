import { buildSmallDeck } from "./deck";

export function createDemoGameState(playerName) {
  const deck = buildSmallDeck();

  return {
    phase: "donation",
    deck,
    discardPile: [],
    sharedPool: [],
    players: [
      { name: "Zeg", gold: 0, points: 0, hand: [] },
      { name: "Df", gold: 0, points: 0, hand: [] },
      { name: playerName, gold: 0, points: 0, hand: [] }
    ],
    currentPlayerIndex: 0,
    lastDonatorIndex: null,
    sharedSelectionIndex: 0,
    dice: null,
    finalPhaseDone: false
  };
}
