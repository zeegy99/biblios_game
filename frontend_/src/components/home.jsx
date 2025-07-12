import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = ({ setPlayerName }) => {
  const [tempName, setTempName] = useState("");
  const navigate = useNavigate();

  const handleStart = () => {
    if (tempName.trim()) {
      setPlayerName(tempName);       // Send name up to App
      navigate("/lobby");            // Go to lobby
    } else {
      alert("Please enter a name!");
    }
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Welcome to Biblios Online</h1>
      <input
        type="text"
        placeholder="Enter your name"
        value={tempName}
        onChange={(e) => setTempName(e.target.value)}
        style={{ marginBottom: "1rem" }}
      />
      <br />
      
      <button onClick={handleStart}>
        Enter Biblios Lobby
      </button>
    </div>
  );
};

export default Home;
