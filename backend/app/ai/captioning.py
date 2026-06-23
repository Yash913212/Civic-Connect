import torch
from PIL import Image

_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
_processor = None
_model = None
_ready = False


def _load():
    global _processor, _model, _ready
    if _ready:
        return
    try:
        from transformers import BlipProcessor, BlipForConditionalGeneration
        _processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
        _model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")
        _model.eval()
        _model.to(_device)
        _ready = True
        print("BLIP loaded on demand")
    except Exception as e:
        print(f"BLIP load failed: {e}")
        _ready = False


def generate_caption(image_path):
    _load()
    if not _ready:
        return "Image analysis not available"

    try:
        image = Image.open(image_path).convert("RGB")
        inputs = _processor(image, return_tensors="pt").to(_device)
        with torch.no_grad():
            out = _model.generate(**inputs, max_new_tokens=50, num_beams=3, temperature=0.7)
        return _processor.decode(out[0], skip_special_tokens=True)
    except Exception as e:
        return f"Could not analyze image: {e}"
