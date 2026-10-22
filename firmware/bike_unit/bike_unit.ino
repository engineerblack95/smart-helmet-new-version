// ==================================================
// SMART HELMET — BIKE UNIT FIRMWARE (WITH SETUP PORTAL)
// Board: ESP32 Dev Module
// ==================================================
// 1. On first boot, creates "SmartHelmet-Setup" WiFi portal.
// 2. Connect via phone, enter WiFi + API Key (from dashboard).
// 3. Saves settings to flash memory permanently.
// 4. Receives HC-05 Bluetooth, POSTs to cloud, drives relay.
// ==================================================

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <WebServer.h>
#include <Preferences.h>

// ==================================================
// PIN CONFIGURATION
// ==================================================
#define RELAY_PIN       4
#define LED_GREEN       25
#define LED_YELLOW      26
#define LED_BLUE        27
#define BT_RX           16
#define BT_TX           17

// ==================================================
// CONFIGURATION
// ==================================================
const char* API_URL = "https://smart-helmet-new-version.onrender.com/api/sensor/data";
const char* BIKE_CODE = "B001"; // The bike code this unit represents

// ==================================================
// STATE
// ==================================================
String wifiSSID = "";
String wifiPass = "";
String apiKey = "";
bool isConfigured = false;
bool relayOn = false;
String btBuffer = "";

WebServer server(80);
Preferences preferences;
unsigned long lastWifiCheck = 0;

// ==================================================
// SETUP
// ==================================================
void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, BT_RX, BT_TX);

  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);

  // FAIL-SAFE: relay OFF at boot
  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, HIGH);
  digitalWrite(LED_BLUE, LOW);

  Serial.println(F("\n=================================================="));
  Serial.println(F("  Smart Helmet — Bike Unit Booting"));
  Serial.println(F("=================================================="));

  // Load saved settings from flash
  preferences.begin("smarthelmet", false);
  wifiSSID = preferences.getString("ssid", "");
  wifiPass = preferences.getString("pass", "");
  apiKey = preferences.getString("api_key", "");
  preferences.end();

  if (wifiSSID.length() > 0 && apiKey.length() > 0) {
    isConfigured = true;
    connectWiFi();
  } else {
    startSetupPortal();
  }
}

// ==================================================
// MAIN LOOP
// ==================================================
void loop() {
  if (!isConfigured) {
    server.handleClient(); // Handle setup web page
    return;
  }

  // Read Bluetooth
  while (Serial2.available()) {
    char c = Serial2.read();
    if (c == '\n') {
      if (btBuffer.length() > 0) {
        handlePacket(btBuffer);
        btBuffer = "";
      }
    } else if (c != '\r') {
      btBuffer += c;
    }
  }

  // WiFi heartbeat
  if (millis() - lastWifiCheck > 30000) {
    lastWifiCheck = millis();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println(F("[WiFi] Lost connection, reconnecting..."));
      connectWiFi();
    }
  }
}

// ==================================================
// SETUP PORTAL
// ==================================================
void startSetupPortal() {
  WiFi.mode(WIFI_AP);
  WiFi.softAP("SmartHelmet-Setup");
  Serial.println(F("[SETUP] Portal started. Connect to WiFi: SmartHelmet-Setup"));
  Serial.println(F("[SETUP] Open browser and go to: http://192.168.4.1"));

  // Serve HTML form
  server.on("/", HTTP_GET, []() {
    String html = R"rawliteral(
      <!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial; background: #F9FAFB; padding: 20px; }
        .card { background: white; max-width: 400px; margin: 0 auto; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h2 { color: #16A34A; text-align: center; }
        input { width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box; }
        button { width: 100%; padding: 12px; background: #16A34A; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; margin-top: 15px; }
      </style></head><body>
      <div class="card">
        <h2>Smart Helmet Setup</h2>
        <form action="/save" method="POST">
          <label>WiFi Name (SSID)</label>
          <input type="text" name="ssid" required>
          <label>WiFi Password</label>
          <input type="password" name="pass" required>
          <label>API Key (from dashboard)</label>
          <input type="text" name="key" required placeholder="Paste 64-char key here">
          <button type="submit">Save & Reboot</button>
        </form>
      </div></body></html>
    )rawliteral";
    server.send(200, "text/html", html);
  });

  // Handle form submit
  server.on("/save", HTTP_POST, []() {
    String s = server.arg("ssid");
    String p = server.arg("pass");
    String k = server.arg("key");

    preferences.begin("smarthelmet", false);
    preferences.putString("ssid", s);
    preferences.putString("pass", p);
    preferences.putString("api_key", k);
    preferences.end();

    String successPage = "<html><body style='text-align:center; padding:50px; font-family:Arial;'><h1 style='color:#16A34A;'>Saved!</h1><p>Rebooting...</p></body></html>";
    server.send(200, "text/html", successPage);
    delay(2000);
    ESP.restart();
  });

  server.begin();
}

// ==================================================
// WIFI CONNECTION
// ==================================================
void connectWiFi() {
  Serial.print(F("[WiFi] Connecting to "));
  Serial.println(wifiSSID);

  digitalWrite(LED_BLUE, LOW);
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiSSID.c_str(), wifiPass.c_str());

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(LED_BLUE, HIGH);
    Serial.println(F(""));
    Serial.print(F("[WiFi] Connected. IP: "));
    Serial.println(WiFi.localIP());
    Serial.println(F("  Waiting for helmet data via Bluetooth..."));
    Serial.println(F("==================================================\n"));
  } else {
    digitalWrite(LED_BLUE, LOW);
    Serial.println(F("\n[WiFi] Failed to connect — will retry"));
  }
}

// ==================================================
// PACKET HANDLER
// ==================================================
void handlePacket(String packet) {
  packet.trim();
  Serial.print(F("[BT] Received: "));
  Serial.println(packet);

  int comma1 = packet.indexOf(',');
  int comma2 = packet.indexOf(',', comma1 + 1);
  int comma3 = packet.indexOf(',', comma2 + 1);

  if (comma1 < 0 || comma2 < 0 || comma3 < 0) {
    Serial.println(F("[BT] Invalid packet format"));
    return;
  }

  String helmetCode = packet.substring(0, comma1);
  bool   worn       = packet.substring(comma1 + 1, comma2).toInt() == 1;
  int    alcohol    = packet.substring(comma2 + 1, comma3).toInt();
  int    battery    = packet.substring(comma3 + 1).toInt();

  sendToBackend(helmetCode, worn, alcohol, battery);
}

// ==================================================
// HTTP POST TO BACKEND
// ==================================================
void sendToBackend(String helmetCode, bool worn, int alcohol, int battery) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[HTTP] No WiFi — skipping send"));
    setRelay(false);
    return;
  }

  String json = "{";
  json += "\"helmetCode\":\"" + helmetCode + "\",";
  json += "\"bikeCode\":\"" + String(BIKE_CODE) + "\",";
  json += "\"worn\":" + String(worn ? "true" : "false") + ",";
  json += "\"alcoholLevel\":" + String(alcohol) + ",";
  json += "\"batteryLevel\":" + String(battery);
  json += "}";

  Serial.print(F("[HTTP] POST "));
  Serial.println(API_URL);
  Serial.print(F("[HTTP] Body: "));
  Serial.println(json);

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  https.setTimeout(10000);

  if (!https.begin(client, API_URL)) {
    Serial.println(F("[HTTP] begin() failed"));
    setRelay(false);
    return;
  }

  https.addHeader("Content-Type", "application/json");
  https.addHeader("x-api-key", apiKey.c_str()); // Uses saved key

  int httpCode = https.POST(json);
  Serial.printf("[HTTP] Response code: %d\n", httpCode);

  if (httpCode == 200) {
    String response = https.getString();
    bool allowed = parseEngineAllowed(response);
    setRelay(allowed);
    Serial.print(F("[HTTP] engineAllowed = "));
    Serial.println(allowed ? "TRUE" : "FALSE");
  } else {
    Serial.print(F("[HTTP] Error: "));
    Serial.println(https.getString());
    setRelay(false);
  }

  https.end();
}

// ==================================================
// PARSE RESPONSE
// ==================================================
bool parseEngineAllowed(String response) {
  int idx = response.indexOf("\"engineAllowed\":");
  if (idx < 0) return false;

  int start = idx + 16;
  while (start < response.length() && response[start] == ' ') start++;

  if (response.startsWith("true", start)) return true;
  return false;
}

// ==================================================
// RELAY CONTROL
// ==================================================
void setRelay(bool on) {
  if (on == relayOn) return;
  relayOn = on;

  if (on) {
    digitalWrite(RELAY_PIN, HIGH);
    digitalWrite(LED_GREEN, HIGH);
    digitalWrite(LED_YELLOW, LOW);
    Serial.println(F("[RELAY] ON — engine START allowed"));
  } else {
    digitalWrite(RELAY_PIN, LOW);
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_YELLOW, HIGH);
    Serial.println(F("[RELAY] OFF — engine START blocked"));
  }
}