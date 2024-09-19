const http = require("http");
const express = require("express");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = process.env.PORT || 4000;

// Serve static files from the "public" directory
app.use(express.static('public'));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

let users = {};

io.on("connection", (socket) => {
    console.log('A user connected:', socket.id);

    // Handle new user joining
    socket.on("new-user-joined", (username) => {
        users[socket.id] = username;
        socket.broadcast.emit('user-connected', username);
        io.emit("user-list", Object.values(users));
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
        const username = users[socket.id];
        if (username) {
            socket.broadcast.emit('user-disconnected', username);
            delete users[socket.id];
            io.emit("user-list", Object.values(users));
        }
    });

    // Handle incoming messages
    socket.on('message', (data) => {
        socket.broadcast.emit("message", data);
    });
});

// Start the server
server.listen(port, () => {
    console.log("Server started on port " + port);
});
