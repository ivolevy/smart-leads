import requests
import json
import logging
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Rubro to OSM Tags mapper
RUBRO_MAP = {
    "metalurgicas": [
        '["craft"="metal_construction"]',
        '["industrial"="metal_working"]',
        '["shop"="metal"]'
    ],
    "restaurantes": [
        '["amenity"="restaurant"]',
        '["amenity"="cafe"]'
    ],
    "hoteles": [
        '["tourism"="hotel"]',
        '["tourism"="hostel"]'
    ],
    "abogados": [
        '["office"="lawyer"]'
    ],
    "contadores": [
        '["office"="accountant"]'
    ],
    "inmobiliarias": [
        '["office"="estate_agent"]'
    ],
    "concesionarios": [
        '["shop"="car"]'
    ],
}

class OverpassClient:
    def __init__(self):
        self.url = OVERPASS_URL

    def search_by_area(self, rubro: str, city_name: str = None, bbox: List[float] = None, radius: int = 5, lat: float = None, lng: float = None) -> List[Dict[Any, Any]]:
        """
        Search for companies by rubro in a specific area.
        """
        tags = RUBRO_MAP.get(rubro.lower(), [f'["shop"="{rubro}"]', f'["amenity"="{rubro}"]', f'["office"="{rubro}"]'])
        
        query_parts = []
        for tag in tags:
            if city_name:
                query_parts.append(f'nwr{tag}(area.searchArea);')
            elif bbox:
                # bbox format: [min_lat, min_lon, max_lat, max_lon]
                query_parts.append(f'nwr{tag}({bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]});')
            elif lat and lng:
                query_parts.append(f'nwr{tag}(around:{radius * 1000},{lat},{lng});')

        if city_name:
            area_query = f'area[name="{city_name}"]->.searchArea;'
        else:
            area_query = ""

        full_query = f"""
        [out:json][timeout:25];
        {area_query}
        (
            {"".join(query_parts)}
        );
        out body;
        >;
        out skel qt;
        """
        
        try:
            logger.info(f"Querying Overpass for {rubro}")
            response = requests.post(self.url, data={"data": full_query})
            response.raise_for_status()
            data = response.json()
            
            results = []
            for element in data.get("elements", []):
                if "tags" in element:
                    tags = element["tags"]
                    results.append({
                        "osm_id": element.get("id"),
                        "nombre": tags.get("name", "N/A"),
                        "rubro": rubro,
                        "rubro_key": tags.get("shop") or tags.get("amenity") or tags.get("office") or tags.get("craft"),
                        "website": tags.get("website") or tags.get("contact:website"),
                        "telefono": tags.get("phone") or tags.get("contact:phone"),
                        "email": tags.get("email") or tags.get("contact:email"),
                        "direccion": tags.get("addr:full") or f"{tags.get('addr:street', '')} {tags.get('addr:housenumber', '')}",
                        "ciudad": tags.get("addr:city") or city_name,
                        "pais": tags.get("addr:country"),
                        "latitud": element.get("lat") or element.get("center", {}).get("lat"),
                        "longitud": element.get("lon") or element.get("center", {}).get("lon"),
                    })
            
            # Remove duplicates and N/A names if possible
            seen_ids = set()
            unique_results = []
            for res in results:
                if res["osm_id"] not in seen_ids:
                    unique_results.append(res)
                    seen_ids.add(res["osm_id"])
            
            return unique_results
            
        except Exception as e:
            logger.error(f"Error querying Overpass API: {e}")
            return []

overpass_client = OverpassClient()
