import { io } from "socket.io-client";

const socket = io("https://biblios-game.onrender.com", {
  transports: ["websocket"], // optional: ensures WebSocket connection
  path: "/socket.io",        // default path, but good to be explicit
});

export default socket;
