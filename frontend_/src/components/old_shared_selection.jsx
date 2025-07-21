import React, { useState } from "react";
import Card from "./card";

const SharedPoolSelection = ({
  players,
  activePlayer,
  sharedPool,
  setSharedPool,
  setPlayerHands,
  setPlayerGold,
  onFinish,
  setPlayers,
  broadcastState,
  sharedSelectionIndex,
  lastDonatorIndex,
  playerName,  // <- added prop
}) => {
  const currentIndex = players.findIndex(p => p.name === activePlayer.name);

  
  const handleChoice = (player, choiceIdx) => {
  const chosenCard = sharedPool[choiceIdx];
  if (!chosenCard) return;

  const newPool = [...sharedPool];
  newPool.splice(choiceIdx, 1);
  setSharedPool(newPool);

  // Update player's hand and gold in the players array
  setPlayers(prevPlayers => {
    return prevPlayers.map((p) => {
      if (p.name !== player.name) return p;

      const updatedHand = [...p.hand, chosenCard];
      const updatedGold = p.gold + (chosenCard.type === "Gold" ? chosenCard.value : 0);

      return { ...p, hand: updatedHand, gold: updatedGold };
    });
  });

  broadcastState(); // broadcast to all clients
  nextPlayer();     // move to next
};


  const nextPlayer = () => {
    let next = (players.findIndex(p => p.name === activePlayer.name) + 1) % players.length;

    if (next === players.findIndex(p => p.name === activePlayer.name)) {
      onFinish(); // done selecting
    } else {
      broadcastState({
  sharedSelectionIndex: next
});
    }
  };

  const player = players[currentIndex];

  if (!sharedPool.length) {
    onFinish();
    return <p>No cards left in shared pool.</p>;
  }

  const isCurrentPlayer = player.name === playerName;

  return (
    <div>
      <h3>{player.name}'s Turn - Shared Pool Selection</h3>

      {!isCurrentPlayer && (
        <p>⏳ Waiting for {player.name} to choose a card...</p>
      )}

      {isCurrentPlayer && (
        <>
          <p>Select a card or skip:</p>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {sharedPool.map((card, idx) => (
              <div key={idx} style={{ margin: "10px" }}>
                <Card {...card} />
                <button onClick={() => handleChoice(player, idx)}>Take</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SharedPoolSelection;
