import requests
from bs4 import BeautifulSoup
import re
import concurrent.futures
from typing import List, Dict, Any, Set
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

EMAIL_REGEX = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
PHONE_REGEX = r'\+?(\d{1,3})?[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,5}[\s.-]?\d{3,5}'

class Scraper:
    def __init__(self, max_workers: int = 10):
        self.max_workers = max_workers
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        })

    def normalize_url(self, url: str) -> str:
        if not url:
            return ""
        if not url.startswith("http"):
            return "http://" + url
        return url

    def extract_from_page(self, url: str) -> Dict[str, Set[str]]:
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            
            text = soup.get_text()
            emails = set(re.findall(EMAIL_REGEX, text))
            phones = set(re.findall(PHONE_REGEX, text))
            
            # Filter generic emails
            generic_emails = {"noreply", "support", "info", "contact", "sales"}
            filtered_emails = {e for e in emails if not any(g in e.lower() for g in generic_emails)}
            
            # If no filtered emails, keep original ones but info/contact is often better than nothing
            if not filtered_emails:
                filtered_emails = {e for e in emails if "example" not in e and "domain" not in e}

            socials = {
                "facebook": "",
                "linkedin": "",
                "instagram": "",
                "twitter": ""
            }
            
            for a in soup.find_all("a", href=True):
                href = a["href"].lower()
                if "facebook.com" in href:
                    socials["facebook"] = a["href"]
                elif "linkedin.com" in href:
                    socials["linkedin"] = a["href"]
                elif "instagram.com" in href:
                    socials["instagram"] = a["href"]
                elif "twitter.com" in href or "x.com" in href:
                    socials["twitter"] = a["href"]

            return {
                "emails": filtered_emails,
                "phones": phones,
                "socials": socials
            }
        except Exception as e:
            logger.error(f"Error scraping {url}: {e}")
            return {"emails": set(), "phones": set(), "socials": {}}

    def scrape_company(self, company: Dict[str, Any]) -> Dict[str, Any]:
        website = self.normalize_url(company.get("website"))
        if not website:
            return company

        results = self.extract_from_page(website)
        
        # Try subpages if nothing found
        if not results["emails"] and not results["phones"]:
            subpages = ["contact", "contacto", "about", "nosotros", "contact-us"]
            for sub in subpages:
                sub_url = f"{website.rstrip('/')}/{sub}"
                sub_results = self.extract_from_page(sub_url)
                results["emails"].update(sub_results["emails"])
                results["phones"].update(sub_results["phones"])
                for k, v in sub_results["socials"].items():
                    if v and not results["socials"][k]:
                        results["socials"][k] = v
                if results["emails"] or results["phones"]:
                    break

        # Update company dict
        if results["emails"]:
            company["email"] = list(results["emails"])[0] # Take first valid email
        if results["phones"]:
            company["telefono"] = list(results["phones"])[0]
        
        company["facebook"] = results["socials"]["facebook"]
        company["linkedin"] = results["socials"]["linkedin"]
        
        # Validation logic
        if company.get("email") or company.get("telefono"):
            company["validada"] = True
            
        return company

    def enrich_companies(self, companies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            enriched = list(executor.map(self.scrape_company, companies))
        return enriched

scraper = Scraper()
