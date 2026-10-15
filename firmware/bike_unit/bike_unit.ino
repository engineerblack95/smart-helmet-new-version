// ==================================================
// SMART HELMET — BIKE UNIT FIRMWARE
// Board: ESP32 Dev Module
// ==================================================
// Receives sensor packet from helmet via HC-05 Bluetooth.
// Sends it to cloud backend over HTTPS with x-api-key.
// Reads `engineAllowed` from response and drives relay.
//
// Safety rule: relay defaults OFF (fail-safe).
// Never cuts engine mid-ride — only prevents unsafe STARTS.
// ==================================================

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// ==================================================
// PIN CONFIGURATION (matches your hardware)
// ==================================================
#define RELAY_PIN       4     // 5V relay IN
#define LED_GREEN       25    // Green LED — engine allowed
#define LED_YELLOW      26    // Yellow LED — engine blocked
#define LED_BLUE        27    // Blue LED — WiFi connected

#define BT_RX           16    // HC-05 TX → ESP32 GPIO 16 (RX2)
#define BT_TX           17    // HC-05 RX ← ESP32 GPIO 17 (TX2)

// ==================================================
// CONFIGURATION — EDIT THESE VALUES!
// ==================================================

// ---------- WiFi ----------
const char* WIFI_SSID     = "YOUR_HOTSPOT_NAME";       // ← EDIT
const char* WIFI_PASSWORD = "YOUR_HOTSPOT_PASSWORD";   // ← EDIT

// ---------- Cloud Backend ----------
// Option A — CLOUD (recommended for demo):
const char* API_URL = "https://smart-helmet-new-version.onrender.com/api/sensor/data";
const char* API_KEY = "94e2ade3d13706bac5c0c9254d32b7bf1f9fceb6a261267dd691916f3b11f26a";  // ← B001 CLOUD KEY

// Option B — LOCAL (uncomment to use):
// const char* API_URL = "http://192.168.1.100:5000/api/sensor/data";  // ← your PC's LAN IP
// const char* API_KEY = "37b2934061e7e7ba04d8c522f97356d791b748355f841842497bff91ba3c58f4";  // ← B001 LOCAL KEY

// ---------- Bike code ----------
const char* BIKE_CODE = "B001";   // Must match DeviceKey in database

// ==================================================
// STATE
// ==================================================
String btBuffer = "";
unsigned long lastWifiCheck = 0;
unsigned long lastHeartbeat = 0;
bool relayOn = false;

// ==================================================
// SETUP
// ==================================================
void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, BT_RX, BT_TX);  // HC-05 at 9600 baud

  // ---------- Outputs ----------
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);

  // ---------- FAIL-SAFE: relay OFF at boot ----------
  digitalWrite(RELAY_PIN, LOW);
  relayOn = false;
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, HIGH);   // blocked by default
  digitalWrite(LED_BLUE, LOW);

  Serial.println(F("\n=================================================="));
  Serial.println(F("  Smart Helmet — Bike Unit Booting"));
  Serial.println(F("=================================================="));

  connectWiFi();

  Serial.println(F("  Waiting for helmet data via Bluetooth..."));
  Serial.println(F("==================================================\n"));
}

// ==================================================
// MAIN LOOP
// ==================================================
void loop() {
  // ---------- Read Bluetooth ----------
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

  // ---------- WiFi heartbeat every 30s ----------
  if (millis() - lastWifiCheck > 30000) {
    lastWifiCheck = millis();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println(F("[WiFi] Lost connection, reconnecting..."));
      connectWiFi();
    }
  }
}

// ==================================================
// PACKET HANDLER
// ==================================================
void handlePacket(String packet) {
  packet.trim();
  Serial.print(F("[BT] Received: "));
  Serial.println(packet);

  // Expected: "H001,1,150,85"
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

  // ---------- Send to backend ----------
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

  // ---------- Build JSON body ----------
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

  // ---------- HTTPS client ----------
  WiFiClientSecure client;
  client.setInsecure();   // ⚠️ Skip cert validation — acceptable for FYP demo

  HTTPClient https;
  https.setTimeout(10000);  // 10s timeout

  if (!https.begin(client, API_URL)) {
    Serial.println(F("[HTTP] begin() failed"));
    setRelay(false);
    return;
  }

  https.addHeader("Content-Type", "application/json");
  https.addHeader("x-api-key", API_KEY);

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
    setRelay(false);   // FAIL-SAFE
  }

  https.end();
}

// ==================================================
// PARSE RESPONSE
// ==================================================
// Extracts engineAllowed value from:
// {"success":true,"data":{"engineAllowed":true, ...}}
bool parseEngineAllowed(String response) {
  int idx = response.indexOf("\"engineAllowed\":");
  if (idx < 0) return false;

  int start = idx + 16;   // length of `"engineAllowed":`
  while (start < response.length() && response[start] == ' ') start++;

  if (response.startsWith("true", start)) return true;
  return false;
}

// ==================================================
// RELAY CONTROL
// ==================================================
void setRelay(bool on) {
  if (on == relayOn) return;   // no change
  relayOn = on;

  if (on) {
    digitalWrite(RELAY_PIN, HIGH);   // relay ON → starter circuit closed
    digitalWrite(LED_GREEN, HIGH);
    digitalWrite(LED_YELLOW, LOW);
    Serial.println(F("[RELAY] ON — engine START allowed"));
  } else {
    digitalWrite(RELAY_PIN, LOW);    // relay OFF → starter circuit open
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_YELLOW, HIGH);
    Serial.println(F("[RELAY] OFF — engine START blocked"));
  }
}

// ==================================================
// WIFI CONNECTION
// ==================================================
void connectWiFi() {
  Serial.print(F("[WiFi] Connecting to "));
  Serial.println(WIFI_SSID);

  digitalWrite(LED_BLUE, LOW);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

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
  } else {
    digitalWrite(LED_BLUE, LOW);
    Serial.println(F("\n[WiFi] Failed to connect — will retry"));
  }
}