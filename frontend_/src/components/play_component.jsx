import React from "react";
import GameRunner from "./game_manager";

const Play = ({ playerName, playerList }) => {
  return (
    <div>
      {/* <h1>Biblios Game</h1> */}
      <GameRunner playerName={playerName} playerList={playerList} />
    </div>
  );
};

export default Play;
