
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

    // Draw simulated OHLC candles from the existing illustrative monthly close series.
    const candles = {values: []};
    const candlePlugin = {
      id:"agriCandlesticks",
      afterDatasetsDraw(chart){
        const {ctx,scales:{x,y}}=chart;
        ctx.save();
        candles.values.forEach((v,i)=>{
          const cx=x.getPixelForValue(i),w=Math.min(22,Math.max(7,x.width/25));
          const up=v.c>=v.o,color=up?"#19bd89":"#f36b77";
          ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2;
          ctx.beginPath();ctx.moveTo(cx,y.getPixelForValue(v.h));ctx.lineTo(cx,y.getPixelForValue(v.l));ctx.stroke();
          const top=y.getPixelForValue(Math.max(v.o,v.c)),bottom=y.getPixelForValue(Math.min(v.o,v.c));
          ctx.fillRect(cx-w/2,top,w,Math.max(3,bottom-top));
        });
        ctx.restore();
      }
    };
    function ohlc(key){
      const arr=grainData[key];
      candles.values=arr.map((c,i)=>{const o=i?arr[i-1]:Math.round(c*.985);return {o,c,h:Math.round(Math.max(o,c)*1.018),l:Math.round(Math.min(o,c)*.982)};});
      const last=candles.values.at(-1),first=candles.values[0],pct=(last.c-first.o)/first.o*100;
      const price=document.getElementById("agri-trend-price"),change=document.getElementById("agri-trend-change"),name=document.getElementById("agri-trend-commodity");
      if(price)price.textContent="₦"+last.c.toLocaleString("en-NG");
      if(change)change.textContent=(pct>=0?"+":"")+pct.toFixed(1)+"% period change";
      if(name)name.textContent=key[0].toUpperCase()+key.slice(1)+" / NGN";
    }
    ohlc(grainSelect.value in grainData?grainSelect.value:"rice");
    // Function to Update Chart
    function updateChart(grain) {
        ohlc(grain);\n        marketTrendsChart.data.datasets[0].data = grainData[grain];
        marketTrendsChart.data.datasets[0].label = grain.charAt(0).toUpperCase() + grain.slice(1) + " Price (₦)";
        marketTrendsChart.update();
    }

    // Initialize Chart.js
    const marketTrendsChart = new Chart(ctx, {\n        plugins:[candlePlugin],
        type: "line",
        data: {
            labels: months,
            datasets: [
                {
                    label: "Rice Price (₦)",
                    data: grainData["rice"],\n                    pointRadius: 0, pointHoverRadius: 0, showLine: false,
                    borderColor: "#10b981",
                    backgroundColor: "rgba(16,185,129,.85)",
                    borderWidth: 2,
                    borderRadius: 3, barPercentage: .45
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip:{displayColors:false,backgroundColor:"#102e25",padding:12,callbacks:{label:item=>{const v=candles.values[item.dataIndex];return ["Open: ₦"+v.o.toLocaleString(),"High: ₦"+v.h.toLocaleString(),"Low: ₦"+v.l.toLocaleString(),"Close: ₦"+v.c.toLocaleString()];}}},\n                legend: {
                    display: false,
                    position: "top"
                }
            },
            scales: {
                x: { grid:{display:false}, ticks:{color:"#9bb2a8"},
                    title: {
                        display: true,
                        text: "Months"
                    }
                },
                y: { position:"right", grid:{color:"rgba(155,178,168,.18)"}, ticks:{color:"#9bb2a8",callback:v=>"₦"+Number(v).toLocaleString("en-NG")},
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
        grainSelect.focus(); grainSelect.scrollIntoView({behavior:"smooth",block:"nearest"});
    });

    const initial=document.getElementById("agri-trend-price"); if(initial)initial.textContent="₦"+candles.values.at(-1).c.toLocaleString("en-NG");\n    // Ensure Chart is Updated When the Section is Activated
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


