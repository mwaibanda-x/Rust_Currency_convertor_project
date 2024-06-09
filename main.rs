#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

#[derive(Serialize, Deserialize)]
struct ConvertCurrency {
    from: String,
    to: String,
    amount: f64,
}

#[derive(Serialize, Deserialize)]
struct CurrencyData {
    date: String,
    value: f64,
}

struct AppState {
    client: Client,
}

#[tauri::command]
async fn convert_currency(state: State<'_, AppState>, from: String, to: String, amount: f64) -> Result<f64, String> {
    let url = format!("https://api.exchangeratesapi.io/latest?base={}&symbols={}&access_key=af2ff359166a7e8f19e03f79", from, to);
    let response = state.client.get(&url).send().await.map_err(|e| e.to_string())?;
    let data = response.json::<serde_json::Value>().await.map_err(|e| e.to_string())?;

    let rate = data["rates"][&to].as_f64().ok_or("Rate not found")?;
    Ok(rate * amount)
}

#[tauri::command]
async fn fetch_currency_data(state: State<'_, AppState>, currency: String, timeframe: String) -> Result<Vec<CurrencyData>, String> {
    let url = format!("https://api.exchangeratesapi.io/history?start_at={}&end_at={}&base={}&access_key=af2ff359166a7e8f19e03f79", timeframe, timeframe, currency);
    let response = state.client.get(&url).send().await.map_err(|e| e.to_string())?;
    let data = response.json::<serde_json::Value>().await.map_err(|e| e.to_string())?;
    
    let mut currency_data = Vec::new();
    if let Some(history) = data["rates"].as_object() {
        for (date, rate) in history {
            if let Some(value) = rate.as_object().and_then(|r| r.values().next().and_then(|v| v.as_f64())) {
                currency_data.push(CurrencyData {
                    date: date.to_string(),
                    value,
                });
            }
        }
    } else {
        return Err("No historical data found".to_string());
    }

    Ok(currency_data)
}

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            client: Client::new(),
        })
        .invoke_handler(tauri::generate_handler![convert_currency, fetch_currency_data])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
