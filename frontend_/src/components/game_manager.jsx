import React, { useState, useEffect } from "react";
import { useRef } from "react";
import DonationPhase from "./donation_phase";
import AuctionPhase from "./auction_phase";
import ResultsScreen from "./results";
import ScoringPhase from "./scoring_phase";
import SharedPoolSelection from "./shared_selection";
import { buildDeck } from "./deck.jsx";
import { rollDice } from "../utils/setup";
import socket from "../socket";
import { useLocation } from "react-router-dom";

const GameRunner = ({ playerName }) => {
  console.log("🧠 GameRunner mounted with playerName:", playerName);
  const hasSynced = useRef(false);
  const [auctionStarterIndex, setAuctionStarterIndex] = useState(null);
  const [sharedSelectionIndex, setSharedSelectionIndex] = useState(0);
  const [dice, setDice] = useState(null);
  const [phase, setPhase] = useState("donation");
  const [deck, setDeck] = useState(buildDeck());
  const [discardPile, setDiscardPile] = useState([]);
  const [sharedPool, setSharedPool] = useState([]);
  const [players, setPlayers] = useState([]);
  const [playersOnline, setPlayersOnline] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [lastDonatorIndex, setLastDonatorIndex] = useState(null);
  const [finalPhaseDone, setFinalPhaseDone] = useState(false);

  //Building out what gameState is
  const buildGameState = () => ({
    phase,
    deck,
    discardPile,
    sharedPool,
    players,
    currentPlayerIndex,
    lastDonatorIndex,
    sharedSelectionIndex,
    dice,
    finalPhaseDone,
  });

  const broadcastState = (newPartialState = null) => {
  const fullState = {
    ...buildGameState(),      // ⬅️ get the full current state
    ...newPartialState        // ⬅️ overwrite any fields provided
  };
  console.log("📤 Broadcasting FULL game state:", fullState);
  console.log("🧺 Broadcast sharedPool:", fullState.sharedPool);
  socket.emit("sync_game_state", { room: "biblios", gameState: fullState });
};

//⬅️ First UseEffect
 useEffect(() => {
  console.log("📡 GameManager useEffect ran");

  // const hasSynced = { current: false };

  socket.on("sync_game_state", (...args) => {
  console.log("👂 df actually received sync_game_state");
});
  
  // Always attach this listener — it must run regardless of playerName
  const handleGameState = (gameState) => {
    if (hasSynced.current) {
      console.log("🛑 Skipping fallback — already synced once.");
    }
    hasSynced.current = true;
    console.log("This is the gamestate", gameState)
    console.log("💥 From player:", playerName);
    localStorage.setItem("last_game_state", JSON.stringify(gameState)); 

    setPhase(gameState.phase);
    setDeck(gameState.deck);
    setDiscardPile(gameState.discardPile);

    setSharedPool([...gameState.sharedPool]);  // ✅ ensure clone to trigger re-render
    console.log("📥 Synced sharedPool on client:", gameState.sharedPool);
    console.log("🧮 SharedPool length:", gameState.sharedPool?.length);
    console.log("📋 Full sharedPool contents:", JSON.stringify(gameState.sharedPool, null, 2));


    setPlayers(gameState.players);
    setCurrentPlayerIndex(gameState.currentPlayerIndex);
    setLastDonatorIndex(gameState.lastDonatorIndex);
    setDice(gameState.dice);
    setSharedSelectionIndex(gameState.sharedSelectionIndex ?? 0);
    setFinalPhaseDone(gameState.finalPhaseDone);
  };

  // ✅ Use fallback *once* before listener
  if (!hasSynced.current) {
    const cached = localStorage.getItem("last_game_state");
    if (cached) {
      console.log("📦 Using cached game state");
      handleGameState(JSON.parse(cached));
    }
  }


  socket.on("sync_game_state", handleGameState);

  
  if (playerName) {
    socket.emit("join_game", { room: "biblios", playerName });

    const cachedStart = localStorage.getItem("start_game_payload");
    if (cachedStart) {
      console.log("📦 Using cached start_game payload");
      const { players: rawPlayers } = JSON.parse(cachedStart);

      const initializedPlayers = rawPlayers.map((p) => ({
        name: p.name,
        gold: 0,
        points: 0,
        hand: [],
      }));

      setPlayers(initializedPlayers);
      setCurrentPlayerIndex(0);

      setTimeout(() => {
        const state = {
          phase: "donation",
          deck,
          discardPile,
          sharedPool: Array.isArray(sharedPool) ? sharedPool : [],
          players: initializedPlayers,
          currentPlayerIndex: 0,
          lastDonatorIndex: null,
          dice: null,
          finalPhaseDone: false,
        };
        console.log("👑 Host broadcasting initial game state:", state);
        socket.emit("sync_game_state", { room: "biblios", gameState: state });
      }, 0);

      localStorage.removeItem("start_game_payload");
    }

    if (!hasSynced.current) {
      const cachedGameState = localStorage.getItem("last_game_state");
      if (cachedGameState) {
        console.log("📦 Using cached game state");
        handleGameState(JSON.parse(cachedGameState));
      }
    }

    socket.on("player_list", (list) => {
      console.log("📡 player_list received:", list);
      setPlayersOnline(list);
    });
  }

  return () => {
    socket.off("player_list");
    socket.off("sync_game_state", handleGameState);
  };
}, [playerName]);




  if (!players.length || !players[currentPlayerIndex]) {
    console.log("⏳ Still waiting for game initialization...");
    return <div>Waiting for game state to initialize...</div>;
  }

  const currentPlayer = players[currentPlayerIndex];

  const advancePhase = () => {
    if (phase === "auction") {
      const newDice = rollDice();
      setDice(newDice);
      setPhase("scoring");
    } else if (phase === "scoring") {
      setPhase("results");
    } else if (phase === "results") {
      console.log("Game over.");
    }
  };

  return (
    <div>
      <h1 style={{ textAlign: "center", marginTop: "50px" }}>Biblios Game</h1>

      <div>
        <h3>Players Online:</h3>
        <ul>
          {playersOnline.map((p, i) => (
            <li key={i}>{p.name}</li>
          ))}
        </ul>
      </div>

      <p style={{ textAlign: "center" }}>Current Phase: {phase}</p>

      {phase === "donation" && (
        
        <DonationPhase
          isCurrentPlayer={currentPlayer.name === playerName}
          player={currentPlayer}
          deck={deck}
          setDeck={setDeck}
          setDiscardPile={setDiscardPile}
          discardPile={discardPile}
          sharedPool={sharedPool}
          setSharedPool={setSharedPool}
          setPlayers={setPlayers}
          broadcastState={broadcastState}
          players={players} 
          currentPlayerIndex={currentPlayerIndex}
          totalPlayers={players.length}
          onFinish={({ updatedDiscard, updatedShared, updatedPlayers }) => {
            console.log("Everything from DonationPhase");
            console.log("🗑️ Discard Pile:", updatedDiscard);
            console.log("🫱 Shared Pool:", updatedShared);
            console.log("🧑‍🤝‍🧑 Players:", updatedPlayers);
            console.log("🃏 Player Hands:", updatedPlayers.map(p => ({
              name: p.name,
              hand: p.hand,
              gold: p.gold
            })));  
        }}


        />
      )}

      {phase === "shared_selection" && players[lastDonatorIndex] && (
  <SharedPoolSelection
    key={sharedSelectionIndex}
    players={players}
    broadcastState={broadcastState}
    activePlayer={players[sharedSelectionIndex]}
    sharedPool={sharedPool}
    setSharedPool={setSharedPool}
    discardPile={discardPile}
    setPlayers={setPlayers}
    setPlayerGold={(updateFn) =>
      setPlayers((prev) =>
        prev.map((p, i) => {
          const updatedGold = updateFn(prev.map((p) => p.gold))[i];
          return { ...p, gold: updatedGold };
        })
      )
    }
    onFinish={() => {
      const nextPlayerIndex = (lastDonatorIndex + 1) % players.length;

      if (deck.length < players.length + 1) {
        setAuctionStarterIndex(nextPlayerIndex);
        setPhase("auction");
        broadcastState({
          auctionStarterIndex: nextPlayerIndex,
          phase: "auction",
        });
      } else {
        setCurrentPlayerIndex(nextPlayerIndex);
        setSharedPool([]);
        setPhase("donation");
        broadcastState({
          currentPlayerIndex: nextPlayerIndex,
          sharedPool: [],  // ✅ broadcast cleared pool
          phase: "donation",
        });
      }
    }}
    sharedSelectionIndex={sharedSelectionIndex}
    lastDonatorIndex={lastDonatorIndex}
    playerName={playerName}
  />
)}

      {phase === "auction" && (
        console.log("🎴 Deck at donation phase start:", deck),
        <AuctionPhase
          players={players}
          discardPile={discardPile}
          setDiscardPile={setDiscardPile}
          setPhase={setPhase}
          setPlayers={setPlayers}
          lastDonatorIndex={lastDonatorIndex}
          auctionStarterIndex={auctionStarterIndex}
        />
      )}

      {phase === "scoring" && dice && (
        <ScoringPhase
          players={players}
          dice={dice}
          setFinalResults={(scoredPlayers) => {
            setPlayers(scoredPlayers);
            setFinalPhaseDone(true);
            broadcastState();
          }}
        />
      )}

      {phase === "results" && finalPhaseDone && (
        <ResultsScreen
          players={players}
          onRestart={() => window.location.reload()}
        />
      )}

      {/* {phase !== "donation" && phase !== "shared" && (
        <button onClick={advancePhase}>Next Phase</button>
      )} */}

      <div>
        {players.map((p, i) => (
          <p key={i}>
            {p.name}: {p.gold} gold, {p.points} points
          </p>
        ))}
      </div>

      <div style={{ marginTop: "30px" }}>
        <h3>Game State</h3>

        <h4>{currentPlayer.name}'s Hand</h4>
        <ul>
          {currentPlayer.hand.map((card, index) => (
            <li key={index}>
              {card.type} {card.value}
            </li>
          ))}
        </ul>

        <h4>Discard Pile</h4>
        <ul>
          {discardPile.map((card, index) => (
            <li key={index}>
              {card.type} {card.value}
            </li>
          ))}
        </ul>

        <h4>Shared Pool</h4>
        <ul>
          {sharedPool.map((card, index) => (
            <li key={index}>
              {card.type} {card.value}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default GameRunner;
