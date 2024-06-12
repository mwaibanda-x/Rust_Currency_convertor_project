// script.js
document.addEventListener('DOMContentLoaded', () => {
  const { invoke } = window.__TAURI__.tauri;
  const amountInput = document.getElementById('amount');
  const fromCurrency = document.getElementById('from-currency');
  const toCurrency = document.getElementById('to-currency');
  const resultDiv = document.getElementById('result');
  const rateChartCtx = document.getElementById('rate-chart').getContext('2d');
  const calculator = document.getElementById('calculator');
  const toggleCalculatorBtn = document.getElementById('toggle-calculator-btn');
  const calcOutput = document.getElementById('calc-output');
  const calcButtons = document.querySelectorAll('.calc-btn');

  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

  // Populate the currency select elements
  currencies.forEach(currency => {
    const optionFrom = document.createElement('option');
    const optionTo = document.createElement('option');
    optionFrom.value = currency;
    optionTo.value = currency;
    optionFrom.textContent = currency;
    optionTo.textContent = currency;
    fromCurrency.appendChild(optionFrom);
    toCurrency.appendChild(optionTo);
  });

  let rateChart;

  const updateConversion = async () => {
    const amount = parseFloat(amountInput.value);
    const from = fromCurrency.value;
    const to = toCurrency.value;

    if (isNaN(amount) || amount <= 0) {
      resultDiv.textContent = 'Please enter a valid amount.';
      return;
    }

    try {
      const conversionResult = await invoke('convert_currency', { amount, from, to });

      resultDiv.textContent = `${amount} ${from} = ${conversionResult.result.toFixed(2)} ${to}`;

      const historicalData = conversionResult.historical_data;

      if (rateChart) {
        rateChart.destroy();
      }
      console.log("chart drawn but no points");
      rateChart = new Chart(rateChartCtx, {
        type: 'line',
        data: {
          labels: historicalData.map(point => point.date),
          datasets: [{
            label: 'Exchange Rate',
            data: historicalData.map(point => point.rate),
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            fill: false,
          }],
        },
        options: {
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Date',
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
        },
      });
    } catch (error) {
      resultDiv.textContent = 'Error fetching conversion data: ' + error;
    }
  };

  amountInput.addEventListener('input', updateConversion);
  fromCurrency.addEventListener('change', updateConversion);
  toCurrency.addEventListener('change', updateConversion);

  toggleCalculatorBtn.addEventListener('click', () => {
    if (calculator.style.display === 'none' || calculator.style.display === '') {
      calculator.style.display = 'block';
      document.querySelector('.converter').style.flex = '1';
    } else {
      calculator.style.display = 'none';
      document.querySelector('.converter').style.flex = '1 1 100%';
    }
  });

  // Calculator logic
  let calcExpression = '';

  calcButtons.forEach(button => {
    button.addEventListener('click', () => {
      const value = button.getAttribute('data-value');

      if (value === 'C') {
        calcExpression = '';
        calcOutput.textContent = '0';
      } else if (value === '=') {
        try {
          calcExpression = eval(calcExpression).toString();
          calcOutput.textContent = calcExpression;
        } catch (e) {
          calcOutput.textContent = 'Error';
          calcExpression = '';
        }
      } else {
        calcExpression += value;
        calcOutput.textContent = calcExpression;
      }
    });
  });
});

