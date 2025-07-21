import React from "react";

const Card = ({ value, type, tieBreaker, isSpecial }) => {
  return (
    <div
      className="card"
      style={{
        border: "2px solid black",
        borderRadius: "8px",
        padding: "12px",
        margin: "10px",
        width: "120px",
        backgroundColor: isSpecial ? "#ffd700" : "#fff",
      }}
    >
      <h4>{type}</h4>
      <p>Value: {value}</p>
      {!isSpecial && <p>Tiebreaker: {tieBreaker}</p>}
    </div>
  );
};

export default Card;