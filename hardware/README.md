# Hardware Prototype - Smart Foot Insole

## Phase 4: IoT Integration (Planned)

This directory contains specifications and firmware for the smart foot insole prototype.

## Components

- **Microcontroller:** ESP32
- **Pressure Sensors:** 3x FSR (Heel, Metatarsal, Toe)
- **Temperature Sensor:** MLX90614 (Infrared)
- **Moisture Sensor:** GSR (Galvanic Skin Response)

## Features (Future Implementation)

- ✅ Real-time pressure monitoring (kg/cm²)
- ✅ Temperature anomaly detection (> 33°C = high risk)
- ✅ Moisture level tracking (sweat/humidity)
- ✅ HTTPS data transmission to backend
- ✅ Battery-powered (8+ hours per charge)

## Data Schema

```json
{
  "device_id": "insole_esp32_001",
  "timestamp": "2024-04-19T10:30:00Z",
  "pressure_heel": 85,           // kg/cm²
  "pressure_metatarsal": 120,    // kg/cm²
  "pressure_toe": 60,            // kg/cm²
  "temp_celsius": 31.5,
  "moisture_level": 45           // % humidity
}
```

## Backend Integration

The backend `/api/v1/insole/reading` endpoint accepts this data:

```python
POST /api/v1/insole/reading
{
    "user_id": "user_...",
    "device_id": "insole_esp32_001",
    "pressure_heel": 85,
    "pressure_metatarsal": 120,
    "pressure_toe": 60,
    "temp_celsius": 31.5,
    "moisture_level": 45
}
```

## Risk Assessment Logic

- **Low Risk:** temp < 32°C, normal pressure distribution
- **Moderate Risk:** temp 32-33°C OR elevated pressure toe
- **High Risk:** temp > 33°C AND pressure_toe > 50 kg/cm²

## Firmware Status

- 🔄 Planned: ESP32 Arduino sketches
- 🔄 Planned: Sensor calibration guides
- 🔄 Planned: OTA (Over-the-Air) update mechanism
- 🔄 Planned: Local anomaly detection (edge compute)

## Documentation Files

- `esp32_firmware/` - Arduino sketches (future)
- `sensor_calibration/` - Calibration guides
- `wireless_protocol/` - HTTPS transmission details
- `power_management/` - Battery optimization

## Integration Points

1. **Frontend**: Device pairing, real-time dashboard
2. **Backend**: `/api/v1/insole/reading` endpoint (complete)
3. **Database**: `InsoleReading` table (complete)
4. **Analytics**: Pressure heatmaps, anomaly detection

## Testing

Without hardware:
```bash
# Simulate insole reading
curl -X POST http://localhost:8000/api/v1/insole/reading \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "...",
    "device_id": "insole_esp32_001",
    "pressure_heel": 85,
    "pressure_metatarsal": 120,
    "pressure_toe": 60,
    "temp_celsius": 31.5,
    "moisture_level": 45
  }'
```

## Future Roadmap

**v1.0 (Current):** Basic pressure + temperature monitoring
**v2.0 (2024):** Wireless connectivity, cloud sync
**v3.0 (2025):** Edge AI anomaly detection
**v4.0 (2026):** Multi-device coordination, gait analysis

## References

- ESP32 Documentation: https://docs.espressif.com/projects/esp-idf/
- FSR Sensor Guide: https://www.tekscan.com/flexiforce
- MLX90614 Specs: https://www.melexis.com/en/product/MLX90614/

---
**Status:** Phase 4 - Prototype specification complete, firmware pending
**Last Updated:** April 2024
