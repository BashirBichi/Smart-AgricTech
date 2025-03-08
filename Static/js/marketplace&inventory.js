document.addEventListener("DOMContentLoaded", function () {
    const inventoryTable = document.getElementById("inventoryTable").querySelector("tbody");
    const marketAccessTable = document.getElementById("marketAccessTable");
    const addProductBtn = document.getElementById("addProductBtn");
    const postToMarketplaceBtn = document.getElementById("postToMarketplace");
    const clearInventoryBtn = document.getElementById("clearInventory");

    // Function to add product to inventory
    addProductBtn.addEventListener("click", function () {
        const productName = document.getElementById("productName").value.trim();
        const productQuantity = document.getElementById("productQuantity").value.trim();
        const productPrice = document.getElementById("productPrice").value.trim();

        if (!productName || !productQuantity || !productPrice) {
            alert("Please fill in all fields.");
            return;
        }

        const productId = Date.now().toString();

        const inventoryRow = `
            <tr id="inventory-${productId}">
                <td>${productName}</td>
                <td>${productQuantity}</td>
                <td>${productPrice}</td>
                <td>In Stock</td>
                <td><button class="btn btn-danger remove-product" data-id="${productId}">Remove</button></td>
            </tr>
        `;
        inventoryTable.insertAdjacentHTML("beforeend", inventoryRow);

        document.getElementById("productName").value = "";
        document.getElementById("productQuantity").value = "";
        document.getElementById("productPrice").value = "";
    });

    // Function to remove product from inventory
    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("remove-product")) {
            const productId = event.target.getAttribute("data-id");
            document.getElementById(`inventory-${productId}`).remove();
        }
    });

    // Function to post product to Market Access
    postToMarketplaceBtn.addEventListener("click", function () {
        const rows = inventoryTable.querySelectorAll("tr");
        marketAccessTable.innerHTML = ""; // Clear previous entries

        rows.forEach(row => {
            const productName = row.cells[0].textContent;
            const productQuantity = row.cells[1].textContent;
            const productPrice = row.cells[2].textContent;

            const marketRow = `
                <tr>
                    <td>${productName}</td>
                    <td>${productQuantity}</td>
                    <td>${productPrice}</td>
                    <td><button class="btn btn-success post-to-marketplace">Post</button></td>
                </tr>
            `;
            marketAccessTable.insertAdjacentHTML("beforeend", marketRow);
        });

        alert("Products have been added to Market Access.");
    });

    // Function to post product to Marketplace
    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("post-to-marketplace")) {
            alert("Product successfully posted to Marketplace!");
            event.target.closest("tr").remove();
        }
    });

    // Clear Inventory
    clearInventoryBtn.addEventListener("click", function () {
        inventoryTable.innerHTML = "";
        alert("All inventory items cleared.");
    });
});
