document.getElementById('registrationForm').addEventListener('submit', function(event) {
    event.preventDefault();

    // Get form values
    const userName = document.getElementById('userName').value;
    const userRole = document.getElementById('userRole').value;

    // Create welcome message
    const welcomeMessage = `
        <h4>Welcome, ${userName}!</h4>
        <p>You have registered as a <strong>${userRole}</strong>.</p>
    `;

    // Display welcome message
    const welcomeMessageContainer = document.getElementById('welcomeMessage');
    welcomeMessageContainer.innerHTML = welcomeMessage;
    welcomeMessageContainer.style.display = 'block';

    // Clear form
    document.getElementById('registrationForm').reset();
});
// password validation
document.getElementById("registrationForm").addEventListener("submit", function(event) {
    const password = document.getElementById("userPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const passwordError = document.getElementById("passwordError");

    if (password !== confirmPassword) {
        event.preventDefault();  // Prevent form submission
        passwordError.classList.remove("d-none");
    } else {
        passwordError.classList.add("d-none");
    }
});

// javaScript for Password Toggle 
                    document.getElementById("toggleUserPassword").addEventListener("change", function() {
                        const passwordField = document.getElementById("userPassword");
                        passwordField.type = this.checked ? "text" : "password";
                    });
                
                    document.getElementById("toggleConfirmPassword").addEventListener("change", function() {
                        const confirmPasswordField = document.getElementById("confirmPassword");
                        confirmPasswordField.type = this.checked ? "text" : "password";
                    });
                
                    document.getElementById("toggleLoginPassword").addEventListener("change", function() {
                        const loginPasswordField = document.getElementById("loginPassword");
                        loginPasswordField.type = this.checked ? "text" : "password";
                    });
    

 
                    document.addEventListener("DOMContentLoaded", function () {
                        const menuLinks = document.querySelectorAll('.nav-link[data-section]');
                        const profileLinks = document.querySelectorAll('.profile-link[data-section]');
                        const sections = document.querySelectorAll('.content-section');
                        const profileSections = document.querySelectorAll("#profile-content .content-section");
                    
                        // Function to hide all sections
                        function hideAllSections() {
                            sections.forEach(section => section.style.display = 'none');
                            profileSections.forEach(section => section.style.display = 'none');
                        }
                    
                        // Function to show sidebar content
                        function showSidebarSection(sectionId) {
                            hideAllSections();
                            const targetSection = document.getElementById(sectionId);
                            if (targetSection) {
                                targetSection.style.display = 'block';
                            }
                        }
                    
                        // Function to show profile section
                        function showProfileSection(sectionId) {
                            hideAllSections();
                            const targetSection = document.getElementById(sectionId);
                            if (targetSection) {
                                targetSection.style.display = "block";
                            }
                        }
                    
                        // Sidebar Navigation Links
                        menuLinks.forEach(link => {
                            link.addEventListener('click', (e) => {
                                e.preventDefault();
                                showSidebarSection(link.getAttribute('data-section'));
                    
                                // Remove 'active' class from all links and add to the clicked one
                                menuLinks.forEach(item => item.classList.remove('active'));
                                link.classList.add('active');
                            });
                        });
                    
                        // Profile Dropdown Links
                        profileLinks.forEach(item => {
                            item.addEventListener("click", function (event) {
                                event.preventDefault();
                                const selectedSection = item.getAttribute("data-section");
                    
                                if (selectedSection === "logout") {
                                    logoutUser();
                                } else {
                                    showProfileSection(selectedSection);
                                }
                            });
                        });
                    });
                    
                    // Logout function
                    function logoutUser() {
                        alert("Logging out...");
                        window.location.href = "login.html"; // Redirect to login page
                    }
                    