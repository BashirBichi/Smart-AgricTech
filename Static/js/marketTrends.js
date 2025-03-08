document.addEventListener("DOMContentLoaded", function () {
    const searchBtn = document.getElementById("searchTrends");
    const checkOtherTrends = document.getElementById("checkOtherTrends");
    const trendSearch = document.getElementById("trendSearch");
    const trendCategory = document.getElementById("trendCategory");
    const chartCanvas = document.getElementById("marketTrendsChart").getContext("2d");

    let marketTrendsChart;

    // Function to Fetch Market Trends Data
    function fetchMarketTrends(searchQuery = "", category = "") {
        fetch(`/market-trends-data?product=${searchQuery}&category=${category}`)
            .then(response => response.json())
            .then(data => updateChart(data))
            .catch(error => console.error("Error fetching market trends:", error));
    }

    // Function to Update Market Trends Chart
    function updateChart(data) {
        if (marketTrendsChart) {
            marketTrendsChart.destroy(); // Clear existing chart
        }

        marketTrendsChart = new Chart(chartCanvas, {
            type: "line",
            data: {
                labels: data.map(d => d.t), // Time labels
                datasets: [{
                    label: "Price Trend",
                    data: data.map(d => d.c), // Closing price
                    borderColor: d => d.c >= d.o ? "green" : "red", // Green for rise, Red for fall
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

    // Search Button Click
    searchBtn.addEventListener("click", function () {
        fetchMarketTrends(trendSearch.value, trendCategory.value);
    });

    // Check Other Trends Button
    checkOtherTrends.addEventListener("click", function () {
        fetchMarketTrends();
    });

    // Initial Fetch of Market Trends
    fetchMarketTrends();
});
