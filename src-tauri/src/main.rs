use tauri::command;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::fs;
use std::io;
use std::path::Path;
use chrono::{Utc, DateTime};
use thiserror::Error;
use reqwest::Error as ReqwestError;

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

#[derive(serde::Deserialize)]
struct ConversionRequest {
    from: String,
    to: String,
    amount: f64,
}

#[derive(Serialize)]
struct Currency {
    code: &'static str,
    name: &'static str,
}

#[derive(Debug, Serialize, Deserialize)]
struct ApiResponse {
    conversion_rates: HashMap<String, f64>,
}

const API_KEY: &str = "adb2a861a837b5b08ce6d0b8";
const LOCAL_DATA_FILE: &str = "exchange_rates.json";
const API_URL: &str = "https://v6.exchangerate-api.com/v6/";

#[derive(Error, Debug)]
enum AppError {
    #[error("Request error: {0}")]
    ReqwestError(#[from] ReqwestError),
    #[error("IO error: {0}")]
    IoError(#[from] io::Error),
    #[error("Serialization error: {0}")]
    SerdeError(#[from] serde_json::Error),
}

#[command]
fn get_currencies() -> Vec<Currency> {
    vec![
        Currency { name: "US Dollar", code: "USD" },
        Currency { name: "Zambian Kwacha", code: "ZMW" },
        Currency { name: "Euro", code: "EUR" },
        Currency { name: "Japanese Yen", code: "JPY" },
        Currency { name: "British Pound", code: "GBP" },
        Currency { name: "Australian Dollar", code: "AUD" },
        Currency { name: "Canadian Dollar", code: "CAD" },
        Currency { name: "Swiss Franc", code: "CHF" },
        Currency { name: "Chinese Yuan", code: "CNY" },
        Currency { name: "Hong Kong Dollar", code: "HKD" },
        Currency { name: "New Zealand Dollar", code: "NZD" },
        Currency { name: "South African Rand", code: "ZAR" },
        Currency { name: "Nigerian Naira", code: "NGN" },
        Currency { name: "Egyptian Pound", code: "EGP" },
        Currency { name: "Kenyan Shilling", code: "KES" },
        Currency { name: "Ghanaian Cedi", code: "GHS" },
        Currency { name: "Moroccan Dirham", code: "MAD" },
        Currency { name: "Tunisian Dinar", code: "TND" },
        Currency { name: "Ugandan Shilling", code: "UGX" },
        Currency { name: "Ethiopian Birr", code: "ETB" },
        Currency { name: "Central African CFA Franc", code: "XAF" },
    ]
}

// Fetch exchange rates from API or load from local file if available
async fn fetch_exchange_rates() -> Result<ApiResponse, AppError> {
    let url = format!("{}{}/latest/USD", API_URL, API_KEY);
    let response = reqwest::get(&url).await?;
    let api_response: ApiResponse = response.json().await?;
    Ok(api_response)
}

fn save_exchange_rates(data: &ApiResponse) -> Result<(), AppError> {
    let serialized_data = serde_json::to_string(data)?;
    fs::write(LOCAL_DATA_FILE, serialized_data)?;
    Ok(())
}

fn load_exchange_rates() -> Result<ApiResponse, AppError> {
    let data = fs::read_to_string(LOCAL_DATA_FILE)?;
    let exchange_rates: ApiResponse = serde_json::from_str(&data)?;
    Ok(exchange_rates)
}

fn is_data_stale() -> bool {
    if let Ok(metadata) = fs::metadata(LOCAL_DATA_FILE) {
        if let Ok(modified) = metadata.modified() {
            let modified: DateTime<Utc> = modified.into();
            let now = Utc::now();
            return (now - modified).num_days() > 1;
        }
    }
    true
}

// Get conversion rate using the fetched or cached exchange rates
async fn get_conversion_rate(from: &str, to: &str) -> Result<f64, String> {
    let exchange_rates = if is_data_stale() {
        match fetch_exchange_rates().await {
            Ok(data) => {
                save_exchange_rates(&data).unwrap_or_else(|e| {
                    eprintln!("Failed to save exchange rates: {}", e);
                });
                data
            }
            Err(e) => {
                eprintln!("Failed to fetch exchange rates: {}", e);
                load_exchange_rates().map_err(|_| "Failed to load local exchange rates".to_string())?
            }
        }
    } else {
        load_exchange_rates().map_err(|_| "Failed to load local exchange rates".to_string())?
    };

    let from_rate = exchange_rates.conversion_rates.get(from).ok_or_else(|| format!("Unsupported currency: {}", from))?;
    let to_rate = exchange_rates.conversion_rates.get(to).ok_or_else(|| format!("Unsupported currency: {}", to))?;

    Ok(to_rate / from_rate)
}

fn get_historical_data(from: &str, to: &str) -> Result<Vec<HistoricalRate>, String> {
    let historical_rates: HashMap<&str, Vec<f64>> = [
        ("USD", vec![1.0, 1.01, 1.02, 1.03, 1.04, 1.05, 1.06]),
        ("ZMW", vec![25.84, 27.85, 27.86, 29.87, 27.88, 28.89, 30.90]),
        ("EUR", vec![0.84, 0.85, 0.86, 0.87, 0.88, 0.89, 0.90]),
        ("JPY", vec![109.0, 110.0, 111.0, 112.0, 113.0, 114.0, 115.0]),
        ("GBP", vec![0.74, 0.75, 0.76, 0.77, 0.78, 0.79, 0.80]),
        ("AUD", vec![1.34, 1.35, 1.36, 1.37, 1.38, 1.39, 1.40]),
        ("CAD", vec![1.24, 1.25, 1.26, 1.27, 1.28, 1.29, 1.30]),
        ("CHF", vec![0.91, 0.92, 0.93, 0.94, 0.95, 0.96, 0.97]),
        ("CNY", vec![6.44, 6.45, 6.46, 6.47, 6.48, 6.49, 6.50]),
        ("HKD", vec![7.74, 7.75, 7.76, 7.77, 7.78, 7.79, 7.80]),
        ("NZD", vec![1.39, 1.40, 1.41, 1.42, 1.43, 1.44, 1.45]),
        ("ZAR", vec![14.4, 14.5, 14.6, 14.7, 14.8, 14.9, 15.0]),
        ("NGN", vec![409.0, 410.0, 411.0, 412.0, 413.0, 414.0, 415.0]),
        ("EGP", vec![15.6, 15.7, 15.8, 15.9, 16.0, 16.1, 16.2]),
        ("KES", vec![109.4, 109.5, 109.6, 109.7, 109.8, 109.9, 110.0]),
        ("GHS", vec![5.9, 6.0, 6.1, 6.2, 6.3, 6.4, 6.5]),
        ("MAD", vec![8.8, 8.9, 9.0, 9.1, 9.2, 9.3, 9.4]),
        ("TND", vec![2.8, 2.9, 3.0, 3.1, 3.2, 3.3, 3.4]),
        ("UGX", vec![3550.0, 3560.0, 3570.0, 3580.0, 3590.0, 3600.0, 3610.0]),
        ("ETB", vec![43.0, 44.0, 45.0, 46.0, 47.0, 48.0, 49.0]),
        ("XAF", vec![544.0, 545.0, 546.0, 547.0, 548.0, 549.0, 550.0]),
    ].iter().cloned().collect();

    let from_data = historical_rates.get(from).ok_or("Unsupported currency")?;
    let to_data = historical_rates.get(to).ok_or("Unsupported currency")?;

    let historical_data: Vec<HistoricalRate> = from_data.iter().zip(to_data.iter()).enumerate().map(|(i, (from_rate, to_rate))| {
        HistoricalRate {
            date: format!("2023-05-0{}", i + 1),
            rate: to_rate / from_rate,
        }
    }).collect();

    Ok(historical_data)
}

#[command]
async fn convert_currency(from: String, to: String, amount: f64) -> Result<ConversionResult, String> {
    let conversion_rate = get_conversion_rate(&from, &to).await?;
    let converted_amount = amount * conversion_rate;
    let historical_data = get_historical_data(&from, &to)?;

    Ok(ConversionResult {
        amount,
        from,
        to,
        result: converted_amount,
        historical_data,
    })
}


#[command]
fn evaluate_expression(expression: &str) -> Result<f64, String> {
    let result = meval::eval_str(expression).map_err(|e| e.to_string())?;
    Ok(result)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![convert_currency, get_currencies, evaluate_expression])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
