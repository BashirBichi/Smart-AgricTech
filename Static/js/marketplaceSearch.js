// Marketplace Search Functionality
document.addEventListener("DOMContentLoaded", function() {
    const searchInput = document.querySelector("#marketplaceSearchInput");
    const marketplaceContainer = document.querySelector("#marketplaceContainer");

    if (searchInput && marketplaceContainer) {
        searchInput.addEventListener("input", function() {
            const searchTerm = this.value.toLowerCase();
            const cards = marketplaceContainer.querySelectorAll(".card");

            cards.forEach(card => {
                const title = card.querySelector(".card-title");
                if (title) {
                    const cardText = title.textContent.toLowerCase();
                    if (cardText.includes(searchTerm)) {
                        card.style.display = "block";
                    } else {
                        card.style.display = "none";
                    }
                }
            });
        });
    }
});
