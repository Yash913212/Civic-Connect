import os
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms, models
from PIL import Image

from .complaint_generator import generate_complaint

CLASS_DEPARTMENTS = [
    "roads", "drainage", "garbage", "water",
    "streetlight", "electricity", "safety", "traffic"
]
PRIORITY_LEVELS = ["low", "medium", "high"]
DEPARTMENT_MAP = {name: i for i, name in enumerate(CLASS_DEPARTMENTS)}
PRIORITY_MAP = {name: i for i, name in enumerate(PRIORITY_LEVELS)}

KEYWORDS = {
    "roads": ["pothole", "road", "gunta", "crack", "pavement", "road lo", "road meeda", "junction", "speed breaker", "road sagging", "rodda", "dari", "rasta"],
    "drainage": ["drainage", "drain", "block", "sewage", "water logging", "nagar", "open drain", "flooded", "kalava", "gutter", "drain block", "nagar lo"],
    "garbage": ["garbage", "trash", "waste", "chetta", "dustbin", "dump", "burning", "rats", "picha", "cetta", "bin full", "garbage pile"],
    "water": ["water", "leak", "pipe", "nandu", "borewell", "drinking", "water supply", "tanker", "pipe leak", "water pipe", "burst pipe", "nila", "water cut", "tap", "motor", "pump", "kran", "valve"],
    "streetlight": ["street light", "light pole", "dark", "light", "flicker", "night lo", "bulb", "streetlight", "lamp", "no light", "dipam", "street lamp"],
    "electricity": ["electric", "power", "transformer", "voltage", "wire", "spark", "pole", "current", "shock", "power cut", "electric wire", "fuse", "vidyut"],
    "safety": ["manhole", "open manhole", "fallen tree", "railing", "construction debris", "dangerous structure", "moodu", "gaddam", "broken bridge", "cave in", "safety hazard"],
    "traffic": ["traffic", "signal", "jam", "sign board", "zebra crossing", "parking", "congestion", "traffic light", "signal broken", "traffic jam", "sanket"],
}

SEVERITY_HIGH = ["urgent", "immediate", "danger", "risk", "accident", "emergency", "critical", "hazard",
                 "pedda", "chala", "broken", "burst", "fire", "shock", "collapse", "spark", "peril", "thu"]

SEVERITY_MEDIUM = ["repair", "fix", "damage", "issue", "problem", "need", "sagging", "block", "naaku"]

image_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

_vision_model = None
_text_tokenizer = None
_text_encoder = None
_has_text_encoder = False
_vision_num_classes = None


def _get_vision_model():
    global _vision_model, _vision_num_classes
    if _vision_model is None:
        model_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "civic_model.pth")
        has_8_class = False

        if os.path.exists(model_path):
            try:
                state = torch.load(model_path, map_location=_device, weights_only=True)
                classifier_weight = state.get("classifier.1.weight")
                if classifier_weight is not None:
                    _vision_num_classes = classifier_weight.shape[0]
            except Exception:
                pass

        if _vision_num_classes is None:
            _vision_num_classes = 4
        print("Loaded model with", _vision_num_classes, "classes")

        model = models.efficientnet_b0(weights=None)
        model.classifier[1] = nn.Linear(model.classifier[1].in_features, _vision_num_classes)

        if os.path.exists(model_path):
            model.load_state_dict(torch.load(model_path, map_location=_device, weights_only=True))

        model.eval()
        model.to(_device)
        _vision_model = model
    return _vision_model, _vision_num_classes


def _get_text_encoder():
    global _text_tokenizer, _text_encoder, _has_text_encoder
    if _text_encoder is None and not _has_text_encoder:
        try:
            from transformers import AutoTokenizer, AutoModel
            _text_tokenizer = AutoTokenizer.from_pretrained("google/muril-base-cased")
            _text_encoder = AutoModel.from_pretrained("google/muril-base-cased")
            _text_encoder.eval()
            _text_encoder.to(_device)
            _has_text_encoder = True
        except Exception as e:
            print(f"MuRIL load failed: {e}")
            _has_text_encoder = False
    return _text_tokenizer, _text_encoder, _has_text_encoder


def analyze_text(text):
    text_lower = text.lower()
    scores = {dept: 0.0 for dept in CLASS_DEPARTMENTS}
    for dept, keywords in KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                scores[dept] += 1.0

    tokenizer, encoder, available = _get_text_encoder()
    if available:
        try:
            inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=128).to(_device)
            with torch.no_grad():
                outputs = encoder(**inputs)
            return scores, outputs.pooler_output.squeeze(0).cpu()
        except Exception:
            pass
    return scores, None


def _compute_text_confidence(text_scores):
    sorted_scores = sorted(text_scores.values(), reverse=True)
    top = sorted_scores[0] if sorted_scores else 0
    second = sorted_scores[1] if len(sorted_scores) > 1 else 0
    if top == 0:
        return 0.0
    dominance = top / max(1, top + second)
    return min(95.0, dominance * 100)


def _map_4class_to_8class(old_idx):
    OLD_CLASSES = ["drainage", "garbage", "roads", "water"]
    OLD_TO_NEW = {"drainage": "drainage", "garbage": "garbage", "roads": "roads", "water": "water"}
    old_dept = OLD_CLASSES[old_idx] if old_idx < len(OLD_CLASSES) else "roads"
    return OLD_TO_NEW.get(old_dept, "roads")


def predict_issue(image_path, description=""):
    vision_model, num_classes = _get_vision_model()
    image = Image.open(image_path).convert("RGB")
    image_tensor = image_transform(image).unsqueeze(0).to(_device)

    with torch.no_grad():
        outputs = vision_model(image_tensor)
        probabilities = F.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probabilities, 1)

    vision_confidence = round(confidence.item() * 100, 2)

    predicted_idx = predicted.item()

    if num_classes == 4:
        vision_dept = _map_4class_to_8class(predicted_idx)
    else:
        if predicted_idx >= len(CLASS_DEPARTMENTS):
             predicted_idx = 0
        vision_dept = CLASS_DEPARTMENTS[predicted_idx]
    text_scores, _ = analyze_text(description)
    has_text = bool(description.strip())
    text_confidence = 0.0

    if has_text:
        total_keywords = sum(text_scores.values())
        if total_keywords > 0:
            text_confidence = _compute_text_confidence(text_scores)

    combined = {}
    for dept in CLASS_DEPARTMENTS:
        vs = 1.0 if dept == vision_dept else 0.0
        ts = text_scores.get(dept, 0.0)
        top_text_score = max(text_scores.values()) if has_text and max(text_scores.values()) > 0 else 1

        if has_text and top_text_score > 0:
            tn = ts / top_text_score
            if text_confidence >= 60:
                vw = 0.2
            elif text_confidence >= 35:
                vw = 0.35
            elif text_confidence >= 15:
                vw = 0.5
            else:
                vw = 0.7
            combined[dept] = (vw * vs + (1 - vw) * tn) * 100
        else:
            combined[dept] = vs * 100

    predicted_dept = max(combined, key=combined.get)
    dept_confidence = round(combined[predicted_dept], 2)

    text_lower = description.lower()
    high_score = sum(1 for kw in SEVERITY_HIGH if kw in text_lower)
    med_score = sum(1 for kw in SEVERITY_MEDIUM if kw in text_lower)

    if high_score >= 2:
        priority = "high"
    elif high_score >= 1 or med_score >= 2:
        priority = "medium"
    else:
        priority = "low"

    priority_scores = {"low": 0, "medium": 0, "high": 0}
    priority_scores[priority] = dept_confidence
    remaining = 100 - dept_confidence
    for p in PRIORITY_LEVELS:
        if p != priority:
            priority_scores[p] = round(remaining / 2, 2)

    all_dept_scores = {d: round(s, 2) for d, s in sorted(combined.items(), key=lambda x: -x[1])}

    has_real_text = has_text and text_confidence > 0
    modality = "vision+text" if has_real_text else "vision-only"

    return {
        "issue": predicted_dept,
        "department": predicted_dept,
        "department_confidence": dept_confidence,
        "priority": priority,
        "priority_confidence": round(priority_scores[priority], 2),
        "vision_confidence": vision_confidence,
        "text_confidence": text_confidence,
        "all_department_scores": all_dept_scores,
        "complaint": generate_complaint(predicted_dept),
        "modality": modality,
    }
