import Card from "./card";
import React, { useState, useMemo, useRef, useEffect } from "react";

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
 
  console.log("🧠 AuctionPhase mounted");
  console.log("📋 Initial activeBidders:", activeBidders);

  console.log("🧾 Discard pile at mount:", discardPile);
  console.log("🧾 Current card index:", currentCardIndex);
  console.log("🧾 Card at index:", discardPile[currentCardIndex]);


  useEffect(() => {
    if (activeBidders.length === 0) {
      const allIn = players.map(() => true);
      setActiveBidders(allIn);
      console.log("✅ Set activeBidders to all true:", allIn);
    }
  }, [players, activeBidders, setActiveBidders]);

  useEffect(() => {
  console.log("🔄 Sync check from UseEffect2:");
  console.log("  👤 playerName:", playerName);
  console.log("Discard Pile", discardPile)
  console.log("  📦 currentCardIndex:", currentCardIndex);
  console.log("  🧠 activePlayerIndex:", activePlayerIndex);
  console.log("  🙋‍♂️ activeBidders:", activeBidders);
  console.log("  💰 currentBid:", currentBid);
  console.log("  🏆 highestBidder:", highestBidder);
  console.log("  🧑‍🤝‍🧑 players:", players.map(p => ({ name: p.name, gold: p.gold, handLen: p.hand.length })));
}, [
  currentCardIndex,
  activePlayerIndex,
  activeBidders,
  currentBid,
  highestBidder,
  players,
]);


  console.log("New activeBidders", activeBidders)
  

  const [auctionTurnOffset, setAuctionTurnOffset] = useState(
    (lastDonatorIndex + 1) % players.length
  );

  const biddingOrder = useMemo(() => {
    return players.map((_, i) => players[(auctionTurnOffset + i) % players.length]);
  }, [players, auctionTurnOffset]);

  const currentCard = discardPile[currentCardIndex];
  const isGold = currentCard?.type === "Gold";
  const player = biddingOrder[activePlayerIndex];

  console.log("📦 playerName:", playerName);
console.log("📦 auctionTurnOffset:", auctionTurnOffset);
console.log("📦 activePlayerIndex:", activePlayerIndex);
console.log("📦 biddingOrder:", biddingOrder.map(p => p.name));
console.log("📦 Current player expected to bid:", biddingOrder[activePlayerIndex].name);

  const getNextActivePlayerIndex = () => {
  let next = (activePlayerIndex + 1) % players.length;
  while (!activeBidders[next]) {
    next = (next + 1) % players.length;
  }
  return next;
};

  const handleBid = (amount) => {
    if (isGold && amount > player.hand.length) return;
    if (!isGold && amount > player.gold) {

      return alert("You don't have enough gold");
    }

    const isFirstBid = highestBidder === null;
    if (!isFirstBid && amount <= currentBid) {
      return alert("Bid too low!");
    }

    const updated = [...activeBidders];
    updated[activePlayerIndex] = true;

    setCurrentBid(amount);
    setHighestBidder(activePlayerIndex);
    setActiveBidders(updated);
    const next = getNextActivePlayerIndex();
setActivePlayerIndex(next);

broadcastState({
  currentBid: amount,
  highestBidder: activePlayerIndex,
  activeBidders: updated,
  activePlayerIndex: next,
});


    const stillIn = updated.filter(Boolean).length;
    console.log("I am in auction_phase handle next and this is stillIn", stillIn)
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
    const next = getNextActivePlayerIndex();
setActivePlayerIndex(next);

broadcastState({
  activeBidders: updated,
  activePlayerIndex: next,
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
  // Remove the current card from discardPile
const updatedDiscardPile = [...discardPile];
updatedDiscardPile.splice(currentCardIndex, 1);
setDiscardPile(updatedDiscardPile);

if (updatedDiscardPile.length > 0) {
  setCurrentCardIndex(0); // always auction the top card (index 0)
  setHighestBidder(null);
  setActiveBidders(players.map(() => true));
  setAuctionTurnOffset((prev) => (prev + 1) % players.length);
  setActivePlayerIndex(0);
  setCurrentBid(0);

  broadcastState({
    discardPile: updatedDiscardPile,
    currentCardIndex: 0,
    highestBidder: null,
    activeBidders: players.map(() => true),
    activePlayerIndex: 0,
    currentBid: 0,
    auctionTurnOffset: (auctionTurnOffset + 1) % players.length,
  });
} else {
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
    const isLocalPlayerWinner = playerName === goldPaymentWinner.player.name;

    console.log("✅ Awaiting gold payment. Local player is winner?", isLocalPlayerWinner);
    const toggleGoldCardSelection = (card, idx) => {
    if (!isLocalPlayerWinner || card.type !== "Gold") return;
    setSelectedPaymentCards((prev) => {
      const alreadySelected = prev.find((c) => c.idx === idx);
      return alreadySelected
        ? prev.filter((c) => c.idx !== idx)
        : [...prev, { ...card, idx }];
    });
  };

    const totalSelected = selectedPaymentCards.reduce((sum, c) => sum + c.value, 0);

    const confirmGoldPayment = () => {
      console.log("I have been received and I am in confirmGoldPayment")
      if (!isLocalPlayerWinner) {
        console.log("some piss")
        return;
      }
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
  const updatedDiscardPile = [...discardPile];
  updatedDiscardPile.splice(currentCardIndex, 1); // or use .shift() if always index 0
  setDiscardPile(updatedDiscardPile);
  console.log("🧾 Updated discard pile after gold payment:", updatedDiscardPile);

  setPlayers(updatedPlayers);
  setAwaitingGoldPayment(false);
  setSelectedPaymentCards([]);
  setCurrentBid(0);
  // setCurrentCardIndex((prev) => prev + 1);
  setHighestBidder(null);
  setActiveBidders(players.map(() => true));
  setAuctionTurnOffset((prev) => (prev + 1) % players.length);
  setActivePlayerIndex(0);

  console.log("🔄 I am right before broadcaststate in confirmGoldPayment, Incremented auctionTurnOffset to:", (auctionTurnOffset + 1) % players.length);

  broadcastState({
    players: updatedPlayers,
    awaitingGoldPayment: false,
    selectedPaymentCards: [],
    currentBid: 0,
    currentCardIndex: 0,
    highestBidder: null,
    activeBidders: players.map(() => true),
    activePlayerIndex: 0,
    discardPile: updatedDiscardPile,
    auctionTurnOffset: (auctionTurnOffset + 1) % players.length,
  });
  console.log("📤 Broadcasting updated discard pile after the broadcaststate in the confirmgoldpayment:", updatedDiscardPile);
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
        <button
  onClick={() => {
    console.log("🖱️ Button clicked");
    confirmGoldPayment();
  }}
>
  Confirm Payment
</button>
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


      //Removing Card from the Auction_Pool 
      const updatedDiscardPile = [...discardPile];
      updatedDiscardPile.splice(currentCardIndex, 1); // remove the card that was just won
      setDiscardPile(updatedDiscardPile);
      console.log("ConfirmCardPayment updating the discard pile", updatedDiscardPile)


      
      setPlayers(updatedPlayers);
      setAwaitingCardPayment(false);
      setSelectedPaymentCards([]);
      setCurrentBid(0);
      

      broadcastState({
      players: updatedPlayers,
      awaitingCardPayment: false,
      selectedPaymentCards: [],
      currentBid: 0,
      discardPile: updatedDiscardPile,
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