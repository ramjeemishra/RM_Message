const http = require("http");
const express = require("express");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);

const port = process.env.PORT || 4000;

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Socket.io setup
io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle new user joining
  socket.on("new-user-joined", (username) => {
    socket.broadcast.emit('user-connected', username);
    io.emit("user-list", getUsersList());
  });

  // Handle image messages from clients
  socket.on('imageMessage', ({ sender, imageData }) => {
    io.emit('imageMessage', { sender, imageData }); // Broadcast the image to all clients
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("A user disconnected");
    io.emit("user-disconnected", socket.id);
    io.emit("user-list", getUsersList());
  });
});

server.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});

function getUsersList() {
  return Object.values(io.sockets.connected)
    .filter(socket => socket.username)
    .map(socket => socket.username);
}
