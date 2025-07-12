import React from "react";
import Card from "./card";

const SharedPoolSelection = ({
  players,
  sharedPool,
  setSharedPool,
  setPlayerHands,
  setPlayerGold,
  onFinish,
  setPlayers,
  broadcastState,
  sharedSelectionIndex,
  lastDonatorIndex,
  playerName,
}) => {

  console.log("🧑‍🤝‍🧑 Players from df's POV:", players);
  console.log("🃏 Hands from df:", players.map(p => ({ name: p.name, hand: p.hand })));

  
  const player = players[sharedSelectionIndex];
  const isCurrentPlayer = player.name === playerName;

  const handleChoice = (choiceIdx) => {
  if (!isCurrentPlayer) {
    console.warn("⛔ Not your turn. Ignoring input.");
    return;
  }

  const chosenCard = sharedPool[choiceIdx];
  if (!chosenCard) {
    console.warn("❌ Card already taken or stale click");
    return;
  }

  console.log("🎯 Player", players[sharedSelectionIndex].name, "chose card:", chosenCard);

  const newPool = [...sharedPool];
  newPool.splice(choiceIdx, 1);
  setSharedPool(newPool);
  console.log("🧺 New sharedPool after removal:", newPool);

  const updatedPlayers = players.map((p, i) => {
  if (i !== sharedSelectionIndex) return p;
  return {
    ...p,
    hand: [...p.hand, chosenCard],
    gold: p.gold + (chosenCard.type === "Gold" ? chosenCard.value : 0),
  };
});

console.log("🃏 Hand after taking card:", updatedPlayers[sharedSelectionIndex].hand);
console.log("SharedPool after taking card: ")



  
  setPlayers(() => {
  console.log("🖐 Hands after selection:");
  updatedPlayers.forEach((p) => {
    console.log(`   👤 ${p.name}:`, p.hand.map(card => `${card.type} ${card.value}`));
  });

  const lastIndex = (sharedSelectionIndex - 1 + updatedPlayers.length) % updatedPlayers.length;
  const lastPlayer = updatedPlayers[lastIndex];
  console.log(`📌 Last player to act was: ${lastPlayer.name}`);
  console.log(`   📜 Their hand:`, lastPlayer.hand.map(card => `${card.type} ${card.value}`));
  return updatedPlayers;
});

  console.log("🧑‍🤝‍🧑 Updated players after choice:", updatedPlayers);

  broadcastState({
    sharedPool: newPool,
    players: updatedPlayers,
    sharedSelectionIndex,
    phase: "shared_selection",
  });

  setTimeout(() => {
    console.log("➡️ Moving to next player after broadcasting...");
    nextPlayer();
  }, 200);
};



  const nextPlayer = () => {
    const next = (sharedSelectionIndex + 1) % players.length;
    if (next === lastDonatorIndex) {
      onFinish();
    } else {
      broadcastState({ sharedSelectionIndex: next });
    }
  };

  // Empty pool, end selection immediately if it's current player's turn
  if (!sharedPool.length && isCurrentPlayer) {
    onFinish();
    return <p>No cards left in shared pool.</p>;
  }

  // Passive waiting if not current player and pool is empty
  if (!sharedPool.length) {
    return <p>Waiting for other players...</p>;
  }

  return (
    <div>
      <h3>{player.name}'s Turn - Shared Pool Selection</h3>

      {!isCurrentPlayer && (
        <p>⏳ Waiting for {player.name} to choose a card...</p>
      )}

      {isCurrentPlayer && sharedPool.length > 0 && (
  <>
    <p>Select a card or skip:</p>
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      {sharedPool.map((card, idx) => (
        <div key={idx} style={{ margin: "10px" }}>
          <Card {...card} />
          <button
            onClick={() => handleChoice(idx)}
            disabled={!sharedPool[idx]} // stale guard
          >
            Take
          </button>
        </div>
      ))}
    </div>
  </>
)}

    </div>
  );
};

export default SharedPoolSelection;
