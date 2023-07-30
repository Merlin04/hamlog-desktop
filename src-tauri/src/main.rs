// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use openssl::hash::MessageDigest;
use openssl::pkey::PKey;
use openssl::rsa::Rsa;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use libhamlog::qso::{Callsign, Frequency, NewQSO, QSO};
use openssl::x509::{X509NameBuilder, X509ReqBuilder};

const APP_NAME: &str = "hamlog-desktop";

#[derive(Serialize, Deserialize)]
struct AppConfig {
    version: u8,
    private_key_pem: Option<Vec<u8>>,
    api_endpoint: Option<String>,
    cert_pem: Option<SingleJson>
}

impl Default for AppConfig {
    fn default() -> Self {
        AppConfig {
            version: 1,
            private_key_pem: None,
            api_endpoint: None,
            cert_pem: None
        }
    }
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
// #[tauri::command]
// fn greet(name: &str) -> String {
//     format!("Hello, {}! You've been greeted from Rust!", name)
// }

#[derive(Serialize, Deserialize)]
struct TestStruct {
    number: u8
}

#[derive(Serialize, Deserialize)]
pub struct SingleJson {
    pub data: String
}

fn create_x509_req(callsign: &str) -> Vec<u8> {
    let mut req = X509ReqBuilder::new().unwrap();
    println!("test");

    let mut x509_name = X509NameBuilder::new().unwrap();
    println!("yeag");
    x509_name.append_entry_by_text("C", "US").unwrap();
    println!("a");
    x509_name.append_entry_by_text("O", "hamlogd").unwrap();
    println!("b");
    x509_name.append_entry_by_text("CN", callsign).unwrap();
    println!("c");
    let x509_name = x509_name.build();
    println!("d");
    req.set_subject_name(&x509_name).unwrap();
    println!("e");

    let keypair = Rsa::generate(2048).unwrap();
    println!("f");
    // save the keypair
    let mut app_config: AppConfig = confy::load(APP_NAME, None).unwrap_or_default();
    app_config.private_key_pem = Some(keypair.private_key_to_pem().unwrap());
    confy::store(APP_NAME, None, app_config).unwrap();

    println!("g");
    let key = &PKey::from_rsa(keypair).unwrap();
    req.set_pubkey(key).unwrap();
    req.sign(key, MessageDigest::sha256()).unwrap();
    println!("h");
    let req = req.build();
    println!("i");
    println!("h {:?}", req.to_text().unwrap());
    let req = req.to_pem();
    println!("j");
    req.unwrap()
}

#[tauri::command]
fn sign_in(callsign: String, api_endpoint: String) {
    let pem = create_x509_req(callsign.as_str());

    let client = reqwest::blocking::Client::builder().add_root_certificate(
        reqwest::Certificate::from_pem(include_bytes!("../certs/ca.pem").as_ref()).unwrap()
    ).build().unwrap();
    let res = client.post(api_endpoint.clone() + "/cert/request")
        .form(&[
            ("csr", String::from_utf8(pem).unwrap()),
            ("callsign", callsign)
        ])
        .send()
        .unwrap()
        .json::<SingleJson>()
        .unwrap();

    let mut app_config: AppConfig = confy::load(APP_NAME, None).unwrap_or_default();
    app_config.cert_pem = Some(res);
    app_config.api_endpoint = Some(api_endpoint);
    confy::store(APP_NAME, None, app_config).unwrap();
}

#[tauri::command]
fn test(s: TestStruct) {
    println!("test: {}", s.number);
}

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

#[tauri::command]
fn get_cert() -> Option<SingleJson> {
    let app_config: AppConfig = confy::load(APP_NAME, None).unwrap_or_default();
    app_config.cert_pem
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_qsos, create_qso, sign_in, test, get_cert])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
