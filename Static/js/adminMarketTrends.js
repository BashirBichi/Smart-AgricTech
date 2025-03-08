document.addEventListener("DOMContentLoaded", function () {
    const addProductBtn = document.getElementById("addProductName");
    const productNameInput = document.getElementById("adminProductName");
    const productCategorySelect = document.getElementById("adminProductCategory");
    const productTableBody = document.querySelector("#productNamesTable tbody");
    const chartCanvas = document.getElementById("adminMarketTrendsChart").getContext("2d");

    let marketTrendsChart;

    // Fetch & Display Existing Product Names
    function fetchProductNames() {
        fetch("/get-product-names")
            .then(response => response.json())
            .then(data => {
                productTableBody.innerHTML = "";
                data.forEach((product, index) => {
                    productTableBody.innerHTML += `
                        <tr>
                            <td>${product.name}</td>
                            <td>${product.category}</td>
                            <td>
                                <button class="btn btn-danger btn-sm delete-product" data-id="${product.id}">Remove</button>
                            </td>
                        </tr>
                    `;
                });
            })
            .catch(error => console.error("Error fetching product names:", error));
    }

    // Add New Product Name & Category
    addProductBtn.addEventListener("click", function () {
        const productName = productNameInput.value.trim();
        const productCategory = productCategorySelect.value;

        if (!productName || !productCategory) {
            alert("Please enter a product name and select a category.");
            return;
        }

        fetch("/add-product-name", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: productName, category: productCategory })
        })
        .then(response => response.json())
        .then(data => {
            alert("Product name added successfully!");
            fetchProductNames(); // Refresh product list
            productNameInput.value = "";
            productCategorySelect.value = "";
        })
        .catch(error => console.error("Error adding product name:", error));
    });

    // Remove Product Name
    productTableBody.addEventListener("click", function (event) {
        if (event.target.classList.contains("delete-product")) {
            const productId = event.target.getAttribute("data-id");

            fetch(`/delete-product-name/${productId}`, { method: "DELETE" })
                .then(response => response.json())
                .then(data => {
                    alert("Product name removed successfully!");
                    fetchProductNames(); // Refresh product list
                })
                .catch(error => console.error("Error deleting product name:", error));
        }
    });

    // Fetch Market Trends
    function fetchMarketTrends() {
        fetch("/market-trends-data")
            .then(response => response.json())
            .then(data => updateChart(data))
            .catch(error => console.error("Error fetching market trends:", error));
    }

    // Update Market Trends Chart
    function updateChart(data) {
        if (marketTrendsChart) {
            marketTrendsChart.destroy(); // Clear previous chart
        }

        marketTrendsChart = new Chart(chartCanvas, {
            type: "line",
            data: {
                labels: data.map(d => d.t), // Time labels
                datasets: [{
                    label: "Price Trend",
                    data: data.map(d => d.c), // Closing price
                    borderColor: d => d.c >= d.o ? "green" : "red",
                    borderWidth: 2,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { title: { display: true, text: "Date" } },
                    y: { title: { display: true, text: "Price (₦)" } }
                }
            }
        });
    }

    // Initial Data Fetch
    fetchProductNames();
    fetchMarketTrends();
});
