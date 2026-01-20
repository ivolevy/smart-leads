import os
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
import logging

from overpass_client import overpass_client
from scraper import scraper
from db_supabase import supabase
from email_service import email_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="B2B Lead Acquisition API")

FRONTEND_URL = os.getenv("FRONTEND_URL", "*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL], # Dynamically set from .env
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class SearchRequest(BaseModel):
    rubro: str
    location_name: Optional[str] = None
    bbox: Optional[List[float]] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    radius: Optional[int] = 5
    user_id: str

# Progress tracking (simplistic in-memory for this demo, use Redis for production)
progress_store = {}

async def run_search_workflow(request: SearchRequest, search_id: str):
    try:
        progress_store[search_id] = 5
        
        # 1. OSM Search (0-15%)
        companies = overpass_client.search_by_area(
            rubro=request.rubro,
            city_name=request.location_name,
            bbox=request.bbox,
            lat=request.lat,
            lng=request.lng,
            radius=request.radius
        )
        progress_store[search_id] = 15
        
        if not companies:
            progress_store[search_id] = 100
            return

        # 2. Parallel Scraping (15-85%)
        # For large lists, we'd update progress more granularly
        total = len(companies)
        enriched_companies = []
        
        # Batch processing for progress reporting
        batch_size = max(1, total // 10)
        for i in range(0, total, batch_size):
            batch = companies[i:i+batch_size]
            enriched_batch = scraper.enrich_companies(batch)
            enriched_companies.extend(enriched_batch)
            
            p = 15 + int((len(enriched_companies) / total) * 70)
            progress_store[search_id] = min(p, 85)

        progress_store[search_id] = 85
        
        # 3. Validation & Saving (85-100%)
        # Save search history
        search_data = {
            "id": search_id,
            "user_id": request.user_id,
            "rubro": request.rubro,
            "ubicacion_nombre": request.location_name,
            "empresas_encontradas": total,
            "empresas_validas": len([c for c in enriched_companies if c.get("validada")])
        }
        supabase.table("search_history").insert(search_data).execute()
        
        # Upsert companies
        for company in enriched_companies:
            supabase.table("empresas").upsert(company, on_conflict="osm_id").execute()
            
        progress_store[search_id] = 100
        logger.info(f"Search {search_id} completed successfully.")
        
    except Exception as e:
        logger.error(f"Error in search workflow: {e}")
        progress_store[search_id] = -1 # Error state

@app.post("/search")
async def start_search(request: SearchRequest, background_tasks: BackgroundTasks):
    search_id = str(uuid.uuid4())
    progress_store[search_id] = 0
    background_tasks.add_task(run_search_workflow, request, search_id)
    return {"search_id": search_id}

@app.get("/search/{search_id}/progress")
async def get_progress(search_id: str):
    if search_id not in progress_store:
        raise HTTPException(status_code=404, detail="Search ID not found")
    return {"progress": progress_store[search_id]}

@app.get("/empresas")
async def list_empresas(rubro: Optional[str] = None, validada: Optional[bool] = None):
    query = supabase.table("empresas").select("*")
    if rubro:
        query = query.eq("rubro", rubro)
    if validada is not None:
        query = query.eq("validada", validada)
    
    result = query.execute()
    return result.data

@app.post("/send-email")
async def send_marketing_email(payload: Dict[str, Any]):
    # payload: { user_id, empresa_id, template_id }
    user_id = payload.get("user_id")
    empresa_id = payload.get("empresa_id")
    template_id = payload.get("template_id")
    
    # Fetch template
    template_res = supabase.table("email_templates").select("*").eq("id", template_id).single().execute()
    template = template_res.data
    
    # Fetch company
    empresa_res = supabase.table("empresas").select("*").eq("id", empresa_id).single().execute()
    empresa = empresa_res.data
    
    # Render
    body_html = email_service.render_template(template["body_html"], empresa)
    body_text = email_service.render_template(template.get("body_text", ""), empresa)
    
    # Send
    success = email_service.send_email(empresa["email"], template["subject"], body_html, body_text)
    
    # Log history
    history_data = {
        "user_id": user_id,
        "empresa_nombre": empresa["nombre"],
        "empresa_email": empresa["email"],
        "template_id": template_id,
        "status": "sent" if success else "failed"
    }
    supabase.table("email_history").insert(history_data).execute()
    
    return {"success": success}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
