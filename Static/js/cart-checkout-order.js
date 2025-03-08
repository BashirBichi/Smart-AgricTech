document.addEventListener("DOMContentLoaded", function () {
    let cartItems = JSON.parse(localStorage.getItem("cart")) || [];
    const cartContainer = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    const invoiceItems = document.getElementById("invoice-items");
    const invoiceTotal = document.getElementById("invoice-total");
    const orderTable = document.getElementById("order-table");

    // Load cart items from localStorage
    function loadCartItems() {
        cartContainer.innerHTML = ""; // Clear previous items
        cartItems.forEach((product, index) => {
            const cartItem = `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <img src="${product.imageUrl}" alt="${product.name}" style="width: 50px; height: 50px; border-radius: 5px;">
                    <span><strong>${product.name}</strong> - ${product.description}</span>
                    <span>₦${product.price}</span>
                    <button class="btn btn-danger btn-sm remove-from-cart" data-index="${index}">Remove</button>
                </li>
            `;
            cartContainer.insertAdjacentHTML("beforeend", cartItem);
        });
        updateTotal();
    }

    // Function to update total price
    function updateTotal() {
        let total = cartItems.reduce((sum, product) => sum + parseFloat(product.price), 0);
        cartTotal.textContent = `Total: ₦${total.toFixed(2)}`;
    }

    // Proceed to Checkout
    document.getElementById("proceed-to-checkout").addEventListener("click", function () {
        invoiceItems.innerHTML = "";
        let totalInvoicePrice = 0;

        cartItems.forEach((item) => {
            totalInvoicePrice += parseFloat(item.price);
            invoiceItems.insertAdjacentHTML("beforeend", `
                <li class="list-group-item d-flex justify-content-between">
                    <span>${item.name}</span>
                    <span><strong>₦${item.price}</strong></span>
                </li>
            `);
        });

        invoiceTotal.textContent = `Total: ₦${totalInvoicePrice.toFixed(2)}`;
        new bootstrap.Modal(document.getElementById("checkoutModal")).show();
    });

    // Remove from Cart
    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("remove-from-cart")) {
            const index = event.target.getAttribute("data-index");
            cartItems.splice(index, 1);
            localStorage.setItem("cart", JSON.stringify(cartItems));
            loadCartItems();
        }
    });

    // Clear Cart
    document.getElementById("clear-cart").addEventListener("click", function () {
        localStorage.removeItem("cart");
        loadCartItems();
    });

    // Load Cart Items when Cart Section is Opened
    document.querySelector(".nav-link[data-section='Product-catalog']").addEventListener("click", function () {
        loadCartItems();
    });

    // Checkout Form Submission
    document.getElementById("checkout-form").addEventListener("submit", function (event) {
        event.preventDefault();

        let orderDetails = {
            name: document.getElementById("full-name").value,
            address: document.getElementById("address").value,
            paymentMethod: document.getElementById("payment-method").value,
            cart: cartItems
        };

        localStorage.setItem("order", JSON.stringify(orderDetails));
        alert("Your order has been placed successfully!");
        localStorage.setItem("cart", JSON.stringify([])); // Clear cart after checkout
        cartItems = [];
        loadCartItems();
    });

    // Load Cart on Page Load
    loadCartItems();
});







// Invoice Modal

function displayInvoice() {
    const invoiceDetailsElement = document.getElementById('invoice-details');
    const totalInvoiceAmountElement = document.getElementById('total-invoice-amount');
    invoiceDetailsElement.innerHTML = '';
    let totalInvoiceAmount = 0;

    cartItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalInvoiceAmount += itemTotal;
        invoiceDetailsElement.innerHTML += `
            <div class="invoice-item">
                <span>${item.name} (${item.quantity})</span>
                <span>₦${itemTotal.toFixed(2)}</span>
            </div>
        `;
    });

    totalInvoiceAmountElement.innerText = `₦${totalInvoiceAmount.toFixed(2)}`;
}
// Ensure Checkout Button Navigates to Checkout Section
document.getElementById('proceed-checkout-btn').addEventListener('click', function () {
    document.getElementById('checkout-section').style.display = 'block';
    document.getElementById('Product-catalog').style.display = 'none';
});
