// src/components/rules.jsx
import React from "react";

const RulesPage = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Game Rules</h1>
      <ol className="list-decimal pl-5 space-y-2">
        <li>Each player takes turns donating cards...</li>
        <li>Cards are categorized into five regions: Religion, Science, etc.</li>
        <li>During the Auction phase, players bid gold or cards...</li>
        <li>Special cards affect dice values or game state...</li>
        <li>Scoring is done by majority value per region...</li>
        {/* Add more rules as needed */}
      </ol>
    </div>
  );
};

export default RulesPage;
