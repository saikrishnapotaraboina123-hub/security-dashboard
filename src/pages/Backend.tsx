import { motion } from 'framer-motion';
import CodeBlock from '../components/CodeBlock';
import FileTree from '../components/FileTree';
import { Server, Terminal, FileText } from 'lucide-react';
import { useState } from 'react';

const backendFiles = [
  {
    name: 'backend',
    type: 'folder' as const,
    children: [
      { name: 'main.py', type: 'file' as const, highlight: true },
      { name: 'config.py', type: 'file' as const, highlight: true },
      { name: 'database.py', type: 'file' as const, highlight: true },
      { name: 'models.py', type: 'file' as const, highlight: true },
      { name: 'schemas.py', type: 'file' as const, highlight: true },
      { name: 'patrol.py', type: 'file' as const, highlight: true },
      { name: 'export.py', type: 'file' as const, highlight: true },
      { name: 'management.py', type: 'file' as const, highlight: true },
      { name: 'requirements.txt', type: 'file' as const, highlight: true },
      { name: '.env.example', type: 'file' as const, highlight: true },
    ],
  },
];

const CODE: Record<string, string> = {
  'main.py': `from fastapi import FastAPI

app = FastAPI(title="Security Patrol API")

@app.get("/")
def root():
    return {"message": "Security Patrol Backend Running"}

@app.get("/health")
def health():
    return {"status": "ok"}
`,

  'config.py': `from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Security Patrol"
    API_KEY: str = "secret-key"
    DATABASE_URL: str = "sqlite:///./security_patrol.db"

settings = Settings()
`,

  'database.py': `from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = "sqlite:///./security_patrol.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(bind=engine)

class Base(DeclarativeBase):
    pass
`,

  'models.py': `from sqlalchemy import Column, Integer, String
from app.database import Base

class Guard(Base):
    __tablename__ = "guards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
`,

  'schemas.py': `from pydantic import BaseModel

class GuardCreate(BaseModel):
    name: str

class GuardOut(BaseModel):
    id: int
    name: str

    model_config = {
        "from_attributes": True
    }
`,

  'patrol.py': `from fastapi import APIRouter

router = APIRouter()

@router.get("/events")
def get_events():
    return [
        {
            "guard": "John",
            "checkpoint": "Gate A",
            "time": "10:30 PM"
        }
    ]
`,

  'export.py': `from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

router = APIRouter()

@router.get("/export")
def export_csv():
    csv_data = "name,time\\nJohn,10:30 PM"
    return PlainTextResponse(csv_data)
`,

  'management.py': `from fastapi import APIRouter

router = APIRouter()

@router.get("/guards")
def get_guards():
    return [
        {"id": 1, "name": "John"},
        {"id": 2, "name": "Alex"}
    ]
`,

  'requirements.txt': `fastapi
uvicorn
sqlalchemy
pydantic
pydantic-settings
`,

  '.env.example': `API_KEY=secret-key
DATABASE_URL=sqlite:///./security_patrol.db
`,
};

export default function Backend() {
  const [activeFile, setActiveFile] = useState('main.py');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
            <Server className="w-7 h-7 text-white" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              FastAPI Backend
            </h1>

            <p className="text-gray-600 dark:text-gray-400">
              Python · SQLAlchemy · Pydantic
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <FileTree
              files={backendFiles}
              onFileClick={(file) => {
                const fileName = file.split('/').pop() || file;
                setActiveFile(fileName);
              }}
            />

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-700 dark:text-green-300 text-sm mb-2 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Quick Start
              </h4>

              <ol className="text-xs text-green-600 dark:text-green-400 space-y-1 list-decimal list-inside">
                <li>
                  <code className="bg-green-100 dark:bg-green-800 px-1 rounded">
                    cd backend
                  </code>
                </li>

                <li>
                  <code className="bg-green-100 dark:bg-green-800 px-1 rounded">
                    python -m venv venv
                  </code>
                </li>

                <li>
                  <code className="bg-green-100 dark:bg-green-800 px-1 rounded">
                    pip install -r requirements.txt
                  </code>
                </li>

                <li>
                  <code className="bg-green-100 dark:bg-green-800 px-1 rounded">
                    uvicorn main:app --reload
                  </code>
                </li>
              </ol>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-500" />

                <span className="font-mono text-sm font-medium text-gray-700 dark:text-gray-300">
                  {activeFile}
                </span>
              </div>

              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full font-medium">
                Working
              </span>
            </div>

            <div className="max-h-[70vh] overflow-auto">
              <CodeBlock
                code={CODE[activeFile] || '// Select a file'}
                language="python"
                filename={activeFile}
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {
                method: 'GET',
                path: '/',
                color:
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                auth: 'Public',
              },
              {
                method: 'GET',
                path: '/health',
                color:
                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
                auth: 'Public',
              },
              {
                method: 'GET',
                path: '/events',
                color:
                  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
                auth: 'Public',
              },
              {
                method: 'GET',
                path: '/guards',
                color:
                  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
                auth: 'Public',
              },
            ].map((ep, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${ep.color.split(' ')[0]} border-current/20`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      ep.method === 'POST'
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}
                  >
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
