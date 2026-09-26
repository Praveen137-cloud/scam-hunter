import os
import io
from datetime import datetime
from typing import Optional
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from app.models.analysis import Analysis

DARK_BG = colors.HexColor("#0f172a")
ACCENT = colors.HexColor("#06b6d4")
DANGER = colors.HexColor("#ef4444")
WARNING = colors.HexColor("#f59e0b")
SUCCESS = colors.HexColor("#22c55e")
MEDIUM = colors.HexColor("#f97316")
LIGHT_GRAY = colors.HexColor("#94a3b8")
WHITE = colors.white

RISK_COLORS = {
    "Safe": SUCCESS,
    "Medium": WARNING,
    "High": MEDIUM,
    "Critical": DANGER,
}


def get_risk_color(risk_level: str):
    return RISK_COLORS.get(risk_level, LIGHT_GRAY)


def build_styles():
    styles = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "title", fontName="Helvetica-Bold", fontSize=22,
            textColor=WHITE, spaceAfter=4, leading=28
        ),
        "subtitle": ParagraphStyle(
            "subtitle", fontName="Helvetica", fontSize=11,
            textColor=ACCENT, spaceAfter=12
        ),
        "section_header": ParagraphStyle(
            "section_header", fontName="Helvetica-Bold", fontSize=13,
            textColor=ACCENT, spaceBefore=14, spaceAfter=6
        ),
        "body": ParagraphStyle(
            "body", fontName="Helvetica", fontSize=10,
            textColor=colors.HexColor("#e2e8f0"), leading=15, spaceAfter=6
        ),
        "small": ParagraphStyle(
            "small", fontName="Helvetica", fontSize=9,
            textColor=LIGHT_GRAY, leading=13
        ),
        "bold": ParagraphStyle(
            "bold", fontName="Helvetica-Bold", fontSize=10,
            textColor=WHITE, leading=15
        ),
        "risk_critical": ParagraphStyle(
            "risk_critical", fontName="Helvetica-Bold", fontSize=26,
            textColor=DANGER, alignment=TA_CENTER
        ),
        "risk_high": ParagraphStyle(
            "risk_high", fontName="Helvetica-Bold", fontSize=26,
            textColor=MEDIUM, alignment=TA_CENTER
        ),
        "risk_medium": ParagraphStyle(
            "risk_medium", fontName="Helvetica-Bold", fontSize=26,
            textColor=WARNING, alignment=TA_CENTER
        ),
        "risk_safe": ParagraphStyle(
            "risk_safe", fontName="Helvetica-Bold", fontSize=26,
            textColor=SUCCESS, alignment=TA_CENTER
        ),
    }


def generate_report_pdf(analysis: Analysis, username: str) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = build_styles()
    story = []

    def add_header_bg(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(DARK_BG)
        canvas.rect(0, 0, A4[0], A4[1], fill=True, stroke=False)
        canvas.setFillColor(ACCENT)
        canvas.rect(0, A4[1] - 55 * mm, A4[0], 55 * mm, fill=True, stroke=False)
        canvas.restoreState()

    # Header
    story.append(Spacer(1, 5 * mm))
    story.append(Paragraph("🛡 AUTONOMOUS SCAM HUNTER AI", styles["title"]))
    story.append(Paragraph("Cybersecurity Threat Investigation Report", styles["subtitle"]))
    story.append(Spacer(1, 3 * mm))

    meta_data = [
        ["Report ID", f"#{analysis.id:06d}", "Generated", datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")],
        ["Analyst", username, "Input Type", analysis.input_type],
    ]
    meta_table = Table(meta_data, colWidths=[35 * mm, 60 * mm, 35 * mm, 60 * mm])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#1e293b")),
        ("TEXTCOLOR", (0, 0), (0, -1), ACCENT),
        ("TEXTCOLOR", (2, 0), (2, -1), ACCENT),
        ("TEXTCOLOR", (1, 0), (1, -1), WHITE),
        ("TEXTCOLOR", (3, 0), (3, -1), WHITE),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.HexColor("#1e293b"), colors.HexColor("#0f172a")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#334155")),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 6 * mm))

    # Risk Score Block
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("THREAT ASSESSMENT", styles["section_header"]))

    risk_color = get_risk_color(analysis.risk_level)
    risk_data = [
        [
            Paragraph(f"<b>{analysis.risk_level.upper()}</b>", ParagraphStyle(
                "rc", fontName="Helvetica-Bold", fontSize=20,
                textColor=risk_color, alignment=TA_CENTER
            )),
            Paragraph(f"<b>{analysis.risk_score:.0f}/100</b>", ParagraphStyle(
                "rs", fontName="Helvetica-Bold", fontSize=20,
                textColor=risk_color, alignment=TA_CENTER
            )),
            Paragraph(f"<b>{analysis.scam_type}</b>", ParagraphStyle(
                "st", fontName="Helvetica-Bold", fontSize=14,
                textColor=WHITE, alignment=TA_CENTER
            )),
            Paragraph(f"<b>{analysis.scam_confidence:.0f}%</b><br/><font size=8 color='#94a3b8'>Confidence</font>", ParagraphStyle(
                "sc", fontName="Helvetica-Bold", fontSize=14,
                textColor=ACCENT, alignment=TA_CENTER
            )),
        ]
    ]
    risk_table = Table(risk_data, colWidths=[45 * mm, 45 * mm, 55 * mm, 45 * mm])
    risk_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#1e293b")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#334155")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    story.append(risk_table)
    story.append(Spacer(1, 6 * mm))

    # AI Summary
    if analysis.ai_summary:
        story.append(Paragraph("EXECUTIVE SUMMARY", styles["section_header"]))
        story.append(Paragraph(analysis.ai_summary, styles["body"]))
        story.append(Spacer(1, 4 * mm))

    # Extracted Entities
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#334155")))
    story.append(Paragraph("EXTRACTED INDICATORS OF COMPROMISE", styles["section_header"]))

    entity_rows = []
    if analysis.extracted_urls:
        for url in analysis.extracted_urls[:5]:
            entity_rows.append(["URL", url[:80]])
    if analysis.extracted_emails:
        for email in analysis.extracted_emails[:3]:
            entity_rows.append(["Email", email])
    if analysis.extracted_phones:
        for phone in analysis.extracted_phones[:3]:
            entity_rows.append(["Phone", phone])
    if analysis.extracted_upi_ids:
        for upi in analysis.extracted_upi_ids[:3]:
            entity_rows.append(["UPI ID", upi])
    if analysis.extracted_crypto_wallets:
        for wallet in analysis.extracted_crypto_wallets[:2]:
            entity_rows.append(["Crypto Wallet", wallet[:60]])

    if entity_rows:
        ioc_table = Table([["Type", "Value"]] + entity_rows, colWidths=[40 * mm, 150 * mm])
        ioc_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#1e293b"), colors.HexColor("#0f172a")]),
            ("TEXTCOLOR", (0, 1), (0, -1), ACCENT),
            ("TEXTCOLOR", (1, 1), (1, -1), WHITE),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#334155")),
            ("PADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(ioc_table)
    else:
        story.append(Paragraph("No indicators of compromise extracted.", styles["small"]))
    story.append(Spacer(1, 4 * mm))

    # Technical Analysis
    if analysis.ai_technical_analysis:
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#334155")))
        story.append(Paragraph("TECHNICAL ANALYSIS", styles["section_header"]))
        story.append(Paragraph(analysis.ai_technical_analysis, styles["body"]))
        story.append(Spacer(1, 4 * mm))

    # Threat Indicators
    if analysis.threat_indicators:
        story.append(Paragraph("THREAT INDICATORS", styles["section_header"]))
        for i, indicator in enumerate(analysis.threat_indicators[:8], 1):
            story.append(Paragraph(f"• {indicator}", styles["body"]))
        story.append(Spacer(1, 4 * mm))

    # Attack Techniques
    if analysis.attack_techniques:
        story.append(Paragraph("ATTACK TECHNIQUES (MITRE ATT&CK)", styles["section_header"]))
        for tech in analysis.attack_techniques[:5]:
            story.append(Paragraph(f"▸ {tech}", styles["body"]))
        story.append(Spacer(1, 4 * mm))

    # OCR Results
    if analysis.ocr_text:
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#334155")))
        story.append(Paragraph("OCR EXTRACTED TEXT", styles["section_header"]))
        story.append(Paragraph(analysis.ocr_text[:500], styles["small"]))
        story.append(Spacer(1, 4 * mm))

    # Recommendations
    if analysis.ai_recommendations:
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#334155")))
        story.append(Paragraph("RECOMMENDATIONS", styles["section_header"]))
        story.append(Paragraph(analysis.ai_recommendations, styles["body"]))
        story.append(Spacer(1, 4 * mm))

    # Footer
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(
        "This report was generated by Autonomous Scam Hunter AI. "
        "For cybercrime reporting in India, contact: cybercrime.gov.in | Helpline: 1930",
        styles["small"]
    ))

    doc.build(story, onFirstPage=add_header_bg, onLaterPages=add_header_bg)
    return buffer.getvalue()


def save_report(analysis: Analysis, username: str, output_dir: str = "/tmp/reports") -> str:
    os.makedirs(output_dir, exist_ok=True)
    filename = f"report_{analysis.id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
    filepath = os.path.join(output_dir, filename)
    pdf_bytes = generate_report_pdf(analysis, username)
    with open(filepath, "wb") as f:
        f.write(pdf_bytes)
    return filepath
