from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import harvest, ai, dashboard, cron, producers, anomaly_router

app = FastAPI(title="CoopNet API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(harvest.router)
app.include_router(ai.router)
app.include_router(dashboard.router)
app.include_router(cron.router)
app.include_router(producers.router)
app.include_router(anomaly_router.router)


@app.get("/health")
def health():
    return {"status": "ok"}
