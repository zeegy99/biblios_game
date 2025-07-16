import { io } from "socket.io-client";

const socket = io("https://biblios-game.onrender.com");

export default socket;
