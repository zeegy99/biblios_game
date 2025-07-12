import Card from "./card";
import React, { useState, useMemo, useRef } from "react";

const AuctionPhase = ({
   players,
  discardPile,
  setDiscardPile,
  setPhase,
  setPlayers,
  lastDonatorIndex,
  auctionStarterIndex,
  playerName,
  broadcastState,

  currentCardIndex,
  setCurrentCardIndex,
  currentBid,
  setCurrentBid,
  highestBidder,
  setHighestBidder,
  activePlayerIndex,
  setActivePlayerIndex,
  activeBidders,
  setActiveBidders,
  awaitingGoldPayment,
  setAwaitingGoldPayment,
  goldPaymentWinner,
  setGoldPaymentWinner,
  awaitingCardPayment,
  setAwaitingCardPayment,
  selectedPaymentCards,
  setSelectedPaymentCards,
  goldWinner,
  setGoldWinner,
  goldCard,
  setGoldCard
}) => {
  // const [currentCardIndex, setCurrentCardIndex] = useState(0);
  // const [currentBid, setCurrentBid] = useState(0);
  // const [highestBidder, setHighestBidder] = useState(null);
  // const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  // const [activeBidders, setActiveBidders] = useState(players.map(() => true));
  // const bidInputRef = useRef(null);
  // const [awaitingGoldPayment, setAwaitingGoldPayment] = useState(false);
  // const [goldPaymentWinner, setGoldPaymentWinner] = useState(null);
  // const [awaitingCardPayment, setAwaitingCardPayment] = useState(false);
  // const [selectedPaymentCards, setSelectedPaymentCards] = useState([]);
  // const [goldWinner, setGoldWinner] = useState(null);
  // const [goldCard, setGoldCard] = useState(null);
  const [auctionTurnOffset, setAuctionTurnOffset] = useState(
    (lastDonatorIndex + 1) % players.length
  );

  const biddingOrder = useMemo(() => {
    return players.map((_, i) => players[(auctionTurnOffset + i) % players.length]);
  }, [players, auctionTurnOffset]);

  const currentCard = discardPile[currentCardIndex];
  const isGold = currentCard?.type === "Gold";
  const player = biddingOrder[activePlayerIndex];

  const nextPlayer = () => {
    let next = (activePlayerIndex + 1) % players.length;
    while (!activeBidders[next]) {
      next = (next + 1) % players.length;
    }
    setActivePlayerIndex(next);
  };

  const handleBid = (amount) => {
    if (isGold && amount > player.hand.length) return;
    if (!isGold && amount > player.gold) return;


    const isFirstBid = highestBidder === null;
    if (!isFirstBid && amount <= currentBid) {
      return alert("Bid too low!");
    }

    const updated = [...activeBidders];
    updated[activePlayerIndex] = true;

    setCurrentBid(amount);
    setHighestBidder(activePlayerIndex);
    setActiveBidders(updated);

    broadcastState({
    currentBid: amount,
    highestBidder: activePlayerIndex,
    activeBidders: updated,
    activePlayerIndex: (activePlayerIndex + 1) % players.length, // optimistic turn rotation
  });

    const stillIn = updated.filter(Boolean).length;
    if (stillIn === 1) {
      finishAuction(updated, activePlayerIndex);
    } else {
      nextPlayer();
    }
  };

  const handlePass = () => {
    const updated = [...activeBidders];
    updated[activePlayerIndex] = false;
    setActiveBidders(updated);

    broadcastState({
    activeBidders: updated,
    activePlayerIndex: (activePlayerIndex + 1) % players.length,
  });

    const stillIn = updated.filter(Boolean).length;
    const hasBid = highestBidder !== null;

    if (stillIn === 0) {
      finishAuction(updated, hasBid ? highestBidder : null);
    } else if (stillIn === 1 && hasBid) {
      finishAuction(updated, highestBidder);
    } else {
      nextPlayer();
    }
  };

  const finishAuction = (finalBidders, winnerIndex) => {
  if (winnerIndex == null) {
    alert("No one bid — card discarded.");

    broadcastState({
      discardPile: discardPile.slice(1), // remove the top card
      currentCardIndex: currentCardIndex + 1,
      highestBidder: null,
      currentBid: 0,
      activeBidders: players.map(() => true),
      activePlayerIndex: 0,
    });
  } else {
    const updatedPlayers = [...players];
    const winnerName = biddingOrder[winnerIndex].name;
    const winnerIdx = players.findIndex((p) => p.name === winnerName);
    const winner = updatedPlayers[winnerIdx];

    winner.hand.push(currentCard);

    if (isGold) {
      winner.gold += currentCard.value;

      setAwaitingCardPayment(true);
      setGoldWinner({ player: winner, index: winnerIdx });
      setGoldCard(currentCard);

      setPlayers(updatedPlayers);
      broadcastState({
        players: updatedPlayers,
        awaitingCardPayment: true,
        goldWinner: { player: winner, index: winnerIdx },
        goldCard: currentCard,
      });

      return;

    } else {
      // Add the won card (non-gold) to the winner's hand 
      setAwaitingGoldPayment(true);
      setGoldPaymentWinner({ player: winner, index: winnerIdx, card: currentCard });

      setPlayers(updatedPlayers);
      broadcastState({
        players: updatedPlayers,
        awaitingGoldPayment: true,
        goldPaymentWinner: {
          player: winner,
          index: winnerIdx,
          card: currentCard,
        },
      });
      return; // Wait until payment is confirmed
    }


  }

  // Advance to next card
  if (currentCardIndex + 1 < discardPile.length) {
    setCurrentCardIndex(currentCardIndex + 1);
    setHighestBidder(null);
    setActiveBidders(players.map(() => true));
    setAuctionTurnOffset((prev) => (prev + 1) % players.length);
    setActivePlayerIndex(0); // always start at index 0 of the new biddingOrder
    setCurrentBid(0);

    broadcastState({
      currentCardIndex: currentCardIndex + 1,
      highestBidder: null,
      activeBidders: players.map(() => true),
      activePlayerIndex: 0,
      currentBid: 0,
    });
    // Reset bid ONLY if we're not awaiting a gold card payment
  
  } else {
    setDiscardPile([]);
    setPhase("scoring");

    broadcastState({
      discardPile: [],
      phase: "scoring",
    });
  }
};


  if (!currentCard) return <p>No cards to auction.</p>;

  // 🔶 Non-gold card won → pay with gold cards
  if (awaitingGoldPayment && goldPaymentWinner) {
    const toggleGoldCardSelection = (card, idx) => {
      if (card.type !== "Gold") return;
      setSelectedPaymentCards((prev) => {
        const alreadySelected = prev.find((c) => c.idx === idx);
        return alreadySelected
          ? prev.filter((c) => c.idx !== idx)
          : [...prev, { ...card, idx }];
      });
    };

    const totalSelected = selectedPaymentCards.reduce((sum, c) => sum + c.value, 0);

    const confirmGoldPayment = () => {
  if (totalSelected < currentBid) {
    alert(`Selected cards only add up to ${totalSelected}. Must be at least ${currentBid}.`);
    return;
  }

  const updatedPlayers = [...players];
  const hand = [...updatedPlayers[goldPaymentWinner.index].hand];
  
  // Remove selected gold cards from hand
  const filtered = hand.filter((_, i) =>
    !selectedPaymentCards.some((c) => c.idx === i)
  );
  updatedPlayers[goldPaymentWinner.index].hand = filtered;

  // Decrease player's gold count
  updatedPlayers[goldPaymentWinner.index].gold -= totalSelected;

  // Add the won card to hand
  updatedPlayers[goldPaymentWinner.index].hand.push(goldPaymentWinner.card);

  setPlayers(updatedPlayers);
  setAwaitingGoldPayment(false);
  setSelectedPaymentCards([]);
  setCurrentBid(0);
  setCurrentCardIndex((prev) => prev + 1);
  setHighestBidder(null);
  setActiveBidders(players.map(() => true));
  setAuctionTurnOffset((prev) => (prev + 1) % players.length);
  setActivePlayerIndex(0);

  broadcastState({
    players: updatedPlayers,
    awaitingGoldPayment: false,
    selectedPaymentCards: [],
    currentBid: 0,
    currentCardIndex: currentCardIndex + 1,
    highestBidder: null,
    activeBidders: players.map(() => true),
    activePlayerIndex: 0,
  });
};


    return (
      <div>
        <h3>{goldPaymentWinner.player.name}, pay {currentBid} gold with your gold cards:</h3>
        <p>Total selected: {totalSelected}</p>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {players[goldPaymentWinner.index].hand.map((card, idx) => (
            <div
              key={idx}
              onClick={() => toggleGoldCardSelection(card, idx)}
              style={{
                border: selectedPaymentCards.some((c) => c.idx === idx)
                  ? "2px solid red"
                  : "1px solid gray",
                margin: "5px",
                cursor: card.type === "Gold" ? "pointer" : "not-allowed",
                opacity: card.type === "Gold" ? 1 : 0.4,
              }}
            >
              <Card {...card} />
            </div>
          ))}
        </div>
        <button onClick={confirmGoldPayment}>Confirm Payment</button>
      </div>
    );
  }

  // 🔶 Gold card won → discard equal number of cards
  if (awaitingCardPayment && goldWinner) {
    const toggleCardSelection = (card, idx) => {
      setSelectedPaymentCards((prev) => {
        const alreadySelected = prev.find((c) => c.idx === idx);
        return alreadySelected
          ? prev.filter((c) => c.idx !== idx)
          : [...prev, { ...card, idx }];
      });
    };

    const confirmCardPayment = () => {
      if (selectedPaymentCards.length !== currentBid) {
        alert(`You must select exactly ${currentBid} cards.`);
        return;
      }

      const updatedPlayers = [...players];
      const hand = [...updatedPlayers[goldWinner.index].hand];

      //Removing selected cards
      const filtered = hand.filter((_, i) =>
        !selectedPaymentCards.some((c) => c.idx === i)
      );
      updatedPlayers[goldWinner.index].hand = filtered;

      setPlayers(updatedPlayers);
      setAwaitingCardPayment(false);
      setSelectedPaymentCards([]);
      setCurrentBid(0);

      broadcastState({
      players: updatedPlayers,
      awaitingCardPayment: false,
      selectedPaymentCards: [],
      currentBid: 0,
  });
    };

    return (
      <div>
        <h3>{goldWinner.player.name}, select {currentBid} cards to discard:</h3>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {goldWinner.player.hand.map((card, idx) => (
            <div
              key={idx}
              onClick={() => toggleCardSelection(card, idx)}
              style={{
                border: selectedPaymentCards.some((c) => c.idx === idx)
                  ? "2px solid red"
                  : "1px solid gray",
                margin: "5px",
                cursor: "pointer",
              }}
            >
              <Card {...card} />
            </div>
          ))}
        </div>
        <button onClick={confirmCardPayment}>Confirm Discard</button>
      </div>
    );
  }

  // 🔶 Main auction UI
  return (
    <div>
      <h3>Auction Phase</h3>
      <Card {...currentCard} />
      <p>
        Current Bid: {currentBid} by{" "}
        {highestBidder != null ? biddingOrder[highestBidder].name : "None"}
      </p>
      <p style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
      👉 {player.name}'s turn to bid
    </p>

    <p>Gold: {player.gold}, Cards: {player.hand.length}</p>

      {player.name === playerName && (
  <>
    <input
      type="number"
      min={0}
      placeholder="Enter bid"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          handleBid(Number(e.target.value));
          e.target.value = "";
        }
      }}
    />
    <button onClick={handlePass}>Pass</button>
  </>
)}

    </div>
  );
};

export default AuctionPhase;
