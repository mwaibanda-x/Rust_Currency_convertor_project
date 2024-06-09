document.addEventListener("DOMContentLoaded", function () {
    const dateElement = document.getElementById("date");
    const calculatorIcon = document.getElementById("calculator-icon");
    const calculatorModal = document.getElementById("calculator-modal");
    const closeModal = document.getElementById("close-modal");
    const convertButton = document.getElementById("convert-button");
    const swapButton = document.getElementById("swap-button");
    const fromCurrency = document.getElementById("from-currency");
    const toCurrency = document.getElementById("to-currency");
    const fromAmount = document.getElementById("from-amount");
    const toAmount = document.getElementById("to-amount");
    const timeframes = document.querySelectorAll(".timeframes span");

    // Display current date
    const today = new Date();
    dateElement.textContent = `Today ${today.getFullYear()} - ${("0" + (today.getMonth() + 1)).slice(-2)} - ${("0" + today.getDate()).slice(-2)}`;

    // Show calculator modal
    calculatorIcon.addEventListener("click", () => {
        calculatorModal.style.display = "block";
    });

    // Hide calculator modal
    closeModal.addEventListener("click", () => {
        calculatorModal.style.display = "none";
    });

    // Fetch currency exchange rate and perform conversion
    convertButton.addEventListener("click", async () => {
        const from = fromCurrency.value;
        const to = toCurrency.value;
        const amount = fromAmount.value;

        if (amount === "") {
            alert("Please enter an amount to convert.");
            return;
        }

        try {
            const result = await window.__TAURI__.invoke("convert_currency", { from, to, amount: parseFloat(amount) });
            toAmount.value = result.toFixed(2);
        } catch (error) {
            console.error("Error converting currency:", error);
        }
    });

    // Swap currencies
    swapButton.addEventListener("click", () => {
        const fromValue = fromCurrency.value;
        fromCurrency.value = toCurrency.value;
        toCurrency.value = fromValue;
    });

    // Fetch and display currency graph based on timeframe
    timeframes.forEach((span) => {
        span.addEventListener("click", async () => {
            timeframes.forEach((s) => s.style.fontWeight = "normal");
            span.style.fontWeight = "bold";

            const timeframe = span.getAttribute("data-timeframe");
            const currency = fromCurrency.value;

            try {
                const data = await window.__TAURI__.invoke("fetch_currency_data", { currency, timeframe });
                drawGraph(data);
            } catch (error) {
                console.error("Error fetching currency data:", error);
            }
        });
    });

    function drawGraph(data) {
        const svg = d3.select("#currency-chart");
        const width = +svg.attr("width");
        const height = +svg.attr("height");
        const margin = { top: 10, right: 30, bottom: 30, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        svg.selectAll("*").remove();

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleTime()
            .domain(d3.extent(data, d => new Date(d.date)))
            .range([0, innerWidth]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value)])
            .range([innerHeight, 0]);

        g.append("g")
            .call(d3.axisLeft(y));

        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x));

        const line = d3.line()
            .x(d => x(new Date(d.date)))
            .y(d => y(d.value));

        g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", line);

        g.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => x(new Date(d.date)))
            .attr("cy", d => y(d.value))
            .attr("r", 3)
            .attr("fill", "steelblue");
    }
});
