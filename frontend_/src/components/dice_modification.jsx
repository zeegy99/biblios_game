// src/components/DiceModifierPhase.jsx
import React, { useState } from "react";

const DiceModifierPhase = ({
  player,
  card,
  dice,
  setDice,
  onFinish,
}) => {
  const [step, setStep] = useState("chooseDirection");
  const [modifications, setModifications] = useState([]);
  const [chosenType, setChosenType] = useState(card.type);

  const handleDirectionChoice = (dir) => {
    setChosenType(dir === "i" ? "Plus" : "Minus");
    setStep("modifyDice");
  };

  const handleDieClick = (idx) => {
    const newDice = [...dice];
    const die = newDice[idx];
    if (chosenType === "Plus") {
      die.value = Math.min(6, die.value + 1);
    } else {
      die.value = Math.max(1, die.value - 1);
    }
    setDice(newDice);
    setModifications([...modifications, idx]);

    if (
      (card.value === 2 && modifications.length + 1 === 2) ||
      card.value === 1
    ) {
      onFinish();
    }
  };

  return (
    <div>
      <h3>{player.name} plays dice modifier: {card.type} {card.value}</h3>
      {card.type === "Both" && step === "chooseDirection" ? (
        <div>
          <p>Choose whether to Increase or Decrease dice:</p>
          <button onClick={() => handleDirectionChoice("i")}>Increase</button>
          <button onClick={() => handleDirectionChoice("d")}>Decrease</button>
        </div>
      ) : (
        <div>
          <p>Choose die to {chosenType === "Plus" ? "increase" : "decrease"}:</p>
          <div style={{ display: "flex", gap: "10px" }}>
            {dice.map((die, idx) => (
              <button
                key={idx}
                onClick={() => handleDieClick(idx)}
                disabled={modifications.includes(idx)}
              >
                {die.resource_type}: {die.value}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiceModifierPhase;
