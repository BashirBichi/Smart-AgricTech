document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("marketAccessForm");
    const container = document.getElementById("marketplaceContainer");
    const search = document.getElementById("marketSearch");
    const searchButton = document.getElementById("searchProduct");
    const postButton = document.getElementById("postToMarketplace");
    const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    let products = [];
    async function loadMarketplaceProducts() {
        if (!container) return;
        try {
            const response = await fetch('/api/marketplace/products', {credentials:'same-origin'});
            if (!response.ok) throw Error('Could not load marketplace');
            products = (await response.json()).products || [];
            renderProducts();
        } catch(error) { container.textContent = error.message; }
    }
    function renderProducts() {
        if (!container) return;
        const query = (search?.value || '').toLowerCase().trim();
        container.replaceChildren();
        products.filter(p => p.name.toLowerCase().includes(query)).forEach(p => {
            const wrapper = document.createElement('div');
            wrapper.className = 'col-md-4 mb-4 product-item';
            wrapper.dataset.name = p.name.toLowerCase();
            const card = document.createElement('div');
            card.className = 'card';
            const image = document.createElement('img');
            image.className = 'card-img-top';
            image.src = p.image_url || '/static/images/placeholder.png';
            image.alt = p.name;
            const body = document.createElement('div');
            body.className = 'card-body';
            const title = document.createElement('h5'); title.className = 'card-title'; title.textContent = p.name;
            const description = document.createElement('p'); description.className = 'card-text'; description.textContent = p.description;
            const price = document.createElement('p'); price.className = 'card-text';
            const strong = document.createElement('strong'); strong.textContent = '₦' + Number(p.price).toLocaleString(); price.append(strong);
            const button = document.createElement('button'); button.type = 'button'; button.className = 'btn btn-primary add-to-cart'; button.textContent = 'Add to Cart';
            button.dataset.name = p.name; button.dataset.description = p.description; button.dataset.price = p.price; button.dataset.image = p.image_url || '';
            body.append(title,description,price,button);card.append(image,body);wrapper.append(card);container.append(wrapper);
        });
        if (!container.children.length) container.textContent = 'No products found.';
    }
    postButton?.addEventListener('click', async function(event) {
        event.preventDefault();
        const name = document.getElementById('marketProductName')?.value.trim();
        const description = document.getElementById('marketProductDescription')?.value.trim();
        const price = document.getElementById('marketProductPrice')?.value;
        const image = document.getElementById('marketProductImage')?.files[0];
        if (!name || !price || Number(price) <= 0) { alert('Enter a product name and valid price.'); return; }
        const data = new FormData(); data.set('name',name);data.set('description',description||'');data.set('price',price);data.set('quantity','1');if(image)data.set('image',image);
        postButton.disabled = true;
        try {
            const response = await fetch('/api/marketplace/products',{method:'POST',body:data,credentials:'same-origin'});
            const result = await response.json();
            if(!response.ok)throw Error(result.error||'Could not publish product');
            form?.reset();await loadMarketplaceProducts();alert('Product published successfully!');
        } catch(error) { alert(error.message); } finally { postButton.disabled = false; }
    });
    searchButton?.addEventListener('click',renderProducts);
    search?.addEventListener('input',renderProducts);
    document.querySelectorAll(".nav-link[data-section='marketplace']").forEach(link=>link.addEventListener('click',loadMarketplaceProducts));
    loadMarketplaceProducts();
    // CART FUNCTIONALITY
    function updateCartTotal() {
        let cartItems = JSON.parse(localStorage.getItem((window.AGRI_CART_ITEMS_KEY || "cartItems"))) || [];
        let total = cartItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
        cartTotal.innerText = `₦${total.toFixed(2)}`;
    }

    function loadCartItems() {
        cartContainer.innerHTML = "";
        let cartItems = JSON.parse(localStorage.getItem((window.AGRI_CART_ITEMS_KEY || "cartItems"))) || [];

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

            let cartItems = JSON.parse(localStorage.getItem((window.AGRI_CART_ITEMS_KEY || "cartItems"))) || [];
            cartItems.push({ name, description, price, image, quantity: 1 });
            localStorage.setItem((window.AGRI_CART_ITEMS_KEY || "cartItems"), JSON.stringify(cartItems));

            loadCartItems(); // Update cart instantly
        }
    });

    // Remove item from cart
    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("remove-item")) {
            let cartItems = JSON.parse(localStorage.getItem((window.AGRI_CART_ITEMS_KEY || "cartItems"))) || [];
            const index = event.target.getAttribute("data-index");
            cartItems.splice(index, 1);
            localStorage.setItem((window.AGRI_CART_ITEMS_KEY || "cartItems"), JSON.stringify(cartItems));

            loadCartItems();
        }
    });

    // Clear Cart
    clearCartBtn.addEventListener("click", function () {
        localStorage.removeItem((window.AGRI_CART_ITEMS_KEY || "cartItems"));
        loadCartItems();
        alert("Your cart has been cleared.");
    });

    loadCartItems(); // Load cart items on page load
});
