// ==================================================
// SMART HELMET — HELMET UNIT FIRMWARE
// Board: Arduino Nano (ATmega328P)
// ==================================================
// Reads MQ-3 alcohol sensor + IR proximity sensor.
// Lights 3 status LEDs (green/yellow/red).
// Sends packet over HC-05 Bluetooth every 500ms.
//
// Packet format: "H001,<worn>,<alcohol>,<battery>\n"
//   - H001       = helmet code (fixed)
//   - worn       = 1 if worn, 0 if not
//   - alcohol    = raw ADC value 0-1023
//   - battery    = simulated battery percentage 0-100
// ==================================================

#include <SoftwareSerial.h>

// ==================================================
// PIN CONFIGURATION (matches your hardware)
// ==================================================
#define MQ3_PIN        A0    // MQ-3 alcohol sensor analog output
#define IR_PIN         2     // FC-51 IR proximity sensor digital output
#define LED_GREEN      3     // Green LED — helmet OK
#define LED_YELLOW     4     // Yellow LED — alcohol detected
#define LED_RED        5     // Red LED — not worn

#define BT_RX          10    // HC-05 TX → Nano D10 (via voltage divider!)
#define BT_TX          11    // HC-05 RX ← Nano D11 (direct)

// ==================================================
// CONFIGURATION
// ==================================================
const char* HELMET_CODE = "H001";      // Must match DeviceKey in database
const int   ALCOHOL_THRESHOLD = 300;   // Same as backend constant
const unsigned long SEND_INTERVAL_MS = 500;  // 500ms as designed

// HC-05 Bluetooth (software serial)
SoftwareSerial bluetooth(BT_RX, BT_TX);

// ==================================================
// STATE
// ==================================================
unsigned long lastSendTime = 0;
int simulatedBattery = 100;  // Simulated; replace with real ADC if you add a divider

// ==================================================
// SETUP
// ==================================================
void setup() {
  Serial.begin(9600);
  bluetooth.begin(9600);      // HC-05 default baud
  delay(100);

  pinMode(IR_PIN, INPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED, OUTPUT);

  // Startup blink test — confirms all LEDs work
  testLeds();

  Serial.println(F("=================================================="));
  Serial.println(F("  Smart Helmet — Helmet Unit Ready"));
  Serial.println(F("  Helmet code: H001"));
  Serial.println(F("  Sending packet every 500ms"));
  Serial.println(F("=================================================="));
}

// ==================================================
// MAIN LOOP
// ==================================================
void loop() {
  unsigned long now = millis();

  if (now - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = now;

    // ---------- READ SENSORS ----------
    int alcoholLevel = analogRead(MQ3_PIN);      // 0-1023
    bool worn = isHelmetWorn();                  // true/false

    // ---------- UPDATE LEDS ----------
    updateLeds(worn, alcoholLevel);

    // ---------- BUILD PACKET ----------
    // Format: "H001,1,150,85\n"
    String packet = String(HELMET_CODE) + "," +
                    (worn ? "1" : "0") + "," +
                    String(alcoholLevel) + "," +
                    String(simulatedBattery) + "\n";

    // ---------- SEND VIA BLUETOOTH ----------
    bluetooth.print(packet);

    // ---------- DEBUG PRINT ----------
    Serial.print(F("Sent: "));
    Serial.print(packet);

    // Slowly drain simulated battery (for demo purposes)
    if (simulatedBattery > 0 && now % 10000 < 500) {
      simulatedBattery -= 1;
    }
  }
}

// ==================================================
// HELPERS
// ==================================================

// FC-51 IR sensor: LOW when object detected (helmet on head)
bool isHelmetWorn() {
  return digitalRead(IR_PIN) == LOW;
}

void updateLeds(bool worn, int alcohol) {
  // Priority: safety-first
  // 1. Not worn → RED
  // 2. Alcohol detected → YELLOW
  // 3. Otherwise → GREEN (safe)

  if (!worn) {
    digitalWrite(LED_RED, HIGH);
    digitalWrite(LED_YELLOW, LOW);
    digitalWrite(LED_GREEN, LOW);
  } else if (alcohol >= ALCOHOL_THRESHOLD) {
    digitalWrite(LED_RED, LOW);
    digitalWrite(LED_YELLOW, HIGH);
    digitalWrite(LED_GREEN, LOW);
  } else {
    digitalWrite(LED_RED, LOW);
    digitalWrite(LED_YELLOW, LOW);
    digitalWrite(LED_GREEN, HIGH);
  }
}

void testLeds() {
  digitalWrite(LED_GREEN, HIGH);  delay(200);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, HIGH); delay(200);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(LED_RED, HIGH);    delay(200);
  digitalWrite(LED_RED, LOW);
}