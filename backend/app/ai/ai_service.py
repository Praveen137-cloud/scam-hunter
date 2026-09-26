from typing import Dict, Any, Optional
from app.core.config import settings


async def generate_ai_analysis(
    text: str,
    entities: dict,
    risk_score: float,
    scam_type: str,
    threat_intel: dict
) -> Dict[str, str]:
    """Generate AI-powered analysis using Groq LLM."""
    
    if not settings.GROQ_API_KEY:
        return _generate_rule_based_analysis(text, entities, risk_score, scam_type)
    
    try:
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)
        
        prompt = f"""You are a cybersecurity expert specializing in scam detection and digital fraud analysis.

Analyze the following content and provide a comprehensive investigation report.

CONTENT TO ANALYZE:
{text[:2000]}

EXTRACTED ENTITIES:
- URLs: {entities.get('urls', [])}
- Emails: {entities.get('emails', [])}
- Phone Numbers: {entities.get('phones', [])}
- UPI IDs: {entities.get('upi_ids', [])}
- Crypto Wallets: {entities.get('crypto_wallets', [])}

RISK SCORE: {risk_score}/100
CLASSIFIED AS: {scam_type}

Provide your analysis in the following JSON format ONLY (no markdown, no extra text):
{{
  "summary": "2-3 sentence summary of what this scam/threat is about",
  "technical_analysis": "Detailed technical breakdown of the attack method, red flags, and deceptive techniques used",
  "threat_indicators": ["indicator1", "indicator2", "indicator3", "indicator4", "indicator5"],
  "attack_techniques": ["technique1", "technique2", "technique3"],
  "recommendations": "Specific actionable recommendations for the victim and how to protect against this type of scam"
}}"""
        
        completion = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1500
        )
        
        response_text = completion.choices[0].message.content
        
        import json
        import re
        
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group())
            return {
                "summary": parsed.get("summary", ""),
                "technical_analysis": parsed.get("technical_analysis", ""),
                "threat_indicators": parsed.get("threat_indicators", []),
                "attack_techniques": parsed.get("attack_techniques", []),
                "recommendations": parsed.get("recommendations", "")
            }
    except Exception as e:
        pass
    
    return _generate_rule_based_analysis(text, entities, risk_score, scam_type)


def _generate_rule_based_analysis(text: str, entities: dict, risk_score: float, scam_type: str) -> Dict[str, Any]:
    """Fallback rule-based analysis when AI is not available."""
    
    risk_label = "Low" if risk_score < 30 else "Medium" if risk_score < 60 else "High" if risk_score < 80 else "Critical"
    
    indicators = []
    if entities.get("urls"):
        indicators.append(f"Contains {len(entities['urls'])} URL(s) that may redirect to malicious sites")
    if entities.get("upi_ids"):
        indicators.append(f"Contains UPI ID(s): {', '.join(entities['upi_ids'][:2])} - potential payment fraud")
    if entities.get("crypto_wallets"):
        indicators.append(f"Contains {len(entities['crypto_wallets'])} cryptocurrency wallet(s) - possible crypto scam")
    if entities.get("phones"):
        indicators.append(f"Contains {len(entities['phones'])} phone number(s) used for social engineering")
    if entities.get("emails"):
        indicators.append(f"Contains {len(entities['emails'])} email address(es) for phishing")
    
    if not indicators:
        indicators = ["Suspicious language patterns detected", "Content may be attempting social engineering"]
    
    techniques = []
    if scam_type == "Phishing":
        techniques = ["Credential harvesting via fake login pages", "Social engineering through urgency", "Domain spoofing"]
    elif scam_type == "UPI Fraud":
        techniques = ["Payment request manipulation", "UPI PIN phishing", "Fake payment confirmation"]
    elif scam_type == "Crypto Scam":
        techniques = ["Cryptocurrency wallet targeting", "Fake investment promises", "Pump and dump schemes"]
    elif scam_type == "Job Scam":
        techniques = ["Fake job opportunity luring", "Advance fee fraud", "Personal information harvesting"]
    else:
        techniques = ["Social engineering", "False urgency creation", "Trust manipulation"]
    
    scam_descriptions = {
        "Phishing": "credential stealing attempt",
        "UPI Fraud": "UPI payment fraud attempt",
        "Job Scam": "fake job offer scam",
        "Lottery Scam": "lottery/prize scam",
        "Investment Scam": "investment fraud scheme",
        "Romance Scam": "romance-based social engineering attack",
        "Crypto Scam": "cryptocurrency scam",
        "Delivery Scam": "fake delivery notification scam",
        "Tech Support Scam": "tech support impersonation scam",
        "Government Scam": "government authority impersonation scam",
    }
    
    desc = scam_descriptions.get(scam_type, "potential scam")
    
    return {
        "summary": f"Analysis indicates this is a {desc} with a {risk_label} risk level (score: {risk_score}/100). "
                   f"The content contains multiple indicators of fraudulent intent designed to deceive victims.",
        "technical_analysis": f"This {scam_type} uses multiple deception techniques including "
                               f"{'URL manipulation, ' if entities.get('urls') else ''}"
                               f"{'payment redirection via UPI, ' if entities.get('upi_ids') else ''}"
                               f"{'cryptocurrency wallet targeting, ' if entities.get('crypto_wallets') else ''}"
                               f"social engineering and psychological manipulation. "
                               f"The overall risk score of {risk_score}/100 indicates {risk_label} threat level.",
        "threat_indicators": indicators,
        "attack_techniques": techniques,
        "recommendations": f"1. Do not click any links in this message. "
                           f"2. Do not share personal information, OTP, or payment details. "
                           f"3. Block and report the sender. "
                           f"4. If you've already interacted, immediately contact your bank and local cybercrime authorities. "
                           f"5. Report to cybercrime.gov.in (India) or your local cybercrime helpline (1930 in India)."
    }
