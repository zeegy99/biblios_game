import React from "react";
import Card from "./card";
import {useEffect} from "react";

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
  phase,
}) => {

  if (phase !== "shared_selection") {
    console.log(`🚫 [${playerName}] SharedPoolSelection rendered but phase is: ${phase}`);
    return null;
  }

  
  // console.log("🧑‍🤝‍🧑 Players from df's POV:", players);
  // console.log("🃏 Hands from df:", players.map(p => ({ name: p.name, hand: p.hand })));

  
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

  const updatedPlayers = players.map((p, i) => {
    if (i !== sharedSelectionIndex) return p;
    return {
      ...p,
      hand: [...p.hand, chosenCard],
      gold: p.gold + (chosenCard.type === "Gold" ? chosenCard.value : 0),
    };
  });

  const next = (sharedSelectionIndex + 1) % players.length;

  // Apply state updates immediately
  setSharedPool(newPool);
  setPlayers(updatedPlayers);

  setTimeout(() => {
    const sharedSelectionState = {
      phase: "shared_selection",
      sharedPool: newPool,
      players: updatedPlayers,
      sharedSelectionIndex: next,
    };

    if (next === lastDonatorIndex) {
      console.log("🚨 Final selector in shared phase, broadcasting & finishing");
      broadcastState(sharedSelectionState);
      onFinish(); 
    } else {
      console.log("➡️ Broadcasting next turn in shared pool");
      broadcastState(sharedSelectionState);
    }
  }, 0);
};


  useEffect(() => {
  if (!sharedPool.length && isCurrentPlayer) {
    onFinish(); // ✅ Safe inside effect
  }
}, [sharedPool, isCurrentPlayer, onFinish]);

if (!sharedPool.length && !isCurrentPlayer) {
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