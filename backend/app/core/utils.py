import io
from PIL import Image

def compress_image(contents: bytes, max_size=(1024, 1024), quality=80) -> bytes:
    try:
        img = Image.open(io.BytesIO(contents))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        output = io.BytesIO()
        img.save(output, format="JPEG", quality=quality, optimize=True)
        return output.getvalue()
    except Exception as e:
        print(f"Image compression failed: {e}")
        return contents
