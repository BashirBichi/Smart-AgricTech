// Forumbutton
function forumsection() {
    // Hide all other sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none'; // Hide all sections
    });

    // Show forumsection
    const budgetSection = document.getElementById('forum-section');
    if (budgetSection) {
        budgetSection.style.display = 'block'; // Show the budget forecasting section
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const postButton = document.getElementById("postDiscussion");
    const discussionList = document.getElementById("discussionList");
    const chatBox = document.getElementById("chatBox");
    const sendChat = document.getElementById("sendChat");

    // Post a new discussion
    postButton.addEventListener("click", function () {
        const title = document.getElementById("discussionTitle").value;
        const content = document.getElementById("discussionContent").value;

        if (title.trim() !== "" && content.trim() !== "") {
            const discussionItem = document.createElement("li");
            discussionItem.classList.add("list-group-item");
            discussionItem.innerHTML = `<strong>${title}</strong><p>${content}</p>`;

            discussionList.prepend(discussionItem);
            document.getElementById("discussionTitle").value = "";
            document.getElementById("discussionContent").value = "";
        } else {
            alert("Please enter both title and content!");
        }
    });

    // Live Chat Functionality
    sendChat.addEventListener("click", function () {
        const chatMessage = document.getElementById("chatMessage").value;
        if (chatMessage.trim() !== "") {
            const messageElement = document.createElement("p");
            messageElement.textContent = `User: ${chatMessage}`;
            chatBox.appendChild(messageElement);
            document.getElementById("chatMessage").value = "";
        }
    });

    // Video Meeting
    document.getElementById("hostMeeting").addEventListener("click", function () {
        alert("Hosting a meeting... Opening Zoom/Google Meet link.");
        window.open("https://meet.google.com", "_blank"); // Replace with actual meeting link
    });

    document.getElementById("joinMeeting").addEventListener("click", function () {
        alert("Joining a meeting... Please enter the meeting ID.");
    });
});


document.addEventListener("DOMContentLoaded", function () {
    // Chat system
    const chatBox = document.querySelector(".chat-messages");
    const chatInput = document.querySelector("#chat-message");
    const sendBtn = document.querySelector("#send-message");

    sendBtn.addEventListener("click", function () {
        const messageText = chatInput.value.trim();
        if (messageText !== "") {
            const message = document.createElement("p");
            message.textContent = "You: " + messageText;
            chatBox.appendChild(message);
            chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll
            chatInput.value = "";
        }
    });

    // Allow sending messages with Enter key
    chatInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendBtn.click();
        }
    });

    // Video call functions
    document.querySelector(".start-call").addEventListener("click", function () {
        alert("Starting a video call...");
    });

    document.querySelector(".join-call").addEventListener("click", function () {
        alert("Joining a video call...");
    });
});
