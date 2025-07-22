// src/components/player_hand.jsx
import React from "react";
import Card from "./card"; // assuming your Card component renders individual cards
import "./player_hand.css"; // we'll style it here

const PlayerHand = ({ hand, isCurrentPlayer }) => {
  return (
    <div className={`player-hand ${isCurrentPlayer ? "active" : "inactive"}`}>
      {[...hand]
  .sort((a, b) => {
    // Sort by type alphabetically, then by value
    if (a.type !== b.type) {
      return a.type.localeCompare(b.type);
    }
    return a.value - b.value;
  })
  .map((card, idx) => (
    <div key={idx} className="card-container">
      <Card card={card} />
    </div>
))}

    </div>
  );
};

export default PlayerHand;
