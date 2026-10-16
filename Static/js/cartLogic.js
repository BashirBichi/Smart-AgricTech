document.addEventListener("DOMContentLoaded", function () {
    const cartKey = window.AGRI_CART_KEY || "cart";
    const cartNavLink = document.querySelector(".nav-link[data-section='Product-catalog']");
    const cartContainer = document.getElementById("Product-catalog");
    const cartItemsList = document.getElementById("cart-items");
    const cartTotalElement = document.getElementById("cart-total");
    const clearCartBtn = document.getElementById("clear-cart");
    const proceedCheckoutBtn = document.getElementById("proceed-to-checkout");

    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];

    // Keep every navigation badge synchronized with saved cart quantities.
    function updateCartBadges() {
        const count = cart.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
        document.querySelectorAll('#cart-badge').forEach(badge => {
            badge.textContent = String(count);
            badge.setAttribute('aria-label', count + ' items in cart');
            badge.style.display = count ? 'inline-flex' : 'none';
        });
    }

    // ✅ Function to Update Cart UI Instantly
    function updateCartUI() {
        updateCartBadges();
        cartItemsList.innerHTML = "";
        let total = 0;

        if (cart.length === 0) {
            cartItemsList.innerHTML = `<li class="list-group-item text-center text-muted">Your cart is empty.</li>`;
            cartTotalElement.textContent = "₦0.00";
            return;
        }

        cart.forEach((item, index) => {
            total += item.price * item.quantity;

            const cartItemHTML = `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <img src="${item.image}" alt="${item.name}" width="50" height="50" class="rounded">
                    <div>
                        <strong>${item.name}</strong> <br>
                        ${item.description} <br>
                        (₦${item.price} x ${item.quantity})
                    </div>
                    <button class="btn btn-danger btn-sm remove-item" data-index="${index}">Remove</button>
                </li>
            `;
            cartItemsList.insertAdjacentHTML("beforeend", cartItemHTML);
        });

        cartTotalElement.textContent = `₦${total.toFixed(2)}`;
    }

    // ✅ Function to Add Item to Cart (Fix for Image & Real-Time Updates)
    function addToCart(product) {
        let existingItem = cart.find(item => item.name === product.name);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push(product);
        }

        localStorage.setItem(cartKey, JSON.stringify(cart));
        updateCartUI();
    }

    // ✅ Handle "Add to Cart" Button Click (Fix: Ensure Image is Captured)
    document.addEventListener("click", function (event) {
        if (event.target.closest(".add-to-cart")) {
            const productCard = event.target.closest(".card");

            const product = {
                name: productCard.querySelector(".card-title").textContent,
                description: productCard.querySelector(".card-text").textContent,
                price: parseFloat(productCard.querySelector("strong").textContent.replace("₦", "")),
                image: productCard.querySelector(".card-img-top").src, // ✅ Fix: Get correct image source
                quantity: 1
            };

            addToCart(product);
            alert(`${product.name} has been added to the cart.`);
        }
    });

    // ✅ Handle "Remove" Button Click
    cartItemsList.addEventListener("click", function (event) {
        if (event.target.closest(".remove-item")) {
            const index = event.target.closest(".remove-item").getAttribute("data-index");
            cart.splice(index, 1);
            localStorage.setItem(cartKey, JSON.stringify(cart));
            updateCartUI();
        }
    });

    // ✅ Fix: Fully Clear Cart When "Clear Cart" is Clicked
    clearCartBtn.addEventListener("click", function () {
        if (cart.length === 0) {
            alert("Your cart is already empty.");
            return;
        }
        cart = []; // Reset cart array
        localStorage.removeItem(cartKey); // Remove from localStorage
        updateCartUI(); // Refresh UI
        alert("Your cart has been cleared.");
    });

    // ✅ Show Cart Content When NavLink is Clicked (Now Updates in Real Time)
    cartNavLink.addEventListener("click", function () {
        updateCartUI();
    });

    // ✅ Handle "Proceed to Checkout" Button Click
    proceedCheckoutBtn.addEventListener("click", function () {
        document.getElementById("checkout-section").style.display = "block";
        cartContainer.style.display = "none";
    });

    window.addEventListener('storage', function (event) {
        if (event.key === cartKey) {
            try { cart = JSON.parse(event.newValue || '[]') || []; } catch (_) { cart = []; }
            updateCartUI();
        }
    });
    updateCartUI(); // Initialize cart list and badges from saved items
});
