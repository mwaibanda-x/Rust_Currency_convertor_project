const { invoke } = window.__TAURI__.tauri;

const dateElement = document.getElementById("date");
// Display current date
const today = new Date();
dateElement.textContent = `Today ${today.getFullYear()} - ${("0" + (today.getMonth() + 1)).slice(-2)} - ${("0" + today.getDate()).slice(-2)}`;

async function loadCurrencies() {
    try {
        const currencies = await invoke('get_currencies');
        const fromSelect = document.getElementById('from');
        const toSelect = document.getElementById('to');

        currencies.forEach(currency => {
            const optionFrom = document.createElement('option');
            optionFrom.value = currency.code;
            optionFrom.textContent = `${currency.name} (${currency.code})`;
            fromSelect.appendChild(optionFrom);

            const optionTo = document.createElement('option');
            optionTo.value = currency.code;
            optionTo.textContent = `${currency.name} (${currency.code})`;
            toSelect.appendChild(optionTo);
        });

        fromSelect.value = 'USD';
        toSelect.value = 'ZMK';
        document.getElementById('amount').value = 1;

        fromSelect.addEventListener('change', convertCurrency);
        toSelect.addEventListener('change', convertCurrency);
        document.getElementById('amount').addEventListener('input', convertCurrency);

        convertCurrency();
    } catch (error) {
        console.error('Failed to load currencies:', error);
    }
}

function formatResult(value) {
    if (value >= 1) {
        return value.toFixed(2); // For values greater than or equal to 1, show two decimal places
    } else {
        // For values less than 1, show up to 2 non-zero digits after the decimal point
        let formatted = value.toString();
        // Match a value like 0.001234 to keep up to 2 significant figures after the decimal
        let match = formatted.match(/^0\.(0+)([1-9]\d?)/);
        if (match) {
            return `0.${match[1]}${match[2]}`;
        } else {
            return value.toFixed(2);
        }
    }
}



async function convertCurrency() {
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;
    const amount = parseFloat(document.getElementById('amount').value);

    if (!from || !to || isNaN(amount)) {
        document.getElementById('result').value = 'Please fill in all fields correctly.';
        return;
    }

    try {
        const result = await invoke('convert_currency', { amount, from, to });
        document.getElementById('result').value = `${formatResult(result.result)} ${to}`;
        loadGraphData(result.historical_data);
    } catch (error) {
        document.getElementById('result').value = `Error: ${error}`;
    }
}


let gChart;

async function loadGraphData(historical_data) {
    try {
        if (gChart) {
            gChart.destroy();
        }

        const ctx = document.getElementById('graph').getContext('2d');
        
        // Create a gradient for the background
        const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
        gradient.addColorStop(0, 'rgba(0, 0, 255, 0.8)'); // Blue at the top
        gradient.addColorStop(1, 'rgba(0, 0, 255, 0)');   // Transparent at the bottom
        
        gChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: historical_data.map(point => point.date),
                datasets: [{
                    label: '7 Days History',
                    data: historical_data.map(point => point.rate),
                    fill: true, // Enable filling the area below the line
                    borderColor: '#007bff', // Line color
                    backgroundColor: gradient, // Gradient color below the line
                    borderWidth: 1, // Thinner line
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Time',
                        },
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Rate',
                        },
                    },
                },
                plugins: {
                    legend: {
                        display: true,
                    }
                },
                layout: {
                    padding: 0.5
                },
                // Remove points on the line
                elements: {
                    point: {
                        radius: 1
                    }
                },
            }
        });
    } catch (error) {
        console.error('Failed to load graph data:', error);
    }
}



function swapCurrencies() {
    const fromSelect = document.getElementById('from');
    const toSelect = document.getElementById('to');

    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;

    convertCurrency();
}

document.getElementById('swap-button').addEventListener('click', swapCurrencies);

function showCalculator() {
    const modal = document.getElementById('calculator-modal');
    modal.style.display = 'block';
}

function closeCalculator() {
    const modal = document.getElementById('calculator-modal');
    modal.style.display = 'none';
}

document.getElementById('calculator-icon').addEventListener('click', showCalculator);
document.querySelector('.close-button').addEventListener('click', closeCalculator);

window.addEventListener('DOMContentLoaded', loadCurrencies);

document.querySelectorAll('.calc-btn').forEach(button => {
    button.addEventListener('click', handleCalculatorInput);
});

function handleCalculatorInput(event) {
    const display = document.getElementById('calculator-display');
    const value = event.target.textContent;

    if (value === '=') {
        evaluateExpression();
    } else if (value === 'AC') {
        display.value = '';
    } else if (value === '⌫') {
        display.value = display.value.slice(0, -1);
    } else {
        display.value += value;
    }
}

async function evaluateExpression() {
    const display = document.getElementById('calculator-display');
    let expression = display.value;

    // Replace special characters with standard operators
    expression = expression.replace(/×/g, '*').replace(/÷/g, '/');

    try {
        const result = await invoke('evaluate_expression', { expression });
        const formattedResult = parseFloat(result.toFixed(10)).toString(); // Convert to fixed precision and trim
        document.getElementById('amount').value = formattedResult;
        display.value = formattedResult;
        convertCurrency();
    } catch (error) {
        alert('Invalid expression');
    }
}

window.onclick = function(event) {
    const modal = document.getElementById('calculator-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}