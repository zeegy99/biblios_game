import React from "react";
import Card from "./card"; // Your custom card renderer
import "./player_hand.css";

const PlayerHand = ({ hand, isCurrentPlayer }) => {
  const sortedHand = [...hand].sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.value - b.value;
  });

  const total = sortedHand.length;

  return (
    <div className={`player-hand-container ${isCurrentPlayer ? "active" : "inactive"}`}>
      {sortedHand.map((card, idx) => {
        const offset = idx - (total - 1) / 2;
        return (
          <div
            key={idx}
            className="fan-card"
            style={{ "--i": offset }}
          >
            <Card card={card} />
          </div>
        );
      })}
    </div>
  );
};

export default PlayerHand;
