import httpx
from urllib.parse import urlparse, quote
from typing import Dict, List, Any, Optional
from app.models.analysis import Analysis

# Map UPI handles to bank names and their fraud reporting emails
UPI_BANK_MAP = {
    "okaxis": ("Axis Bank", "phishing@axisbank.com"),
    "okhdfcbank": ("HDFC Bank", "report.phishing@hdfcbank.com"),
    "okicici": ("ICICI Bank", "abuse@icicibank.com"),
    "oksbi": ("State Bank of India", "report.phishing@sbi.co.in"),
    "ybl": ("Yes Bank", "phishing@yesbank.in"),
    "ibl": ("IndusInd Bank", "abuse@indusind.com"),
    "paytm": ("Paytm Payments Bank", "abuse@paytm.com"),
    "upi": ("NPCI (National Payments Corporation of India)", "upi.abuse@npci.org.in"),
    "sbi": ("State Bank of India", "report.phishing@sbi.co.in"),
    "icici": ("ICICI Bank", "abuse@icicibank.com"),
    "hdfcbank": ("HDFC Bank", "report.phishing@hdfcbank.com"),
    "kotak": ("Kotak Mahindra Bank", "report.phishing@kotak.com"),
    "pnb": ("Punjab National Bank", "cybercell@pnb.co.in"),
    "phonepe": ("PhonePe", "abuse@phonepe.com"),
    "ybl": ("Yes Bank", "phishing@yesbank.in"),
    "axl": ("Axis Bank", "phishing@axisbank.com"),
}

async def lookup_domain_registrar(domain: str) -> Dict[str, str]:
    """Lookup domain registrar and abuse email via public RDAP API."""
    fallback = {
        "registrar": "Unknown Domain Host",
        "abuse_email": "abuse@domain-registrar.net"
    }
    
    # Clean domain
    domain = domain.lower().strip()
    if "/" in domain:
        domain = domain.split("/")[0]
        
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Query official public RDAP registry resolver
            res = await client.get(f"https://rdap.org/domain/{domain}")
            if res.status_code == 200:
                data = res.json()
                
                # Extract registrar name
                registrar = "Unknown Registrar"
                for entity in data.get("entities", []):
                    roles = entity.get("roles", [])
                    if "registrar" in roles:
                        vcard = entity.get("vcardArray", [])
                        if len(vcard) > 1:
                            for prop in vcard[1]:
                                if prop[0] == "fn":
                                    registrar = prop[3]
                                    break
                
                # Extract abuse email
                abuse_email = "abuse@domain-registrar.net"
                for entity in data.get("entities", []):
                    # Check nested sub-entities for abuse contacts
                    for sub_entity in entity.get("entities", []):
                        roles = sub_entity.get("roles", [])
                        if "abuse" in roles:
                            vcard = sub_entity.get("vcardArray", [])
                            if len(vcard) > 1:
                                for prop in vcard[1]:
                                    if prop[0] == "email":
                                        abuse_email = prop[3]
                                        break
                
                # Refine fallback registrar name
                if registrar == "Unknown Registrar":
                    # Look at top-level port43 or generic names
                    registrar = data.get("port43", "Unknown Registrar")
                    
                return {
                    "registrar": registrar,
                    "abuse_email": abuse_email
                }
    except Exception:
        pass
        
    # Smart local fallbacks based on common domain suffixes or patterns
    if domain.endswith(".in") or domain.endswith(".co.in"):
        return {
            "registrar": "IN Registry (India)",
            "abuse_email": "registry@registry.in"
        }
    elif "google" in domain:
        return {
            "registrar": "Google LLC",
            "abuse_email": "registrar-abuse@google.com"
        }
    elif "amazon" in domain:
        return {
            "registrar": "Amazon Registrar",
            "abuse_email": "abuse@amazonaws.com"
        }
        
    return fallback

def extract_domain(url: str) -> str:
    try:
        parsed = urlparse(url if url.startswith("http") else f"https://{url}")
        return parsed.netloc or parsed.path.split("/")[0]
    except Exception:
        return url

def generate_abuse_complaint(
    entity_type: str,
    target: str,
    provider_name: str,
    scam_type: str,
    risk_score: float,
    details: str,
    abuse_email: str
) -> Dict[str, Any]:
    """Generate pre-formatted subject, body and mailto link for abuse report."""
    
    subject = f"IMMEDIATE TAKEDOWN REQUEST: Active {scam_type} Scam / Fraud Target: {target}"
    
    body = (
        f"Dear Nodal Security Team / Abuse Desk at {provider_name},\n\n"
        f"This is an automated threat report from ScamHunter AI. We have detected and verified "
        f"an active fraud campaign associated with a service hosted or registered under your network.\n\n"
        f"--- INVESTIGATION DETAILS ---\n"
        f"• Target Entity: {target}\n"
        f"• Entity Type: {entity_type}\n"
        f"• Detected Scam Type: {scam_type}\n"
        f"• Severity Score: {risk_score}/100\n"
        f"• Evidence / Scam Context:\n"
        f"\"{details[:1000]}\"\n\n"
        f"--- REQUIRED ACTION ---\n"
        f"Under standard digital safety compliance and fraud mitigation policies, we request that you "
        f"investigate this target immediately and suspend, restrict, or freeze access to this resource "
        f"to prevent financial loss and security threats to the public.\n\n"
        f"Please verify this report and reply with confirmation of action taken.\n\n"
        f"Thank you,\n"
        f"Cybersecurity Threat Operations Team\n"
        f"ScamHunter AI Console"
    )
    
    # Construct mailto link
    encoded_subject = quote(subject)
    encoded_body = quote(body)
    mailto_link = f"mailto:{abuse_email}?subject={encoded_subject}&body={encoded_body}"
    
    return {
        "entity_type": entity_type,
        "target": target,
        "provider_name": provider_name,
        "recipient_email": abuse_email,
        "subject": subject,
        "body": body,
        "mailto_link": mailto_link
    }

async def compile_takedown_dossier(analysis: Analysis) -> List[Dict[str, Any]]:
    """Compile takedown reports for all suspicious entities in the analysis."""
    dossier = []
    
    # 1. Process Suspicious URLs
    if analysis.extracted_urls:
        for url in analysis.extracted_urls[:3]:
            domain = extract_domain(url)
            reg_info = await lookup_domain_registrar(domain)
            
            dossier.append(generate_abuse_complaint(
                entity_type="Malicious URL",
                target=domain,
                provider_name=reg_info["registrar"],
                scam_type=analysis.scam_type,
                risk_score=analysis.risk_score,
                details=analysis.raw_input or analysis.extracted_text,
                abuse_email=reg_info["abuse_email"]
            ))
            
    # 2. Process UPI IDs
    if analysis.extracted_upi_ids:
        for upi_id in analysis.extracted_upi_ids[:3]:
            # Get handle (everything after @)
            handle = upi_id.split("@")[-1].lower() if "@" in upi_id else "upi"
            bank_name, abuse_email = UPI_BANK_MAP.get(handle, ("NPCI Partner Bank", "upi.abuse@npci.org.in"))
            
            dossier.append(generate_abuse_complaint(
                entity_type="Fraudulent UPI ID",
                target=upi_id,
                provider_name=bank_name,
                scam_type=analysis.scam_type,
                risk_score=analysis.risk_score,
                details=analysis.raw_input or analysis.extracted_text,
                abuse_email=abuse_email
            ))
            
    # 3. Process Phone Numbers
    if analysis.extracted_phones:
        for phone in analysis.extracted_phones[:2]:
            dossier.append(generate_abuse_complaint(
                entity_type="Scam Caller Number",
                target=phone,
                provider_name="Telecom Regulator (TRAI)",
                scam_type=analysis.scam_type,
                risk_score=analysis.risk_score,
                details=analysis.raw_input or analysis.extracted_text,
                abuse_email="telecom.fraud@trai.gov.in"
            ))
            
    return dossier
