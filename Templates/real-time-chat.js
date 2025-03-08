// StartChatbutton
function startChat() {
    // Hide all other sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none'; // Hide all sections
    });

    // Startbuttonsection
    const budgetSection = document.getElementById('chat-section');
    if (budgetSection) {
        budgetSection.style.display = 'block'; // Show the budget forecasting section
    }
}
document.addEventListener("DOMContentLoaded", function () {
    const socket = io();
    let chatID = null;
    let username = null;

    function showChatSection() {
        document.querySelectorAll('.content-section').forEach(section => section.style.display = 'none');
        document.getElementById("chat-section").style.display = "block";
    }

    function startChat(user1, user2) {
        fetch("/start-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user1, user2 })
        })
        .then(response => response.json())
        .then(data => {
            chatID = data.chat_id;
            username = prompt("Enter your name:");
            socket.emit("join_chat", { chat_id: chatID, username: username });

            showChatSection(); // Display chat section in content
        });
    }

    socket.on("message", (data) => {
        const chatBox = document.getElementById("chat-box");
        const messageElement = document.createElement("p");
        messageElement.textContent = `${data.sender}: ${data.text}`;
        chatBox.appendChild(messageElement);
    });

    window.sendMessage = function () {
        const message = document.getElementById("message-input").value;
        if (message.trim() !== "") {
            socket.emit("send_message", { chat_id: chatID, username: username, message: message });
            document.getElementById("message-input").value = "";
        }
    };

    window.leaveChat = function () {
        chatID = null;
        username = null;
        document.getElementById("chat-box").innerHTML = "";
        alert("You have left the chat.");
    };

    // Attach function to global window object
    window.startChat = startChat;
});
