// Forumbutton
function showbtn() {
    // Hide all other sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none'; // Hide all sections
    });

    // Show forumsection
    const budgetSection = document.getElementById('market-trends');
    if (budgetSection) {
        budgetSection.style.display = 'block'; // 
    }
}



document.addEventListener("DOMContentLoaded", function () {
    const marketAccessForm = document.getElementById("marketAccessForm");
    const marketplaceContainer = document.getElementById("marketplaceContainer");
    const marketSearch = document.getElementById("marketSearch");
    const searchProductBtn = document.getElementById("searchProduct");
    const marketplaceNavLink = document.querySelector(".nav-link[data-section='marketplace']");

    // Function to Store Products in Local Storage
    function storeProduct(product) {
        let products = JSON.parse(localStorage.getItem("marketplaceProducts")) || [];
        products.push(product);
        localStorage.setItem("marketplaceProducts", JSON.stringify(products));
    }

    // Function to Load Products into Marketplace
    function loadMarketplaceProducts() {
        marketplaceContainer.innerHTML = ""; // Clear previous items
        let products = JSON.parse(localStorage.getItem("marketplaceProducts")) || [];

        products.forEach(product => {
            const marketplaceProduct = `
                <div class="col-md-4 mb-4 product-item" data-name="${product.name.toLowerCase()}" id="product-${product.id}">
                    <div class="card">
                        <img src="${product.imageUrl}" alt="${product.name}" class="card-img-top">
                        <div class="card-body">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text">${product.description}</p>
                            <p class="card-text"><strong>${product.price}</strong></p>
                            <button class="btn btn-primary add-to-cart" 
                                    data-name="${product.name}"
                                    data-description="${product.description}"
                                    data-price="${product.price}"
                                    data-image="${product.imageUrl}">
                                Add to Cart
                            </button>
                            <button class="btn btn-primary add-to-favorite" data-id="${product.id}">Add to Favorite</button>
                        </div>
                    </div>
                </div>
            `;
            marketplaceContainer.insertAdjacentHTML("beforeend", marketplaceProduct);
        });
    }

    // Enhanced Product Posting with Validation
    document.getElementById("postToMarketplace").addEventListener("click", function () {
        // Get and validate product details
        const productName = document.getElementById("marketProductName").value.trim();
        const productDescription = document.getElementById("marketProductDescription").value.trim();
        const productPrice = document.getElementById("marketProductPrice").value.trim();
        const productImage = document.getElementById("marketProductImage").files[0];

        if (!productName || productName.length < 3) {
            alert("Product name must be at least 3 characters long.");
            return;
        }

        if (!productDescription || productDescription.length < 10) {
            alert("Product description must be at least 10 characters long.");
            return;
        }

        if (!productPrice || isNaN(productPrice) || parseFloat(productPrice) <= 0) {
            alert("Please enter a valid price.");
            return;
        }

        if (!productImage) {
            alert("Please upload a product image.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
            const imageUrl = event.target.result;
            const productId = Date.now().toString();

            const product = {
                id: productId,
                name: productName,
                description: productDescription,
                price: parseFloat(productPrice).toFixed(2),
                imageUrl: imageUrl,
                dateAdded: new Date().toLocaleString()
            };

            // Store in Local Storage
            storeProduct(product);

            // Clear the form after submission
            marketAccessForm.reset();

            alert("Your product has been posted successfully!");
        };
        reader.readAsDataURL(productImage);
    });

    // Function to Display Products in Marketplace when NavLink is Clicked
    marketplaceNavLink.addEventListener("click", function () {
        loadMarketplaceProducts();
    });

    // Function to Search for Products in Marketplace
    searchProductBtn.addEventListener("click", function () {
        const searchQuery = marketSearch.value.toLowerCase().trim();
        const products = document.querySelectorAll(".product-item");

        products.forEach(product => {
            const productName = product.getAttribute("data-name");
            product.style.display = productName.includes(searchQuery) ? "block" : "none";
        });
    });

    // Add event listener for "Add to Cart" buttons
    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("add-to-cart")) {
            event.preventDefault();
            
            // Get product details from data attributes
            const product = {
                name: event.target.dataset.name,
                description: event.target.dataset.description,
                price: parseFloat(event.target.dataset.price).toFixed(2),
                image: event.target.dataset.image,
                quantity: 1,
                id: Date.now().toString()
            };

            // Check if product already exists in cart
            const existingProduct = cart.find(p => p.name === product.name);
            if (existingProduct) {
                existingProduct.quantity += 1;
            } else {
                cart.push(product);
            }

            localStorage.setItem("cart", JSON.stringify(cart));
            updateCartUI();
            alert("Product added to cart!");
        }
    });

    // Add event listener for "Add to Favorite" buttons
    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("add-to-favorite")) {
            event.preventDefault();
            // Trigger the existing functionality in favorite.js
            alert("This product has been added to your favorites!");
        }
    });
});