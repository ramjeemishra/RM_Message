const http = require("http");
const express = require("express");
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 4000;

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const io = require("socket.io")(server);
let users = {};

io.on("connection", (socket) => {
  socket.on("new-user-joined", (username) => {
    users[socket.id] = username;
    socket.broadcast.emit('user-connected', username);
    io.emit("user-list", users);
  });

  socket.on("disconnect", () => {
    socket.broadcast.emit('user-disconnected', users[socket.id]);
    delete users[socket.id];
    io.emit("user-list", users);
  });

  socket.on('message', (data) => {
    io.emit("message", data);
  });

  socket.on('reaction', (data) => {
    io.emit('reaction', data); // Broadcast reaction to all clients
  });
});

server.listen(port, () => {
  console.log("Server started at " + port);
});
