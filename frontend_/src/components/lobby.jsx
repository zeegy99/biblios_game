import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";

const Lobby = ({ playerName, setPlayerName }) => {
  const [players, setPlayers] = useState([]);
  const navigate = useNavigate();
  const room = "biblios";

  useEffect(() => {
  socket.emit("join_game", { room, playerName });

  socket.on("player_list", (updatedPlayers) => {
    // console.log("📡 Received player list:", updatedPlayers);
    setPlayers(updatedPlayers);
  });

  socket.on("start_game", (data) => {
  console.log("📩 start_game received in lobby:", data);
  localStorage.setItem("start_game_payload", JSON.stringify(data));
  localStorage.setItem("playerName", playerName);
  setPlayerName(playerName);

  // ⏳ Give localStorage a moment to flush before navigating
  setTimeout(() => {
    console.log("🚪 Navigating to /game...");
    navigate("/game");
  }, 50);  // 50ms is usually enough
});


  // ✅ THIS is what you were missing
  socket.on("game_state", (data) => {
    console.log("✅ game_state received in lobby. Navigating to game...");
    localStorage.setItem("playerName", playerName);
    navigate("/game");
  });

  return () => {
    socket.off("player_list");
    socket.off("start_game");
    socket.off("game_state");
  };
}, [playerName]);

  const handleStartGame = () => {
    console.log("🚀 Start Game button clicked");
    socket.emit("start_game", { room: "biblios" });
  };

  const isHost = players.length > 0 && players[0].name === playerName;

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Waiting Room</h2>
      <p>Room: {room}</p>
      <h3>Players Joined:</h3>
      <ul>
        {players.map((p, i) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
      {players.length < 2 ? (
        <p>Waiting for more players...</p>
      ) : isHost ? (
        <button onClick={handleStartGame}>Start Game</button>
      ) : (
        <p>Waiting for host to start the game...</p>
      )}
    </div>
  );
};

export default Lobby;
