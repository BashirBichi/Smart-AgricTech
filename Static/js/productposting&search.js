document.addEventListener("DOMContentLoaded", function () {
    const marketAccessForm = document.getElementById("marketAccessForm");
    const marketplaceContainer = document.getElementById("marketplaceContainer");
    const marketSearch = document.getElementById("marketSearch");
    const searchProductBtn = document.getElementById("searchProduct");
    const marketplaceNavLink = document.querySelector(".nav-link[data-section='marketplace']");
    const cartContainer = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    const clearCartBtn = document.getElementById("clear-cart");

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
                            <p class="card-text"><strong>₦${product.price}</strong></p>
                            <button class="btn btn-primary add-to-cart" 
                                    data-name="${product.name}"
                                    data-description="${product.description}"
                                    data-price="${product.price}"
                                    data-image="${product.imageUrl}">
                                Add to Cart
                            </button>
                            <button class="btn btn-secondary add-to-favorite" data-id="${product.id}">Add to Favorites</button>
                        </div>
                    </div>
                </div>
            `;
            marketplaceContainer.insertAdjacentHTML("beforeend", marketplaceProduct);
        });
    }

    // Post Product to Marketplace
    document.getElementById("postToMarketplace").addEventListener("click", function () {
        const productName = document.getElementById("marketProductName").value.trim();
        const productDescription = document.getElementById("marketProductDescription").value.trim();
        const productPrice = document.getElementById("marketProductPrice").value.trim();
        const productImage = document.getElementById("marketProductImage").files[0];

        if (!productName || !productDescription || !productPrice || !productImage) {
            alert("Please fill all fields and upload an image.");
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
                imageUrl: imageUrl
            };

            storeProduct(product);
            marketAccessForm.reset();
            alert("Your product has been posted successfully!");
            loadMarketplaceProducts(); // Reload marketplace products
        };
        reader.readAsDataURL(productImage);
    });

    // Display Products in Marketplace when the NavLink is Clicked
    marketplaceNavLink.addEventListener("click", function () {
        loadMarketplaceProducts();
    });

    // Search Products in Marketplace
    searchProductBtn.addEventListener("click", function () {
        const searchQuery = marketSearch.value.toLowerCase().trim();
        const products = document.querySelectorAll(".product-item");

        products.forEach(product => {
            const productName = product.getAttribute("data-name");
            product.style.display = productName.includes(searchQuery) ? "block" : "none";
        });
    });

    loadMarketplaceProducts(); // Load products when the page loads

    // CART FUNCTIONALITY
    function updateCartTotal() {
        let cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
        let total = cartItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
        cartTotal.innerText = `₦${total.toFixed(2)}`;
    }

    function loadCartItems() {
        cartContainer.innerHTML = "";
        let cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];

        cartItems.forEach((item, index) => {
            const cartItem = `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <img src="${item.image}" alt="${item.name}" width="50" class="mr-2">
                    <div>
                        <strong>${item.name}</strong> (₦${item.price}) x ${item.quantity}
                    </div>
                    <button class="btn btn-danger btn-sm remove-item" data-index="${index}">Remove</button>
                </li>
            `;
            cartContainer.insertAdjacentHTML("beforeend", cartItem);
        });

        updateCartTotal();
    }

    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("add-to-cart")) {
            const name = event.target.getAttribute("data-name");
            const description = event.target.getAttribute("data-description");
            const price = event.target.getAttribute("data-price");
            const image = event.target.getAttribute("data-image");

            let cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
            cartItems.push({ name, description, price, image, quantity: 1 });
            localStorage.setItem("cartItems", JSON.stringify(cartItems));

            loadCartItems(); // Update cart instantly
        }
    });

    // Remove item from cart
    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("remove-item")) {
            let cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
            const index = event.target.getAttribute("data-index");
            cartItems.splice(index, 1);
            localStorage.setItem("cartItems", JSON.stringify(cartItems));

            loadCartItems();
        }
    });

    // Clear Cart
    clearCartBtn.addEventListener("click", function () {
        localStorage.removeItem("cartItems");
        loadCartItems();
        alert("Your cart has been cleared.");
    });

    loadCartItems(); // Load cart items on page load
});
