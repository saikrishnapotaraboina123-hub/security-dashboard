import { motion } from 'framer-motion';
import CodeBlock from '../components/CodeBlock';
import FileTree from '../components/FileTree';
import { Server, Database, Terminal, FileText } from 'lucide-react';
import { useState } from 'react';

const backendFiles = [
  { name:'backend', type:'folder' as const, children:[
    { name:'app/__init__.py', type:'file' as const },
    { name:'app/main.py', type:'file' as const, highlight:true },
    { name:'app/config.py', type:'file' as const, highlight:true },
    { name:'app/database.py', type:'file' as const, highlight:true },
    { name:'app/models.py', type:'file' as const, highlight:true },
    { name:'app/schemas.py', type:'file' as const, highlight:true },
    { name:'app/routers/__init__.py', type:'file' as const },
    { name:'app/routers/patrol.py', type:'file' as const, highlight:true },
    { name:'app/routers/export.py', type:'file' as const, highlight:true },
    { name:'app/routers/management.py', type:'file' as const, highlight:true },
    { name:'requirements.txt', type:'file' as const, highlight:true },
    { name:'.env.example', type:'file' as const, highlight:true },
    { name:'scripts/seed_db.py', type:'file' as const, highlight:true },
  ]}
];

const CODE: Record<string,string> = {
  'main.py': `"""
Security Patrol - FastAPI Main Application
==========================================
Main entry point. Creates FastAPI app, includes routers,
mounts static files, configures middleware (CORS, logging).
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import time
import logging

from app.config import settings
from app.database import engine, Base
from app.routers import patrol, export, management

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("security_patrol")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler — startup and shutdown."""
    logger.info("🚀 Starting Security Patrol API...")
    
    # Auto-create tables in development mode
    if settings.ENVIRONMENT == "development":
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created (dev mode)")
    
    yield
    
    logger.info("🛑 Shutting down Security Patrol API...")


# Create FastAPI application instance
app = FastAPI(
    title="Security Patrol API",
    description="""
    ## BLE Guard Tour Monitoring System Backend API
    
    ### Features
    - **Event Ingestion**: Receive BLE detection events from ESP32 anchors
    - **Query & Filter**: Search events by date range, tag, anchor
    - **CSV Export**: Download filtered event data
    - **Management**: CRUD operations for anchors and tags
    
    ### Authentication
    All write endpoints require `x-api-key` header matching `API_KEY`.
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Middleware ───────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    """Log every request with method, path, status, and timing."""
    start_time = time.time()
    response = await call_next(request)
    process_time_ms = (time.time() - start_time) * 1000
    logger.info(
        f"{request.method} {request.url.path} → "
        f"{response.status_code} ({process_time_ms:.1f}ms)"
    )
    return response


# ── Include Routers ─────────────────────────────────────────

app.include_router(patrol.router, prefix="/api", tags=["Patrol Events"])
app.include_router(export.router, prefix="/api", tags=["Export"])
app.include_router(management.router, prefix="/api", tags=["Management"])

# ── Static Files ─────────────────────────────────────────────

app.mount("/static", StaticFiles(directory="static"), name="static")

# ── Root Endpoints ──────────────────────────────────────────


@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint — returns 200 OK if service is healthy."""
    return {
        "status": "healthy",
        "service": "security-patrol-api",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/")
async def root_redirect():
    """Redirect root to dashboard."""
    return RedirectResponse(url="/dashboard")`,

  'config.py': `"""
Security Patrol - Application Configuration
=========================================
Environment-based configuration using Pydantic Settings.
All values loaded from .env file or environment variables.
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
from functools import lru_cache


class Settings(BaseSettings):
    """
    Application settings with validation.
    
    Load order (highest priority first):
    1. Environment variables
    2. .env file
    3. Default values
    """
    
    # ── Application ──────────────────────────────────────
    APP_NAME: str = "Security Patrol"
    ENVIRONMENT: str = "development"  # development | staging | production
    DEBUG: bool = True
    BACKEND_URL: str = "http://localhost:8000"
    
    # ── API Security ──────────────────────────────────────
    # MUST match API_KEY in ESP32 config.h!
    API_KEY: str = "change-me-in-production"
    
    # ── Database ──────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./security_patrol.db"
    # PostgreSQL example:
    # DATABASE_URL = "postgresql+asyncpg://user:pass@localhost:5432/patrol"
    
    # ── CORS ──────────────────────────────────────────────
    CORS_ORIGINS: List[str] = ["http://localhost:8000", "http://localhost:3000"]
    
    # ── Timezone ──────────────────────────────────────────
    DEFAULT_TIMEZONE: str = "UTC"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Cached singleton settings instance."""
    return Settings()


# Module-level convenience accessor
settings = get_settings()`,

  'database.py': `"""
Security Patrol - Database Configuration
=======================================
SQLAlchemy engine, session management, and base model class.

Supports both SQLite (development) and PostgreSQL (production).
Uses async-compatible patterns for future scalability.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

# Create database engine based on configured URL
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,              # Log SQL statements in debug mode
    pool_pre_ping=True,               # Verify connections before use
    pool_size=10,
    max_overflow=20,
    # SQLite-specific: allow multithreaded access
    connect_args={"check_same_thread": True}
    if "sqlite" in settings.DATABASE_URL.lower()
    else {},
)

# Session factory for dependency injection
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy ORM models.
    
    All models inherit common configuration from this class.
    """
    pass


def get_db():
    """
    FastAPI dependency that yields a database session.
    
    Usage:
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()`,

  'models.py': `"""
Security Patrol - SQLAlchemy ORM Models
=====================================
Database schema definitions compatible with both SQLite and PostgreSQL.

Tables:
- anchors: Fixed-position ESP32 scanner devices
- tags: BLE beacons carried by security personnel
- patrol_events: Individual detection records
"""

from sqlalchemy import (
    Column, Integer, String, DateTime, Float, Text, JSON,
    ForeignKey, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Anchor(Base):
    """
    Represents an ESP32 anchor device at a fixed physical location.
    
    Anchors are stationary BLE scanners positioned at checkpoints
    throughout the secured facility.
    """
    __tablename__ = "anchors"
    
    id = Column(String(64), primary_key=True, index=True)
    # e.g., "ANCHOR-001", MAC address, or custom ID
    name = Column(String(128), nullable=False, index=True)
    # Human-readable location name
    lat = Column(Float, nullable=True)
    # Latitude for map display
    lon = Column(Float, nullable=True)
    # Longitude for map display
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship: one anchor has many patrol events
    events = relationship("PatrolEvent", back_populates="anchor",
                         cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Anchor(id={self.id}, name='{self.name}', lat={self.lat}, lon={self.lon})>"


class Tag(Base):
    """
    Represents a BLE tag/beacon carried by security personnel.
    
    Tags broadcast their identity via BLE advertisements which are
    picked up by nearby anchors.
    """
    __tablename__ = "tags"
    
    id = Column(String(64), primary_key=True, index=True)
    # Tag identifier from BLE advertisement (e.g., "TAG001")
    name = Column(String(128), nullable=True, index=True)
    # Optional human-readable name (e.g., "John Smith - Night Shift")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship: one tag appears in many events
    events = relationship("PatrolEvent", back_populates="tag",
                         cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Tag(id={self.id}, name='{self.name}')>"


class PatrolEvent(Base):
    """
    A single BLE detection event recorded by an anchor.
    
    Created when an anchor's BLE scan detects a known tag within
    range. Contains signal strength, timestamp, and optional metadata.
    """
    __tablename__ = "patrol_events"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    received_at = Column(DateTime(timezone=True), server_default=func.now(),
                        nullable=False, index=True)
    # When the server received this event
    timestamp_utc = Column(DateTime(timezone=True), nullable=False, index=True)
    # When the event actually occurred (from NTP on ESP32)
    anchor_id = Column(String(64), ForeignKey("anchors.id", ondelete="CASCADE"),
                       nullable=False, index=True)
    # Which anchor detected this event
    tag_id = Column(String(64), ForeignKey("tags.id", ondelete="CASCADE"),
                   nullable=False, index=True)
    # Which tag was detected
    rssi = Column(Integer, nullable=False)
    # Signal strength in dBm (-30 = very close, -90 = far away)
    battery = Column(Integer, nullable=True)
    # Battery percentage of the tag (if advertised via BLE)
    raw_json = Column(JSON, nullable=True)
    # Original payload from ESP32 for debugging/audit
    extra = Column(JSON, nullable=True)
    # Additional metadata (future use)
    
    # Relationships
    anchor = relationship("Anchor", back_populates="events")
    tag = relationship("Tag", back_populates="events")
    
    # Composite indexes for common query patterns
    __table_args__ = (
        Index('ix_events_anchor_tag', 'anchor_id', 'tag_id'),
        Index('ix_events_timestamp_anchor', 'timestamp_utc', 'anchor_id'),
        Index('ix_events_tag_time', 'tag_id', 'timestamp_utc'),
    )
    
    def __repr__(self) -> str:
        return (f"<PatrolEvent(id={self.id}, tag={self.tag_id}, "
                f"anchor={self.anchor_id}, rssi={self.rssi})>")`,

  'schemas.py': `"""
Security Patrol - Pydantic Schemas
====================================
Request/response models for input validation and serialization.

All external data passes through these schemas to ensure
type safety and catch invalid data early.
"""

from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import datetime
from typing import Optional, List, Any, Dict


class PatrolEventIn(BaseModel):
    """
    Incoming patrol event from an ESP32 anchor.
    
    Validated before storage in the database.
    Supports single or batch ingestion.
    """
    tag_id: str = Field(
        ...,
        min_length=1,
        max_length=64,
        description="BLE tag identifier (e.g., TAG001, BEACON01)",
        examples=["TAG001", "BEACON-MAIN-DOOR"],
    )
    rssi: int = Field(
        ...,
        ge=-127,
        le=30,
        description="Signal strength in dBm (-90 to -30 typical)",
        examples=[-55, -70, -85],
    )
    timestamp_utc: datetime = Field(
        ...,
        description="ISO 8601 UTC timestamp when detection occurred",
        examples=["2025-01-15T14:30:00Z"],
    )
    anchor_id: Optional[str] = Field(
        None,
        max_length=64,
        description="Anchor identifier (auto-filled if missing)",
    )
    battery: Optional[int] = Field(
        None,
        ge=0,
        le=100,
        description="Battery percentage if available from BLE beacon",
    )
    raw_json: Optional[Dict[str, Any]] = None
    extra: Optional[Dict[str, Any]] = None

    @field_validator('timestamp_utc')
    @classmethod
    def validate_not_in_future(cls, v: datetime) -> datetime:
        """Reject timestamps more than 1 hour in the future."""
        max_allowed = datetime.utcnow().replace(tzinfo=v.tzinfo) + __import__(
            'datetime', fromlist=['timedelta']
        ).timedelta(hours=1)
        if v > max_allowed:
            raise ValueError('Timestamp cannot be more than 1 hour in the future')
        return v


class PatrolEventOut(BaseModel):
    """
    Patrol event as returned by the API (read model).
    """
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
    """Schema for creating a new anchor."""
    id: str = Field(..., min_length=1, max_length=64)
    name: str = Field(..., min_length=1, max_length=128)
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lon: Optional[float] = Field(None, ge=-180, le=180)


class AnchorOut(BaseModel):
    """Anchor as returned by the API."""
    id: str
    name: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    created_at: datetime
    event_count: Optional[int] = 0

    model_config = {"from_attributes": True}


class TagCreate(BaseModel):
    """Schema for creating a new tag."""
    id: str = Field(..., min_length=1, max_length=64)
    name: Optional[str] = Field(None, max_length=128)


class TagOut(BaseModel):
    """Tag as returned by the API."""
    id: str
    name: Optional[str] = None
    created_at: datetime
    event_count: Optional[int] = 0

    model_config = {"from_attributes": True}


class HealthResponse(BaseModel):
    """Health check response body."""
    status: str
    service: str
    version: str
    environment: str = "unknown"


class ErrorResponse(BaseModel):
    """Standard error response format."""
    error: str
    detail: Optional[str] = None


class SuccessResponse(BaseModel):
    """Standard success response for mutations."""
    message: str
    count: Optional[int] = None`,

  'routers/patrol.py': `"""
Security Patrol - Patrol Events Router
========================================
Endpoints for ingesting and querying patrol detection events.

Endpoints:
- POST /ingest/patrol   — Ingest one or more events (auth required)
- GET  /events          — Query events with filters
- GET  /events/count    — Get filtered event count
"""

from fastapi import APIRouter, Depends, HTTPException, Header, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_
from datetime import datetime
from typing import Optional, List

from app.database import get_db
from app.models import PatrolEvent, Anchor, Tag
from app.schemas import (
    PatrolEventIn, PatrolEventOut, ErrorResponse
)
from app.config import settings

router = APIRouter()


def verify_api_key(x_api_key: Optional[str] = Header(default=None)) -> str:
    """
    Dependency: Verify x-api-key header matches configured API key.
    
    Raises 401 Unauthorized if key is missing or incorrect.
    """
    if not x_api_key or x_api_key != settings.API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing API key. Provide valid x-api-key header.",
        )
    return x_api_key


@router.post(
    "/ingest/patrol",
    response_model=List[PatrolEventOut],
    status_code=201,
    responses={
        201: {"description": "Events created successfully"},
        401: {"model": ErrorResponse, "description": "Invalid API key"},
        422: {"description": "Validation error"},
    },
    summary="Ingest patrol events",
    description="Accepts single event object or array of events. Validates each event, ensures anchor/tag exist (creates if not), stores in database.",
)
async def ingest_patrol_event(
    events: List[PatrolEventIn],
    request: Request,
    db: Session = Depends(get_db),
    _: str = Depends(verify_api_key),
):
    """
    Ingest one or more patrol events from an ESP32 anchor.
    
    Accepts either a single event object or a list of events.
    For each event:
    1. Validate fields (tag_id, rssi, timestamp)
    2. Ensure anchor exists (create if new)
    3. Ensure tag exists (create if new)
    4. Create patrol event record
    5. Return created record(s)
    """
    results = []
    
    for event_in in events:
        # Use provided anchor_id or default to request context
        anchor_id = event_in.anchor_id or request.headers.get("x-anchor-id", "unknown-anchor")
        
        # Upsert anchor if not exists
        anchor = db.query(Anchor).filter(Anchor.id == anchor_id).first()
        if not anchor:
            anchor = Anchor(
                id=anchor_id,
                name=f"Auto-{anchor_id[:12]}",
            )
            db.add(anchor)
            db.flush()  # Get generated defaults
        
        # Upsert tag if not exists
        tag = db.query(Tag).filter(Tag.id == event_in.tag_id).first()
        if not tag:
            tag = Tag(id=event_in.tag_id, name=event_in.tag_id)
            db.add(tag)
            db.flush()
        
        # Create the patrol event record
        db_event = PatrolEvent(
            timestamp_utc=event_in.timestamp_utc,
            anchor_id=anchor_id,
            tag_id=event_in.tag_id,
            rssi=event_in.rssi,
            battery=event_in.battery,
            raw_json=event_in.model_dump() if event_in.raw_json else None,
            extra=event_in.extra,
        )
        db.add(db_event)
        db.flush()  # Get auto-generated ID
        
        # Build output response
        results.append(PatrolEventOut(
            id=db_event.id,
            received_at=db_event.received_at,
            timestamp_utc=db_event.timestamp_utc,
            anchor_id=db_event.anchor_id,
            tag_id=db_event.tag_id,
            rssi=db_event.rssi,
            battery=db_event.battery,
            lat=anchor.lat,
            lon=anchor.lon,
        ))
    
    db.commit()
    
    return results


@router.get(
    "/events",
    response_model=List[PatrolEventOut],
    summary="Query patrol events",
    description="Retrieve patrol events with optional filtering by date range, tag, anchor, and pagination.",
)
def get_events(
    from_date: Optional[datetime] = Query(
        None, alias="from",
        description="Start of date range (inclusive)",
        examples=["2025-01-01T00:00:00Z"],
    ),
    to_date: Optional[datetime] = Query(
        None, alias="to",
        description="End of date range (inclusive)",
        examples=["2025-01-31T23:59:59Z"],
    ),
    tag_id: Optional[str] = Query(None, description="Filter by tag ID"),
    anchor_id: Optional[str] = Query(None, description="Filter by anchor ID"),
    limit: int = Query(50, ge=1, le=1000, description="Max results per page"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    db: Session = Depends(get_db),
):
    """
    Query patrol events with optional filters.
    
    Returns events ordered by most recent first.
    Supports pagination with limit/offset parameters.
    """
    # Build query with anchor join for lat/lon
    query = (
        db.query(
            PatrolEvent.id,
            PatrolEvent.received_at,
            PatrolEvent.timestamp_utc,
            PatrolEvent.anchor_id,
            PatrolEvent.tag_id,
            PatrolEvent.rssi,
            PatrolEvent.battery,
            Anchor.lat,
            Anchor.lon,
        )
        .outerjoin(Anchor, PatrolEvent.anchor_id == Anchor.id)
    )
    
    # Apply filters
    if from_date:
        query = query.filter(PatrolEvent.timestamp_utc >= from_date)
    if to_date:
        query = query.filter(PatrolEvent.timestamp_utc <= to_date)
    if tag_id:
        query = query.filter(PatrolEvent.tag_id == tag_id)
    if anchor_id:
        query = query.filter(PatrolEvent.anchor_id == anchor_id)
    
    # Order and paginate
    query = query.order_by(desc(PatrolEvent.timestamp_utc)).offset(offset).limit(limit)
    results = query.all()
    
    # Map to output schema
    return [
        PatrolEventOut(
            id=r.id,
            received_at=r.received_at,
            timestamp_utc=r.timestamp_utc,
            anchor_id=r.anchor_id,
            tag_id=r.tag_id,
            rssi=r.rssi,
            battery=r.battery,
            lat=r.lat,
            lon=r.lon,
        )
        for r in results
    ]


@router.get(
    "/events/count",
    summary="Count patrol events",
    description="Get total count of events matching the same filters as /events.",
)
def get_events_count(
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    tag_id: Optional[str] = Query(None),
    anchor_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Return total count of events matching filters."""
    query = db.query(func.count(PatrolEvent.id))
    
    if from_date:
        query = query.filter(PatrolEvent.timestamp_utc >= from_date)
    if to_date:
        query = query.filter(PatrolEvent.timestamp_utc <= to_date)
    if tag_id:
        query = query.filter(PatrolEvent.tag_id == tag_id)
    if anchor_id:
        query = query.filter(PatrolEvent.anchor_id == anchor_id)
    
    count = query.scalar() or 0
    return {"count": count}`,

  'routers/export.py': `"""
Security Patrol - Export Router
=================================
CSV download endpoint for patrol event data.
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


@router.get(
    "/export/csv",
    summary="Export events as CSV",
    description="Download patrol events as CSV file with columns: timestamp_utc, anchor_id, tag_id, rssi, battery, lat, lon",
    responses={
        200: {
            "description": "CSV file download",
            "content": {"text/csv": {}},
        }
    },
)
def export_csv(
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    tag_id: Optional[str] = Query(None),
    anchor_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Export patrol events as a downloadable CSV file.
    
    Columns: timestamp_utc, anchor_id, tag_id, rssi, battery, lat, lon
    Empty values shown as empty strings when lat/lon unknown.
    """
    # Build query (same as GET /events but without pagination)
    query = (
        db.query(
            PatrolEvent.timestamp_utc,
            PatrolEvent.anchor_id,
            PatrolEvent.tag_id,
            PatrolEvent.rssi,
            PatrolEvent.battery,
            Anchor.lat.label('lat'),
            Anchor.lon.label('lon'),
        )
        .outerjoin(Anchor, PatrolEvent.anchor_id == Anchor.id)
    )
    
    # Apply same filters
    if from_date:
        query = query.filter(PatrolEvent.timestamp_utc >= from_date)
    if to_date:
        query = query.filter(PatrolEvent.timestamp_utc <= to_date)
    if tag_id:
        query = query.filter(PatrolEvent.tag_id == tag_id)
    if anchor_id:
        query = query.filter(PatrolEvent.anchor_id == anchor_id)
    
    # Execute ordered query
    results = query.order_by(PatrolEvent.timestamp_utc).all()
    
    # Generate CSV in memory using Python csv module
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header row
    writer.writerow([
        "timestamp_utc",
        "anchor_id",
        "tag_id",
        "rssi",
        "battery",
        "lat",
        "lon",
    ])
    
    # Write data rows
    for row in results:
        writer.writerow([
            row.timestamp_utc.isoformat() if row.timestamp_utc else "",
            row.anchor_id or "",
            row.tag_id or "",
            str(row.rssi) if row.rssi is not None else "",
            str(row.battery) if row.battery is not None else "",
            f"{row.lat:.6f}" if row.lat is not None else "",
            f"{row.lon:.6f}" if row.lon is not None else "",
        ])
    
    csv_data = output.getvalue()
    
    # Generate filename with current timestamp
    filename = (
        f"patrol_events_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    )
    
    return Response(
        content=csv_data,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )`,

  'routers/management.py': `"""
Security Patrol - Management Router
=======================================
CRUD endpoints for managing anchors and tags.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.database import get_db
from app.models import Anchor, Tag, PatrolEvent
from app.schemas import AnchorCreate, AnchorOut, TagCreate, TagOut, ErrorResponse

router = APIRouter()


# ════════════════════════════════════════════════════════════
# ANCHOR ENDPOINTS
# ════════════════════════════════════════════════════════════

@router.get("/anchors", response_model=List[AnchorOut], summary="List all anchors")
def get_anchors(db: Session = Depends(get_db)):
    """List all registered anchors with their event counts."""
    anchors = db.query(Anchor).order_by(Anchor.name).all()
    
    result = []
    for anchor in anchors:
        count = (
            db.query(func.count(PatrolEvent.id))
            .filter(PatrolEvent.anchor_id == anchor.id)
            .scalar()
        ) or 0
        result.append(AnchorOut(
            id=anchor.id,
            name=anchor.name,
            lat=anchor.lat,
            lon=anchor.lon,
            created_at=anchor.created_at,
            event_count=count,
        ))
    
    return result


@router.post(
    "/anchors",
    response_model=AnchorOut,
    status_code=201,
    summary="Register a new anchor",
    responses={409: {"model": ErrorResponse, "description": "Anchor already exists"}},
)
def create_anchor(anchor_data: AnchorCreate, db: Session = Depends(get_db)):
    """Register a new anchor at a physical location."""
    existing = db.query(Anchor).filter(Anchor.id == anchor_data.id).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Anchor '{anchor_data.id}' already exists")
    
    new_anchor = Anchor(**anchor_data.model_dump())
    db.add(new_anchor)
    db.commit()
    db.refresh(new_anchor)
    
    return AnchorOut(
        id=new_anchor.id,
        name=new_anchor.name,
        lat=new_anchor.lat,
        lon=new_anchor.lon,
        created_at=new_anchor.created_at,
        event_count=0,
    )


# ════════════════════════════════════════════════════════════
# TAG ENDPOINTS
# ════════════════════════════════════════════════════════════

@router.get("/tags", response_model=List[TagOut], summary="List all tags")
def get_tags(db: Session = Depends(get_db)):
    """List all registered tags with their event counts."""
    tags = db.query(Tag).order_by(Tag.id).all()
    
    result = []
    for tag in tags:
        count = (
            db.query(func.count(PatrolEvent.id))
            .filter(PatrolEvent.tag_id == tag.id)
            .scalar()
        ) or 0
        result.append(TagOut(
            id=tag.id,
            name=tag.name,
            created_at=tag.created_at,
            event_count=count,
        ))
    
    return result


@router.post(
    "/tags",
    response_model=TagOut,
    status_code=201,
    summary="Register a new tag",
    responses={409: {"model": ErrorResponse, "description": "Tag already exists"}},
)
def create_tag(tag_data: TagCreate, db: Session = Depends(get_db)):
    """Register a new BLE tag/beacon."""
    existing = db.query(Tag).filter(Tag.id == tag_data.id).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Tag '{tag_data.id}' already exists")
    
    new_tag = Tag(**tag_data.model_dump())
    db.add(new_tag)
    db.commit()
    db.refresh(new_tag)
    
    return TagOut(
        id=new_tag.id,
        name=new_tag.name,
        created_at=new_tag.created_at,
        event_count=0,
    )`,

  'requirements.txt': `# Security Patrol - Python Dependencies
# =========================================
# Install: pip install -r requirements.txt

# Web framework
fastapi>=0.104.0
uvicorn[standard]>=0.24.0

# Database ORM
sqlalchemy>=2.0.0
pydantic-settings>=2.0.0

# Data validation (included with FastAPI, explicit here)
pydantic>=2.5.0

# Templating (for Jinja2 dashboard)
jinja2>=3.1.0
python-multipart>=0.0.6

# Development tools (optional)
# pytest>=7.4.0
# httpx>=0.25.0       # For testing async endpoints
# alembic>=1.12.0      # For database migrations`,

  '.env.example': `# Security Patrol - Environment Configuration
# ==============================================
# Copy this file to .env and update values for your deployment.
# NEVER commit .env to version control!

# ── Application ──────────────────────────────────────
APP_NAME=Security Patrol
ENVIRONMENT=development
DEBUG=true
BACKEND_URL=http://localhost:8000

# ── API Security ──────────────────────────────────────
# This key must match API_KEY in ESP32 firmware config.h!
API_KEY=your-secret-api-key-change-me-in-production

# ── Database ──────────────────────────────────────────
# SQLite (development - default):
DATABASE_URL=sqlite:///./security_patrol.db
# PostgreSQL (production):
# DATABASE_URL=postgresql+asyncpg://patrol:password@localhost:5432/security_patrol

# ── CORS ──────────────────────────────────────────────
CORS_ORIGINS=["http://localhost:8000", "http://localhost:3000"]

# ── Timezone ──────────────────────────────────────────
DEFAULT_TIMEZONE=UTC`,

  'scripts/seed_db.py': `#!/usr/bin/env python3
"""
Security Patrol - Database Seed Script
========================================
Populates the database with sample anchors, tags, and simulated
patrol events for development and UI testing.

Usage:
    cd backend
    python scripts/seed_db.py
"""

import sys
import os
from datetime import datetime, timedelta, timezone
import random

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base, SessionLocal
from app.models import Anchor, Tag, PatrolEvent


# ════════════════════════════════════════════════════════════
# SAMPLE DATA
# ════════════════════════════════════════════════════════════

SAMPLE_ANCHORS = [\n    {\n        \"id\": \"ANCHOR-001\",\n        \"name\": \"Main Entrance\",\n        \"lat\": 40.7128,\n        \"lon\": -74.0060,\n    },\n    {\n        \"id\": \"ANCHOR-002\",\n        \"name\": \"Parking Lot A\",\n        \"lat\": 40.7140,\n        \"lon\": -74.0080,\n    },\n    {\n        \"id\": \"ANCHOR-003\",\n        \"name\": \"Rear Loading Dock\",\n        \"lat\": 40.7115,\n        \"lon\": -74.0045,\n    },\n    {\n        \"id\": \"ANCHOR-004\",\n        \"name\": \"Server Room\",\n        \"lat\": 40.7132,\n        \"lon\": -74.0072,\n    },\n    {\n        \"id\": \"ANCHOR-005\",\n        \"name\": \"Executive Floor\",\n        \"lat\": 40.7135,\n        \"lon\": -74.0055,\n    },\n    {\n        \"id\": \"ANCHOR-006\",\n        \"name\": \"Warehouse Bay 1\",\n        \"lat\": 40.7108,\n        \"lon\": -74.0020,\n    },\n    {\n        \"id\": \"ANCHOR-007\",\n        \"name\": \"Security Office\",\n        \"lat\": 40.7120,\n        \"lon\": -74.0040,\n    },\n]

SAMPLE_TAGS = [\n    {\"id\": \"TAG001\", \"name\": \"John Smith - Night Shift\"},\n    {\"id\": \"TAG002\", \"name\": \"Maria Garcia - Day Shift\"},\n    {\"id\": \"TAG003\", \"name\": \"Robert Chen - Supervisor\"},\n    {\"id\": \"TAG004\", \"name\": \"Sarah Williams - Rover\"},\n    {\"id\": \"TAG005\", \"name\": \"James Wilson - Weekend\"},\n]\n\n\ndef seed_database():\n    \"\"\"\n    Clear existing data and populate with sample data.\n    Simulates realistic guard tour activity over the past 7 days.\n    \"\"\"\n    print(\"\\n🔧 Creating database tables...\")\n    Base.metadata.create_all(bind=engine)\n    \n    db = SessionLocal()\n    \n    try:\n        # ── Clear existing data ──────────────────────────────\n        print(\"🗑️  Clearing existing data...\")\n        db.query(PatrolEvent).delete()\n        db.query(Tag).delete()\n        db.query(Anchor).delete()\n        db.commit()\n        \n        # ── Seed Anchors ───────────────────────────────────────\n        print(f\"📍 Creating {len(SAMPLE_ANCHORS)} anchors...\")\n        for anchor_data in SAMPLE_ANCHORS:\n            anchor = Anchor(**anchor_data)\n            db.add(anchor)\n        db.commit()\n        print(f\"   ✅ Created {len(SAMPLE_ANCHORS)} anchors\")\n        \n        # ── Seed Tags ───────────────────────────────────────────\n        print(f\"🏷️  Creating {len(SAMPLE_TAGS)} tags...\")\n        for tag_data in SAMPLE_TAGS:\n            tag = Tag(**tag_data)\n            db.add(tag)\n        db.commit()\n        print(f\"   ✅ Created {len(SAMPLE_TAGS)} tags\")\n        \n        # ── Generate Simulated Patrol Events ──────────────────\n        print(\"📝 Generating patrol events (simulating 7 days of activity)...\")\n        \n        anchors = db.query(Anchor).all()\n        tags = db.query(Tag).all()\n        now = datetime.now(timezone.utc)\n        total_events = 0\n        \n        for days_ago in range(7, 0, -1):\n            day_start = now - timedelta(\n                days=days_ago,\n                hours=now.hour,\n                minutes=now.minute,\n                seconds=now.second,\n            )\n            \n            # Each guard does 3-5 rounds per day\n            for tag in tags:\n                num_rounds = random.randint(3, 5)\n                \n                for round_num in range(num_rounds):\n                    # Random start time during their shift\n                    round_start = day_start + timedelta(\n                        hours=random.randint(0, 23),\n                        minutes=random.randint(0, 59),\n                    )\n                    \n                    # Visit each checkpoint sequentially\n                    visit_interval_min = random.randint(3, 8)\n                    \n                    for i, anchor in enumerate(anchors):\n                        event_time = round_start + timedelta(\n                            minutes=i * visit_interval_min\n                        )\n                        \n                        # RSSI varies: closer anchors have stronger signals\n                        base_rssi = random.randint(-55, -75)\n                        \n                        event = PatrolEvent(\n                            timestamp_utc=event_time,\n                            anchor_id=anchor.id,\n                            tag_id=tag.id,\n                            rssi=base_rssi + random.randint(-10, 10),\n                            battery=random.choice([85, 88, 92, 95, 78, 82, 90]),\n                        )\n                        db.add(event)\n                        total_events += 1\n        \n        db.commit()\n        print(f\"   ✅ Generated {total_events} patrol events\")\n        \n        # ── Summary ──────────────────────────────────────────\n        print(\"\\n\" + \"=\" * 50)\n        print(\"🎉 SEED COMPLETE!\")\n        print(\"=\" * 50)\n        print(f\"   Anchors:  {len(SAMPLE_ANCHORS)}\")\n        print(f\"   Tags:     {len(SAMPLE_TAGS)}\")\n        print(f\"   Events:   {total_events}\")\n        print(f\"   Time span: Last 7 days\")\n        print(\"=\" * 50 + \"\\n\")\n        \n    except Exception as e:\n        print(f\"❌ ERROR: {e}\")\n        db.rollback()\n        raise\n    finally:\n        db.close()\n\n\nif __name__ == \"__main__\":\n    seed_database()`,

};

export default function Backend() {
  const [activeFile, setActiveFile] = useState('main.cpp');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl"><Server className="w-7 h-7 text-white"/></div>
          <div><h1 className="text-3xl font-bold text-gray-900 dark:text-white">FastAPI Backend</h1><p className="text-gray-600 dark:text-gray-400">Python · SQLAlchemy · Pydantic</p></div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <FileTree files={backendFiles} onFileClick={setActiveFile}/>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-700 dark:text-green-300 text-sm mb-2 flex items-center gap-2"><Terminal className="w-4 h-4"/>Quick Start</h4>
              <ol className="text-xs text-green-600 dark:text-green-400 space-y-1 list-decimal list-inside">
                <li><code className="bg-green-100 dark:bg-green-800 px-1 rounded">cd backend</code></li>
                <li><code className="bg-green-100 dark:bg-green-800 px-1 rounded">python -m venv venv</code></li>
                <li><code className="bg-green-100 dark:bg-green-800 px-1 rounded">source venv/bin/activate</code></li>
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
              <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-green-500"/><span className="font-mono text-sm font-medium text-gray-700 dark:text-gray-300">{activeFile}</span></div>
              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full font-medium">Production Ready</span>
            </div>
            <div className="max-h-[70vh] overflow-auto">
              <CodeBlock code={CODE[activeFile]||'// Select a file'} language="python" filename={activeFile}/>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {[{method:'POST',path:'/ingest/patrol',color:'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',auth:'🔒 API Key'},{method:'GET',path:'/health',color:'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',auth:'Public'},{method:'GET',path:'/events',color:'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',auth:'Public'},{method:'GET',path:'/export/csv',color:'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',auth:'Public'},{method:'GET',path:'/anchors',color:'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',auth:'Public'},{method:'POST',path:'/anchors',color:'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',auth:'Public'},{method:'GET',path:'/tags',color:'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',auth:'Public'},{method:'POST',path:'/tags',color:'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',auth:'Public'},{method:'GET',path:'/docs',color:'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',auth:'Swagger UI'}].map((ep,i)=>(<div key={i} className={`p-3 rounded-lg border ${ep.color.split(' ')[0]} border-current/20`}><div className="flex items-center gap-2 mb-1"><span className={`text-xs font-bold px-1.5 py-0.5 rounded ${ep.method==='POST'?'bg-green-500 text-white':'bg-blue-500 text-white'}`}>{ep.method}</span><code className="text-xs truncate">{ep.path}</code></div><div className="text-xs opacity-75">{ep.auth}</div></div>))}
          </div>
        </div>
      </div>
    </div>
  );
}
