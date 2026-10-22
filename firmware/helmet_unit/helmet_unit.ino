// ==================================================
// SMART HELMET — HELMET UNIT FIRMWARE
// Board: Arduino Nano (ATmega328P)
// ==================================================
// Reads MQ-3 alcohol sensor + IR proximity sensor.
// Lights 3 status LEDs (green/yellow/red).
// Sends packet over HC-05 Bluetooth every 500ms.
//
// NEW FEATURE: EEPROM Configuration
// You can configure the HELMET_CODE via the Serial Monitor
// without re-uploading the code. 
// ==================================================

#include <SoftwareSerial.h>
#include <EEPROM.h>

// ==================================================
// PIN CONFIGURATION
// ==================================================
#define MQ3_PIN        A0    // MQ-3 alcohol sensor analog output
#define IR_PIN         2     // FC-51 IR proximity sensor digital output
#define LED_GREEN      3     // Green LED — helmet OK
#define LED_YELLOW     4     // Yellow LED — alcohol detected
#define LED_RED        5     // Red LED — not worn

#define BT_RX          10    // HC-05 TX → Nano D10
#define BT_TX          11    // HC-05 RX ← Nano D11

// ==================================================
// CONFIGURATION
// ==================================================
const int ALCOHOL_THRESHOLD = 300;
const unsigned long SEND_INTERVAL_MS = 500;

// EEPROM Addresses to store configuration
#define EEPROM_SIZE 32
#define ADDR_MAGIC 0       // Tells us if the EEPROM is already initialized
#define ADDR_HELMET_CODE 4 // Starts storing the 4-byte helmet code here

SoftwareSerial bluetooth(BT_RX, BT_TX);

// ==================================================
// STATE
// ==================================================
unsigned long lastSendTime = 0;
int simulatedBattery = 100;
String helmetCode = "H001"; // Default

// ==================================================
// SETUP
// ==================================================
void setup() {
  Serial.begin(9600);
  bluetooth.begin(9600);
  delay(100);

  pinMode(IR_PIN, INPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED, OUTPUT);

  // Load Helmet Code from EEPROM (or use default)
  loadConfig();

  testLeds();

  Serial.println(F("=================================================="));
  Serial.println(F("  Smart Helmet — Helmet Unit Ready"));
  Serial.print(F("  Helmet code: "));
  Serial.println(helmetCode);
  Serial.println(F("  Type 'SET: H002' to change the helmet code."));
  Serial.println(F("=================================================="));
}

// ==================================================
// MAIN LOOP
// ==================================================
void loop() {
  // Check for incoming serial commands from the PC (Setup mode)
  checkSerialConfig();

  unsigned long now = millis();
  if (now - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = now;

    int alcoholLevel = analogRead(MQ3_PIN);
    bool worn = isHelmetWorn();
    updateLeds(worn, alcoholLevel);

    // Format: "H002,1,150,85\n"
    String packet = helmetCode + "," +
                    (worn ? "1" : "0") + "," +
                    String(alcoholLevel) + "," +
                    String(simulatedBattery) + "\n";

    bluetooth.print(packet);
    Serial.print(F("Sent: "));
    Serial.print(packet);

    if (simulatedBattery > 0 && now % 10000 < 500) {
      simulatedBattery -= 1;
    }
  }
}

// ==================================================
// SERIAL CONFIGURATION (Bypass re-uploading)
// ==================================================
void checkSerialConfig() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    
    if (cmd.startsWith("SET:")) {
      String newCode = cmd.substring(4);
      newCode.trim();
      newCode.toUpperCase();

      if (newCode.length() >= 3 && newCode.length() <= 10) {
        helmetCode = newCode;
        saveConfig();
        Serial.print(F("✅ Helmet code updated to: "));
        Serial.println(helmetCode);
        Serial.println(F("   Rebooting in 2 seconds..."));
        delay(2000);
        // Soft restart to apply cleanly
        void (*reboot)(void) = 0;
        reboot();
      } else {
        Serial.println(F("❌ Invalid code. Must be 3-10 characters (e.g. H002)"));
      }
    }
  }
}

// ==================================================
// EEPROM STORAGE
// ==================================================
void loadConfig() {
  char magic = EEPROM.read(ADDR_MAGIC);
  if (magic == 'S') {
    // EEPROM is initialized, read the code
    char buffer[11];
    for (int i = 0; i < 10; i++) {
      buffer[i] = EEPROM.read(ADDR_HELMET_CODE + i);
    }
    buffer[10] = '\0';
    helmetCode = String(buffer);
    helmetCode.trim();
    if (helmetCode.length() == 0) helmetCode = "H001"; // Fallback
  } else {
    // First boot, write default
    saveConfig();
  }
}

void saveConfig() {
  EEPROM.write(ADDR_MAGIC, 'S'); // Mark as initialized
  for (int i = 0; i < 10; i++) {
    if (i < helmetCode.length()) {
      EEPROM.write(ADDR_HELMET_CODE + i, helmetCode[i]);
    } else {
      EEPROM.write(ADDR_HELMET_CODE + i, 0); // Null padding
    }
  }
}

// ==================================================
// HELPERS
// ==================================================
bool isHelmetWorn() {
  return digitalRead(IR_PIN) == LOW;
}

void updateLeds(bool worn, int alcohol) {
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