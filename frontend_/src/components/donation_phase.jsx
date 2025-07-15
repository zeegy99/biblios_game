import React, { useState, useEffect, useRef } from "react";
import Card from "./card";

const DonationPhase = ({
  player,
  players,
  isCurrentPlayer,
  deck,
  setDeck,
  setDiscardPile,
  discardPile,
  sharedPool,
  setSharedPool,
  setPlayers,
  broadcastState,
  onFinish,
  totalPlayers,
  currentPlayerIndex,
}) => {
  const numToDraw = 2 + (totalPlayers - 1);
  const [cardsToProcess, setCardsToProcess] = useState([]);
  const [kept, setKept] = useState(null);
  const [discarded, setDiscarded] = useState(null);
  const [shared, setShared] = useState([]);

  useEffect(() => {
  if (!isCurrentPlayer) return;
  if (deck.length < numToDraw) {
    console.warn("Not enough cards — skipping to auction");
    broadcastState({ phase: "auction" });
    return;
  }

  const drawn = deck.slice(-numToDraw);
  const newDeck = deck.slice(0, -numToDraw);
  setDeck(newDeck);
  setCardsToProcess(drawn);
  broadcastState({ deck: newDeck });
}, []);


  const handleChoice = (card, action) => {
    if (action === "keep") {
      if (kept) return alert("You've already kept a card.");
      setKept(card);
    } else if (action === "discard") {
      if (discarded) return alert("You've already discarded a card.");
      setDiscarded(card);
    } else if (action === "pool") {
      if (shared.length >= numToDraw - 2)
        return alert("Too many shared cards.");
      setShared([...shared, card]);
    }

    setCardsToProcess((prev) => prev.slice(1));
  };

  const confirmTurn = () => {
    console.log("🟩 ConfirmTurn triggered");
  console.log("Kept:", kept, "Discarded:", discarded, "Shared:", shared);
  if (!kept || !discarded || shared.length !== numToDraw - 2) {
    alert("You must assign all cards.");
    return;
  }

  // Create all updates first
  const updatedPlayers = players.map((p) =>
    p.name !== player.name
      ? p
      : {
          ...p,
          hand: [...p.hand, kept],
          gold: p.gold + (kept.type === "Gold" ? kept.value : 0),
        }
  );

  const updatedDiscard = [...discardPile, discarded];
  const updatedShared = [...sharedPool, ...shared];
  const lastDonatorIdx = players.findIndex(p => p.name === player.name);

  console.log("✅ Updated players before broadcast:", updatedPlayers);

  onFinish({
    updatedDiscard,
    updatedShared,
    updatedPlayers,
  });
  // Single state update and broadcast
  broadcastState({
    discardPile: updatedDiscard,
    sharedPool: updatedShared,
    players: updatedPlayers,
    lastDonatorIndex: lastDonatorIdx,
    phase: "shared_selection",
    sharedSelectionIndex: (currentPlayerIndex + 1) % totalPlayers,
    currentPlayerIndex: (currentPlayerIndex + 1) % totalPlayers
  });

  // Reset local state
  setKept(null);
  setDiscarded(null);
  setShared([]);
  setCardsToProcess([]);

  
};

  const currentCard = cardsToProcess[0];

  return (
    <div>
      <h3>{player.name}'s Donation Turn</h3>

      {!isCurrentPlayer && (
        <p>⏳ Waiting for {player.name} to complete their turn...</p>
      )}

      {isCurrentPlayer && (
        <>
          {currentCard ? (
            <div>
              <h4>Choose what to do with this card:</h4>
              <Card {...currentCard} />
              <div style={{ marginTop: "10px" }}>
                <button onClick={() => handleChoice(currentCard, "keep")}>
                  Keep
                </button>
                <button onClick={() => handleChoice(currentCard, "discard")}>
                  Discard
                </button>
                <button onClick={() => handleChoice(currentCard, "pool")}>
                  Pool
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p>
                You kept: {kept?.type} {kept?.value}
              </p>
              <p>
                You discarded: {discarded?.type} {discarded?.value}
              </p>
              <p>
                Shared cards:{" "}
                {shared.map((c, i) => `${c.type} ${c.value}`).join(", ")}
              </p>
              <button onClick={confirmTurn}>Confirm Turn</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DonationPhase;
