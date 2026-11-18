"""Professional PDF Valuation Report Generator.

Uses ReportLab to generate an elegant, branded PDF report for
a predicted property valuation.
"""

import os
from io import BytesIO
from datetime import datetime, timezone
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)

def generate_property_pdf(prediction_data: dict) -> BytesIO:
    """Generate a PDF bytes buffer for a property prediction record."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#1e3a8a") # Deep Navy
    secondary_color = colors.HexColor("#0284c7") # Ocean Blue
    accent_color = colors.HexColor("#059669") # Emerald Green
    text_dark = colors.HexColor("#1f2937") # Gray 800
    bg_light = colors.HexColor("#f8fafc") # Slate 50
    border_color = colors.HexColor("#cbd5e1") # Slate 300

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=primary_color,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=15
    )

    section_header = ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=primary_color,
        spaceBefore=10,
        spaceAfter=6
    )

    label_style = ParagraphStyle(
        "CellLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#475569")
    )

    val_style = ParagraphStyle(
        "CellValue",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=text_dark
    )

    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#64748b")
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph("PROPERTY VALUATION & ESTIMATION REPORT", title_style))
    report_date = prediction_data.get("prediction_date", datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p"))
    pred_id = prediction_data.get("id", "N/A")
    story.append(Paragraph(f"Report Ref: <b>#HPR-{pred_id}</b> | Generated on: {report_date}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=15))

    # 2. Executive Valuation Box
    est_price = prediction_data.get("predicted_price_exact") or f"Rs. {prediction_data.get('predicted_price', 0):,.0f}"
    est_formatted = prediction_data.get("predicted_price_formatted", "")
    price_sqft = prediction_data.get("price_per_sqft_formatted") or "N/A"
    lower_b = prediction_data.get("lower_bound_formatted", "N/A")
    upper_b = prediction_data.get("upper_bound_formatted", "N/A")
    model_name = prediction_data.get("model_name", "GradientBoostingRegressor")

    val_box_data = [
        [
            Paragraph("<font size='10' color='#1e3a8a'><b>ESTIMATED MARKET VALUE</b></font>", styles["Normal"]),
            Paragraph("<font size='10' color='#1e3a8a'><b>VALUATION BAND (6.5% CI)</b></font>", styles["Normal"])
        ],
        [
            Paragraph(f"<font size='18' color='#059669'><b>{est_price}</b></font> <font size='12' color='#0284c7'>({est_formatted})</font>", styles["Normal"]),
            Paragraph(f"<font size='11' color='#1f2937'><b>{lower_b}</b> to <b>{upper_b}</b></font>", styles["Normal"])
        ],
        [
            Paragraph(f"<font size='9' color='#64748b'>Rate: <b>{price_sqft}</b></font>", styles["Normal"]),
            Paragraph(f"<font size='9' color='#64748b'>ML Algorithm: <b>{model_name}</b></font>", styles["Normal"])
        ]
    ]

    val_table = Table(val_box_data, colWidths=[3.2 * inch, 3.2 * inch])
    val_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg_light),
        ("BOX", (0, 0), (-1, -1), 1.5, secondary_color),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, border_color),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    story.append(val_table)
    story.append(Spacer(1, 15))

    # 3. Property Attributes Table
    story.append(Paragraph("PROPERTY SPECIFICATIONS & FEATURES", section_header))

    city = prediction_data.get("city", "N/A")
    locality = prediction_data.get("locality", "N/A")
    state = prediction_data.get("state", "N/A")
    area = f"{prediction_data.get('area_sqft', 'N/A')} sq. ft."
    bedrooms = f"{prediction_data.get('bedrooms', 'N/A')} BHK"
    bathrooms = str(prediction_data.get('bathrooms', 'N/A'))
    floors = str(prediction_data.get('floors', 'N/A'))
    parking = f"{prediction_data.get('parking', 'N/A')} Vehicle(s)"
    prop_age = f"{prediction_data.get('property_age', 'N/A')} Year(s)"
    furnishing = str(prediction_data.get('furnishing_status', 'N/A'))
    prop_type = str(prediction_data.get('property_type', 'N/A'))

    spec_data = [
        [
            Paragraph("City", label_style), Paragraph(city, val_style),
            Paragraph("Locality", label_style), Paragraph(locality, val_style)
        ],
        [
            Paragraph("State", label_style), Paragraph(state, val_style),
            Paragraph("Property Type", label_style), Paragraph(prop_type, val_style)
        ],
        [
            Paragraph("Super Built-up Area", label_style), Paragraph(area, val_style),
            Paragraph("Bedrooms (BHK)", label_style), Paragraph(bedrooms, val_style)
        ],
        [
            Paragraph("Bathrooms", label_style), Paragraph(bathrooms, val_style),
            Paragraph("Floor Level", label_style), Paragraph(floors, val_style)
        ],
        [
            Paragraph("Parking Slots", label_style), Paragraph(parking, val_style),
            Paragraph("Property Age", label_style), Paragraph(prop_age, val_style)
        ],
        [
            Paragraph("Furnishing Status", label_style), Paragraph(furnishing, val_style),
            Paragraph("Valuation Model", label_style), Paragraph(model_name, val_style)
        ]
    ]

    spec_table = Table(spec_data, colWidths=[1.5 * inch, 1.7 * inch, 1.5 * inch, 1.7 * inch])
    spec_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f1f5f9")),
        ("BACKGROUND", (2, 0), (2, -1), colors.HexColor("#f1f5f9")),
        ("BOX", (0, 0), (-1, -1), 1, border_color),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, border_color),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(spec_table)
    story.append(Spacer(1, 15))

    # 4. Valuation Drivers
    story.append(Paragraph("KEY VALUE INFLUENCING FACTORS", section_header))
    drivers = prediction_data.get("key_drivers") or [
        f"Location rating for {locality}, {city}",
        f"{bedrooms} configuration in {prop_type} segment",
        f"{furnishing} condition adjustment"
    ]
    driver_rows = []
    for d in drivers:
        driver_rows.append([Paragraph("•", label_style), Paragraph(d, val_style)])
    driver_table = Table(driver_rows, colWidths=[0.3 * inch, 6.1 * inch])
    driver_table.setStyle(TableStyle([
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(driver_table)
    story.append(Spacer(1, 18))

    # 5. Regulatory Disclaimer
    story.append(HRFlowable(width="100%", thickness=0.5, color=border_color, spaceAfter=8))
    disclaimer_text = (
        "<b>LEGAL & APPRAISAL DISCLAIMER:</b> This property valuation estimate is generated using "
        "supervised machine learning algorithms based on historical market trends, square footage rates, "
        "and comparative sales data across Indian residential markets. It is intended solely as an informative "
        "advisory tool and does not constitute a certified legal appraisal, bank loan guarantee, or government stamp duty assessment. "
        "Antigravity Real Estate Analytics Platform © 2026."
    )
    story.append(Paragraph(disclaimer_text, disclaimer_style))

    doc.build(story)
    buffer.seek(0)
    return buffer
