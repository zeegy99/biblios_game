import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const generateRoomCode = () =>
  Math.random().toString(36).substring(2, 7).toUpperCase();


const Home = ({ setPlayerName }) => {
  const [nameInput, setNameInput] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    if (!nameInput || !roomInput) return;
    localStorage.setItem("playerName", nameInput);
    localStorage.setItem("roomCode", roomInput.toUpperCase());
    setPlayerName(nameInput);
    navigate("/lobby");
  };

  const handleCreateRoom = () => {
    if (!nameInput) return alert("Enter your name first.");
    const newRoom = generateRoomCode();
    console.log(newRoom)
    localStorage.setItem("playerName", nameInput);
    localStorage.setItem("roomCode", newRoom);
    setPlayerName(nameInput);
    navigate("/lobby");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Start or Join a Game</h2>
      <input
        type="text"
        placeholder="Your Name"
        value={nameInput}
        onChange={(e) => setNameInput(e.target.value)}
      /><br /><br />

      <form onSubmit={handleJoin}>
        <input
          type="text"
          placeholder="Enter Room Code"
          value={roomInput}
          onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
        /><br /><br />
        <button type="submit">Join Room</button>
      </form>

      <hr style={{ width: "200px", margin: "30px auto" }} />

      <button onClick={handleCreateRoom}>🎲 Create Random Room</button>
    </div>
  );
};

export default Home;
