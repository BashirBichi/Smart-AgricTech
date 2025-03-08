document.addEventListener("DOMContentLoaded", function () {
    const postProductBtn = document.getElementById("postProductBtn");
    const produceListingTable = document.getElementById("produceListingTable");
    const marketplaceContainer = document.getElementById("marketplaceContainer");
    const clearListingsBtn = document.getElementById("clearListings");

    if (!postProductBtn || !produceListingTable || !marketplaceContainer || !clearListingsBtn) {
        console.error("One or more elements missing! Check your HTML IDs.");
        return;
    }

    // Load stored products from localStorage
    function loadProducts() {
        const storedProducts = JSON.parse(localStorage.getItem("products")) || [];

        storedProducts.forEach(product => {
            addProductToMarketplace(product);
            addProductToListing(product);
        });
    }
    loadProducts(); // Call function to load existing products on page load

    // Function to post a product
    postProductBtn.addEventListener("click", function () {
        const name = document.getElementById("name").value.trim();
        const quantity = document.getElementById("quantity").value.trim();
        const price = document.getElementById("price").value.trim();
        const description = document.getElementById("description").value.trim();
        const imageInput = document.getElementById("media_file");
        const image = imageInput.files[0];

        if (!name || !quantity || !price || !description || !image) {
            alert("Please fill all fields and upload an image.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
            const imageUrl = event.target.result;
            const productId = Date.now().toString(); // Unique ID

            const productData = {
                id: productId,
                name,
                quantity,
                price,
                description,
                imageUrl
            };

            // Store product in localStorage
            let storedProducts = JSON.parse(localStorage.getItem("products")) || [];
            storedProducts.push(productData);
            localStorage.setItem("products", JSON.stringify(storedProducts));

            // ✅ Add Product to Marketplace & Farmer's Listing
            addProductToMarketplace(productData);
            addProductToListing(productData);

            // ✅ Clear form fields after posting
            document.getElementById("name").value = "";
            document.getElementById("quantity").value = "";
            document.getElementById("price").value = "";
            document.getElementById("description").value = "";
            imageInput.value = "";

            alert("Your product has been posted successfully!");
        };
        reader.readAsDataURL(image);
    });

    // Function to Add Product to Marketplace
    function addProductToMarketplace(product) {
        const marketplaceProduct = `
            <div class="col-md-4 mb-4" id="product-${product.id}">
                <div class="card">
                    <img src="${product.imageUrl}" class="card-img-top" alt="${product.name}">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text">${product.description}</p>
                        <p class="card-text"><strong>$${product.price}</strong></p>
                        <button class="btn btn-primary add-to-cart">Add to Cart</button>
                        <button class="btn btn-danger remove-product" data-id="${product.id}">Remove</button>
                    </div>
                </div>
            </div>
        `;
        marketplaceContainer.insertAdjacentHTML("beforeend", marketplaceProduct);
    }

    // Function to Add Product to Farmer's Product Listing
    function addProductToListing(product) {
        const productRow = `
            <tr id="listing-${product.id}">
                <td>${product.name}</td>
                <td>${product.quantity}</td>
                <td>${product.price}</td>
                <td>Available</td>
                <td><strong>Farmer</strong></td>
                <td><button class="btn btn-danger remove-listing" data-id="${product.id}">Remove</button></td>
            </tr>
        `;
        produceListingTable.insertAdjacentHTML("beforeend", productRow);
    }

    // ✅ Remove Individual Product from Listings & Marketplace
    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("remove-product")) {
            const productId = event.target.getAttribute("data-id");
            document.getElementById(`product-${productId}`)?.remove();
            document.getElementById(`listing-${productId}`)?.remove();

            removeProductFromStorage(productId);
        }

        if (event.target.classList.contains("remove-listing")) {
            const productId = event.target.getAttribute("data-id");
            document.getElementById(`listing-${productId}`)?.remove();
            document.getElementById(`product-${productId}`)?.remove();

            removeProductFromStorage(productId);
        }
    });

    // Function to Remove Product from Local Storage
    function removeProductFromStorage(productId) {
        let storedProducts = JSON.parse(localStorage.getItem("products")) || [];
        storedProducts = storedProducts.filter(product => product.id !== productId);
        localStorage.setItem("products", JSON.stringify(storedProducts));
    }

    // ✅ Clear All Listings
    clearListingsBtn.addEventListener("click", function () {
        produceListingTable.innerHTML = "";
        marketplaceContainer.innerHTML = "";
        localStorage.removeItem("products"); // Clear storage
        alert("All listings have been cleared.");
    });
});
