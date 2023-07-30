// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use uuid::Uuid;
use libhamlog::qso::{Callsign, Frequency, NewQSO, QSO};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
// #[tauri::command]
// fn greet(name: &str) -> String {
//     format!("Hello, {}! You've been greeted from Rust!", name)
// }

#[tauri::command]
fn create_qso(qso: NewQSO) -> QSO {
    // todo
    println!("new qso! {}", serde_json::to_string(&qso).unwrap());
    QSO {
        id: Uuid::new_v4(),
        source: Callsign("W1AW".to_string()),
        destination: Callsign("AAAA".to_string()),
        freq: Frequency("14.070".to_string()),
        time_on: chrono::Utc::now() - chrono::Duration::hours(1),
        time_off: chrono::Utc::now(),
        mode: "FT8".to_string(),
        their_name: Some("Test name".to_string()),
        their_qth: Some("Test QTH".to_string()),
        our_square: Some("FN42".to_string()),
        notes: Some("Test notes".repeat(100))
    }
}

#[tauri::command]
fn get_qsos() -> Vec<QSO> {
    // todo: get QSOs
    // for now, return sample data
    vec![
        QSO {
            id: Uuid::new_v4(),
            source: Callsign("W1AW".to_string()),
            destination: Callsign("AAAA".to_string()),
            freq: Frequency("14.070".to_string()),
            time_on: chrono::Utc::now() - chrono::Duration::hours(1),
            time_off: chrono::Utc::now(),
            mode: "FT8".to_string(),
            their_name: Some("Test name".to_string()),
            their_qth: Some("Test QTH".to_string()),
            our_square: Some("FN42".to_string()),
            notes: Some("Test notes".repeat(100))
        }
    ]
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_qsos, create_qso])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
