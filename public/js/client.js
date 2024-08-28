const socket = io();

let username;
const chats = document.querySelector(".chats");
const users_list = document.querySelector(".users-list");
const users_count = document.querySelector(".users-count");
const msg_send = document.querySelector("#user-send");
const user_msg = document.querySelector("#user-msg");

// URL of the sound file to be played on message receipt
const notificationSound = new Audio('/audio/livechat-129007.mp3');

user_msg.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        msg_send.click();
    }
});

// Load stored messages from Local Storage
function loadStoredMessages() {
    const storedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    storedMessages.forEach((data) => {
        appendMessage(data, 'incoming');
    });
}

// Get stored username from Local Storage
username = localStorage.getItem('username');

if (!username) {
    // Prompt for username if not stored
    do {
        username = prompt("Enter your name: ");
    } while (!username);

    // Store the username in Local Storage
    localStorage.setItem('username', username);
}

// Load stored messages when the page loads
loadStoredMessages();

socket.emit("new-user-joined", username);

socket.on('user-connected', (socket_name) => {
    userJoinLeft(socket_name, 'joined');
});

// Function to speak using text-to-speech
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
}

// Function to handle join and leave events
function userJoinLeft(name, status) {
    const div = document.createElement("div");
    div.classList.add('user-join');
    const content = `<p><b>${name}</b> ${status} the chat</p>`;
    div.innerHTML = content;
    chats.appendChild(div);

    // Speak only for user join or leave
    if (status === 'joined' || status === 'left') {
        speak(`${name} ${status} the chat`);
    }

    // Update users list and count
    updateUsersList();
}

// Handling user-disconnected event
socket.on('user-disconnected', (user) => {
    userJoinLeft(user, 'left');
});

socket.on('user-list', (users) => {
    users_list.innerHTML = "";
    const users_arr = Object.values(users);
    users_arr.forEach(user => {
        const p = document.createElement('p');
        p.innerText = user;
        users_list.appendChild(p);
    });
    users_count.innerHTML = users_arr.length;
});

// Sending message
msg_send.addEventListener('click', () => {
    const data = {
        user: username,
        msg: user_msg.value
    };
    if (user_msg.value !== '') {
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
    const div = document.createElement('div');
    div.classList.add('message', status);

    // Create a paragraph element for the message text
    const messageElement = document.createElement('p');
    messageElement.textContent = data.msg;  // Use textContent to prevent XSS attacks

    // Append the message text to the message div
    div.appendChild(messageElement);

    // Create a span element for the username
    const userElement = document.createElement('span');
    userElement.style.color = 'black';
    userElement.style.fontSize = '9px';
    userElement.textContent = data.user;

    // Append the username after the message text
    div.appendChild(userElement);

    // Append the message div to the chat container
    chats.appendChild(div);

    // Scroll to the bottom of the chat container
    chats.scrollTop = chats.scrollHeight;

    // Play notification sound for incoming messages
    if (status === 'incoming' && notificationSound) {
        notificationSound.play().catch(error => {
            console.error("Notification sound play failed:", error);
        });
    }
}


socket.on('message', (data) => {
    appendMessage(data, 'incoming');
    
    // Store the message in Local Storage
    const storedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    storedMessages.push(data);
    localStorage.setItem('chatMessages', JSON.stringify(storedMessages));
});

const clearChatBtn = document.getElementById('clearChatBtn');
clearChatBtn.addEventListener('click', () => {
    // Clear chat messages from the chat display locally
    chats.innerHTML = '';

    // Clear chat messages from Local Storage locally
    localStorage.removeItem('chatMessages');
});

function playSound() {
    notificationSound.play().catch(error => {
        console.error("Notification sound play failed:", error);
    });
}


clearChatBtn.addEventListener('click', () => {
    // Clear chat messages from the chat display locally
    chats.innerHTML = '';

    // Clear chat messages from Local Storage locally
    localStorage.removeItem('chatMessages');

    // Clear stored images data from Local Storage
    localStorage.removeItem('storedImages');

    // Optionally, you may also want to clear displayed images from the UI
    const imageMessages = document.querySelectorAll('.image-message');
    imageMessages.forEach(message => message.remove());
});

// let currentUser = 'User'; // Replace this with actual logic to get the current username

// Function to display an image message
function displayImage(username, imageUrl) {
    const messagesDiv = document.getElementById('messages');
    
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message', 'image-message');

    // Create a span element for the sender's name
    const senderElement = document.createElement('span');
    senderElement.style.color = 'black';
    senderElement.style.fontWeight = 'bold';
    senderElement.style.paddingRight = '1%';
    senderElement.textContent = username;
    messageContainer.appendChild(senderElement);

    // Create an img element for the shared image
    const imageElement = document.createElement('img');
    imageElement.src = imageUrl;
    imageElement.alt = 'Shared Image';
    imageElement.style.maxWidth = '100%'; // Style the image
    imageElement.style.borderRadius = '8px'; // Rounded corners
    
    messageContainer.appendChild(imageElement);
    messagesDiv.appendChild(messageContainer);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Save image to local storage
function saveImageToLocalStorage(username, imageUrl) {
    const storedImages = JSON.parse(localStorage.getItem('storedImages')) || [];
    storedImages.push({ username, imageUrl });
    localStorage.setItem('storedImages', JSON.stringify(storedImages));
}

// Load images from local storage
function loadImagesFromLocalStorage() {
    const storedImages = JSON.parse(localStorage.getItem('storedImages')) || [];
    storedImages.forEach(({ username, imageUrl }) => {
        displayImage(username, imageUrl);
    });
}

// Handle image upload
// document.getElementById('uploadButton').addEventListener('click', function () {
//     document.getElementById('imageInput').click();
// });

// document.getElementById('imageInput').addEventListener('change', function () {
//     const file = this.files[0];
//     if (file) {
//         const formData = new FormData();
//         formData.append('image', file);
//         formData.append('username', username); // Replace with dynamic username

//         fetch('/upload', {
//             method: 'POST',
//             body: formData
//         })
//         .then(response => response.json())
//         .then(data => {
//             // displayImage(username, data.imageUrl); // Display the image locally
//             // saveImageToLocalStorage(username, data.imageUrl); // Save image to local storage
//             socket.emit('imageMessage', { sender: username, imageUrl: data.imageUrl }); // Broadcast the image
//         })
//         .catch(err => console.error('Error uploading image:', err));
//     }
// });

// Listen for image messages from the server
socket.on('imageMessage', ({ sender, imageUrl }) => {
    displayImage(sender, imageUrl);
    saveImageToLocalStorage(sender, imageUrl); // Save image to local storage
});

// Load images from local storage on page load
document.addEventListener('DOMContentLoaded', loadImagesFromLocalStorage);









// // Select the image input and other elements
// const imageInput = document.getElementById('imageInput');
// const imgPreview = document.querySelector('.imagePreview');
// const confirmationmsg = document.querySelector('.Confirmationmsg')
// const sendButton = document.getElementById('sendimg');
// const uploadButton = document.getElementById('uploadButton');

// // Add event listener to the upload button
// uploadButton.addEventListener('click', function () {
//     imageInput.click(); // Simulate a click on the file input
// });

// // Add event listener when a file is selected
// imageInput.addEventListener('change', function () {
//     const file = this.files[0]; // Get the selected file

//     if (file) {
//         const reader = new FileReader(); // Create a FileReader instance

//         // Closure to capture the file information.
//         reader.onload = function (e) {
//             // Render thumbnail preview of the image
//             const imgElement = document.createElement('img');
//             imgElement.src = e.target.result;
//             imgElement.style.maxWidth = '100%'; // Adjust as needed
//             imgElement.style.maxHeight = '200px'; // Adjust as needed
//             imagePreview.innerHTML = ''; // Clear previous preview
//             imagePreview.appendChild(imgElement); // Append the image preview

//             // Show the send button
//             // sendButton.style.display = 'block';
//             // imgPreview.style.display = 'block';
//             // confirmationmsg.style.display = 'block'
//         };

//         // Read in the image file as a data URL
//         reader.readAsDataURL(file);
//     }
// });

// // Example of sending functionality (replace with your actual functionality)
// sendButton.addEventListener('click', function () {
//     // Example: Send the selected image to server or perform other actions
//     const selectedImage = imagePreview.querySelector('img');
//     if (selectedImage) {
//         // const username = 'User'; // Replace with dynamic username
//         displayImage(username, selectedImage.src); // Display the image in the chat
//         imagePreview.innerHTML = ''; // Clear the preview
//         sendButton.style.display = 'none'; // Hide the send button
//         imagePreview.style.display = 'none'; // Hide the image preview
//     } else {
//         alert('No image selected.');
//     }
// });













/// code to generate images via nexus 
// const token = "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";
// const inputTxt = document.getElementById("user-input");
// const button = document.getElementById("send-buttonn");
// // const status = document.getElementById("status");

// const requiredKeyword = "generate";

// button.addEventListener('click', async function () {
//     const userInput = inputTxt.value.trim();

//     if (!userInput.includes(requiredKeyword)) {
//         status.textContent = `Please include the keyword "${requiredKeyword}" in your input.`;
//         return;
//     }

//     // status.classList.remove("hidden");
//     // status.textContent = "Your image is being generated...";

//     const response = await query(userInput);
//     if (response) {
//         const objectURL = URL.createObjectURL(response);

//         // Create a new image element each time
//         const img = document.createElement("img");
//         img.src = objectURL;
//         img.alt = "Generated image";
//         img.style.width = "200px";  // Set the image size
//         img.style.height = "200px"; // Maintain aspect ratio

//         // Append the new image to the chat box
//         document.getElementById("chat-box").appendChild(img);

//         status.textContent = "Image generated successfully!";
//     }
// });

// async function query(input) {
//     try {
//         const response = await fetch(
//             "https://api-inference.huggingface.co/models/XLabs-AI/flux-RealismLora",
//             {
//                 headers: { Authorization: `Bearer ${token}` },
//                 method: "POST",
//                 body: JSON.stringify({ "inputs": input }),
//             }
//         );

//         if (!response.ok) {
//             const errorMessage = await response.text();
//             throw new Error(`Error ${response.status}: ${errorMessage}`);
//         }

//         const result = await response.blob();
//         return result;
//     } catch (error) {
//         console.error("Error occurred:", error.message);
//         status.textContent = "Failed to generate image. Please try again.";
//     }
// }






const token = "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";
const inputTxt = document.getElementById("user-input");
const button = document.getElementById("send-buttonn");
const chatBox = document.getElementById("chat-box");

const requiredKeyword = "generate";

button.addEventListener('click', async function () {
    const userInput = inputTxt.value.trim();

    // Clear any existing error messages
    clearErrorMessages();

    // Check if the input contains the required keyword
    if (!userInput.includes(requiredKeyword)) {
        return; // Exit if the required keyword is not included
    }

    // Display a status message (if needed)
    displayStatusMessage("Your image is being generated...");

    try {
        const response = await query(userInput);
        if (response) {
            const objectURL = URL.createObjectURL(response);

            // Create a new image element each time
            const img = document.createElement("img");
            img.src = objectURL;
            img.alt = "Generated image";
            img.style.width = "200px";  // Set the image size
            img.style.height = "200px"; // Maintain aspect ratio

            // Append the new image to the chat box
            chatBox.appendChild(img);

            // Display a success message
            displayStatusMessage("Image generated successfully!", 'green');
        }
    } catch (error) {
        displayErrorMessage("Failed to generate image. Please try again.");
    }
});

async function query(input) {
    try {
        const response = await fetch(
            "https://api-inference.huggingface.co/models/XLabs-AI/flux-RealismLora",
            {
                headers: { Authorization: `Bearer ${token}` },
                method: "POST",
                body: JSON.stringify({ "inputs": input }),
            }
        );

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`Error ${response.status}: ${errorMessage}`);
        }

        const result = await response.blob();
        return result;
    } catch (error) {
        console.error("Error occurred:", error.message);
        throw error; // Rethrow the error to be caught in the button click handler
    }
}

function displayErrorMessage(message) {
    const errorMsg = document.createElement("p");
    errorMsg.className = "error-message";
    errorMsg.textContent = message;
    errorMsg.style.color = 'red'; // Style the error message

    // Append the error message to the chat box
    chatBox.appendChild(errorMsg);
}

function displayStatusMessage(message, color = 'black') {
    const statusMsg = document.createElement("p");
    statusMsg.className = "status-message";
    statusMsg.textContent = message;
    statusMsg.style.color = color; // Set the color of the status message

    // Append the status message to the chat box
    chatBox.appendChild(statusMsg);
}

function clearErrorMessages() {
    // Remove all elements with the class "error-message"
    const existingErrorMsgs = chatBox.getElementsByClassName("error-message");
    while (existingErrorMsgs.length > 0) {
        existingErrorMsgs[0].remove();
    }
}
