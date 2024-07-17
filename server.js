const http = require("http");
const express = require("express");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 4000;

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Socket.io setup
const io = require("socket.io")(server);
let users = {};

// Configure multer for file uploads
const upload = multer({ dest: 'public/uploads/' });

// Handle image uploads
app.post('/upload', upload.single('image'), (req, res) => {
  const tempPath = req.file.path;
  const targetPath = path.join(__dirname, 'public/uploads/', req.file.originalname);

  fs.rename(tempPath, targetPath, err => {
    if (err) return res.sendStatus(500);

    const imageUrl = `/uploads/${req.file.originalname}`;
    res.json({ imageUrl });

    // Broadcast the image URL to all connected clients
    io.emit('imageMessage', { sender: req.body.username, imageUrl });
  });
});

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
    socket.broadcast.emit("message", { user: data.user, msg: data.msg });
  });
});

server.listen(port, () => {
  console.log("Server started at " + port);
});
