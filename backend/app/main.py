import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import analysis, backtest, holdings, news, stocks, watchlist
from app.scheduler import shutdown_scheduler, start_scheduler

# Uvicorn's default logging config only wires handlers for its own
# "uvicorn.*" loggers, not the root logger — without this, app-level
# logger.info/exception calls (scheduler runs, background sync failures)
# never reach `docker compose logs`.
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    shutdown_scheduler()


app = FastAPI(title="AI Stock Coach", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stocks.router)
app.include_router(analysis.router)
app.include_router(news.router)
app.include_router(holdings.router)
app.include_router(backtest.router)
app.include_router(watchlist.router)


@app.get("/health")
def health():
    return {"status": "ok"}
