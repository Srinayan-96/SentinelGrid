from fastapi import FastAPI
from routers.triage import router as triage_router
from routers.sitrep import router as sitrep_router

app = FastAPI(
    title="Disaster Relief AI Service",
    version="1.0.0",
)

app.include_router(triage_router)
app.include_router(sitrep_router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai-service"}
