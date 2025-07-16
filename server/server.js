const { Server } = require("socket.io");
const express = require("express");
const http = require("http");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("Server is running");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Or use "http://localhost:5173" for Vite
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});



const playersInRoom = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_game", ({ room, playerName }) => {
    socket.join(room);

    if (!playersInRoom[room]) {
      playersInRoom[room] = [];
    }

    const alreadyJoined = playersInRoom[room].some(p => p.id === socket.id);
    if (!alreadyJoined) {
      playersInRoom[room].push({ id: socket.id, name: playerName });
      console.log(`${playerName} joined room ${room}`);
    }

    io.to(room).emit("player_list", playersInRoom[room]);
  });

  socket.on("start_game", ({ room }) => {
  console.log(`Starting game in room: ${room}`);
  const players = playersInRoom[room] || [];
  io.to(room).emit("start_game", { players });
});




  socket.on("sync_game_state", ({ room, gameState }) => {
    console.log("💥 Received sync_game_state with activeBidders:", gameState.activeBidders);
  console.log(`🔁 Sync game state to room ${room} from sevrer.js has run`);
  io.to(room).emit("sync_game_state", gameState);
});





  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (const room in playersInRoom) {
      playersInRoom[room] = playersInRoom[room].filter(p => p.id !== socket.id);
      io.to(room).emit("player_list", playersInRoom[room]);
    }
  });
});
