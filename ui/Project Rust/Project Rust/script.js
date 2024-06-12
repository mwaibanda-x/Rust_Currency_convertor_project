// Modal functionality
const modal = document.getElementById("calculator-modal");
const btn = document.querySelector(".calculator-btn");
const span = document.getElementsByClassName("close")[0];

btn.onclick = function() {
    modal.style.display = "block";
}

span.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Calculator functionality
const calcDisplay = document.getElementById("calc-display");
const calcButtons = document.querySelectorAll(".calc-btn");

calcButtons.forEach(button => {
    button.addEventListener("click", () => {
        const value = button.textContent;

        if (value === "C") {
            calcDisplay.value = "";
        } else if (value === "=") {
            try {
                calcDisplay.value = eval(calcDisplay.value);
            } catch {
                calcDisplay.value = "Error";
            }
        } else {
            calcDisplay.value += value;
        }
    });
});

// So you can the backend thingy, 
function convertCurrency() {
    const fromCurrency = document.getElementById('from').value;
    const toCurrency = document.getElementById('to').value;
    const amount = document.getElementById('amount').value;

    const convertedAmount = amount * getExchangeRate(fromCurrency, toCurrency); // Placeholder function
    document.getElementById('converted-amount-input').value = `${convertedAmount.toFixed(2)} ${toCurrency}`;
}

function getExchangeRate(from, to) {
    // Here is where you can connect the backend
    console.log(`Placeholder exchange rate for ${from} to ${to} not available.`);
    return 1; // Placeholder value
}

function reverseCurrencies() {
    const fromSelect = document.getElementById('from');
    const toSelect = document.getElementById('to');
    const amountInput = document.getElementById('amount');
    const convertedAmountInput = document.getElementById('converted-amount-input');

    // Swap the currency selections
    const tempValue = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = tempValue;

    // Swap the amounts
    const tempAmount = amountInput.value;
    amountInput.value = convertedAmountInput.value.split(' ')[0];
    convertedAmountInput.value = tempAmount ? `${tempAmount} ${fromSelect.value}` : '';
}

document.getElementById('convert').addEventListener('click', convertCurrency);
document.getElementById('reverse').addEventListener('click', reverseCurrencies);

// The graph is created here
function createExchangeRateGraph() {
    const ctx = document.getElementById('graph').getContext('2d');
    
    const sampleLabels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];
    const sampleData = [1.1, 1.15, 1.2, 1.18, 1.22, 1.25, 1.3]; // Sample data for the exchange rates

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sampleLabels,
            datasets: [{
                label: 'Exchange Rate (USD to EUR)',
                data: sampleData,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

// Call the function to create the graph
createExchangeRateGraph();
