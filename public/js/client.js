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




























// const token = "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";
// const inputTxt = document.getElementById("user-input");
// const button = document.getElementById("send-buttonn");
// const chatBox = document.getElementById("chat-box");
// const showHistoryButton = document.getElementById('show-history-button');
// const historyOverlay = document.getElementById('history-overlay');
// const closeHistoryButton = document.getElementById('close-history-button');
// const historyContainer = document.getElementById('history-container');
// const requiredKeyword = "generate";
// const dbName = "ImageHistoryDB";
// const dbVersion = 1;
// let db;

// function openDB() {
//     const request = indexedDB.open(dbName, dbVersion);
//     request.onupgradeneeded = function (event) {
//         db = event.target.result;
//         if (!db.objectStoreNames.contains('images')) {
//             const store = db.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
//             store.createIndex('timestamp', 'timestamp', { unique: false });
//         }
//     };
//     request.onsuccess = function (event) {
//         db = event.target.result;
//     };
//     request.onerror = function (event) {
//         console.error("Error opening IndexedDB:", event.target.errorCode);
//     };
// }

// function saveImageToIndexedDB(imageDataURL) {
//     const transaction = db.transaction(['images'], 'readwrite');
//     const store = transaction.objectStore('images');
//     const imageRecord = { url: imageDataURL, timestamp: new Date().toISOString() };
//     const request = store.add(imageRecord);
//     request.onsuccess = function () {
//         console.log("Image saved to IndexedDB.");
//     };
//     request.onerror = function () {
//         console.error("Error saving image to IndexedDB.");
//     };
// }

// function loadImageHistoryFromIndexedDB() {
//     historyContainer.innerHTML = '';
//     const transaction = db.transaction(['images'], 'readonly');
//     const store = transaction.objectStore('images');
//     const request = store.getAll();
//     request.onsuccess = function (event) {
//         const images = event.target.result;
//         images.forEach(imageRecord => {
//             const img = document.createElement('img');
//             img.src = imageRecord.url;
//             img.alt = 'History image';
//             img.style.width = '200px';
//             img.style.height = '200px';

//             const timestamp = document.createElement('p');
//             timestamp.textContent = `Generated on: ${new Date(imageRecord.timestamp).toLocaleString()}`;
//             timestamp.style.fontSize = '12px';
//             timestamp.style.color = 'gray';

//             const removeButton = document.createElement('button');
//             removeButton.textContent = 'Remove';
//             removeButton.addEventListener('click', function () {
//                 removeImageFromIndexedDB(imageRecord.id);
//                 historyContainer.removeChild(img);
//                 historyContainer.removeChild(timestamp);
//                 historyContainer.removeChild(removeButton);
//             });

//             historyContainer.appendChild(img);
//             historyContainer.appendChild(timestamp);
//             historyContainer.appendChild(removeButton);
//         });
//     };
//     request.onerror = function () {
//         console.error("Error loading image history from IndexedDB.");
//     };
// }

// function removeImageFromIndexedDB(imageId) {
//     const transaction = db.transaction(['images'], 'readwrite');
//     const store = transaction.objectStore('images');
//     const request = store.delete(imageId);
//     request.onsuccess = function () {
//         console.log("Image removed from IndexedDB.");
//     };
//     request.onerror = function () {
//         console.error("Error removing image from IndexedDB.");
//     };
// }

// openDB();

// showHistoryButton.addEventListener('click', function () {
//     historyOverlay.style.display = 'flex';
//     loadImageHistoryFromIndexedDB();
// });

// closeHistoryButton.addEventListener('click', function () {
//     historyOverlay.style.display = 'none';
// });

// button.addEventListener('click', async function () {
//     const userInput = inputTxt.value.trim();
//     clearErrorMessages();
//     if (!userInput.includes(requiredKeyword)) {
//         return;
//     }
//     displayStatusMessage("Your image is being generated...(it may take some time)");

//     try {
//         const imageDataURL = await query(userInput);
//         if (imageDataURL) {
//             const img = document.createElement("img");
//             img.src = imageDataURL;
//             img.alt = "Generated image";
//             img.style.width = "200px";
//             img.style.height = "200px";
//             img.style.borderRadius = "5px";
//             img.style.boxShadow = "0 6px 24px rgb(0 0 0)";
//             chatBox.appendChild(img);
//             saveImageToIndexedDB(imageDataURL);
//         }
//     } catch (error) {
//         displayErrorMessage("Failed to generate image. Please try again.");
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
//         const reader = new FileReader();
//         return new Promise((resolve, reject) => {
//             reader.onloadend = () => resolve(reader.result);
//             reader.onerror = reject;
//             reader.readAsDataURL(result);
//         });
//     } catch (error) {
//         console.error("Error occurred:", error.message);
//         throw error;
//     }
// }

// function displayErrorMessage(message) {
//     const errorMsg = document.createElement("p");
//     errorMsg.className = "error-message";
//     errorMsg.textContent = message;
//     errorMsg.style.color = 'red';
//     chatBox.appendChild(errorMsg);
// }

// function displayStatusMessage(message, color = 'black') {
//     const statusMsg = document.createElement("p");
//     statusMsg.className = "status-message";
//     statusMsg.textContent = message;
//     statusMsg.style.color = color;
//     chatBox.appendChild(statusMsg);
// }

// function clearErrorMessages() {
//     const existingErrorMsgs = chatBox.getElementsByClassName("error-message");
//     while (existingErrorMsgs.length > 0) {
//         existingErrorMsgs[0].remove();
//     }
// }









const token = "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";
const inputTxt = document.getElementById("user-input");
const button = document.getElementById("send-buttonn");
const chatBox = document.getElementById("chat-box");
const showHistoryButton = document.getElementById('show-history-button');
const historyOverlay = document.getElementById('history-overlay');
const closeHistoryButton = document.getElementById('close-history-button');
const historyContainer = document.getElementById('history-container');
const requiredKeyword = "generate";
const dbName = "ImageHistoryDB";
const dbVersion = 1;
let db;

function openDB() {
    const request = indexedDB.open(dbName, dbVersion);
    request.onupgradeneeded = function (event) {
        db = event.target.result;
        if (!db.objectStoreNames.contains('images')) {
            const store = db.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
            store.createIndex('timestamp', 'timestamp', { unique: false });
        }
    };
    request.onsuccess = function (event) {
        db = event.target.result;
    };
    request.onerror = function (event) {
        console.error("Error opening IndexedDB:", event.target.errorCode);
    };
}

function saveImageToIndexedDB(imageDataURL) {
    const transaction = db.transaction(['images'], 'readwrite');
    const store = transaction.objectStore('images');
    const imageRecord = { url: imageDataURL, timestamp: new Date().toISOString() };
    const request = store.add(imageRecord);
    request.onsuccess = function () {
        console.log("Image saved to IndexedDB.");
    };
    request.onerror = function () {
        console.error("Error saving image to IndexedDB.");
    };
}

function loadImageHistoryFromIndexedDB() {
    historyContainer.innerHTML = '';
    const transaction = db.transaction(['images'], 'readonly');
    const store = transaction.objectStore('images');
    const request = store.getAll();
    request.onsuccess = function (event) {
        const images = event.target.result;
        images.forEach(imageRecord => {
            const imageWrapper = document.createElement('div');
            imageWrapper.style.marginBottom = '15px';
            
            const imgDiv = document.createElement('div');
            const img = document.createElement('img');
            img.src = imageRecord.url;
            img.alt = 'History image';
            img.style.width = '200px';
            img.style.height = '200px';
            img.style.borderRadius = '5px';
            img.style.boxShadow = '0 6px 24px rgb(0 0 0)';
            imgDiv.appendChild(img);
            
            const infoDiv = document.createElement('div');
            const timestamp = document.createElement('p');
            timestamp.textContent = `Generated on: ${new Date(imageRecord.timestamp).toLocaleString()}`;
            timestamp.style.fontSize = '12px';
            timestamp.style.color = 'gray';
            infoDiv.appendChild(timestamp);

            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.addEventListener('click', function () {
                removeImageFromIndexedDB(imageRecord.id);
                historyContainer.removeChild(imageWrapper);
            });
            infoDiv.appendChild(removeButton);

            imageWrapper.appendChild(imgDiv);
            imageWrapper.appendChild(infoDiv);
            historyContainer.appendChild(imageWrapper);
        });
    };
    request.onerror = function () {
        console.error("Error loading image history from IndexedDB.");
    };
}

function removeImageFromIndexedDB(imageId) {
    const transaction = db.transaction(['images'], 'readwrite');
    const store = transaction.objectStore('images');
    const request = store.delete(imageId);
    request.onsuccess = function () {
        console.log("Image removed from IndexedDB.");
    };
    request.onerror = function () {
        console.error("Error removing image from IndexedDB.");
    };
}

openDB();

showHistoryButton.addEventListener('click', function () {
    historyOverlay.style.display = 'flex';
    loadImageHistoryFromIndexedDB();
});

closeHistoryButton.addEventListener('click', function () {
    historyOverlay.style.display = 'none';
});

button.addEventListener('click', async function () {
    const userInput = inputTxt.value.trim();
    clearErrorMessages();
    if (!userInput.includes(requiredKeyword)) {
        return;
    }
    displayStatusMessage("Your image is being generated...(it may take some time)");

    try {
        const imageDataURL = await query(userInput);
        if (imageDataURL) {
            const img = document.createElement("img");
            img.src = imageDataURL;
            img.alt = "Generated image";
            img.style.width = "200px";
            img.style.height = "200px";
            img.style.borderRadius = "5px";
            img.style.boxShadow = "0 6px 24px rgb(0 0 0)";
            chatBox.appendChild(img);
            saveImageToIndexedDB(imageDataURL);
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
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(result);
        });
    } catch (error) {
        console.error("Error occurred:", error.message);
        throw error;
    }
}

function displayErrorMessage(message) {
    const errorMsg = document.createElement("p");
    errorMsg.className = "error-message";
    errorMsg.textContent = message;
    errorMsg.style.color = 'red';
    chatBox.appendChild(errorMsg);
}

function displayStatusMessage(message, color = 'black') {
    const statusMsg = document.createElement("p");
    statusMsg.className = "status-message";
    statusMsg.textContent = message;
    statusMsg.style.color = color;
    chatBox.appendChild(statusMsg);
}

function clearErrorMessages() {
    const existingErrorMsgs = chatBox.getElementsByClassName("error-message");
    while (existingErrorMsgs.length > 0) {
        existingErrorMsgs[0].remove();
    }
}