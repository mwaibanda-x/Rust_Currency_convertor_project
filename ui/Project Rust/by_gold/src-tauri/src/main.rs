use tauri::command;
use serde::Serialize;
use std::collections::HashMap;

#[derive(Serialize)]
struct ConversionResult {
  amount: f64,
  from: String,
  to: String,
  result: f64,
  historical_data: Vec<HistoricalRate>,
}

#[derive(Serialize)]
struct HistoricalRate {
  date: String,
  rate: f64,
}

// Mock conversion rates and historical data (replace with real data fetching in production)
fn get_conversion_rate(from: &str, to: &str) -> Result<f64, String> {
  let rates: HashMap<&str, f64> = [
    ("USD", 1.0), ("EUR", 0.85), ("GBP", 0.75), ("JPY", 110.0), ("CAD", 1.25), ("AUD", 1.35)
  ].iter().cloned().collect();

  let from_rate = rates.get(from).ok_or_else(|| format!("Unsupported currency: {}", from))?;
  let to_rate = rates.get(to).ok_or_else(|| format!("Unsupported currency: {}", to))?;

  Ok(to_rate / from_rate)
}

fn get_historical_data(from: &str, to: &str) -> Result<Vec<HistoricalRate>, String> {
  let historical_rates: HashMap<&str, Vec<f64>> = [
    ("USD", vec![1.0, 1.01, 1.02, 1.03, 1.04, 1.05, 1.06]),
    ("EUR", vec![0.84, 0.85, 0.86, 0.87, 0.88, 0.89, 0.90]),
    ("GBP", vec![0.74, 0.75, 0.76, 0.77, 0.78, 0.79, 0.80]),
    ("JPY", vec![109.0, 110.0, 111.0, 112.0, 113.0, 114.0, 115.0]),
    ("CAD", vec![1.24, 1.25, 1.26, 1.27, 1.28, 1.29, 1.30]),
    ("AUD", vec![1.34, 1.35, 1.36, 1.37, 1.38, 1.39, 1.40]),
  ].iter().cloned().collect();

  let from_rates = historical_rates.get(from).ok_or_else(|| format!("Unsupported currency: {}", from))?;
  let to_rates = historical_rates.get(to).ok_or_else(|| format!("Unsupported currency: {}", to))?;

  let rates = from_rates.iter().zip(to_rates.iter())
    .enumerate()
    .map(|(i, (from_rate, to_rate))| HistoricalRate {
      date: format!("Day {}", i + 1),
      rate: to_rate / from_rate,
    })
    .collect();

  Ok(rates)
}

#[command]
fn convert_currency(amount: f64, from: String, to: String) -> Result<ConversionResult, String> {
  let rate = get_conversion_rate(&from, &to)?;
  let result = amount * rate;
  let historical_data = get_historical_data(&from, &to)?;

  Ok(ConversionResult {
    amount,
    from,
    to,
    result,
    historical_data,
  })
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![convert_currency])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

