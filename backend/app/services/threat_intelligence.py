import httpx
import asyncio
from typing import Dict, List, Any, Optional
from app.core.config import settings
import re
import hashlib


async def check_virustotal(target: str, target_type: str = "url") -> Dict[str, Any]:
    """Check URL or IP with VirusTotal API."""
    if not settings.VIRUSTOTAL_API_KEY:
        return {"source": "virustotal", "status": "api_key_missing", "risk_score": 0}
    
    headers = {"x-apikey": settings.VIRUSTOTAL_API_KEY}
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            if target_type == "url":
                import base64
                url_id = base64.urlsafe_b64encode(target.encode()).decode().rstrip("=")
                response = await client.get(
                    f"https://www.virustotal.com/api/v3/urls/{url_id}",
                    headers=headers
                )
            elif target_type == "ip":
                response = await client.get(
                    f"https://www.virustotal.com/api/v3/ip_addresses/{target}",
                    headers=headers
                )
            else:
                return {"source": "virustotal", "status": "unsupported_type"}
            
            if response.status_code == 200:
                data = response.json()
                stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
                malicious = stats.get("malicious", 0)
                suspicious = stats.get("suspicious", 0)
                total = sum(stats.values()) if stats else 1
                risk_score = min(100, ((malicious * 2 + suspicious) / max(total, 1)) * 100)
                
                return {
                    "source": "virustotal",
                    "status": "success",
                    "malicious_count": malicious,
                    "suspicious_count": suspicious,
                    "total_engines": total,
                    "risk_score": round(risk_score, 2),
                    "is_malicious": malicious > 0,
                    "stats": stats
                }
            elif response.status_code == 404:
                return {"source": "virustotal", "status": "not_found", "risk_score": 0}
            else:
                return {"source": "virustotal", "status": f"error_{response.status_code}", "risk_score": 0}
    except Exception as e:
        return {"source": "virustotal", "status": "error", "error": str(e), "risk_score": 0}


async def check_urlscan(url: str) -> Dict[str, Any]:
    """Submit URL to URLScan.io and get results."""
    if not settings.URLSCAN_API_KEY:
        return {"source": "urlscan", "status": "api_key_missing", "risk_score": 0}
    
    headers = {
        "API-Key": settings.URLSCAN_API_KEY,
        "Content-Type": "application/json"
    }
    
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            submit_response = await client.post(
                "https://urlscan.io/api/v1/scan/",
                headers=headers,
                json={"url": url, "visibility": "private"}
            )
            
            if submit_response.status_code in [200, 201]:
                result_data = submit_response.json()
                uuid = result_data.get("uuid")
                
                await asyncio.sleep(10)
                
                result_response = await client.get(
                    f"https://urlscan.io/api/v1/result/{uuid}/",
                    timeout=15.0
                )
                
                if result_response.status_code == 200:
                    scan_data = result_response.json()
                    verdicts = scan_data.get("verdicts", {})
                    overall = verdicts.get("overall", {})
                    
                    return {
                        "source": "urlscan",
                        "status": "success",
                        "malicious": overall.get("malicious", False),
                        "score": overall.get("score", 0),
                        "risk_score": overall.get("score", 0),
                        "categories": overall.get("categories", []),
                        "screenshot_url": scan_data.get("task", {}).get("screenshotURL"),
                        "result_url": f"https://urlscan.io/result/{uuid}/"
                    }
            
            return {"source": "urlscan", "status": "scan_pending", "risk_score": 0}
    except Exception as e:
        return {"source": "urlscan", "status": "error", "error": str(e), "risk_score": 0}


async def check_abuseipdb(ip: str) -> Dict[str, Any]:
    """Check IP reputation with AbuseIPDB."""
    if not settings.ABUSEIPDB_API_KEY:
        return {"source": "abuseipdb", "status": "api_key_missing", "risk_score": 0}
    
    headers = {
        "Key": settings.ABUSEIPDB_API_KEY,
        "Accept": "application/json"
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://api.abuseipdb.com/api/v2/check",
                headers=headers,
                params={"ipAddress": ip, "maxAgeInDays": 90, "verbose": True}
            )
            
            if response.status_code == 200:
                data = response.json().get("data", {})
                confidence = data.get("abuseConfidenceScore", 0)
                
                return {
                    "source": "abuseipdb",
                    "status": "success",
                    "abuse_confidence_score": confidence,
                    "risk_score": confidence,
                    "is_whitelisted": data.get("isWhitelisted", False),
                    "country_code": data.get("countryCode"),
                    "isp": data.get("isp"),
                    "total_reports": data.get("totalReports", 0),
                    "last_reported": data.get("lastReportedAt")
                }
            return {"source": "abuseipdb", "status": f"error_{response.status_code}", "risk_score": 0}
    except Exception as e:
        return {"source": "abuseipdb", "status": "error", "error": str(e), "risk_score": 0}


def extract_domain(url: str) -> Optional[str]:
    """Extract domain from URL."""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url if url.startswith("http") else f"https://{url}")
        return parsed.netloc or parsed.path.split("/")[0]
    except Exception:
        return None


def extract_ip_from_text(text: str) -> List[str]:
    """Extract IP addresses from text."""
    ip_pattern = r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b'
    return list(set(re.findall(ip_pattern, text)))


SUSPICIOUS_KEYWORDS = [
    "urgent", "winner", "lottery", "prize", "claim", "verify", "account suspended",
    "click here", "free money", "guaranteed", "act now", "limited time", "congratulations",
    "selected", "won", "transfer", "bitcoin", "crypto", "investment return",
    "otp", "kyc", "aadhaar", "pan card", "bank details", "credit card",
    "password", "login", "verify account", "unusual activity", "security alert"
]

SUSPICIOUS_DOMAINS = [
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd",
    "rebrand.ly", "cutt.ly", "short.io"
]


def calculate_text_risk_score(text: str, entities: dict) -> Dict[str, Any]:
    """Calculate risk score based on text content and extracted entities."""
    score = 0
    indicators = []
    
    text_lower = text.lower()
    
    keyword_hits = []
    for keyword in SUSPICIOUS_KEYWORDS:
        if keyword.lower() in text_lower:
            keyword_hits.append(keyword)
    
    if keyword_hits:
        score += min(40, len(keyword_hits) * 5)
        indicators.append(f"Suspicious keywords: {', '.join(keyword_hits[:5])}")
    
    if entities.get("urls"):
        score += min(20, len(entities["urls"]) * 5)
        for url in entities["urls"]:
            domain = extract_domain(url)
            if domain and any(sd in domain for sd in SUSPICIOUS_DOMAINS):
                score += 15
                indicators.append(f"URL shortener detected: {domain}")
    
    if entities.get("upi_ids"):
        score += 20
        indicators.append(f"UPI IDs found: {', '.join(entities['upi_ids'][:3])}")
    
    if entities.get("crypto_wallets"):
        score += 25
        indicators.append(f"Crypto wallets found: {len(entities['crypto_wallets'])} detected")
    
    if entities.get("phones"):
        score += 5
        indicators.append(f"Phone numbers found: {len(entities['phones'])}")
    
    urgency_patterns = [r'\b\d+\s*hours?\b', r'expire', r'deadline', r'immediately', r'asap']
    for pattern in urgency_patterns:
        if re.search(pattern, text_lower):
            score += 10
            indicators.append("Urgency language detected")
            break
    
    money_pattern = r'(?:rs\.?|inr|₹|\$|usd)\s*[\d,]+|[\d,]+\s*(?:lakh|crore|million|thousand)'
    if re.search(money_pattern, text_lower):
        score += 10
        indicators.append("Money/financial amounts mentioned")
    
    return {
        "score": min(100, score),
        "indicators": indicators
    }


def classify_scam_type(text: str, entities: dict) -> Dict[str, Any]:
    """Classify the type of scam based on content analysis."""
    text_lower = text.lower()
    
    scam_patterns = {
        "Phishing": {
            "keywords": ["login", "verify", "account", "password", "credentials", "bank", "otp", "suspended"],
            "weight": 0
        },
        "UPI Fraud": {
            "keywords": ["upi", "paytm", "gpay", "phonepe", "bhim", "upi id", "@", "payment", "transfer money"],
            "weight": 0
        },
        "Job Scam": {
            "keywords": ["job offer", "salary", "work from home", "hiring", "recruitment", "employment", "wfh", "remote job"],
            "weight": 0
        },
        "Lottery Scam": {
            "keywords": ["lottery", "winner", "prize", "won", "jackpot", "lucky draw", "congratulations"],
            "weight": 0
        },
        "Investment Scam": {
            "keywords": ["investment", "returns", "profit", "roi", "double", "trading", "forex", "stock"],
            "weight": 0
        },
        "Romance Scam": {
            "keywords": ["love", "relationship", "dating", "partner", "gift", "stranded", "emergency"],
            "weight": 0
        },
        "Crypto Scam": {
            "keywords": ["bitcoin", "ethereum", "crypto", "blockchain", "nft", "defi", "wallet", "token"],
            "weight": 0
        },
        "Delivery Scam": {
            "keywords": ["delivery", "parcel", "package", "courier", "customs", "shipment", "order"],
            "weight": 0
        },
        "Tech Support Scam": {
            "keywords": ["virus", "hacked", "support", "microsoft", "apple", "technician", "remote access"],
            "weight": 0
        },
        "Government Scam": {
            "keywords": ["government", "income tax", "aadhaar", "pan", "police", "irs", "notice", "penalty", "fine"],
            "weight": 0
        }
    }
    
    if entities.get("upi_ids"):
        scam_patterns["UPI Fraud"]["weight"] += 30
    if entities.get("crypto_wallets"):
        scam_patterns["Crypto Scam"]["weight"] += 30
    
    for scam_type, config in scam_patterns.items():
        for keyword in config["keywords"]:
            if keyword in text_lower:
                config["weight"] += 10
    
    best_type = max(scam_patterns, key=lambda x: scam_patterns[x]["weight"])
    best_weight = scam_patterns[best_type]["weight"]
    
    if best_weight == 0:
        return {"type": "Unknown", "confidence": 0.0}
    
    total_weight = sum(c["weight"] for c in scam_patterns.values())
    confidence = min(95, (best_weight / max(total_weight, 1)) * 100 + 10)
    
    return {"type": best_type, "confidence": round(confidence, 1)}


async def run_threat_intelligence(urls: List[str], text: str = "") -> Dict[str, Any]:
    """Run all threat intelligence checks on provided URLs."""
    results = {}
    
    for url in urls[:3]:
        url_results = {}
        
        vt_result = await check_virustotal(url, "url")
        url_results["virustotal"] = vt_result
        
        domain = extract_domain(url)
        if domain:
            url_results["domain"] = domain
        
        results[url] = url_results
    
    ips = extract_ip_from_text(text) if text else []
    for ip in ips[:2]:
        ip_results = {}
        vt_ip = await check_virustotal(ip, "ip")
        ip_results["virustotal"] = vt_ip
        abuse_result = await check_abuseipdb(ip)
        ip_results["abuseipdb"] = abuse_result
        results[f"ip:{ip}"] = ip_results
    
    return results
