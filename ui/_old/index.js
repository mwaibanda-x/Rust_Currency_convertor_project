const { invoke } = window.__TAURI__.tauri;




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

        // Set default currencies and amount
        fromSelect.value = 'USD';
        toSelect.value = 'EUR';
        document.getElementById('amount').value = 1;

        // Add event listeners for currency and amount changes
        fromSelect.addEventListener('change', convertCurrency);
        toSelect.addEventListener('change', convertCurrency);
        document.getElementById('amount').addEventListener('input', convertCurrency);

        // Perform initial conversion
        convertCurrency();
    } catch (error) {
        console.error('Failed to load currencies:', error);
    }
}

async function convertCurrency() {
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;
    const amount = parseFloat(document.getElementById('amount').value);

    if (!from || !to || isNaN(amount)) {
        document.getElementById('result').innerText = 'Please fill in all fields correctly.';
        return;
    }

    try {
        const result = await invoke('convert_currency', { from, to, amount });
        document.getElementById('result').innerText = `Result: ${result.toFixed(2)} ${to}`;
        loadGraphData();
    } catch (error) {
        document.getElementById('result').innerText = `Error: ${error}`;
    }
}

async function loadGraphData() {
    try {
        const graphData = await invoke('get_graph_data');
        const ctx = document.getElementById('graph').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Conversion Rates Over Time',
                    data: graphData.map(point => ({ x: point.x, y: point.y })),
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom'
                    }
                }
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

    // Perform conversion after swap
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

document.getElementById('calculator-button').addEventListener('click', showCalculator);
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
    } else if (value === 'C') {
        display.value = '';
    } else {
        display.value += value;
    }
}

async function evaluateExpression() {
    const expression = document.getElementById('calculator-display').value;

    try {
        const result = await invoke('evaluate_expression', { expression });
        document.getElementById('amount').value = result;
        closeCalculator();
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

