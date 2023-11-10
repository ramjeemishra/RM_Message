const socket = io();

var username;
var chats = document.querySelector(".chats");
var users_list = document.querySelector(".users-list");
var users_count = document.querySelector(".users-count");
var msg_send = document.querySelector("#user-send");
var user_msg = document.querySelector("#user-msg");

// Load stored messages from Local Storage
function loadStoredMessages() {
    const storedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    storedMessages.forEach((data) => {
        appendMessage(data, 'incoming');
    });
}

do {
    username = prompt("Enter your name: ");
} while (!username);

// Load stored messages when the page loads
loadStoredMessages();

socket.emit("new-user-joined", username);

socket.on('user-connected', (socket_name) => {
    userJoinLeft(socket_name, 'joined');
});

// user is join or left
function userJoinLeft(name, status) {
    let div = document.createElement("div");
    div.classList.add('user-join');
    let content = `<p><b>${name}</b> ${status} the chat</p>`;
    div.innerHTML = content;
    chats.appendChild(div);
}

socket.on('user-disconnected', (user) => {
    userJoinLeft(user, 'left');
});

socket.on('user-list', (users) => {
    users_list.innerHTML = "";
    users_arr = Object.values(users);
    for (i = 0; i < users_arr.length; i++) {
        let p = document.createElement('p');
        p.innerText = users_arr[i];
        users_list.appendChild(p);
    }
    users_count.innerHTML = users_arr.length;
});

// for sending msg
msg_send.addEventListener('click', () => {
    let data = {
        user: username,
        msg: user_msg.value
    };
    if (user_msg.value != '') {
        appendMessage(data, 'outgoing');
        socket.emit('message', data);
        user_msg.value = '';

        // Store the message in Local Storage
        const storedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
        storedMessages.push(data);
        localStorage.setItem('chatMessages', JSON.stringify(storedMessages));
    }
});

function appendMessage(data, status) {
    let div = document.createElement('div');
    div.classList.add('message', status);
    let content = `
    <h5 style="color: black; font-size: 1.5rem;" >${data.user}</h5>&nbsp&nbsp;<br>
    <p>${data.msg}</p>
    `;
    div.innerHTML = content;
    chats.appendChild(div);
    chats.scrollTop = chats.scrollHeight;
}

socket.on('message', (data) => {
    appendMessage(data, 'incoming');
});

const clearChatBtn = document.getElementById('clearChatBtn');
clearChatBtn.addEventListener('click', () => {
    // Clear chat messages from the chat display locally
    chats.innerHTML = '';

    // Clear chat messages from Local Storage locally
    localStorage.removeItem('chatMessages');
});











