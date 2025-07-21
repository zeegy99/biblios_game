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
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useLocation } from "react-router-dom";

const GameRunner = ({ playerName }) => {
  // console.log("🧠 GameRunner mounted with playerName:", playerName);
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

  //For Auctions
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState(null);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [activeBidders, setActiveBidders] = useState([]);
  const [awaitingGoldPayment, setAwaitingGoldPayment] = useState(false);
  const [goldPaymentWinner, setGoldPaymentWinner] = useState(null);
  const [awaitingCardPayment, setAwaitingCardPayment] = useState(false);
  const [selectedPaymentCards, setSelectedPaymentCards] = useState([]);
  const [goldWinner, setGoldWinner] = useState(null);
  const [goldCard, setGoldCard] = useState(null);
  const [auctionTurnOffset, setAuctionTurnOffset] = useState(0);
  const [finalResults, setFinalResults] = useState([]);
  const { room } = useParams();

  const navigate = useNavigate();

  const handleRestart = () => {
  localStorage.removeItem("last_game_state");
  localStorage.removeItem("start_game_payload");

  // Optional: reset any local state if needed
  setFinalResults([]);
  setFinalPhaseDone(false);
  setPlayers([]);
  setDeck([]);
  setDice(null);

  navigate("/lobby");
};



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

     // 🔽 Auction state
    currentCardIndex,
    currentBid,
    highestBidder,
    activePlayerIndex,
    activeBidders,
    awaitingGoldPayment,
    goldPaymentWinner,
    awaitingCardPayment,
    selectedPaymentCards,
    goldWinner,
    goldCard,
    auctionTurnOffset,
  });

  const broadcastState = (newPartialState = null) => {
  const fullState = {
    ...buildGameState(),      // ⬅️ get the full current state
    ...newPartialState        // ⬅️ overwrite any fields provided
  };
  console.log("📤 Broadcasting FULL game state:", fullState, playerName);
  socket.emit("sync_game_state", { room: `${room}`, gameState: fullState });
};

useEffect(() => {
  if (phase === "auction") {
    console.log("🧾 Entering Auction Phase — FULL game state:");
    console.log(buildGameState());
  }
}, [phase]);

useEffect(() => {
  console.log("🎯 auctionTurnOffset updated to:", auctionTurnOffset);
}, [auctionTurnOffset]);

useEffect(() => {
  console.log("📡 GameManager useEffect ran");


  
  // Always attach this listener — it must run regardless of playerName
  const handleGameState = (gameState) => {
   if (!hasSynced.current) {
  hasSynced.current = true;
  console.log("✅ First sync");
} else {
  console.log("🔁 Re-syncing from broadcast");
}
    // console.log("This is the gamestate", gameState)
    // console.log("💥 From player:", playerName);
    localStorage.setItem("last_game_state", JSON.stringify(gameState)); 

    setPhase(gameState.phase);
    setDeck(gameState.deck);
    // console.log("🃏 Deck received in GameRunner:", gameState.deck);
    // console.log("📦 Deck length:", gameState.deck.length, playerName);
    setDiscardPile(gameState.discardPile);

    setSharedPool([...gameState.sharedPool]);  // ✅ ensure clone to trigger re-render
    


    setPlayers(gameState.players);
    setCurrentPlayerIndex(gameState.currentPlayerIndex);
    setLastDonatorIndex(gameState.lastDonatorIndex);
    setDice(gameState.dice);
    setSharedSelectionIndex(gameState.sharedSelectionIndex ?? 0);
    setFinalPhaseDone(gameState.finalPhaseDone);

    //Auctions
    setCurrentCardIndex(gameState.currentCardIndex ?? 0);
    setCurrentBid(gameState.currentBid ?? 0);
    setHighestBidder(gameState.highestBidder);
    setActivePlayerIndex(gameState.activePlayerIndex ?? 0);
    setActiveBidders(gameState.activeBidders ?? []);
    setAwaitingGoldPayment(gameState.awaitingGoldPayment ?? false);
    setGoldPaymentWinner(gameState.goldPaymentWinner ?? null);
    setAwaitingCardPayment(gameState.awaitingCardPayment ?? false);
    setSelectedPaymentCards(gameState.selectedPaymentCards ?? []);
    setGoldWinner(gameState.goldWinner ?? null);
    setGoldCard(gameState.goldCard ?? null);
    setAuctionTurnOffset(gameState.auctionTurnOffset ?? 0);

  };

  // ✅ Use fallback *once* before listener
  if (!hasSynced.current) {
    const cached = localStorage.getItem("last_game_state");
    // if (cached) {
    //   console.log("📦 Using cached game state");
    //   handleGameState(JSON.parse(cached));
    // }
  }


  socket.on("sync_game_state", handleGameState);

  
  if (playerName) {
    socket.emit("join_game", { room: `${room}`, playerName });
    console.log("what is going on")

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

        const newDeck = buildDeck();

        const rolledDice = rollDice();
        setDice(rolledDice); 
        console.log("Dice rolled", rolledDice)
        const state = {
          phase: "donation",
          deck: newDeck,
          discardPile: [],
          sharedPool: Array.isArray(sharedPool) ? sharedPool : [],
          players: initializedPlayers,
          currentPlayerIndex: 0,
          lastDonatorIndex: null,
          dice: rolledDice,
          finalPhaseDone: false,
          auctionTurnOffset: 0,  
        };
        console.log("👑 Host broadcasting initial game state:", state);
        socket.emit("sync_game_state", { room: `${room}`, gameState: state });
      }, 0);

      localStorage.removeItem("start_game_payload");
      localStorage.removeItem("last_game_state");  // <-- ✅ add this
    }

    if (!hasSynced.current) {
      const cachedGameState = localStorage.getItem("last_game_state");
      if (cachedGameState) {
        console.log("📦 Using cached game state");
        handleGameState(JSON.parse(cachedGameState));
      }
    }

    socket.on("player_list", (list) => {
      // console.log("📡 player_list received:", list);
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
      {dice && (
  <div style={{ textAlign: "center", marginBottom: "20px" }}>
    <h3>🎲 Dice Values</h3>
    <ul style={{ display: "flex", justifyContent: "center", listStyle: "none", padding: 0, gap: "12px" }}>
      {dice.map((die, idx) => (
        <li key={idx} style={{
          padding: "8px 12px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9",
          minWidth: "80px"
        }}>
          <strong>{die.resource_type}</strong>: {die.value}
        </li>
      ))}
    </ul>
  </div>
)}

      {phase === "donation" && playerName === players[currentPlayerIndex]?.name &&(
        
        <DonationPhase
          isCurrentPlayer={playerName === players[currentPlayerIndex]?.name}
          player={players.find(p => p.name === playerName)} // 👈 local player!
          players={players}
          deck={deck}
          setDeck={setDeck}
          setDiscardPile={setDiscardPile}
          discardPile={discardPile}
          sharedPool={sharedPool}
          phase={phase}
          setSharedPool={setSharedPool}
          setPlayers={setPlayers}
          broadcastState={broadcastState}
          currentPlayerIndex={currentPlayerIndex}
          totalPlayers={players.length}
          onFinish={({ updatedDiscard, updatedShared, updatedPlayers }) => {
            // console.log("Everything from DonationPhase");
            // console.log("🗑️ Discard Pile:", updatedDiscard);
            // console.log("🫱 Shared Pool:", updatedShared);
            // console.log("🧑‍🤝‍🧑 Players:", updatedPlayers);
            // console.log("🃏 Player Hands:", updatedPlayers.map(p => ({
            //   name: p.name,
            //   hand: p.hand,
            //   gold: p.gold
            // })));  
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
    phase = {phase}
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
      console.log(`   - nextPlayerIndex: ${nextPlayerIndex}`);
      if (deck.length < players.length + 1) {
        console.log("🎯 Switching to auction phase — NO broadcast here");
    setAuctionStarterIndex(nextPlayerIndex);
    setPhase("auction");

    setTimeout(() => {
      broadcastState({
        auctionStarterIndex: nextPlayerIndex,
        phase: "auction",
      });
    }, 50);
      } else {
        console.log(`🔄 [${playerName}] Continuing to next donation round — NO broadcast here`);
        setCurrentPlayerIndex(nextPlayerIndex);
        setSharedPool([]);
        setPhase("donation");

        setTimeout(() => {
      broadcastState({
        currentPlayerIndex: nextPlayerIndex,
        sharedPool: [],
        phase: "donation",
      });
    }, 50);
        
      }
    }}
    sharedSelectionIndex={sharedSelectionIndex}
    lastDonatorIndex={lastDonatorIndex}
    playerName={playerName}
  />
)}

      {phase === "auction" && (
        <AuctionPhase
          players={players}
          discardPile={discardPile}
          setDiscardPile={setDiscardPile}
          setPhase={setPhase}
          setPlayers={setPlayers}
          lastDonatorIndex={lastDonatorIndex}
          auctionStarterIndex={auctionStarterIndex}
          playerName={playerName}
          broadcastState={broadcastState}

          //AuctionState

          currentCardIndex={currentCardIndex}
          setCurrentCardIndex={setCurrentCardIndex}
          currentBid={currentBid}
          setCurrentBid={setCurrentBid}
          highestBidder={highestBidder}
          setHighestBidder={setHighestBidder}
          activePlayerIndex={activePlayerIndex}
          setActivePlayerIndex={setActivePlayerIndex}
          activeBidders={activeBidders}
          setActiveBidders={setActiveBidders}
          awaitingGoldPayment={awaitingGoldPayment}
          setAwaitingGoldPayment={setAwaitingGoldPayment}
          goldPaymentWinner={goldPaymentWinner}
          setGoldPaymentWinner={setGoldPaymentWinner}
          awaitingCardPayment={awaitingCardPayment}
          setAwaitingCardPayment={setAwaitingCardPayment}
          selectedPaymentCards={selectedPaymentCards}
          setSelectedPaymentCards={setSelectedPaymentCards}
          goldWinner={goldWinner}
          setGoldWinner={setGoldWinner}
          goldCard={goldCard}
          setGoldCard={setGoldCard}
          auctionTurnOffset={auctionTurnOffset}
          setAuctionTurnOffset={setAuctionTurnOffset}
        />
      )}

      

      {phase === "scoring" && dice && (
        <ScoringPhase
  players={players}
  dice={dice}
  isHost={players[0]?.name === playerName}
  setFinalResults={(scoredPlayers) => {
    setPlayers(scoredPlayers);
    setFinalResults(scoredPlayers);
    setFinalPhaseDone(true);
    
    // ✅ broadcast to all players
    broadcastState({
      players: scoredPlayers,
      finalResults: scoredPlayers,
      finalPhaseDone: true,
    });
  }}
  goToResults={() => {
    setPhase("results");
    broadcastState({ phase: "results" });
  }}
/>
      )}

      {phase === "results" && (
        <ResultsScreen
           players={finalResults}
            onRestart={handleRestart}
        />
      )}

      {/* {phase !== "donation" && phase !== "shared" && (
        <button onClick={advancePhase}>Next Phase</button>
      )} */}

      {phase !== "results" && (
        <>
        </>


      )}



        {phase !== "results" && phase !== "scoring" && (
        <div>
          <p>
            {playerName}: {players.find(p => p.name === playerName)?.gold ?? 0} gold
          </p>
        </div>
      )}

      <div style={{ marginTop: "30px" }}>
        <h3>Game State</h3>

        {/* ✅ KEEP: Player sees only their own hand */}
        <h4>{playerName}'s Hand</h4>
        <ul>
          {players.find(p => p.name === playerName)?.hand.map((card, index) => (
            <li key={index}>
              {card.type} {card.value}
            </li>
          )) ?? <li>(No cards)</li>}
        </ul>

        {/* 🔻 CHANGED: Hide discard pile unless debugging */}
        {false && (
          <>
            <h4>Discard Pile</h4>
            <ul>
              {discardPile.map((card, index) => (
                <li key={index}>
                  {card.type} {card.value}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* ✅ KEEP: Everyone sees the shared pool */}
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