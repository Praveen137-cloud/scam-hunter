import re
from typing import List, Dict
from urllib.parse import urlparse


def extract_urls(text: str) -> List[str]:
    url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+|www\.[^\s<>"{}|\\^`\[\]]+'
    urls = re.findall(url_pattern, text, re.IGNORECASE)
    cleaned = []
    for url in urls:
        url = url.rstrip(".,;:!?)")
        if url not in cleaned:
            cleaned.append(url)
    return cleaned


def extract_emails(text: str) -> List[str]:
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = list(set(re.findall(email_pattern, text)))
    return emails


def extract_phone_numbers(text: str) -> List[str]:
    patterns = [
        r'\+91[-\s]?\d{10}',
        r'\b[6-9]\d{9}\b',
        r'\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b',
        r'\(\d{3}\)\s*\d{3}[-.\s]\d{4}',
        r'\+\d{1,3}[-.\s]\d{3,14}',
    ]
    phones = []
    for pattern in patterns:
        found = re.findall(pattern, text)
        phones.extend(found)
    return list(set(phones))


def extract_upi_ids(text: str) -> List[str]:
    upi_pattern = r'\b[\w.\-]+@(?:paytm|okaxis|okhdfcbank|okicici|oksbi|ybl|ibl|axl|waicici|upi|apl|allbank|andb|barodampay|citi|cnrb|csbcash|dbs|dcb|denabank|dlb|equitas|federal|fbl|finobank|hdfcbank|hsbc|icici|idbi|idfcbank|idfcfirst|idfc|imobile|indus|iob|jkb|jsb|karb|kbl|kcc|kotak|kvb|lvb|mahb|myicici|nsdl|obc|payzapp|pnb|postbank|psb|rbl|scb|sbi|scmb|tjsb|ubi|ucb|unionbank|utbi|vijb|vjb|yesbankltd|yesbank)\b'
    upi_ids = re.findall(upi_pattern, text, re.IGNORECASE)
    return list(set(upi_ids))


def extract_crypto_wallets(text: str) -> List[str]:
    patterns = {
        "Bitcoin": r'\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b',
        "Ethereum": r'\b0x[a-fA-F0-9]{40}\b',
        "USDT_TRC20": r'\bT[A-Za-z1-9]{33}\b',
    }
    wallets = []
    for crypto_type, pattern in patterns.items():
        found = re.findall(pattern, text)
        for wallet in found:
            wallets.append(f"{crypto_type}:{wallet}")
    return list(set(wallets))


def extract_all_entities(text: str) -> Dict:
    return {
        "urls": extract_urls(text),
        "emails": extract_emails(text),
        "phones": extract_phone_numbers(text),
        "upi_ids": extract_upi_ids(text),
        "crypto_wallets": extract_crypto_wallets(text),
    }
