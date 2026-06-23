import os
from app.core.config import settings

COMPLAINT_TEMPLATES = {
    "roads": "A road infrastructure issue has been detected in the area. The roadway shows signs of damage including potholes, cracks, or surface deterioration that requires immediate inspection and repair. This poses a risk to commuters and vehicles.",
    "drainage": "A drainage system failure has been identified. The drainage is either blocked, overflowing, or damaged, leading to water stagnation and unhygienic conditions. Immediate cleaning and repair work is requested.",
    "garbage": "Solid waste management issue reported. Garbage has accumulated in the area and has not been collected for an extended period. The overflowing waste is creating unsanitary conditions and attracting pests.",
    "water": "A water supply infrastructure issue has been detected. There is evidence of water leakage, pipe damage, or supply disruption in the area. This requires urgent attention from the water works department.",
    "streetlight": "Street lighting infrastructure issue identified. The street light is non-functional, damaged, or missing in this area, creating safety hazards and darkness during night hours.",
    "electricity": "Electrical infrastructure issue detected. There are signs of damaged electrical equipment, exposed wiring, or power supply irregularities that pose an immediate safety risk to the public.",
    "safety": "A public safety hazard has been identified in the area. This includes open manholes, damaged structures, fallen objects, or other dangerous conditions that require immediate intervention.",
    "traffic": "Traffic infrastructure issue reported. Traffic signals, signs, or road markings are damaged or missing, causing confusion and potential accidents at this location.",
}

def generate_complaint(issue):
    issue_lower = issue.lower()
    template = COMPLAINT_TEMPLATES.get(issue_lower)

    if template:
        return template

    return (
        f"Detected civic issue related "
        f"to {issue}. Immediate action "
        f"may be required."
    )
