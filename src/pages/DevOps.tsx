import { motion } from 'framer-motion';
import CodeBlock from '../components/CodeBlock';
import { Container, Terminal, FileText, Database, Settings, Download, Rocket, Shield } from 'lucide-react';
import { useState } from 'react';

const dockerComposeCode = `# Security Patrol - Docker Compose
# One-command local development environment.
# Usage: docker-compose up --build

version: '3.8'

services:
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: security-patrol-api
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
    volumes:
      - ./backend/app:/app/app
      - ./backend/static:/app/static
      - patrol-data:/app/data
    environment:
      - DATABASE_URL=sqlite:///./data/security_patrol.db
      - ENVIRONMENT=docker
      - DEBUG=true
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

volumes:
  patrol-data:`;

const envExampleCode = `# Security Patrol - Environment Configuration
# Copy this file to .env and update values.
# NEVER commit .env to version control!

APP_NAME=Security Patrol
ENVIRONMENT=development
DEBUG=true

# API Security - MUST match API_KEY in ESP32 config.h!
API_KEY=your-secret-api-key-change-me

# Database URL (SQLite for dev, Postgres for prod)
DATABASE_URL=sqlite:///./security_patrol.db

# CORS Origins
CORS_ORIGINS=["http://localhost:8000", "http://localhost:3000"]

DEFAULT_TIMEZONE=UTC`;

const seedDbCode = `#!/usr/bin/env python3
"""
Security Patrol - Database Seed Script
Creates sample anchors, tags, and 7 days of simulated patrol events.

Usage:
    cd backend
    python scripts/seed_db.py
"""

import sys
import os
from datetime import datetime, timedelta, timezone
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base, SessionLocal
from app.models import Anchor, Tag, PatrolEvent

SAMPLE_ANCHORS = [
    {"id": "aabbccddeeff01", "name": "Main Entrance", "lat": 40.7128, "lon": -74.0060},
    {"id": "aabbccddeeff02", "name": "Parking Lot A", "lat": 40.7140, "lon": -74.0080},
    {"id": "aabbccddeeff03", "name": "Rear Loading Dock", "lat": 40.7115, "lon": -74.0045},
    {"id": "aabbccddeeff04", "name": "Server Room", "lat": 40.7132, "lon": -74.0072},
    {"id": "aabbccddeeff05", "name": "Executive Floor", "lat": 40.7135, "lon": -74.0055},
]

SAMPLE_TAGS = [
    {"id": "PT-GUARD001", "Name": "John Smith (Night Shift)"},
    {"id": "PT-GUARD002", "Name": "Maria Garcia (Day Shift)"},
    {"id": "PT-SUPV001", "Name": "Robert Chen (Supervisor)"},
    {"id": "PT-GUARD003", "Name": "Sarah Williams (Rover)"},
]

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        db.query(PatrolEvent).delete()
        db.query(Tag).delete()
        db.query(Anchor).delete()
        db.commit()

        for data in SAMPLE_ANCHORS:
            db.add(Anchor(**data))
        db.commit()
        print(f"Created {len(SAMPLE_ANCHORS)} anchors")

        for data in SAMPLE_TAGS:
            db.add(Tag(**data))
        db.commit()
        print(f"Created {len(SAMPLE_TAGS)} tags")

        anchors = db.query(Anchor).all()
        tags = db.query(Tag).all()
        now = datetime.now(timezone.utc)
        event_count = 0

        for days_ago in range(7, 0, -1):
            day_start = now - timedelta(days=days_ago, hours=now.hour, minutes=now.minute)
            for tag in tags:
                for round_num in range(random.randint(3, 5)):
                    round_start = day_start + timedelta(
                        hours=random.randint(0, 23), minutes=random.randint(0, 59)
                    )
                    for i, anchor in enumerate(anchors):
                        event_time = round_start + timedelta(minutes=i * random.randint(3, 8))
                        db.add(PatrolEvent(
                            timestamp_utc=event_time,
                            anchor_id=anchor.id,
                            tag_id=tag.id,
                            rssi=random.randint(-55, -80),
                            battery=random.choice([85, 88, 92, 95, 78, 82]),
                        ))
                        event_count += 1
        db.commit()
        print(f"Generated {event_count} patrol events")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()`;

const readmeContent = `# Security Patrol

BLE-based Guard Tour Monitoring System with ESP32 + FastAPI + Web Dashboard

## Overview

Security Patrol is a complete IoT starter project for building guard tour monitoring systems:

- **ESP32 Anchors** scan BLE advertisements from security personnel tags
- **FastAPI Backend** receives, stores, and serves detection events  
- **Web Dashboard** visualizes patrols on tables and maps with CSV export

## Architecture

BLE Tags --> BLE Advertise --> ESP32 Anchors (Scan + WiFi + NTP)
                                    |
                              HTTPS POST
                                    |
                             FastAPI Backend
                             /     |      \\
                      SQLite/Postgres  Events API  Export CSV
                                   |          |
                              Web Dashboard (Tables + Map)

## Project Structure

security-patrol/
  firmware/           # ESP32 PlatformIO project
    include/          # Headers (config.h, ble_scanner.h, etc.)
    src/              # Implementation (.cpp files)
    platformio.ini    # Build config
  backend/            # FastAPI Python backend
    app/              # Application code
    static/           # CSS, JS assets
    templates/        # Jinja2 HTML templates
    scripts/          # Utility scripts (seed_db.py)
    requirements.txt  # Python dependencies
    .env.example      # Environment template
  docs/               # Additional documentation
  docker-compose.yml  # One-command setup
  README.md           # This file

## Quick Start

### Option 1: Docker (Recommended)

\`\`\`bash
cd security-patrol
cp backend/.env.example backend/.env
# Edit .env with your settings
docker-compose up --build
docker-compose exec api python scripts/seed_db.py
open http://localhost:8000/dashboard
\`\`\`

### Option 2: Manual Setup

#### Backend:
\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python scripts/seed_db.py
uvicorn app.main:app --reload
\`\`\`

#### Firmware:
\`\`\`bash
cd firmware
pip install platformio
cp include/config.example.h include/config.h
# Edit config.h with WiFi and API details
pio run -t upload
pio device monitor
\`\`\`

## Configuration

### ESP32 (firmware/include/config.h):
- WIFI_SSID / WIFI_PASSWORD: Network credentials
- API_BASE_URL: Backend server URL
- API_KEY: Shared secret (must match backend)
- TAG_PREFIX: BLE name filter (e.g., "PT-")
- BATCH_SIZE: Events per upload (default: 20)

### Backend (backend/.env):
- API_KEY: Must match ESP32 config
- DATABASE_URL: SQLite or PostgreSQL connection string
- CORS_ORIGINS: Allowed frontend URLs

## Testing

### Backend API Tests (curl):

# Health check
curl http://localhost:8000/health

# Get all events
curl "http://localhost:8000/api/events?limit=10"

# Ingest an event
curl -X POST http://localhost:8000/api/ingest/patrol \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: your-secret-api-key" \\
  -d '[{"tag_id":"PT-TEST","rssi":-65,"timestamp_utc":"2025-01-15T10:30:00Z","anchor_id":"test"}]'

# Export CSV
curl -o patrol.csv "http://localhost:8000/api/export/csv"

## Simulating BLE Tags

For testing without physical beacons:
1. Use nRF Connect app (Android/iOS)
2. Set advertising name to "PT-TEST001"
3. Start advertising near ESP32

## License

MIT License`;

export default function DevOps() {
  const [activeTab, setActiveTab] = useState<'docker' | 'env' | 'seed' | 'readme'>('docker');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
            <Container className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">DevOps & Deployment</h1>
            <p className="text-gray-600 dark:text-gray-400">Docker, configuration, seeding, and documentation</p>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'docker' as const, label: 'Docker Compose', icon: Container },
          { id: 'env' as const, label: '.env.example', icon: Settings },
          { id: 'seed' as const, label: 'Seed Script', icon: Database },
          { id: 'readme' as const, label: 'README.md', icon: FileText },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        
        {activeTab === 'docker' && (
          <div>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
              <Container className="w-5 h-5 text-cyan-500" />
              <span className="font-semibold text-gray-900 dark:text-white">docker-compose.yml</span>
            </div>
            <CodeBlock code={dockerComposeCode} filename="docker-compose.yml" language="yaml" />
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-500" /> Quick Commands
              </h4>
              <div className="space-y-2 font-mono text-sm">
                <div className="flex items-center gap-3">
                  <code className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Start everything</code>
                  <code className="text-green-600 dark:text-green-400">docker-compose up --build</code>
                </div>
                <div className="flex items-center gap-3">
                  <code className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Background mode</code>
                  <code className="text-green-600 dark:text-green-400">docker-compose up -d --build</code>
                </div>
                <div className="flex items-center gap-3">
                  <code className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">View logs</code>
                  <code className="text-green-600 dark:text-green-400">docker-compose logs -f api</code>
                </div>
                <div className="flex items-center gap-3">
                  <code className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Stop</code>
                  <code className="text-green-600 dark:text-green-400">docker-compose down</code>
                </div>
                <div className="flex items-center gap-3">
                  <code className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Seed data</code>
                  <code className="text-green-600 dark:text-green-400">docker-compose exec api python scripts/seed_db.py</code>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'env' && (
          <div>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
              <Settings className="w-5 h-5 text-orange-500" />
              <span className="font-semibold text-gray-900 dark:text-white">.env.example (Backend)</span>
            </div>
            <CodeBlock code={envExampleCode} filename=".env.example" language="bash" />
            <div className="px-6 py-4 bg-yellow-50 dark:bg-yellow-900/10 border-t border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <strong>Security Note:</strong> The API_KEY must be identical in both ESP32 config.h and backend .env. Change it before deploying!
              </p>
            </div>
          </div>
        )}

        {activeTab === 'seed' && (
          <div>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
              <Database className="w-5 h-5 text-green-500" />
              <span className="font-semibold text-gray-900 dark:text-white">scripts/seed_db.py — Sample Data Generator</span>
            </div>
            <CodeBlock code={seedDbCode} filename="scripts/seed_db.py" language="python" />
          </div>
        )}

        {activeTab === 'readme' && (
          <div>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" />
              <span className="font-semibold text-gray-900 dark:text-white">README.md — Full Documentation</span>
            </div>
            <div className="p-6 overflow-x-auto">
              <pre className="bg-gray-950 text-gray-100 p-6 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">{readmeContent}</pre>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
