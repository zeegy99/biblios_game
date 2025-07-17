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
  const hasDrawn = useRef(false);
  const handledSpecialCards = useRef(new Set());
  const [specialCardToPlay, setSpecialCardToPlay] = useState(null);
  const [drawnCount, setDrawnCount] = useState(0); // counts non-specials

  //Dice UI
  const [diceToModify, setDiceToModify] = useState(null);
  const [diceSelectionCard, setDiceSelectionCard] = useState(null);
  const [diceChosen, setDiceChosen] = useState(new Set());

   //Resolving Special Dice Cards: 

  const playSpecialCard = (card) => {
  console.log(`${player.name} is playing special dice modifier:`, card);

  // Clone dice from localStorage
  const prevState = JSON.parse(localStorage.getItem("last_game_state"));
  const diceClone = prevState?.dice ? [...prevState.dice.map(d => ({ ...d }))] : [];

  // Defer to UI for all handling
  if (card.type === "Both") {
    // UI will render choice between Plus/Minus
    setDiceSelectionCard(card);
    return;
  }

  setDiceToModify(diceClone);         // For rendering
  setDiceSelectionCard(card);         // Which card is active
  setDiceChosen(new Set());           // For tracking selected dice
};

 useEffect(() => {
  if (!specialCardToPlay || !isCurrentPlayer) return;

  const card = specialCardToPlay;
  if (handledSpecialCards.current.has(card)) return;

  handledSpecialCards.current.add(card);

  setTimeout(() => {
    playSpecialCard(card);

    // ✅ Remove the resolved special card from the screen
    setCardsToProcess((prev) =>
      prev.filter((c) => c !== card)
    );

    // // ✅ Clear the tracker
    // setSpecialCardToPlay(null);
  }, 300);
}, [specialCardToPlay, isCurrentPlayer]);

  useEffect(() => {
    if (!isCurrentPlayer || hasDrawn.current) {
      return;
    }
    hasDrawn.current = true;

    console.log(`🃏 [${player.name}] Deck before draw:`, deck.map(c => `${c.type} ${c.value}`));
    console.log(`📦 [${player.name}] Deck size before draw:`, deck.length);

    const updatedDeck = [...deck];
    const drawn = [];

    while (drawn.length < numToDraw && updatedDeck.length > 0) {
      const card = updatedDeck.pop();
      if (card.isSpecial) {
          // drawn.push(card); // show it like a normal card first
          setSpecialCardToPlay(card); // trigger effect later
          continue;
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
    if (specialCardToPlay || diceSelectionCard || diceToModify) {
    console.warn("🛑 Cannot assign cards during special card resolution");
    return;
    }
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
    <h3>{players[currentPlayerIndex]?.name}'s Donation Turn</h3>

    {/* 🟡 Everyone sees the special card banner */}
    {specialCardToPlay && (
      <div style={{ margin: "20px auto", padding: "15px", border: "2px solid gold", borderRadius: "10px", width: "fit-content", backgroundColor: "#fff8dc" }}>
        <h4 style={{ textAlign: "center" }}>💫 Special Card Drawn!</h4>
        <Card {...specialCardToPlay} />
      </div>
    )}

    {/* 🟣 Both card choice */}
    {diceSelectionCard?.type === "Both" && !diceToModify && (
      <div style={{ marginTop: "20px", border: "2px solid violet", padding: "10px", borderRadius: "10px" }}>
        <h4>💫 You drew a Both card ({diceSelectionCard.value})</h4>
        <p>Choose how you'd like to use it:</p>
        {isCurrentPlayer ? (
          <>
            <button style={{ marginRight: "10px" }} onClick={() => playSpecialCard({ ...diceSelectionCard, type: "Plus" })}>
              ➕ Increase
            </button>
            <button onClick={() => playSpecialCard({ ...diceSelectionCard, type: "Minus" })}>
              ➖ Decrease
            </button>
          </>
        ) : (
          <p style={{ color: "gray" }}>Waiting for {player.name} to choose...</p>
        )}
      </div>
    )}

    {/* 🎲 Dice resolution UI */}
    {diceToModify && diceSelectionCard && (
      <div style={{ marginTop: "20px", border: "2px dashed gray", padding: "10px", borderRadius: "10px" }}>
        <h4>
          🎲 Modify Dice — {diceSelectionCard.type === "Plus" ? "+" : "-"}
          {diceSelectionCard.value}
        </h4>
        {!isCurrentPlayer && (
          <p style={{ color: "gray", marginBottom: "10px" }}>
            ⏳ Waiting for {player.name} to select dice...
          </p>
        )}
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          {diceToModify.map((die, i) => (
            <div key={i} style={{ border: "1px solid #ccc", padding: "10px", borderRadius: "8px", textAlign: "center", minWidth: "80px" }}>
              <div style={{ fontWeight: "bold" }}>{die.resource_type}</div>
              <div style={{ fontSize: "24px", margin: "6px 0" }}>{die.value}</div>
              <button
                disabled={!isCurrentPlayer || diceChosen.has(i)}
                onClick={() => {
                  if (!isCurrentPlayer) return;

                  const updated = [...diceToModify];
                  updated[i].value = diceSelectionCard.type === "Plus"
                    ? Math.min(6, updated[i].value + 1)
                    : Math.max(1, updated[i].value - 1);

                  const nextChosen = new Set(diceChosen);
                  nextChosen.add(i);
                  setDiceToModify(updated);
                  setDiceChosen(nextChosen);

                  const needed = diceSelectionCard.value === 2 ? 2 : 1;
                  if (nextChosen.size === needed) {
                    broadcastState({ dice: updated });
                    setSpecialCardToPlay(null);
                    setDiceToModify(null);
                    setDiceSelectionCard(null);
                    setDiceChosen(new Set());
                    setCardsToProcess((prev) => prev.filter((c) => c !== diceSelectionCard));
                  }
                }}
              >
                {diceSelectionCard.type === "Plus" ? "➕" : "➖"}
              </button>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* 👤 Non-current player's view */}
    {!isCurrentPlayer && (
      <p>⏳ Waiting for {players[currentPlayerIndex]?.name} to complete their turn...</p>
    )}

    {/* ✅ Main player control section */}
    {isCurrentPlayer && (
      <>
        {currentCard ? (
          <div>
            <h4>Choose what to do with this card:</h4>
            <Card {...currentCard} />
            <div style={{ marginTop: "10px" }}>
              <button onClick={() => handleChoice(currentCard, "keep")}
                disabled={specialCardToPlay || diceSelectionCard || diceToModify}>
                Keep
              </button>
              <button onClick={() => handleChoice(currentCard, "discard")}
                disabled={specialCardToPlay || diceSelectionCard || diceToModify}>
                Discard
              </button>
              <button onClick={() => handleChoice(currentCard, "pool")}
                disabled={specialCardToPlay || diceSelectionCard || diceToModify}>
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
