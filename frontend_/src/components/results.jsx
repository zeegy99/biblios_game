// src/components/ResultsScreen.jsx
import React from "react";

const ResultsScreen = ({ players, onRestart }) => {
  const maxPoints = Math.max(...players.map((p) => p.points));
  const pointLeaders = players.filter((p) => p.points === maxPoints);

  let finalWinners = [];
  if (pointLeaders.length === 1) {
    finalWinners = [pointLeaders[0]];
  } else {
    const maxGold = Math.max(...pointLeaders.map((p) => p.gold));
    finalWinners = pointLeaders.filter((p) => p.gold === maxGold);
  }

  return (
    <div>
      <h2>🎉 Game Results</h2>
      <table style={{ borderCollapse: "collapse", marginTop: "1rem" }}>
        <thead>
          <tr>
            <th style={cellStyle}>Player</th>
            <th style={cellStyle}>Points</th>
            <th style={cellStyle}>Gold</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <tr key={i}>
              <td style={cellStyle}>{p.name}</td>
              <td style={cellStyle}>{p.points}</td>
              <td style={cellStyle}>{p.gold}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>
        🏆 Winner{finalWinners.length > 1 ? "s" : ""}:{" "}
        {finalWinners.map((p) => p.name).join(", ")}
      </h3>

      <button onClick={onRestart}>🔄 Start New Game</button>
    </div>
  );
};

const cellStyle = {
  border: "1px solid #ccc",
  padding: "8px 16px",
  textAlign: "center",
};

export default ResultsScreen;
