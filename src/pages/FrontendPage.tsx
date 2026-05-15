import { motion } from 'framer-motion';
import CodeBlock from '../components/CodeBlock';
import FileTree from '../components/FileTree';
import { Server, Database, Shield, Globe, FileText, Settings, Terminal } from 'lucide-react';
import { useState } from 'react';

const backendFiles = [
  {
    name: 'backend', type: 'folder' as const, children: [
      { name: 'app/__init__.py', type: 'file' as const },
      { name: 'app/main.py', type: 'file' as const, highlight: true },
      { name: 'app/config.py', type: 'file' as const, highlight: true },
      { name: 'app/database.py', type: 'file' as const, highlight: true },
      { name: 'app/models.py', type: 'file' as const, highlight: true },
      { name: 'app/schemas.py', type: 'file' as const, highlight: true },
      { name: 'app/routers/__init__.py', type: 'file' as const },
      { name: 'app/routers/patrol.py', type: 'file' as const, highlight: true },
      { name: 'app/routers/export.py', type: 'file' as const, highlight: true },
      { name: 'app/routers/management.py', type: 'file' as const },
      { name: 'requirements.txt', type: 'file' as const, highlight: true },
      { name: '.env.example', type: 'file' as const, highlight: true },
      { name: 'scripts/seed_db.py', type: 'file' as const, highlight: true },
    ]
  }
];

const mainPyCode = `"""
Security Patrol - FastAPI Main Application
==========================================
Main entry point. Creates FastAPI app, includes routers,
mounts static files, and configures middleware.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import time
import logging

from app.config import settings
from app.database import engine, Base
from app.routers import patrol, export, management

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger("security_patrol")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Security Patrol API...")
    if settings.ENVIRONMENT == "development":
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created (dev mode)")
    yield
    logger.info("Shutting down Security Patrol API...")

app = FastAPI(
    title="Security Patrol API",
    description="Backend API for Security Patrol IoT system.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    logger.info(f"{request.method} {request.url.path} -> {response.status_code} ({process_time:.1f}ms)")
    return response

app.include_router(patrol.router, prefix="/api", tags=["Patrol"])
app.include_router(export.router, prefix="/api", tags=["Export"])
app.include_router(management.router, prefix="/api", tags=["Management"])

@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "healthy", "service": "security-patrol-api", "version": "1.0.0"}

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root_redirect():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/dashboard")`;

const configPyCode = `"""
Security Patrol - Application Configuration
=========================================
Environment-based configuration using Pydantic Settings.
"""

from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "Security Patrol"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_KEY: str = "change-me-in-production"
    DATABASE_URL: str = "sqlite:///./security_patrol.db"
    CORS_ORIGINS: List[str] = ["http://localhost:8000", "http://localhost:3000"]
    DEFAULT_TIMEZONE: str = "UTC"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()`;

const databasePyCode = `"""
Security Patrol - Database Configuration
SQLAlchemy engine and session management.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()`;

const modelsPyCode = `"""
Security Patrol - SQLAlchemy Models
"""

from sqlalchemy import Column, Integer, String, DateTime, Float, Text, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Anchor(Base):
    __tablename__ = "anchors"
    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    events = relationship("PatrolEvent", back_populates="anchor")


class Tag(Base):
    __tablename__ = "tags"
    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    events = relationship("PatrolEvent", back_populates="tag")


class PatrolEvent(Base):
    __tablename__ = "patrol_events"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    received_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    timestamp_utc = Column(DateTime(timezone=True), nullable=False, index=True)
    anchor_id = Column(String(64), ForeignKey("anchors.id"), nullable=False, index=True)
    tag_id = Column(String(64), ForeignKey("tags.id"), nullable=False, index=True)
    rssi = Column(Integer, nullable=False)
    battery = Column(Integer, nullable=True)
    raw_json = Column(JSON, nullable=True)
    extra = Column(JSON, nullable=True)
    anchor = relationship("Anchor", back_populates="events")
    tag = relationship("Tag", back_populates="events")

    __table_args__ = (
        Index('ix_events_anchor_tag', 'anchor_id', 'tag_id'),
        Index('ix_events_timestamp_anchor', 'timestamp_utc', 'anchor_id'),
    )`;

const schemasPyCode = `"""Security Patrol - Pydantic Schemas"""
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List, Any


class PatrolEventIn(BaseModel):
    tag_id: str = Field(..., min_length=1, max_length=64)
    rssi: int = Field(..., ge=-127, le=30)
    timestamp_utc: datetime = Field(...)
    anchor_id: Optional[str] = Field(None, max_length=64)
    battery: Optional[int] = Field(None, ge=0, le=100)
    raw_json: Optional[dict] = None
    extra: Optional[dict] = None

    @field_validator('timestamp_utc')
    @classmethod
    def validate_timestamp(cls, v):
        if v > datetime.utcnow().replace(tzinfo=v.tzinfo) + __import__('datetime').timedelta(hours=1):
            raise ValueError('Timestamp cannot be more than 1 hour in the future')
        return v


class PatrolEventOut(BaseModel):
    id: int
    received_at: datetime
    timestamp_utc: datetime
    anchor_id: str
    tag_id: str
    rssi: int
    battery: Optional[int] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    model_config = {"from_attributes": True}


class AnchorCreate(BaseModel):
    id: str = Field(..., min_length=1, max_length=64)
    name: str = Field(..., min_length=1, max_length=128)
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lon: Optional[float] = Field(None, ge=-180, le=180)


class TagCreate(BaseModel):
    id: str = Field(..., min_length=1, max_length=64)
    name: Optional[str] = Field(None, max_length=128)`;

const patrolRouterCode = `"""
Security Patrol - Patrol Events Router
Endpoints for ingesting and querying patrol detection events.
"""

from fastapi import APIRouter, Depends, HTTPException, Header, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime
from typing import Optional, List

from app.database import get_db
from app.models import PatrolEvent, Anchor, Tag
from app.schemas import PatrolEventIn, PatrolEventOut
from app.config import settings

router = APIRouter()


def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != settings.API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key


@router.post("/ingest/patrol", response_model=List[PatrolEventOut], status_code=201)
async def ingest_patrol_event(
    events: List[PatrolEventIn],
    request: Request,
    db: Session = Depends(get_db),
    _: str = Depends(verify_api_key),
):
    results = []
    for event_in in events:
        anchor = db.query(Anchor).filter(Anchor.id == event_in.anchor_id).first()
        if not anchor:
            anchor = Anchor(id=event_in.anchor_id, name=f"Anchor-{event_in.anchor_id[:8]}")
            db.add(anchor)
            db.flush()

        tag = db.query(Tag).filter(Tag.id == event_in.tag_id).first()
        if not tag:
            tag = Tag(id=event_in.tag_id, name=event_in.tag_id)
            db.add(tag)
            db.flush()

        db_event = PatrolEvent(
            timestamp_utc=event_in.timestamp_utc,
            anchor_id=event_in.anchor_id,
            tag_id=event_in.tag_id,
            rssi=event_in.rssi,
            battery=event_in.battery,
            raw_json=event_in.model_dump() if event_in.raw_json else None,
            extra=event_in.extra,
        )
        db.add(db_event)
        db.flush()

        results.append(PatrolEventOut(
            id=db_event.id, received_at=db_event.received_at,
            timestamp_utc=db_event.timestamp_utc, anchor_id=db_event.anchor_id,
            tag_id=db_event.tag_id, rssi=db_event.rssi, battery=db_event.battery,
            lat=anchor.lat, lon=anchor.lon,
        ))

    db.commit()
    return results


@router.get("/events", response_model=List[PatrolEventOut])
def get_events(
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    tag_id: Optional[str] = Query(None),
    anchor_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(
        PatrolEvent.id, PatrolEvent.received_at, PatrolEvent.timestamp_utc,
        PatrolEvent.anchor_id, PatrolEvent.tag_id, PatrolEvent.rssi,
        PatrolEvent.battery, Anchor.lat, Anchor.lon,
    ).outerjoin(Anchor, PatrolEvent.anchor_id == Anchor.id)

    if from_date:
        query = query.filter(PatrolEvent.timestamp_utc >= from_date)
    if to_date:
        query = query.filter(PatrolEvent.timestamp_utc <= to_date)
    if tag_id:
        query = query.filter(PatrolEvent.tag_id == tag_id)
    if anchor_id:
        query = query.filter(PatrolEvent.anchor_id == anchor_id)

    query = query.order_by(desc(PatrolEvent.timestamp_utc)).offset(offset).limit(limit)
    results = query.all()

    return [PatrolEventOut(
        id=r.id, received_at=r.received_at, timestamp_utc=r.timestamp_utc,
        anchor_id=r.anchor_id, tag_id=r.tag_id, rssi=r.rssi,
        battery=r.battery, lat=r.lat, lon=r.lon,
    ) for r in results]


@router.get("/events/count")
def get_events_count(
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    tag_id: Optional[str] = Query(None),
    anchor_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(func.count(PatrolEvent.id))
    if from_date:
        query = query.filter(PatrolEvent.timestamp_utc >= from_date)
    if to_date:
        query = query.filter(PatrolEvent.timestamp_utc <= to_date)
    if tag_id:
        query = query.filter(PatrolEvent.tag_id == tag_id)
    if anchor_id:
        query = query.filter(PatrolEvent.anchor_id == anchor_id)
    return {"count": query.scalar() or 0}`;

const exportRouterCode = `"""
Security Patrol - Export Router
CSV export endpoint for patrol events.
"""

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import csv
import io

from app.database import get_db
from app.models import PatrolEvent, Anchor

router = APIRouter()


@router.get("/export/csv")
def export_csv(
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    tag_id: Optional[str] = Query(None),
    anchor_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(
        PatrolEvent.timestamp_utc, PatrolEvent.anchor_id, PatrolEvent.tag_id,
        PatrolEvent.rssi, PatrolEvent.battery, Anchor.lat, Anchor.lon,
    ).outerjoin(Anchor, PatrolEvent.anchor_id == Anchor.id)

    if from_date:
        query = query.filter(PatrolEvent.timestamp_utc >= from_date)
    if to_date:
        query = query.filter(PatrolEvent.timestamp_utc <= to_date)
    if tag_id:
        query = query.filter(PatrolEvent.tag_id == tag_id)
    if anchor_id:
        query = query.filter(PatrolEvent.anchor_id == anchor_id)

    query = query.order_by(PatrolEvent.timestamp_utc)
    results = query.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["timestamp_utc", "anchor_id", "tag_id", "rssi", "battery", "lat", "lon"])

    for r in results:
        writer.writerow([
            r.timestamp_utc.isoformat() if r.timestamp_utc else "",
            r.anchor_id or "", r.tag_id or "",
            r.rssi if r.rssi is not None else "",
            r.battery if r.battery is not None else "",
            f"{r.lat:.6f}" if r.lat else "",
            f"{r.lon:.6f}" if r.lon else "",
        ])

    csv_data = output.getvalue()
    filename = f"patrol_events_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(content=csv_data, media_type="text/csv",
                    headers={"Content-Disposition": f"attachment; filename={filename}"})`;

const managementRouterCode = `"""
Security Patrol - Management Router
CRUD endpoints for anchors and tags management.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.database import get_db
from app.models import Anchor, Tag, PatrolEvent
from app.schemas import AnchorCreate, AnchorOut, TagCreate, TagOut

router = APIRouter()


@router.get("/anchors", response_model=List[AnchorOut])
def get_anchors(db: Session = Depends(get_db)):
    anchors = db.query(Anchor).all()
    result = []
    for a in anchors:
        count = db.query(func.count(PatrolEvent.id)).filter(PatrolEvent.anchor_id == a.id).scalar()
        result.append(AnchorOut(id=a.id, name=a.name, lat=a.lat, lon=a.lon,
                                created_at=a.created_at, event_count=count))
    return result


@router.post("/anchors", response_model=AnchorOut, status_code=201)
def create_anchor(anchor: AnchorCreate, db: Session = Depends(get_db)):
    existing = db.query(Anchor).filter(Anchor.id == anchor.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Anchor already exists")
    new_anchor = Anchor(**anchor.model_dump())
    db.add(new_anchor)
    db.commit()
    db.refresh(new_anchor)
    return AnchorOut(id=new_anchor.id, name=new_anchor.name, lat=new_anchor.lat,
                     lon=new_anchor.lon, created_at=new_anchor.created_at, event_count=0)


@router.get("/tags", response_model=List[TagOut])
def get_tags(db: Session = Depends(get_db)):
    tags = db.query(Tag).all()
    result = []
    for t in tags:
        count = db.query(func.count(PatrolEvent.id)).filter(PatrolEvent.tag_id == t.id).scalar()
        result.append(TagOut(id=t.id, name=t.name, created_at=t.created_at, event_count=count))
    return result


@router.post("/tags", response_model=TagOut, status_code=201)
def create_tag(tag: TagCreate, db: Session = Depends(get_db)):
    existing = db.query(Tag).filter(Tag.id == tag.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Tag already exists")
    new_tag = Tag(**tag.model_dump())
    db.add(new_tag)
    db.commit()
    db.refresh(new_tag)
    return TagOut(id=new_tag.id, name=new_tag.name, created_at=new_tag.created_at, event_count=0)`;

const requirementsTxt = `# Security Patrol - Python Dependencies
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
sqlalchemy>=2.0.0
pydantic-settings>=2.0.0
pydantic>=2.5.0
jinja2>=3.1.0
python-multipart>=0.0.6`;

const envExample = `# Security Patrol - Environment Configuration
APP_NAME=Security Patrol
ENVIRONMENT=development
DEBUG=true
API_KEY=your-secret-api-key-change-me
DATABASE_URL=sqlite:///./security_patrol.db
CORS_ORIGINS=["http://localhost:8000", "http://localhost:3000"]
DEFAULT_TIMEZONE=UTC`;

const seedDbCode = `#!/usr/bin/env python3
"""
Security Patrol - Database Seed Script
Creates sample anchors, tags, and patrol events for testing.
Usage: cd backend && python scripts/seed_db.py
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
    print("Creating tables...")
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
                    round_start = day_start + timedelta(hours=random.randint(0, 23), minutes=random.randint(0, 59))
                    for i, anchor in enumerate(anchors):
                        event_time = round_start + timedelta(minutes=i * random.randint(3, 8))
                        db.add(PatrolEvent(
                            timestamp_utc=event_time, anchor_id=anchor.id,
                            tag_id=tag.id, rssi=random.randint(-55, -80),
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

const fileContents: Record<string, string> = {
  'main.py': mainPyCode,
  'config.py': configPyCode,
  'database.py': databasePyCode,
  'models.py': modelsPyCode,
  'schemas.py': schemasPyCode,
  'routers/patrol.py': patrolRouterCode,
  'routers/export.py': exportRouterCode,
  'routers/management.py': managementRouterCode,
  'requirements.txt': requirementsTxt,
  '.env.example': envExample,
  'scripts/seed_db.py': seedDbCode,
};

export default function Backend() {
  const [activeFile, setActiveFile] = useState('main.py');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
            <Server className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">FastAPI Backend</h1>
            <p className="text-gray-600 dark:text-gray-400">Python · SQLAlchemy · Pydantic</p>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <FileTree files={backendFiles} onFileClick={setActiveFile} />
            
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-700 dark:text-green-300 text-sm mb-2 flex items-center gap-2">
                <Terminal className="w-4 h-4" /> Quick Start
              </h4>
              <ol className="text-xs text-green-600 dark:text-green-400 space-y-1 list-decimal list-inside">
                <li><code className="bg-green-100 dark:bg-green-800 px-1 rounded">cd backend</code></li>
                <li><code className="bg-green-100 dark:bg-green-800 px-1 rounded">python -m venv venv</code></li>
                <li><code className="bg-green-100 dark:bg-green-800 px-1 rounded">pip install -r requirements.txt</code></li>
                <li><code className="bg-green-100 dark:bg-green-800 px-1 rounded">cp .env.example .env</code></li>
                <li><code className="bg-green-100 dark:bg-green-800 px-1 rounded">python scripts/seed_db.py</code></li>
                <li><code className="bg-green-100 dark:bg-green-800 px-1 rounded">uvicorn app.main:app --reload</code></li>
              </ol>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-500" />
                <span className="font-mono text-sm font-medium text-gray-700 dark:text-gray-300">{activeFile}</span>
              </div>
              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full font-medium">
                Production Ready
              </span>
            </div>
            <div className="max-h-[70vh] overflow-auto">
              <CodeBlock 
                code={fileContents[activeFile] || '// Select a file from the tree'} 
                language="python" 
                filename={activeFile} 
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {[
              { method: 'POST', path: '/ingest/patrol', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', auth: 'API Key Required' },
              { method: 'GET', path: '/health', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', auth: 'Public' },
              { method: 'GET', path: '/events', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', auth: 'Public' },
              { method: 'GET', path: '/export/csv', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', auth: 'Public' },
              { method: 'GET', path: '/anchors', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', auth: 'Public' },
              { method: 'POST', path: '/anchors', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', auth: 'Public' },
              { method: 'GET', path: '/tags', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300', auth: 'Public' },
              { method: 'POST', path: '/tags', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300', auth: 'Public' },
              { method: 'GET', path: '/docs', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', auth: 'Swagger UI' },
            ].map((ep, i) => (
              <div key={i} className={`p-3 rounded-lg border ${ep.color.split(' ')[0]} border-current/20`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${ep.method === 'POST' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
                    {ep.method}
                  </span>
                  <code className="text-xs truncate">{ep.path}</code>
                </div>
                <div className="text-xs opacity-75">{ep.auth}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
