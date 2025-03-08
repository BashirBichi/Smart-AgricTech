// contact-support button
function contactSupport() {
    // Hide all other sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none'; // Hide all sections
    });

    // Show contact-support
    const budgetSection = document.getElementById('contact-support');
    if (budgetSection) {
        budgetSection.style.display = 'block'; // Show the budget forecasting section
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const socket = io();
    let supportChatActive = false;

    // Navigate to Contact Support Section
    document.querySelectorAll(".nav-link[data-section='contact-support']").forEach(link => {
        link.addEventListener("click", () => {
            document.querySelectorAll('.content-section').forEach(section => section.style.display = 'none');
            document.getElementById("contact-support").style.display = "block";
        });
    });

    // Handle Support Form Submission
    document.getElementById("support-form").addEventListener("submit", function (event) {
        event.preventDefault();
        const name = document.getElementById("support-name").value;
        const email = document.getElementById("support-email").value;
        const issue = document.getElementById("support-issue").value;

        // Simulate sending ticket to support system
        alert("Support ticket submitted successfully. Our team will reach out shortly.");
        
        // Reset form
        this.reset();
    });

    // Start Live Chat
    window.startLiveChat = function () {
        document.getElementById("chat-window").style.display = "block";
        supportChatActive = true;
        socket.emit("join_chat", { chat_id: "support-chat", username: "User" });
    };

    // Send Message in Live Chat
    window.sendSupportMessage = function () {
        if (supportChatActive) {
            const message = document.getElementById("chat-input").value;
            if (message.trim() !== "") {
                socket.emit("send_message", { chat_id: "support-chat", username: "User", message: message });
                document.getElementById("chat-input").value = "";
            }
        }
    };

    // Receive Messages from Support
    socket.on("message", (data) => {
        const chatMessages = document.getElementById("chat-messages");
        const messageElement = document.createElement("p");
        messageElement.innerText = `${data.sender}: ${data.text}`;
        chatMessages.appendChild(messageElement);
    });
});
