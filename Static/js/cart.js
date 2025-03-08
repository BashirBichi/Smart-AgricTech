document.addEventListener("DOMContentLoaded", function () {
    const cartBadge = document.getElementById("cart-badge");
    const cartList = document.getElementById("cart-items");
    const clearCartButton = document.getElementById("clear-cart");
    const cartTotal = document.getElementById("cart-total");

    // Load cart items from local storage on page load
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    updateCartUI();

    // Function to update cart UI
    function updateCartUI() {
        cartList.innerHTML = "";
        let totalPrice = 0;

        cart.forEach((product, index) => {
            totalPrice += parseFloat(product.price);
            const listItem = document.createElement("li");
            listItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items<thinking>
The task was interrupted while updating the cart.js file. I need to complete the implementation of the enhanced cart functionality. I'll use create_file to ensure the changes are applied successfully.
</thinking>

<create_file>
<path>Static/js/cart.js</path>
<content>
document.addEventListener("DOMContentLoaded", function () {
    const cartBadge = document.getElementById("cart-badge");
    const cartList = document.getElementById("cart-items");
    const clearCartButton = document.getElementById("clear-cart");
    const cartTotal = document.getElementById("cart-total");
    const cartToggle = document.getElementById("cart-toggle");

    // Load cart items from local storage on page load
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    updateCartUI();

    // Add event listeners to all "Add to Cart" buttons
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

    // Function to update cart UI
    function updateCartUI() {
        cartList.innerHTML = "";
        let total = 0;

        cart.forEach((product, index) => {
            total += product.price * product.quantity;
            const listItem = `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <img src="${product.image}" alt="${product.name}" width="50" class="mr-2">
                    <div class="flex-grow-1 mx-3">
                        <h6 class="mb-0">${product.name}</h6>
                        <small>${product.description}</small>
                        <div class="quantity-control mt-2">
                            <button class="btn btn-sm btn-outline-secondary decrease-quantity" data-index="${index}">-</button>
                            <span class="mx-2">${product.quantity}</span>
                            <button class="btn btn-sm btn-outline-secondary increase-quantity" data-index="${index}">+</button>
                        </div>
                    </div>
                    <div>
                        <strong>₦${(product.price * product.quantity).toFixed(2)}</strong>
                        <button class="btn btn-danger btn-sm remove-item ml-2" data-index="${index}">Remove</button>
                    </div>
                </li>
            `;
            cartList.insertAdjacentHTML("beforeend", listItem);
        });

        // Update total price
        cartTotal.textContent = `₦${total.toFixed(2)}`;
        
        // Update badge count
        cartBadge.textContent = cart.reduce((sum, product) => sum + product.quantity, 0);
    }

    // Remove item from cart
    cartList.addEventListener("click", function (event) {
        if (event.target.classList.contains("remove-item")) {
            const index = event.target.dataset.index;
            cart.splice(index, 1);
            localStorage.setItem("cart", JSON.stringify(cart));
            updateCartUI();
        }
    });

    // Quantity control
    cartList.addEventListener("click", function (event) {
        const index = event.target.dataset.index;
        if (event.target.classList.contains("increase-quantity")) {
            cart[index].quantity += 1;
            localStorage.setItem("cart", JSON.stringify(cart));
            updateCartUI();
        } else if (event.target.classList.contains("decrease-quantity")) {
            if (cart[index].quantity > 1) {
                cart[index].quantity -= 1;
                localStorage.setItem("cart", JSON.stringify(cart));
                updateCartUI();
            }
        }
    });

    // Clear all items from cart
    clearCartButton.addEventListener("click", function () {
        cart = [];
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartUI();
        alert("Cart cleared!");
    });

    // Toggle cart visibility
    if (cartToggle) {
        cartToggle.addEventListener("click", function () {
            const cartSection = document.getElementById("cart-section");
            cartSection.classList.toggle("d-none");
        });
    }
});







document.addEventListener("DOMContentLoaded", function () {
    const cartItemsList = document.getElementById("cart-items");
    const clearCartButton = document.getElementById("clear-cart");
    const cartBadge = document.getElementById("cart-badge");

    // Load cart items from local storage
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    updateCartUI();

    // Function to show toast notification
    function showToast(message) {
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.innerText = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Function to update cart UI
    function updateCartUI() {
        cartItemsList.innerHTML = "";
        let totalPrice = 0;
        let totalItems = 0;

        cart.forEach((product, index) => {
            totalPrice += product.price * product.quantity;
            totalItems += product.quantity; // Increment total items count
            const listItem = `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <img src="${product.image}" alt="${product.name}" width="50" class="mr-2">
                    <div>
                        <strong>${product.name}</strong> (₦${product.price}) x ${product.quantity}
                    </div>
                    <button class="btn btn-danger btn-sm remove-item" data-index="${index}">Remove</button>
                </li>
            `;
            cartItemsList.insertAdjacentHTML("beforeend", listItem);
        });

        // Update total price display
        const totalDisplay = document.createElement("div");
        totalDisplay.className = "total-price";
        totalDisplay.innerHTML = `<strong>Total: ₦${totalPrice.toFixed(2)}</strong>`;
        cartItemsList.appendChild(totalDisplay);

        // Update cart badge
        cartBadge.innerText = totalItems; // Update badge with total items count
    }

    // Clear cart functionality
    clearCartButton.addEventListener("click", function () {
        cart = [];
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartUI();
        alert("Cart cleared!");
    });

    // Remove item from cart
    cartItemsList.addEventListener("click", function (event) {
        if (event.target.classList.contains("remove-item")) {
            const index = event.target.dataset.index;
            cart.splice(index, 1);
            localStorage.setItem("cart", JSON.stringify(cart));
            updateCartUI();
        }
    });

    // Function to add item to cart (this should be called from product posting logic)
    function addToCart(product) {
        cart.push(product);
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartUI();
        showToast(`${product.name} has been added to your cart!`); // Show toast notification
    }
});
