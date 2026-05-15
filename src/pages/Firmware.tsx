import { motion } from 'framer-motion';
import CodeBlock from '../components/CodeBlock';
import FileTree from '../components/FileTree';
import { Cpu, Bluetooth, Wifi, Database, Clock, Shield, Terminal } from 'lucide-react';
import { useState } from 'react';

const firmwareFiles = [
  { name:'firmware', type:'folder' as const, children:[
    { name:'include', type:'folder' as const, children:[
      { name:'config.h', type:'file' as const, highlight:true },
      { name:'ble_scanner.h', type:'file' as const },
      { name:'wifi_manager.h', type:'file' as const },
      { name:'ntp_time.h', type:'file' as const },
      { name:'api_client.h', type:'file' as const },
      { name:'storage.h', type:'file' as const },
    ]},
    { name:'src', type:'folder' as const, children:[
      { name:'main.cpp', type:'file' as const, highlight:true },
      { name:'ble_scanner.cpp', type:'file' as const },
      { name:'wifi_manager.cpp', type:'file' as const },
      { name:'ntp_time.cpp', type:'file' as const },
      { name:'api_client.cpp', type:'file' as const },
      { name:'storage.cpp', type:'file' as const },
    ]},
    { name:'platformio.ini', type:'file' as const, highlight:true },
  ]}
];

const CODE: Record<string,string> = {
  'config.h': `/**
 * Security Patrol - ESP32 Configuration
 * Copy to config.h and modify for your deployment.
 * See config.example.h for all options with documentation.
 */
#ifndef CONFIG_H
#define CONFIG_H

// ── Wi-Fi Configuration ──────────────────────────────────────
#define WIFI_SSID       "YourNetworkSSID"
#define WIFI_PASSWORD   "YourNetworkPassword"

// ── API Configuration ────────────────────────────────────────
#define API_BASE_URL    "https://your-api.example.com"
#define API_KEY         "your-secret-api-key-change-me"
#define API_ENDPOINT    "/ingest/patrol"

// ── Device Identity ──────────────────────────────────────────
// Set explicitly or leave empty to use MAC address
#define ANCHOR_ID       ""

// ── BLE Scanning Configuration ───────────────────────────────
#define SCAN_DURATION_MS    3000     // Scan window per cycle (ms)
#define SCAN_INTERVAL_MS    5000     // Pause between scans (ms)
#define TAG_PREFIX          "PT-"    // Prefix to filter tag names
#define RSSI_THRESHOLD      -85      // Minimum RSSI to accept

// ── Upload Batching ──────────────────────────────────────────
#define BATCH_SIZE          20       // Max events per POST request
#define UPLOAD_INTERVAL_MS  10000    // Min interval between uploads (ms)

// ── Retry / Backoff Configuration ─────────────────────────────
#define RETRY_INITIAL_MS    1000     // First retry delay (ms)
#define RETRY_MAX_MS        60000    // Max retry delay (ms)
#define RETRY_MULTIPLIER    2.0      // Exponential backoff factor
#define MAX_RETRIES         10       // Max retry attempts before giving up

// ── NTP Time Sync ───────────────────────────────────────────
#define NTP_SERVER          "pool.ntp.org"
#define NTP_GMT_OFFSET_SEC  0        // UTC
#define NTP_DAYLIGHT_OFFSET_SEC 0

// ── Serial Debug Output ──────────────────────────────────────
#define SERIAL_BAUD_RATE    115200
#define DEBUG_VERBOSE                // Uncomment for extra debug output

#endif /* CONFIG_H */`,

  'platformio.ini': `; PlatformIO Configuration for Security Patrol ESP32 Firmware
; Run: pio run -t upload && pio device monitor

[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino

; Build flags
build_flags =
    -DCORE_DEBUG_LEVEL=3
    -DBOARD_HAS_PSRAM
    ; Uncomment below for verbose debug output:
    ; -DDEBUG_VERBOSE

; Library dependencies
lib_deps =
    https://github.com/nkolban/ESP32_BLE_Arduino.git
    ArduinoJson@^6.21.0
    LittleFS@^2.0.0
    NTPClient@^3.2.1

; Monitor configuration
monitor_speed = 115200
monitor_filters =
    time
    color

; Upload settings
upload_speed = 921600

; Partition scheme for LittleFS data storage
board_build.partitions = min_spiffs.csv`,

  'ble_scanner.h': `#ifndef BLE_SCANNER_H
#define BLE_SCANNER_H

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEScan.h>
#include <BLEAdvertisedDevice.h>

/**
 * Structure representing a single BLE detection event.
 * Populated by the scanner when a matching advertisement is found.
 */
struct BleEvent {
    String tag_id;           // Extracted tag identifier (from name, UUID, or mfr data)
    int rssi;                // Signal strength in dBm (-30 to -90 typical)
    String timestamp_utc;    // ISO 8601 UTC timestamp from NTP
    int battery;             // Battery percentage (-1 if unknown)
    String rawAdvertisement; // Raw advertising data for debugging
};

/**
 * BLE Scanner class for detecting patrol tags.
 * 
 * Supports three extraction methods:
 * 1. Device name prefix matching (e.g., "PT-", "TAG", "BEACON")
 * 2. Service UUID filtering
 * 3. Manufacturer-specific data parsing
 * 
 * Usage:
 *   PatrolBLEScanner scanner;
 *   scanner.init();
 *   scanner.startScan(3000);  // Scan for 3 seconds
 *   while (scanner.hasNextEvent()) {
 *       BleEvent event = scanner.getNextEvent();
 *       // Process event...
 *   }
 */
class PatrolBLEScanner : public BLEAdvertisedDeviceCallbacks {
public:
    void init();
    void startScan(uint32_t duration_ms);
    void stopScan();
    bool hasResults() const;
    bool getNextEvent(BleEvent& event);
    void clearResults();
    int getEventCount() const;

protected:
    void onResult(BLEAdvertisedDevice advertisedDevice) override;

private:
    std::vector<BleEvent> _events;
    size_t _readIndex = 0;
    bool _scanning = false;
    
    // Tag extraction methods (tried in order)
    String extractTagIdFromName(BLEAdvertisedDevice& device);
    String extractTagIdFromServiceUUID(BLEAdvertisedDevice& device);
    String extractTagIdFromManufacturerData(BLEAdvertisedDevice& device);
    int extractBatteryLevel(BLEAdvertisedDevice& device);
    
    // Helper to check if RSSI meets threshold
    bool isRssiAcceptable(int rssi) const;
};

#endif`,

  'ble_scanner.cpp': `#include "ble_scanner.h"
#include "config.h"
#include "ntp_time.h"

void PatrolBLEScanner::init() {
    BLEDevice::init("");
    Serial.println("[BLE] Scanner initialized successfully");
}

bool PatrolBLEScanner::isRssiAcceptable(int rssi) const {
#ifdef RSSI_THRESHOLD
    return rssi >= RSSI_THRESHOLD;
#else
    return true;  // Accept all RSSI values if no threshold set
#endif
}

void PatrolBLEScanner::startScan(uint32_t duration_ms) {
    _events.clear();
    _readIndex = 0;
    _scanning = true;

    BLEScan* pBLEScan = BLEDevice::getScan();
    pBLEScan->setAdvertisedDeviceCallbacks(this, true);  // Enable duplicate filtering
    pBLEScan->setActiveScan(false);  // Passive scan saves power
    pBLEScan->setInterval(110);      // Interval between scans (ms)
    pBLEScan->setWindow(99);         // Scan window within interval
    
    Serial.printf("[BLE] Starting %d ms passive scan...\\n", duration_ms);
    pBLEScan->start(duration_ms, false);
    _scanning = false;
    Serial.printf("[BLE] Scan complete. Found %d matching tags\\n", _events.size());
}

void PatrolBLEScanner::stopScan() {
    if (_scanning) {
        BLEDevice::getScan()->stop();
        _scanning = false;
        Serial.println("[BLE] Scan stopped by user");
    }
}

void PatrolBLEScanner::onResult(BLEAdvertisedDevice advertisedDevice) {
    // Check RSSI threshold first (cheap filter)
    if (!isRssiAcceptable(advertisedDevice.getRSSI())) return;

    // Try each extraction method in order of preference
    String tagId = "";
    
    // Method 1: Device name (most common for simple beacons)
    tagId = extractTagIdFromName(advertisedDevice);
    
    // Method 2: Service UUID (for iBeacon/Eddystone/custom services)
    if (tagId.length() == 0) {
        tagId = extractTagIdFromServiceUUID(advertisedDevice);
    }
    
    // Method 3: Manufacturer-specific data (for commercial beacons)
    if (tagId.length() == 0) {
        tagId = extractTagIdFromManufacturerData(advertisedDevice);
    }
    
    // If no tag ID found, skip this device
    if (tagId.length() == 0) return;

    // Build event record
    BleEvent event;
    event.tag_id = tagId;
    event.rssi = advertisedDevice.getRSSI();
    event.timestamp_utc = getUTCTimeString();
    event.battery = extractBatteryLevel(advertisedDevice);
    
    // Store raw advertisement data for debugging
    String rawData = "{\\\"name\\\":\\\"";
    if (advertisedDevice.haveName()) rawData += advertisedDevice.getName().c_str();
    rawData += "\\\",\\\"rssi\\\":" + String(event.rssi);
    if (event.battery >= 0) rawData += ",\\\"battery\\\":" + String(event.battery);
    rawData += "}";
    event.rawAdvertisement = rawData;

    _events.push_back(event);

#ifdef DEBUG_VERBOSE
    Serial.printf("  [BLE+] %-12s | RSSI: %3d dBm | Batt: %s%%\\n",
        event.tag_id.c_str(), event.rssi,
        event.battery >= 0 ? String(event.battery).c_str() : "N/A");
#endif
}

// ── Tag ID Extraction Methods ──────────────────────────────────

String PatrolBLEScanner::extractTagIdFromName(BLEAdvertisedDevice& device) {
    if (!device.haveName()) return "";
    
    String name = device.getName().c_str();
    
#ifdef TAG_PREFIX
    // Check if name starts with configured prefix
    if (name.startsWith(TAG_PREFIX)) {
        return name;  // Return full name as tag ID
    }
#endif
    
    // Also match common patterns like TAG001, BEACON01, etc.
    if (name.startsWith("TAG") || name.startsWith("BEACON") ||
        name.startsWith("GUARD") || name.startsWith("PATROL")) {
        return name;
    }
    
    return "";  // Not a recognized patrol tag name
}

String PatrolBLEScanner::extractTagIdFromServiceUUID(BLEAdvertisedDevice& device) {
    if (!device.haveServiceUUID()) return "";
    
    // Iterate through advertised service UUIDs
    for (uint16_t i = 0; i < device.getServiceUUIDCount(); i++) {
        String uuid = device.getServiceUUID(i).toString().c_str();
        
        // Match known service UUIDs for patrol systems
        // Example: Custom service UUID for your beacon system
        if (uuid.startsWith("0000") && uuid.length() == 36) {
            // Could extract tag ID from service data
            // This is placeholder logic - customize for your beacons
            return "SVC-" + uuid.substring(4, 8);  // Use partial UUID as ID
        }
    }
    
    return "";
}

String PatrolBLEScanner::extractTagIdFromManufacturerData(BLEAdvertisedDevice& device) {
    if (!device.haveManufacturerData()) return "";
    
    String md = device.getManufacturerData().c_str();
    if (md.length() < 6) return "";  // Need at least company ID + some payload
    
    uint8_t* data = (uint8_t*)md.c_str();
    uint16_t companyId = data[0] | (data[1] << 8);
    
    // Parse manufacturer-specific format based on company ID
    // Common company IDs:
    //   0x004C = Apple (iBeacon)
    //   0xFFFF = Custom/test
    //   0x0157 = Microsoft
    
    switch (companyId) {
        case 0x004C: {  // Apple iBeacon
            // iBeacon format: [type][length][uuid(16)][major(2)][minor(2)][txPower(1)]
            if (md.length() >= 25) {
                uint16_t major = data[22] | (data[23] << 8);
                uint16_t minor = data[24] | (data[25] << 8);
                return "IBEACON-" + String(major) + "-" + String(minor);
            }
            break;
        }
        
        case 0xFFFF: {  // Custom test format
            // Assume bytes 2-5 are tag ID as ASCII
            char tagBuf[5] = {data[2], data[3], data[4], data[5], '\\0'};
            return String(tagBuf);
        }
        
        default:
            // Generic: use company ID + first 4 payload bytes as hex
            char idBuf[16];
            snprintf(idBuf, sizeof(idBuf), "MFR-%04X%02X%02X",
                     companyId,
                     md.length() > 2 ? data[2] : 0,
                     md.length() > 3 ? data[3] : 0);
            return String(idBuf);
    }
    
    return "";
}

int PatrolBLEScanner::extractBatteryLevel(BLEAdvertisedDevice& device) {
    // Try to read battery from manufacturer data
    if (device.haveManufacturerData()) {
        String md = device.getManufacturerData().c_str();
        uint8_t* data = (uint8_t*)md.c_str();
        
        // Different beacons put battery at different offsets
        // Adjust these offsets based on your specific beacon firmware
        
        // Option 1: Byte at offset 4 (common for custom beacons)
        if (md.length() > 5 && data[4] <= 100 && data[4] >= 0) {
            return data[4];
        }
        
        // Option 2: Last byte before end
        if (md.length() > 2) {
            uint8_t lastByte = data[md.length() - 1];
            if (lastByte <= 100) return lastByte;\        }
    }

    // Try to read from service data (some beacons use this)
    if (device.haveServiceData()) {
        for (uint16_t i = 0; i < device.getServiceDataCount(); i++) {
            String sd = device.getServiceData(i).c_str();
            if (sd.length() > 2) {
                uint8_t* sdata = (uint8_t*)sd.c_str();
                if (sdata[0] <= 100) return sdata[0];\n            }\n        }\n    }
    
    return -1;  // Unknown / not available
}

bool PatrolBLEScanner::hasResults() const {
    return _readIndex < _events.size();
}

bool PatrolBLEScanner::getNextEvent(BleEvent& event) {
    if (!hasResults()) return false;
    event = _events[_readIndex++];
    return true;
}

void PatrolBLEScanner::clearResults() {
    _events.clear();
    _readIndex = 0;
}

int PatrolBLEScanner::getEventCount() const {
    return _events.size();
}`,

  'wifi_manager.h': `#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

/**
 * WiFi Manager handles connection, reconnection, and provides
 * a secure HTTP client for API communication.
 * 
 * Features:
 * - Auto-reconnect with configurable interval
 * - Secure HTTPS client (TLS 1.2)
 * - Anchor ID generation from MAC address
 * - Connection status monitoring
 */
class WiFiManager {
public:
    void init();
    bool connect(unsigned long timeout_ms = 15000);
    void disconnect();
    bool isConnected() const;
    void maintain();  // Call in loop() for auto-reconnect
    String getMACAddress() const;
    String getAnchorId() const;  // MAC or configured ID
    WiFiClientSecure& getSecureClient();

private:
    unsigned long _lastReconnectAttempt = 0;
    const unsigned long RECONNECT_INTERVAL_MS = 30000;
    WiFiClientSecure _secureClient;
    bool _configured = false;
};

extern WiFiManager wifiMgr;

#endif`,

  'wifi_manager.cpp': `#include "wifi_manager.h"
#include "config.h"

WiFiManager wifiMgr;

void WiFiManager::init() {
    WiFi.setAutoReconnect(true);
    WiFi.setSleep(false);  // Keep WiFi awake for reliable connectivity
    
    // Configure secure client for HTTPS
    // In production, use proper root CA certificates
    _secureClient.setInsecure();  // Dev mode: accept any certificate
    // Production: _secureClient.setCACert(root_ca_pem);
    
    _configured = true;
    Serial.println("[WiFi] Manager initialized");
}

bool WiFiManager::connect(unsigned long timeout_ms) {
    if (isConnected()) {
        Serial.println("[WiFi] Already connected");
        return true;
    }

    Serial.printf("[WiFi] Connecting to '%s'...\\n", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    unsigned long start = millis();
    while (!isConnected()) {
        if (millis() - start >= timeout_ms) {
            Serial.println("[WiFi] Connection timed out!");
            return false;
        }
        delay(200);
        Serial.print(".");
    }

    Serial.println();
    Serial.printf("[WiFi] Connected! IP: %s\\n", WiFi.localIP().toString().c_str());
    Serial.printf("[WiFi] MAC Address: %s\\n", getMACAddress().c_str());
    Serial.printf("[WiFi] Anchor ID: %s\\n", getAnchorId().c_str());
    return true;
}

void WiFiManager::disconnect() {
    WiFi.disconnect(true);
    Serial.println("[WiFi] Disconnected");
}

bool WiFiManager::isConnected() const {
    return WiFi.status() == WL_CONNECTED;
}

void WiFiManager::maintain() {
    if (!_configured) return;
    
    if (!isConnected()) {
        unsigned long now = millis();
        if (now - _lastReconnectAttempt >= RECONNECT_INTERVAL_MS) {
            _lastReconnectAttempt = now;
            Serial.println("[WiFi] Attempting automatic reconnect...");
            connect(10000);
        }
    }
}

String WiFiManager::getMACAddress() const {
    return WiFi.macAddress();
}

String WiFiManager::getAnchorId() const {
#if defined(ANCHOR_ID) && strlen(ANCHOR_ID) > 0
    return String(ANCHOR_ID);
#else
    // Generate anchor ID from MAC address (remove colons)
    String mac = getMACAddress();
    mac.replace(":", "");
    return "ANCHOR-" + mac.substring(mac.length() - 8);
#endif
}

WiFiClientSecure& WiFiManager::getSecureClient() {
    return _secureClient;
}`,

  'ntp_time.h': `#ifndef NTP_TIME_H
#define NTP_TIME_H

#include <Arduino.h>
#include <time.h>
#include <NTPClient.h>
#include <WiFiUdp.h>

/**
 * NTP Time synchronization module.
 * Provides accurate UTC timestamps for event records.
 */

// Initialize NTP client and perform initial sync
void ntpInit();

// Get current UTC time as ISO 8601 string (e.g., "2025-01-15T14:30:00Z")
String getUTCTimeString();

// Check if time has been synced at least once
bool isTimeSynced();

// Force a re-synchronization (returns success)
bool ntpSync(unsigned long timeout_ms = 10000);

#endif`,

  'ntp_time.cpp': `#include "ntp_time.h"
#include "config.h"

static WiFiUDP ntpUDP;
static NTPClient timeClient(ntpUDP, NTP_SERVER, NTP_GMT_OFFSET_SEC, NTP_DAYLIGHT_OFFSET_SEC * 1000);
static bool _timeSynced = false;

void ntpInit() {
    timeClient.begin();
    Serial.printf("[NTP] Initialized with server: %s\\n", NTP_SERVER);
    
    // Wait up to 10 seconds for initial sync
    _timeSynced = ntpSync(10000);
}

bool ntpSync(unsigned long timeout_ms) {
    Serial.print("[NTP] Synchronizing time...");
    
    // Force update from NTP server
    if (timeClient.update()) {
        _timeSynced = true;
        time_t rawtime = timeClient.getEpochTime();
        struct tm* timeinfo = gmtime(&rawtime);
        
        char buf[40];
        strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S UTC", timeinfo);
        Serial.printf("\\n[NTP] Time synchronized: %s\\n", buf);
        return true;
    }
    
    // Fallback: try without forced update
    if (timeClient.getRawTime() > 1609459200) {  // After Jan 1, 2021
        _timeSynced = true;
        Serial.println("\\n[NTP] Using cached time");
        return true;
    }
    
    Serial.println("\\n[NTP] WARNING: Time sync failed! Events will use approximate time.");
    return false;
}

String getUTCTimeString() {
    time_t epochTime;
    
    if (_timeSynced) {
        epochTime = timeClient.getEpochTime();
    } else {
        // Fallback: use millis-based approximation
        // This won't be accurate but provides a valid ISO string
        epochTime = (millis() / 1000) + 1735689600;  // Rough offset
    }
    
    struct tm* timeinfo = gmtime(&epochTime);
    
    char buf[25];
    strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", timeinfo);
    return String(buf);
}

bool isTimeSynced() {
    return _timeSynced || (timeClient.getRawTime() > 1609459200);
}`,

  'storage.h': `#ifndef STORAGE_H
#define STORAGE_H

#include <Arduino.h>
#include <FS.h>
#include <LittleFS.h>
#include "ble_scanner.h"

/**
 * Event Queue with LittleFS persistence.
 * 
 * When WiFi is unavailable, events are stored locally on flash memory
 * using LittleFS filesystem. Events are stored in JSONL format
 * (one JSON object per line) for easy parsing and reliability.
 * 
 * File location: /patrol_queue.jsonl
 * 
 * Features:
 * - Append-only writes for durability
 * - Batch dequeue for efficient upload
 * - Automatic file rotation prevention
 * - Count query without loading all data
 */
class EventStorage {
public:
    bool begin();
    int count();
    bool enqueue(const BleEvent& event);
    bool peekBatch(BleEvent* events, int maxCount, int& actualCount);
    bool removeBatch(int count);
    bool clear();
    size_t getQueueSizeBytes();  // File size in bytes

private:
    static const char* QUEUE_FILE;
};

#endif`,

  'storage.cpp': `#include "storage.h"

const char* EventStorage::QUEUE_FILE = "/patrol_queue.jsonl";

bool EventStorage::begin() {
    if (!LittleFS.begin()) {
        // Try formatting if mount fails (first boot)
        if (!LittleFS.begin(true)) {
            Serial.println("[Storage] ERROR: Failed to mount LittleFS!");
            return false;
        }
        Serial.println("[Storage] Formatted LittleFS (first boot)");
    }
    
    int pending = count();
    if (pending > 0) {
        Serial.printf("[Storage] Found %d queued events from previous session\\n", pending);
    } else {
        Serial.println("[Storage] Ready (no pending events)");
    }
    return true;
}

int EventStorage::count() {
    File f = LittleFS.open(QUEUE_FILE, "r");
    if (!f) return 0;
    
    int lines = 0;
    while (f.available()) {
        String line = f.readStringUntil('\\n');
        if (line.length() > 5) lines++;  // Ignore empty/short lines
    }
    f.close();
    return lines;
}

size_t EventStorage::getQueueSizeBytes() {
    File f = LittleFS.open(QUEUE_FILE, "r");
    if (!f) return 0;
    size_t size = f.size();
    f.close();
    return size;
}

bool EventStorage::enqueue(const BleEvent& event) {
    File f = LittleFS.open(QUEUE_FILE, "a");
    if (!f) {
        Serial.println("[Storage] ERROR: Cannot open queue file for append!");
        return false;
    }
    
    // Write one JSON object per line (JSONL format)
    // Using manual JSON construction for efficiency on embedded
    f.print('{');
    f.print("\"tag_id\":\""); f.print(event.tag_id); f.print('\",');
    f.print("\"rssi\":"); f.print(event.rssi); f.print(',');
    f.print("\"timestamp_utc\":\""); f.print(event.timestamp_utc); f.print('\",');
    f.print("\"anchor_id\":\""); f.print(wifiMgr.getAnchorId()); f.print('\",');
    if (event.battery >= 0) {
        f.print("\"battery\":"); f.print(event.battery);
    }
    f.println('}');
    
    f.close();
    return true;
}

bool EventStorage::peekBatch(BleEvent* events, int maxCount, int& actualCount) {
    File f = LittleFS.open(QUEUE_FILE, "r");
    if (!f) {
        actualCount = 0;
        return true;
    }
    
    actualCount = 0;
    while (actualCount < maxCount && f.available()) {
        String line = f.readStringUntil('\\n');
        line.trim();
        if (line.length() < 10) continue;  // Skip invalid lines
        
        // Manual JSON parsing (efficient for embedded)
        BleEvent ev;
        
        // Extract tag_id
        int start = line.indexOf("\"tag_id\":\"") + 10;
        int end = line.indexOf("\"", start);
        if (start < 10 || end < 0) continue;
        ev.tag_id = line.substring(start, end);
        
        // Extract rssi
        start = line.indexOf("\"rssi\":") + 7;
        ev.rssi = line.substring(start).toInt();
        
        // Extract timestamp
        start = line.indexOf("\"timestamp_utc\":\"") + 16;
        end = line.indexOf("\"", start);
        ev.timestamp_utc = line.substring(start, end);
        
        // Extract battery (optional)
        start = line.indexOf("\"battery\":");
        if (start > 0) {
            ev.battery = line.substring(start + 9).toInt();
        } else {
            ev.battery = -1;
        }
        
        events[actualCount++] = ev;
    }
    
    f.close();
    return true;
}

bool EventStorage::removeBatch(int count) {
    // Read remaining content after removing 'count' lines
    File f = LittleFS.open(QUEUE_FILE, "r");
    if (!f) return false;
    
    String remaining;
    int skipped = 0;
    while (f.available() && skipped < count) {
        String line = f.readStringUntil('\\n');
        if (line.length() > 5) skipped++;
    }
    // Keep everything after the removed lines
    while (f.available()) {
        remaining += f.readStringUntil('\\n') + '\\n';
    }
    f.close();
    
    // Write back the remaining content
    File w = LittleFS.open(QUEUE_FILE, "w");
    if (!w) return false;
    w.print(remaining);
    w.close();
    
    return true;
}

bool EventStorage::clear() {
    if (LittleFS.remove(QUEUE_FILE)) {
        Serial.println("[Storage] Cleared all queued events");
        return true;
    }
    return false;
}`,

  'api_client.h': `#ifndef API_CLIENT_H
#define API_CLIENT_H

#include <Arduino.h>
#include <vector>
#include "ble_scanner.h"
#include "wifi_manager.h"

/**
 * HTTP API Client for sending patrol events to backend.
 * 
 * Features:
 * - Single or batch event upload
 * - Exponential backoff retry on failure
 * - Rate limiting (configurable min interval)
 * - Configurable batch size
 * - Detailed logging of all operations
 */
class APIClient {
public:
    void init();
    
    // Send a single event immediately
    bool sendEvent(const BleEvent& event);
    
    // Send batch of events (up to BATCH_SIZE)
    int sendBatch(const BleEvent* events, int count);
    
    // Health check endpoint
    bool healthCheck();
    
    // Retry state management
    unsigned long getCurrentBackoffMs() const;
    void resetRetryState();
    
    // Statistics
    unsigned long getTotalEventsSent() const;
    unsigned long getTotalUploads() const;
    unsigned long getTotalFailures() const;

private:
    String buildJsonPayload(const BleEvent* events, int count);
    bool httpPost(const String& url, const String& payload);
    
    unsigned long _retryDelayMs = RETRY_INITIAL_MS;
    unsigned long _lastUploadTime = 0;
    unsigned long _totalSent = 0;
    unsigned long _totalUploads = 0;
    unsigned long _totalFailures = 0;
};

#endif`,

  'api_client.cpp': `#include "api_client.h"
#include "config.h"
#include <HTTPClient.h>

void APIClient::init() {
    resetRetryState();
    Serial.println("[API] Client initialized");
    Serial.printf("[API] Endpoint: %s%s\\n", API_BASE_URL, API_ENDPOINT);
}

String APIClient::buildJsonPayload(const BleEvent* events, int count) {
    if (count == 0) return "{}";
    
    // For single event, send as object (not array)
    // Backend accepts both formats
    if (count == 1) {
        String json = "{";
        json += "\"tag_id\":\"" + events[0].tag_id + "\",";
        json += "\"rssi\":" + String(events[0].rssi) + ",";
        json += "\"timestamp_utc\":\"" + events[0].timestamp_utc + "\",";
        json += "\"anchor_id\":\"" + wifiMgr.getAnchorId() + "\",";
        if (events[0].battery >= 0) {
            json += "\"battery\":" + String(events[0].battery);
        }
        json += "}";
        return json;
    }
    
    // Multiple events: send as array
    String json = "[";
    for (int i = 0; i < count; i++) {
        if (i > 0) json += ",";
        json += "{";
        json += "\"tag_id\":\"" + events[i].tag_id + "\",";
        json += "\"rssi\":" + String(events[i].rssi) + ",";
        json += "\"timestamp_utc\":\"" + events[i].timestamp_utc + "\",";
        json += "\"anchor_id\":\"" + wifiMgr.getAnchorId() + "\",";
        if (events[i].battery >= 0) {
            json += "\"battery\":" + String(events[i].battery);
        }
        json += "}";
    }
    json += "]";
    return json;
}

bool APIClient::httpPost(const String& url, const String& payload) {
    if (!wifiMgr.isConnected()) {
        Serial.println("[API] Cannot send: WiFi not connected");
        return false;
    }
    
    HTTPClient http;
    http.begin(wifiMgr.getSecureClient(), url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key", API_KEY);
    http.setTimeout(10000);  // 10 second timeout
    
    Serial.printf("[API] POST %s (%d bytes)\\n", url.c_str(), payload.length());
    
#ifdef DEBUG_VERBOSE
    Serial.printf("[API] Payload: %s\\n", payload.substring(0, 200).c_str());
    if (payload.length() > 200) Serial.println("[API] ... (truncated)");
#endif
    
    int httpCode = http.POST(payload);
    String response = http.getString();
    
    if (httpCode == 201 || httpCode == 200) {
        Serial.printf("[API] SUCCESS: HTTP %d\\n", httpCode);
#ifdef DEBUG_VERBOSE
        Serial.printf("[API] Response: %s\\n", response.substring(0, 100).c_str());
#endif
        http.end();
        return true;
    } else {
        Serial.printf("[API] FAILED: HTTP %d - %s\\n", httpCode, response.c_str());
        http.end();
        return false;
    }
}

bool APIClient::sendEvent(const BleEvent& event) {
    return sendBatch(&event, 1);
}

int APIClient::sendBatch(const BleEvent* events, int count) {
    if (count == 0) return 0;
    
    // Rate limiting check
    unsigned long now = millis();
    if (now - _lastUploadTime < UPLOAD_INTERVAL_MS) {
        Serial.println("[API] Rate limited (too soon since last upload)");
        return 0;
    }
    
    String url = String(API_BASE_URL) + String(API_ENDPOINT);
    String payload = buildJsonPayload(events, count);
    
    if (httpPost(url, payload)) {
        _lastUploadTime = now;
        _totalSent += count;
        _totalUploads++;
        resetRetryState();
        
        Serial.printf("[API] Uploaded %d events (total: %lu sent, %lu uploads)\\n",
                   count, _totalSent, _totalUploads);
        return count;
    }
    
    // Failure — increase backoff
    _totalFailures++;
    _retryDelayMs = min(_retryDelayMs * RETRY_MULTIPLIER, (unsigned long)RETRY_MAX_MS);
    Serial.printf("[API] Failure #%lu. Next retry in %lu ms (backoff)\\n",
               _totalFailures, _retryDelayMs);
    return 0;
}

bool APIClient::healthCheck() {
    if (!wifiMgr.isConnected()) return false;
    
    HTTPClient http;
    String url = String(API_BASE_URL) + "/health";
    http.begin(wifiMgr.getSecureClient(), url);
    http.setTimeout(5000);
    
    int code = http.GET();
    http.end();
    return code == 200;
}

unsigned long APIClient::getCurrentBackoffMs() const {
    return _retryDelayMs;
}

void APIClient::resetRetryState() {
    _retryDelayMs = RETRY_INITIAL_MS;
}

unsigned long APIClient::getTotalEventsSent() const { return _totalSent; }
unsigned long APIClient::getTotalUploads() const { return _totalUploads; }
unsigned long APIClient::getTotalFailures() const { return _totalFailures; }`,

  'main.cpp': `/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║        Security Patrol - ESP32 Anchor Firmware             ║
 * ║        Version 1.0.0 | PlatformIO + Arduino Framework       ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * This firmware runs on ESP32 devices acting as "anchors" that:
 * 1. Scan for BLE advertisements from known patrol tags
 * 2. Record tag_id, RSSI, timestamp (from NTP), battery level
 * 3. Upload events to the backend API via HTTPS POST
 * 4. Queue events to LittleFS when offline, replay on reconnect
 *
 * Build:     pio run
 * Flash:     pio run -t upload
 * Monitor:   pio device monitor
 *
 * State Machine Flow:
 * INIT → CONNECT_WIFI → SYNC_TIME → SCAN → PROCESS → UPLOAD → WAIT → (repeat)
 */

#include <Arduino.h>
#include "config.h"
#include "wifi_manager.h"
#include "ntp_time.h"
#include "ble_scanner.h"
#include "storage.h"
#include "api_client.h"

// ── Global Instances ──────────────────────────────────────────
PatrolBLEScanner bleScanner;
EventStorage eventStorage;
APIClient apiClient;

// ── State Machine ─────────────────────────────────────────────
enum class SystemState {
    INIT,
    CONNECTING_WIFI,
    SYNCING_TIME,
    SCANNING,
    PROCESSING_EVENTS,
    UPLOADING,
    WAITING_NEXT_SCAN,
    ERROR
};

SystemState currentState = SystemState::INIT;
unsigned long stateEnterTime = 0;
unsigned long totalScansCompleted = 0;
unsigned long totalTagsDetected = 0;

// ── Forward Declarations ─────────────────────────────────────
void enterState(SystemState newState);
void runState_INIT();
void runState_CONNECTING_WIFI();
void runState_SYNCING_TIME();
void runState_SCANNING();
void runState_PROCESSING_EVENTS();
void runState_UPLOADING();
void runState_WAITING_NEXT_SCAN();
void printSystemStatus();

// ══════════════════════════════════════════════════════════════
// SETUP
// ══════════════════════════════════════════════════════════════
void setup() {
    Serial.begin(SERIAL_BAUD_RATE);
    delay(500);

    Serial.println("");
    Serial.println("╔══════════════════════════════════════════════╗");
    Serial.println("║     🔒 Security Patrol - ESP32 Anchor      ║");
    Serial.println("║     Version 1.0.0                          ║");
    Serial.println("╚══════════════════════════════════════════════╝");
    Serial.println("");

    enterState(SystemState::INIT);
}

// ══════════════════════════════════════════════════════════════
// MAIN LOOP
// ══════════════════════════════════════════════════════════════
void loop() {
    // Always maintain WiFi connection (auto-reconnect)
    wifiMgr.maintain();

    switch (currentState) {
        case SystemState::INIT:              runState_INIT(); break;
        case SystemState::CONNECTING_WIFI:  runState_CONNECTING_WIFI(); break;
        case SystemState::SYNCING_TIME:      runState_SYNCING_TIME(); break;
        case SystemState::SCANNING:          runState_SCANNING(); break;
        case SystemState::PROCESSING_EVENTS: runState_PROCESSING_EVENTS(); break;
        case SystemState::UPLOADING:         runState_UPLOADING(); break;
        case SystemState::WAITING_NEXT_SCAN: runState_WAITING_NEXT_SCAN(); break;
        case SystemState::ERROR:
            Serial.println("[System] ERROR state! Restarting in 10s...");
            delay(10000);
            ESP.restart();
            break;
    }
}

// ══════════════════════════════════════════════════════════════
// STATE MACHINE IMPLEMENTATION
// ══════════════════════════════════════════════════════════════

void enterState(SystemState newState) {
    static const char* stateNames[] = {
        "INIT", "WIFI_CONNECT", "TIME_SYNC", "SCANNING",
        "PROCESSING", "UPLOADING", "WAITING", "ERROR"
    };
    Serial.printf("[State] → %s\\n", stateNames[(int)newState]);
    currentState = newState;
    stateEnterTime = millis();
}

void runState_INIT() {
    Serial.println("[Init] Initializing subsystems...");

    // Initialize LittleFS for offline queue
    if (!eventStorage.begin()) {
        Serial.println("[Init] FATAL: LittleFS failed!");
        enterState(SystemState::ERROR);
        return;
    }

    // Initialize BLE scanner
    bleScanner.init();

    // Initialize API client
    apiClient.init();

    Serial.println("[Init] All subsystems ready ✓");
    enterState(SystemState::CONNECTING_WIFI);
}

void runState_CONNECTING_WIFI() {
    if (wifiMgr.connect(15000)) {
        enterState(SystemState::SYNCING_TIME);
    } else {
        Serial.println("[Init] WiFi failed, continuing anyway (will retry during scan)...");
        enterState(SystemState::SYNCING_TIME);
    }
}

void runState_SYNCING_TIME() {
    // Only sync time if we have WiFi
    if (wifiMgr.isConnected()) {
        if (ntpSync(10000)) {
            Serial.println("[Time] Sync successful ✓");
        } else {
            Serial.println("[Time] WARNING: Using approximate time");
        }
    } else {
        Serial.println("[Time] Skipping (no WiFi)");
    }
    enterState(SystemState::SCANNING);
}

void runState_SCANNING() {
    // Ensure WiFi is available before scanning
    if (!wifiMgr.isConnected()) {
        Serial.println("[Scan] Waiting for WiFi...");
        enterState(SystemState::CONNECTING_WIFI);
        return;
    }

    Serial.println("[Scan] Starting BLE scan cycle...");
    bleScanner.startScan(SCAN_DURATION_MS);
    totalScansCompleted++;

    int detected = bleScanner.getEventCount();
    totalTagsDetected += detected;

    if (detected > 0) {
        Serial.printf("[Scan] Found %d tag(s)! Processing...\\n", detected);
        enterState(SystemState::PROCESSING_EVENTS);
    } else {
        // No new detections — check queue then wait
        int pending = eventStorage.count();
        if (pending > 0) {
            Serial.printf("[Scan] No new tags. Uploading %d queued events...\\n", pending);
            enterState(SystemState::UPLOADING);
        } else {
            enterState(SystemState::WAITING_NEXT_SCAN);
        }
    }
}

void runState_PROCESSING_EVENTS() {
    Serial.println("[Process] Queuing detected events to local storage...");

    int queued = 0;
    BleEvent event;
    while (bleScanner.getNextEvent(event)) {
        if (eventStorage.enqueue(event)) {
            queued++;
        }
    }

    int totalQueued = eventStorage.count();
    Serial.printf("[Process] Queued %d new events (%d total pending)\\n",
               queued, totalQueued);

    bleScanner.clearResults();
    enterState(SystemState::UPLOADING);
}

void runState_UPLOADING() {
    int pending = eventStorage.count();
    
    if (pending == 0) {
        enterState(SystemState::WAITING_NEXT_SCAN);
        return;
    }

    // Check backoff timer
    unsigned long elapsed = millis() - stateEnterTime;
    if (elapsed < apiClient.getCurrentBackoffMs()) {
        // Still in backoff period — stay here until it passes
        delay(100);
        return;
    }

    // Read batch from queue
    BleEvent batch[BATCH_SIZE];
    int batchSize = min(pending, BATCH_SIZE);
    int actualCount = 0;

    if (!eventStorage.peekBatch(batch, batchSize, actualCount)) {
        enterState(SystemState::WAITING_NEXT_SCAN);
        return;
    }

    if (actualCount == 0) {
        enterState(SystemState::WAITING_NEXT_SCAN);
        return;
    }

    Serial.printf("[Upload] Sending batch of %d/%d events...\\n", actualCount, pending);
    int sent = apiClient.sendBatch(batch, actualCount);

    if (sent > 0) {
        // Success — remove uploaded items from queue
        eventStorage.removeBatch(sent);
        int remaining = eventStorage.count();
        Serial.printf("[Upload] Sent %d events. Remaining in queue: %d\\n", sent, remaining);

        // If more to upload, do another round
        if (remaining > 0) {
            stateEnterTime = millis();  // Reset timer
        } else {
            enterState(SystemState::WAITING_NEXT_SCAN);
        }
    } else {
        // Upload failed — backoff will handle delay
        Serial.println("[Upload] Failed. Will retry after backoff period...");

        // Don't stay stuck forever — go back to scanning after max backoff
        if (elapsed > RETRY_MAX_MS * 2) {
            Serial.println("[Upload] Max backoff exceeded, returning to scan");
            enterState(SystemState::SCANNING);
        }
    }
}

void runState_WAITING_NEXT_SCAN() {
    static unsigned long lastStatusPrint = 0;

    // Print status every 60 seconds
    if (millis() - lastStatusPrint > 60000) {
        printSystemStatus();
        lastStatusPrint = millis();
    }

    // Wait for next scan interval
    if (millis() - stateEnterTime >= SCAN_INTERVAL_MS) {
        enterState(SystemState::SCANNING);
    }

    // Small delay to prevent busy-waiting
    delay(100);
}

void printSystemStatus() {
    Serial.println("");
    Serial.println("┌────────────────────────────────────────────┐");
    Serial.println("│      🔒 SECURITY PATROL STATUS             │");
    Serial.println("├────────────────────────────────────────────┤");
    Serial.printf("│ WiFi: %-35s │\\n",
        wifiMgr.isConnected() ? ("✓ " + WiFi.localIP().toString()).c_str()
                              : "✗ Disconnected");
    Serial.printf("│ Anchor: %-33s │\\n", wifiMgr.getAnchorId().c_str());
    Serial.printf("│ Time: %-35s │\\n",
        isTimeSynced() ? "✓ Synchronized" : "⚠ Approximate");
    Serial.printf("│ Queued: %-34d │\\n", eventStorage.count());
    Serial.printf("│ Scans: %-35lu │\\n", totalScansCompleted);
    Serial.printf("│ Tags Detected: %-28lu │\\n", totalTagsDetected);
    Serial.printf("│ Events Sent: %-29lu │\\n", apiClient.getTotalEventsSent());
    Serial.printf("│ Free Heap: %-31lu B │\\n", ESP.getFreeHeap());
    Serial.printf("│ Uptime: %-33lus │\\n", millis() / 1000);
    Serial.println("└────────────────────────────────────────────┘");
    Serial.println("");
}`,
};

export default function Firmware() {
  const [activeFile, setActiveFile] = useState('main.cpp');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl"><Cpu className="w-7 h-7 text-white"/></div>
          <div><h1 className="text-3xl font-bold text-gray-900 dark:text-white">ESP32 Firmware</h1><p className="text-gray-600 dark:text-gray-400">PlatformIO + Arduino Framework</p></div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <FileTree files={firmwareFiles} onFileClick={setActiveFile}/>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
              <h4 className="font-semibold text-orange-700 dark:text-orange-300 text-sm mb-2 flex items-center gap-2"><Terminal className="w-4 h-4"/>Quick Start</h4>
              <ol className="text-xs text-orange-600 dark:text-orange-400 space-y-1 list-decimal list-inside">
                <li>Install PlatformIO CLI</li>
                <li>Copy <code className="bg-orange-100 dark:bg-orange-800 px-1 rounded">config.example.h</code> → <code className="bg-orange-100 dark:bg-orange-800 px-1 rounded">config.h</code></li>
                <li>Edit WiFi &amp; API credentials</li>
                <li><code className="bg-orange-100 dark:bg-orange-800 px-1 rounded">pio run -t upload</code></li>
                <li><code className="bg-orange-100 dark:bg-orange-800 px-1 rounded">pio device monitor</code></li>
              </ol>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2"><Bluetooth className="w-4 h-4 text-orange-500"/><span className="font-mono text-sm font-medium text-gray-700 dark:text-gray-300">{activeFile}</span></div>
              <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-full font-medium">Complete Source</span>
            </div>
            <div className="max-h-[70vh] overflow-auto">
              <CodeBlock code={CODE[activeFile]||'// Select a file'} language={activeFile.endsWith('.h')||activeFile.endsWith('.cpp')||activeFile.endsWith('.ini')?'cpp':'text'} filename={activeFile}/>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[{icon:Bluetooth,label:'BLE Scanner',desc:'Passive scan + tag filtering',color:'text-blue-500'},{icon:Wifi,label:'WiFi Manager',desc:'Auto-reconnect + HTTPS',color:'text-green-500'},{icon:Clock,label:'NTP Sync',desc:'Accurate UTC timestamps',color:'text-purple-500'},{icon:Database,label:'LittleFS Queue',desc:'Offline persistence',color:'text-orange-500'}].map((f,i)=>(<div key={i} className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"><f.icon className={`w-5 h-5 ${f.color} mb-2`}/><div className="font-medium text-sm text-gray-900 dark:text-white">{f.label}</div><div className="text-xs text-gray-500 mt-1">{f.desc}</div></div>))}
          </div>
        </div>
      </div>
    </div>
  );
}
