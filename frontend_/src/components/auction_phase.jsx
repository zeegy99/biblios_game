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
  setGoldCard,
  auctionTurnOffset,
  setAuctionTurnOffset,
}) => {

  

  //UseEffects
  // useEffect(() => {
  //   console.log("🧠 AuctionPhase mounted");
  //   console.log("📋 Initial activeBidders:", activeBidders);

  //   console.log("🧾 Discard pile at mount:", discardPile);
  //   console.log("🧾 Current card index:", currentCardIndex);
  //   console.log("🧾 Card at index:", discardPile[currentCardIndex]);
  // }, [])
  


  useEffect(() => {
    if (activeBidders.length === 0) {
      const allIn = players.map(() => true);
      setActiveBidders(allIn);
      console.log("✅ Set activeBidders to all true:", allIn);
    }
  }, [players, activeBidders, setActiveBidders]);

  useEffect(() => {
  if (discardPile[currentCardIndex]) {
    const allTrue = players.map(() => true);
    setActiveBidders(allTrue);
    setActivePlayerIndex(0); 
    setCurrentBid(0);
    setHighestBidder(null);

    console.log("🔁 New auction round started — resetting activeBidders:", allTrue);
    console.log("Active bidders:", activeBidders)
    console.log("📥 auctionTurnOffset received:", auctionTurnOffset);

    broadcastState({
      activeBidders: allTrue,
      activePlayerIndex: 0,
      currentBid: 0,
      highestBidder: null,
    });
  }
}, [currentCardIndex]);



  console.log("New activeBidders", activeBidders)
  

  const biddingOrder = useMemo(() => {
    const order = players.map((_, i) => players[(auctionTurnOffset + i) % players.length]);
    console.log("🧭 Bidding order now:", order.map(p => p.name));
    return order;
  }, [players, auctionTurnOffset]);
  console.log("🎯 Current bidder should be:", biddingOrder[activePlayerIndex]?.name);

  const currentCard = discardPile[currentCardIndex];
  const isGold = currentCard?.type === "Gold";
  const player = biddingOrder[activePlayerIndex];


  const getNextActivePlayerIndex = () => {
    let next = (activePlayerIndex + 1) % players.length;
    while (!activeBidders[next]) 
      {
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
      // nextPlayer();
    }
  };

  const handlePass = () => {
    console.log("🚫 Player passed:", players[activePlayerIndex]?.name);
    const updated = [...activeBidders];
    updated[activePlayerIndex] = false;
    setActiveBidders(updated);
    console.log("🔄 Updated activeBidders after pass:", updated);


    const next = getNextActivePlayerIndex();
    console.log("➡️ Next active player index:", next, players[next]?.name);
    setActivePlayerIndex(next);

    broadcastState({
      activeBidders: updated,
      activePlayerIndex: next,
    });

    const stillIn = updated.filter(Boolean).length;
    const hasBid = highestBidder !== null;
    console.log("🧮 Players still in:", stillIn, "| Has anyone bid?", hasBid);

    if (stillIn === 0) {
      console.log("🟠 All players passed");
      finishAuction(updated, hasBid ? highestBidder : null);
    } else if (stillIn === 1 && hasBid) {
      console.log("🟢 One player left — winner:", players[highestBidder]?.name);
      finishAuction(updated, highestBidder);
    } else {
      console.log("🕓 Moving to next bidder...");
    }
  };

  const finishAuction = (finalBidders, winnerIndex) => {
    console.log("🔔 finishAuction called. Winner index:", winnerIndex);

    const updatedDiscardPile = [...discardPile];
    setDiscardPile(updatedDiscardPile);

    console.log("🗑️ Discard pile after removal:", updatedDiscardPile);

    if (winnerIndex == null) {
      alert("No one bid — card discarded.");
      console.log("⚠️ Everyone passed — no winner.");

      const updatedDiscardPile = [...discardPile];
      updatedDiscardPile.splice(currentCardIndex, 1); // ✅ REMOVE the card
      setDiscardPile(updatedDiscardPile);

      if (updatedDiscardPile.length > 0) {
        const newOffset = (auctionTurnOffset + 1) % players.length;
        const newAuctionStarter = players[newOffset]?.name;
        console.log("🎯 Next auction round will start with:", newAuctionStarter, playerName);

        setCurrentCardIndex(0);
        setHighestBidder(null);
        setActiveBidders(players.map(() => true));
        setAuctionTurnOffset(newOffset);
        setActivePlayerIndex(0);
        setCurrentBid(0);

        broadcastState({
          discardPile: updatedDiscardPile,
          currentCardIndex: 0,
          highestBidder: null,
          activeBidders: players.map(() => true),
          activePlayerIndex: 0,
          currentBid: 0,
          auctionTurnOffset: newOffset,
          });
        }
    } 

    else 
      {
        const updatedPlayers = [...players];
        const winnerName = biddingOrder[winnerIndex].name;
        const winnerIdx = players.findIndex((p) => p.name === winnerName);
        const winner = updatedPlayers[winnerIdx];
        console.log("🏆 Winner found:", winner.name);

        // winner.hand.push(currentCard);

        if (isGold) 
          {
            winner.gold += currentCard.value;
            winner.hand.push(currentCard);
            setAwaitingCardPayment(true);
            setGoldWinner({ player: winner, index: winnerIdx });
            setGoldCard(currentCard);
            setPlayers(updatedPlayers);

            console.log("💰 Gold card won by:", winner.name);

            broadcastState({
              players: updatedPlayers,
              awaitingCardPayment: true,
              goldWinner: { player: winner, index: winnerIdx },
              goldCard: currentCard,
            });

            return;
          } 
        else 
          {
            setAwaitingGoldPayment(true);
            setGoldPaymentWinner({ player: winner, index: winnerIdx, card: currentCard });
            setPlayers(updatedPlayers);

            console.log("📦 Non-gold card won — awaiting gold payment from:", winner.name);

            broadcastState({
              players: updatedPlayers,
              awaitingGoldPayment: true,
              goldPaymentWinner: {
                player: winner,
                index: winnerIdx,
                card: currentCard,
            },
          });

          return;
        }
      }

  console.log("📦 Checking discard pile length:", updatedDiscardPile.length);
  if (updatedDiscardPile.length > 0) {

    const newOffset = (auctionTurnOffset + 1) % players.length;
    const newAuctionStarter = players[newOffset]?.name;

    console.log("🆕 Starting next auction round — new offset:", newOffset, "=>", newAuctionStarter);

    setCurrentCardIndex(0);
    setHighestBidder(null);
    setActiveBidders(players.map(() => true)); 
    setAuctionTurnOffset(newOffset);
    setActivePlayerIndex(0);
    setCurrentBid(0);

    broadcastState({
      discardPile: updatedDiscardPile,
      currentCardIndex: 0,
      highestBidder: null,
      activeBidders: players.map(() => true),
      activePlayerIndex: 0,
      currentBid: 0,
      auctionTurnOffset: newOffset,
    });
  } else {
    console.log("🎯 No more cards — transitioning to scoring phase.");
    setPhase("scoring");
    broadcastState({
      discardPile: [],
      phase: "scoring",
    });
  }
};


  if (!currentCard) {
    console.log("🎯 No more cards — transitioning to scoring phase.");
    setPhase("scoring");
    broadcastState({
      discardPile: [],
      phase: "scoring",
    });
    return <p>No cards to auction.</p>;
  }

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
      console.log("Pushing the card")
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
      const newAuctionStarterIndex = (auctionTurnOffset + 1) % players.length;
      const newAuctionStarter = players[newAuctionStarterIndex]?.name;
      console.log("🎯 Next auction round will start with I am in gold payment:", newAuctionStarter);
      setActivePlayerIndex(0);

      console.log("🔄 I am right before broadcaststate in confirmGoldPayment, Incremented auctionTurnOffset to:", (auctionTurnOffset + 1) % players.length);

      console.log("📤 About to broadcast auctionTurnOffset =", (auctionTurnOffset + 1) % players.length);
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
      console.log("I AM IN CONFIRMCADPAYMENT HELLO")
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

      //Removing gold if they got rid of gold. 
      const discardedGold = selectedPaymentCards
      .filter((c) => c.type === "Gold")
      .reduce((sum, c) => sum + c.value, 0);

    console.log("🟡 Discarded gold total:", discardedGold);
    console.log("💰 Gold before:", updatedPlayers[goldWinner.index].gold);

    updatedPlayers[goldWinner.index].gold -= discardedGold;

    console.log("💰 Gold after:", updatedPlayers[goldWinner.index].gold);


      //Removing Card from the Auction_Pool 
      const updatedDiscardPile = [...discardPile];
      updatedDiscardPile.splice(currentCardIndex, 1); // remove the card that was just won
      setDiscardPile(updatedDiscardPile);
      console.log("ConfirmCardPayment updating the discard pile", updatedDiscardPile)

      const newAuctionStarterIndex = (auctionTurnOffset + 1) % players.length;
    const newAuctionStarter = players[newAuctionStarterIndex]?.name;
  console.log("🎯 Next auction round will start with:", newAuctionStarter);

  setAuctionTurnOffset(newAuctionStarterIndex);
  setActivePlayerIndex(0); // always biddingOrder[0]
  setHighestBidder(null);
  setActiveBidders(players.map(() => true));
  setCurrentCardIndex(0);
      
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
  auctionTurnOffset: newAuctionStarterIndex,
  activePlayerIndex: 0,
  activeBidders: players.map(() => true),
  highestBidder: null,
  currentCardIndex: 0,
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
                opacity: idx === goldWinner.player.hand.length - 1 ? 0.5 : 1, // dim the new card
                pointerEvents: idx === goldWinner.player.hand.length - 1 ? "none" : "auto", // block clicks
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