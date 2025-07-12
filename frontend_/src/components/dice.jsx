// src/components/Die.jsx
import React from "react";

const Die = ({ type, value, locked, onRoll, onAdd, onSubtract, onToggleLock }) => {
  return (
    <div
      className="die"
      style={{
        border: "2px solid #333",
        padding: "12px",
        margin: "10px",
        width: "150px",
        backgroundColor: locked ? "#ccc" : "#fff",
        borderRadius: "8px",
      }}
    >
      <h4>{type}</h4>
      <p>Value: {value}</p>
      <p>{locked ? "Locked" : "Unlocked"}</p>

      <button onClick={onRoll} disabled={locked}>🎲 Roll</button>
      <button onClick={onAdd}>➕</button>
      <button onClick={onSubtract}>➖</button>
      <button onClick={onToggleLock}>
        {locked ? "🔓 Unlock" : "🔒 Lock"}
      </button>
    </div>
  );
};

export default Die;
