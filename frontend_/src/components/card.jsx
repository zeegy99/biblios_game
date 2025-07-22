import React from "react";

//Adjust the colors and card images later. 
const typeColors = {
  Religion: "#a67c52",
  Science: "#5b9bd5",
  Military: "#c0504d",
  Art: "#70ad47",
  Herbs: "#9e480e",
  Gold: "#ffd700",
};

const Card = (props) => {
  const card = props.card ?? props;
  if (!card) return null;

  const { value, type, tieBreaker, isSpecial } = card;

  const backgroundColor = isSpecial
    ? "#ffd700"
    : typeColors[type] || "#fff";  // fallback to white

  return (
    <div
      className="card"
      style={{
        border: "2px solid black",
        borderRadius: "8px",
        padding: "12px",
        margin: "10px",
        width: "120px",
        backgroundColor,
        color: "#000",
        boxShadow: "2px 2px 6px rgba(0, 0, 0, 0.2)",
      }}
    >
      <h4>{type}</h4>
      <p>Value: {value}</p>
      {!isSpecial && <p>Tiebreaker: {tieBreaker}</p>}
    </div>
  );
};


export default Card;
