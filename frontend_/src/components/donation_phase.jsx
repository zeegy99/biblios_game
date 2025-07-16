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
  const [donationDeck, setDonationDeck] = useState(deck);

  const playSpecialCard = (card) => {
  console.log(`${player.name} is playing special dice modifier:`, card);

  // Step 1: Resolve "Both" to Plus or Minus
  if (card.type === "Both") {
    const choice = prompt("Increase or decrease dice? (i/d)").toLowerCase();
    if (choice === "i") card.type = "Plus";
    else if (choice === "d") card.type = "Minus";
    else {
      alert("Invalid input.");
      return;
    }
  }

  // Step 2: Clone dice from localStorage (or props/state)
  const prevState = JSON.parse(localStorage.getItem("last_game_state"));
  const updatedDice = prevState?.dice ? [...prevState.dice.map(d => ({ ...d }))] : [];

  if (card.value === 2) {
    const chosen = new Set();
    while (chosen.size < 2) {
      const idx = parseInt(prompt(`${player.name}, choose die #${chosen.size + 1} to ${card.type === "Plus" ? "increase" : "decrease"} (0–4):`), 10);

      if (isNaN(idx) || idx < 0 || idx >= updatedDice.length) {
        alert("Invalid index. Must be 0–4.");
        continue;
      }

      if (chosen.has(idx)) {
        alert("You've already picked that die.");
        continue;
      }

      chosen.add(idx);
      const die = updatedDice[idx];
      die.value = card.type === "Plus"
        ? Math.min(6, die.value + 1)
        : Math.max(1, die.value - 1);

      console.log(`🎲 ${die.resource_type} die is now ${die.value}`);
    }
  } else {
    const idx = parseInt(prompt(`${player.name}, choose which die to ${card.type === "Plus" ? "increase" : "decrease"} (0–4):`), 10);
    if (isNaN(idx) || idx < 0 || idx >= updatedDice.length) {
      alert("Invalid die index.");
      return;
    }

    const die = updatedDice[idx];
    die.value = card.type === "Plus"
      ? Math.min(6, die.value + card.value)
      : Math.max(1, die.value - card.value);

    console.log(`🎲 ${die.resource_type} die is now ${die.value}`);
  }

  // ✅ Broadcast the updated dice to everyone
  broadcastState({ dice: updatedDice });
};


  useEffect(() => {
    if (!isCurrentPlayer) return;

    const updatedDeck = [...deck];
    const drawn = [];

    while (drawn.length < numToDraw && updatedDeck.length > 0) {
      const card = updatedDeck.pop();
      if (card.isSpecial) {
        console.log("💫 Special card drawn:", card);
        setTimeout(() => {
          playSpecialCard(card);
        }, 250); // or 300ms if needed
      } else {
        drawn.push(card);
      }
    }

    if (drawn.length < numToDraw) {
      console.warn("Not enough non-special cards — skipping to auction");
      broadcastState({ phase: "auction" });
      return;
    }

    setDeck(updatedDeck);
    setDonationDeck(updatedDeck);
    setCardsToProcess(drawn.reverse()); // optional: maintain draw order
    broadcastState({ deck: updatedDeck });
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
    // console.log("🟩 ConfirmTurn triggered");
  // console.log("Kept:", kept, "Discarded:", discarded, "Shared:", shared);
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

  console.log("🧮 Broadcasting updated deck length:", donationDeck.length);
  broadcastState({
    discardPile: updatedDiscard,
    sharedPool: updatedShared,
    players: updatedPlayers,
    deck: donationDeck,
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
