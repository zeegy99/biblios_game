// src/components/ScoringPhase.jsx
import React, { useEffect, useState } from "react";

const ScoringPhase = ({ players, dice, setFinalResults }) => {
  const [log, setLog] = useState([]);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const newLog = [];
    const updatedPlayers = players.map((p) => ({ ...p, points: 0 }));

    dice.forEach((die) => {
      newLog.push(`Scoring ${die.resource_type} (Die value ${die.value})`);
      let playerScores = updatedPlayers.map((player) => {
        let total = 0;
        let bestTie = Infinity;

        for (let card of player.hand) {
          if (card.type === die.resource_type) {
            total += card.value;
            bestTie = Math.min(bestTie, card.tie_breaker?.charCodeAt?.(0) ?? 999);
          }
        }

        return { player, total, bestTie };
      });

      const maxScore = Math.max(...playerScores.map((x) => x.total));
      let contenders = playerScores.filter((x) => x.total === maxScore);

      if (contenders.length === 1) {
        contenders[0].player.points += die.value;
        newLog.push(`${contenders[0].player.name} wins ${die.resource_type} for ${die.value} points`);
      } else {
        const minTie = Math.min(...contenders.map((x) => x.bestTie));
        const tieWinners = contenders.filter((x) => x.bestTie === minTie);
        if (tieWinners.length === 1) {
          tieWinners[0].player.points += die.value;
          newLog.push(`Tiebreaker! ${tieWinners[0].player.name} wins ${die.resource_type}`);
        } else {
          newLog.push(`Tie on ${die.resource_type}. No points awarded.`);
        }
      }
    });

    const maxPoints = Math.max(...updatedPlayers.map((p) => p.points));
    const pointLeaders = updatedPlayers.filter((p) => p.points === maxPoints);

    if (pointLeaders.length === 1) {
      newLog.push(`🏆 ${pointLeaders[0].name} wins the game!`);
    } else {
      const maxGold = Math.max(...pointLeaders.map((p) => p.gold));
      const goldWinners = pointLeaders.filter((p) => p.gold === maxGold);
      if (goldWinners.length === 1) {
        newLog.push(`🏆 ${goldWinners[0].name} wins by gold tiebreaker!`);
      } else {
        newLog.push(`🏆 Tie between: ${goldWinners.map((p) => p.name).join(", ")}`);
      }
    }

    setLog(newLog);
    setFinalResults(updatedPlayers);
    setCompleted(true);
  }, []);

  return (
    <div>
      <h2>Scoring Phase</h2>
      {log.map((line, i) => (
        <p key={i}>{line}</p>
      ))}
      {completed && <p>✅ Scoring complete!</p>}
    </div>
  );
};

export default ScoringPhase;
