document.addEventListener("DOMContentLoaded", function () {
    // Select all "Add to Favorites" buttons
    const favoriteButtons = document.querySelectorAll(".btn.btn-secondary");

    favoriteButtons.forEach((button) => {
        button.addEventListener("click", function (event) {
            event.preventDefault(); // Prevent default anchor behavior

            // Find the closest card and get the product name
            const productCard = this.closest(".card");
            const productName = productCard.querySelector(".card-title").textContent;

            // Select the favorite items list
            const favoriteList = document.querySelector(".widget-box .list-groupp");

            // Check if item is already in favorites to prevent duplication
            const existingItems = favoriteList.querySelectorAll(".list-group-item");
            for (let item of existingItems) {
                if (item.textContent === productName) {
                    alert("This product is already in favorites!");
                    return; // Stop function execution
                }
            }

            // Create a new list item
            const listItem = document.createElement("li");
            listItem.classList.add("list-group-item");
            listItem.textContent = productName;

            // Append the new item to the favorite list
            favoriteList.appendChild(listItem);
        });
    });
});
