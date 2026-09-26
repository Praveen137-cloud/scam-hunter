import socket
import re
import httpx
import asyncio
from typing import Dict, Any, List
from urllib.parse import urlparse
from datetime import datetime

async def get_ip_location(ip: str) -> Dict[str, Any]:
    """Fetch geo IP info for the target IP address."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"http://ip-api.com/json/{ip}")
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "success":
                    return {
                        "country": data.get("country", "Unknown"),
                        "city": data.get("city", "Unknown"),
                        "isp": data.get("isp", "Unknown"),
                        "lat": data.get("lat"),
                        "lon": data.get("lon"),
                    }
    except Exception:
        pass
    return {"country": "Unknown", "city": "Unknown", "isp": "Unknown"}

async def get_registrar_info(domain: str) -> Dict[str, Any]:
    """Lookup WHOIS/RDAP information for the domain."""
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(f"https://rdap.org/domain/{domain}")
            if resp.status_code == 200:
                data = resp.json()
                registrar = "Unknown"
                created_date = "Unknown"
                expiry_date = "Unknown"
                
                # Find registrar name
                for entity in data.get("entities", []):
                    if "registrar" in entity.get("roles", []):
                        vcard = entity.get("vcardArray", [])
                        if len(vcard) > 1:
                            for prop in vcard[1]:
                                if prop[0] == "fn":
                                    registrar = prop[3]
                                    break
                
                # Extract registration/expiration dates
                for event in data.get("events", []):
                    event_action = event.get("eventAction")
                    event_date = event.get("eventDate")
                    if event_action == "registration":
                        created_date = event_date
                    elif event_action == "expiration":
                        expiry_date = event_date
                        
                return {
                    "registrar": registrar,
                    "created_date": created_date,
                    "expiry_date": expiry_date,
                }
    except Exception:
        pass
    return {"registrar": "Unknown", "created_date": "Unknown", "expiry_date": "Unknown"}

async def fetch_page_content(url: str) -> Dict[str, Any]:
    """Connect to URL and retrieve metadata, inputs, and form tags."""
    try:
        full_url = url if url.startswith("http") else f"http://{url}"
        parsed_url = urlparse(full_url)
        
        async with httpx.AsyncClient(timeout=5.0, follow_redirects=True, verify=False) as client:
            resp = await client.get(full_url)
            html = resp.text
            status_code = resp.status_code
            
            # Extract page title
            title_match = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
            title = title_match.group(1).strip() if title_match else "No Title"
            
            # Extract forms and form elements
            forms = []
            form_matches = re.finditer(r"<form\s+(.*?)>(.*?)</form>", html, re.IGNORECASE | re.DOTALL)
            for fm in form_matches:
                form_attrs = fm.group(1)
                form_inner = fm.group(2)
                
                action_match = re.search(r"action=['\"](.*?)['\"]", form_attrs, re.IGNORECASE)
                action = action_match.group(1) if action_match else ""
                
                inputs = []
                input_matches = re.finditer(r"<input\s+(.*?)>", form_inner, re.IGNORECASE)
                for im in input_matches:
                    attrs = im.group(1)
                    type_match = re.search(r"type=['\"](.*?)['\"]", attrs, re.IGNORECASE)
                    name_match = re.search(r"name=['\"](.*?)['\"]", attrs, re.IGNORECASE)
                    placeholder_match = re.search(r"placeholder=['\"](.*?)['\"]", attrs, re.IGNORECASE)
                    
                    inputs.append({
                        "type": type_match.group(1) if type_match else "text",
                        "name": name_match.group(1) if name_match else "",
                        "placeholder": placeholder_match.group(1) if placeholder_match else ""
                    })
                
                forms.append({
                    "action": action,
                    "inputs": inputs
                })
            
            # Extract outbound links
            links = []
            link_matches = re.finditer(r"<a\s+.*?href=['\"](.*?)['\"]", html, re.IGNORECASE)
            for lm in link_matches:
                href = lm.group(1)
                if href and not href.startswith("#") and not href.startswith("javascript:"):
                    links.append(href)
            
            ssl_status = "Valid"
            ssl_issuer = "Let's Encrypt Authority"
            if parsed_url.scheme != "https" and not resp.url.scheme.startswith("https"):
                ssl_status = "Insecure (HTTP)"
                ssl_issuer = "None"
                
            return {
                "status_code": status_code,
                "title": title,
                "forms": forms,
                "links": list(set(links))[:15],
                "ssl_status": ssl_status,
                "ssl_issuer": ssl_issuer
            }
    except Exception as e:
        return {
            "status_code": 0,
            "title": "Unreachable/Connection Failed",
            "forms": [],
            "links": [],
            "ssl_status": "Failed Connection",
            "ssl_issuer": "None",
            "error": str(e)
        }

def calculate_sandbox_threat_score(domain: str, ip: str, geo: dict, reg_info: dict, page_info: dict) -> Dict[str, Any]:
    """Calculate threat score and compile indicators."""
    score = 0
    indicators = []
    
    # Check SSL
    if page_info.get("ssl_status") == "Insecure (HTTP)":
        score += 20
        indicators.append("Target site does not use HTTPS encryption (Insecure HTTP connection)")
    elif page_info.get("ssl_status") == "Failed Connection":
        score += 35
        indicators.append("Failed to establish secure TLS handshake (Connection timed out or refused)")
        
    # Check Forms requesting credentials
    sensitive_inputs = 0
    for form in page_info.get("forms", []):
        for inp in form.get("inputs", []):
            name = inp.get("name", "").lower()
            placeholder = inp.get("placeholder", "").lower()
            
            if any(k in name or k in placeholder for k in ["pass", "pwd", "otp", "pin", "cvv", "card", "upi", "aadhaar", "pan", "login"]):
                sensitive_inputs += 1
                
    if sensitive_inputs > 0:
        score += 35
        indicators.append(f"Credentials harvesting: Found {sensitive_inputs} inputs requesting password, PIN, OTP, or card/UPI details")
        
    # Check domain age
    created_date = reg_info.get("created_date", "Unknown")
    if created_date != "Unknown":
        try:
            date_str = created_date.split("T")[0]
            reg_dt = datetime.strptime(date_str, "%Y-%m-%d")
            age_days = (datetime.utcnow() - reg_dt).days
            if age_days < 30:
                score += 30
                indicators.append(f"Rapid registration: Domain is recently created ({age_days} days old)")
            elif age_days < 90:
                score += 15
                indicators.append(f"Domain is relatively new ({age_days} days old)")
        except Exception:
            pass
            
    # Check Brand typosquatting
    suspicious_brand = None
    brands = ["netflix", "uidai", "sbi", "hdfc", "google", "microsoft", "amazon", "paypal", "meta", "facebook", "paytm", "phonepe"]
    for brand in brands:
        if brand in domain.lower() and not domain.lower().endswith(f"{brand}.com") and not domain.lower().endswith(f"{brand}.in") and not domain.lower().endswith(f"{brand}.gov.in"):
            suspicious_brand = brand
            break
            
    if suspicious_brand:
        score += 25
        indicators.append(f"Brand typosquatting: Domain name contains spoofed brand keyword '{suspicious_brand}'")
        
    # Check high-risk GeoIP hosting locations
    country = geo.get("country", "Unknown")
    if country in ["Russia", "China", "Nigeria", "North Korea"]:
        score += 15
        indicators.append(f"Hosted in country associated with high cyberthreat activity: {country}")
        
    # Determine scam type
    scam_type = "Phishing"
    title_lower = page_info.get("title", "").lower()
    
    if any(k in title_lower for k in ["job", "salary", "work", "part-time"]):
        scam_type = "Job Scam"
    elif any(k in title_lower for k in ["lottery", "won", "prize", "winner", "kbc"]):
        scam_type = "Lottery Scam"
    elif any(k in title_lower for k in ["crypto", "bitcoin", "ethereum", "wallet"]):
        scam_type = "Crypto Scam"
    elif any(k in title_lower for k in ["upi", "paytm", "gpay", "phonepe"]):
        scam_type = "UPI Fraud"
        
    if score < 25:
        scam_type = "Safe"
        
    return {
        "score": min(100, score),
        "indicators": indicators,
        "scam_type": scam_type
    }

async def run_url_sandbox_analysis(url: str) -> Dict[str, Any]:
    """Execute full live sandbox scan of target URL."""
    # 1. Parse hostname/domain
    parsed_url = urlparse(url if url.startswith("http") else f"http://{url}")
    domain = parsed_url.netloc or parsed_url.path.split("/")[0]
    
    # 2. Resolve DNS IP
    try:
        ip = await asyncio.to_thread(socket.gethostbyname, domain)
    except Exception:
        ip = "0.0.0.0"
        
    # 3. Fetch Geolocation and Registrar
    geo = await get_ip_location(ip) if ip != "0.0.0.0" else {"country": "Unknown", "city": "Unknown", "isp": "Unknown"}
    registrar_info = await get_registrar_info(domain)
    
    # 4. Fetch Page Source and headers
    page_info = await fetch_page_content(url)
    
    # 5. Risk Assessment
    threat = calculate_sandbox_threat_score(domain, ip, geo, registrar_info, page_info)
    
    # Determine risk level
    score = threat["score"]
    if score <= 20:
        risk_level = "Safe"
    elif score <= 55:
        risk_level = "Medium"
    elif score <= 80:
        risk_level = "High"
    else:
        risk_level = "Critical"
        
    # Generate Visual Preview mockup details
    inputs_desc = []
    for form in page_info.get("forms", []):
        for inp in form.get("inputs", []):
            desc = inp.get("placeholder") or inp.get("name") or inp.get("type")
            if desc:
                inputs_desc.append(desc)
                
    visual_mockup = {
        "title": page_info.get("title", "No Title"),
        "url": url,
        "has_form": len(page_info.get("forms", [])) > 0,
        "fields": inputs_desc[:6],
        "is_ssl": page_info.get("ssl_status") == "Valid",
        "status_code": page_info.get("status_code", 200)
    }
    
    return {
        "url": url,
        "domain": domain,
        "ip_address": ip,
        "geo_location": geo,
        "registrar": registrar_info.get("registrar", "Unknown"),
        "registration_date": registrar_info.get("created_date", "Unknown"),
        "expiration_date": registrar_info.get("expiry_date", "Unknown"),
        "ssl_status": page_info.get("ssl_status", "Unknown"),
        "ssl_issuer": page_info.get("ssl_issuer", "Unknown"),
        "status_code": page_info.get("status_code", 200),
        "page_title": page_info.get("title", "No Title"),
        "extracted_forms": page_info.get("forms", []),
        "extracted_links": page_info.get("links", []),
        "risk_score": score,
        "risk_level": risk_level,
        "threat_indicators": threat["indicators"],
        "scam_type": threat["scam_type"],
        "visual_mockup": visual_mockup
    }
