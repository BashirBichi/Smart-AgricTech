
document.addEventListener("DOMContentLoaded", function () {
    const ctx = document.getElementById("marketTrendsChart").getContext("2d");
    const grainSelect = document.getElementById("grainSelect");
    const viewMoreTrends = document.getElementById("viewMoreTrends");

    // Grain Price Data (Randomly Generated for Simulation)
    const grainData = {
        rice: [15000, 16000, 15500, 17000, 18000, 17500, 19000, 20000, 21000, 22000],
        maize: [10000, 10500, 11000, 12000, 13000, 12500, 14000, 14500, 15000, 15500],
        wheat: [12000, 13000, 13500, 14000, 14500, 15000, 15500, 16000, 16500, 17000],
        millet: [8000, 8500, 9000, 9500, 10000, 10500, 11000, 11500, 12000, 12500],
        sorghum: [9000, 9500, 10000, 11000, 12000, 11500, 13000, 13500, 14000, 14500],
        barley: [9500, 10000, 10500, 11000, 11500, 12000, 12500, 13000, 13500, 14000],
        oats: [7000, 7500, 8000, 8500, 9000, 9500, 10000, 10500, 11000, 11500],
        soybeans: [13000, 14000, 14500, 15000, 16000, 15500, 17000, 17500, 18000, 18500],
        groundnuts: [11000, 11500, 12000, 12500, 13000, 13500, 14000, 14500, 15000, 15500],
        sesame: [14000, 14500, 15000, 15500, 16000, 16500, 17000, 17500, 18000, 18500]
    };

    // Generate Labels for Months
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];

    // Function to Update Chart
    function updateChart(grain) {
        marketTrendsChart.data.datasets[0].data = grainData[grain];
        marketTrendsChart.data.datasets[0].label = grain.charAt(0).toUpperCase() + grain.slice(1) + " Price (₦)";
        marketTrendsChart.update();
    }

    // Initialize Chart.js
    const marketTrendsChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: months,
            datasets: [
                {
                    label: "Rice Price (₦)",
                    data: grainData["rice"],
                    borderColor: "rgba(75, 192, 192, 1)",
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    borderWidth: 2,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: "top"
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Months"
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: "Price (₦)"
                    },
                    beginAtZero: false
                }
            }
        }
    });

    // Change Chart Data when Different Grain is Selected
    grainSelect.addEventListener("change", function () {
        updateChart(grainSelect.value);
    });

    // View More Trends Button (Can Load Additional Data)
    viewMoreTrends.addEventListener("click", function () {
        alert("More product trends will be available soon!");
    });

    // Ensure Chart is Updated When the Section is Activated
    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            const sectionId = link.getAttribute("data-section");

            if (sectionId === "market-trends") {
                setTimeout(() => {
                    marketTrendsChart.update();
                }, 300);
            }
        });
    });
});


