import os
import shutil
from PIL import Image, ImageEnhance, ImageFilter
import random

BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "dataset")

NEW_CLASS_SOURCES = {
    "streetlight": ["roads", "water"],
    "electricity": ["garbage", "roads"],
    "safety": ["drainage", "roads"],
    "traffic": ["roads"],
}

def augment_image(img):
    variations = []
    for _ in range(3):
        enhanced = img
        if random.random() > 0.5:
            enhancer = ImageEnhance.Brightness(enhanced)
            enhanced = enhancer.enhance(random.uniform(0.7, 1.3))
        if random.random() > 0.5:
            enhancer = ImageEnhance.Contrast(enhanced)
            enhanced = enhancer.enhance(random.uniform(0.7, 1.3))
        if random.random() > 0.5:
            enhanced = enhanced.filter(ImageFilter.GaussianBlur(radius=random.uniform(0, 1.5)))
        if random.random() > 0.5:
            enhanced = enhanced.transpose(Image.FLIP_LEFT_RIGHT)
        if random.random() > 0.5:
            enhanced = enhanced.transpose(Image.FLIP_TOP_BOTTOM)
        variations.append(enhanced)
    return variations

def expand_dataset():
    existing_classes = [d for d in os.listdir(BASE_DIR)
                       if os.path.isdir(os.path.join(BASE_DIR, d)) and not d.startswith(".")]
    print(f"Existing classes: {existing_classes}")

    for new_class, sources in NEW_CLASS_SOURCES.items():
        target_dir = os.path.join(BASE_DIR, new_class)
        os.makedirs(target_dir, exist_ok=True)

        existing_count = len([f for f in os.listdir(target_dir)
                            if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))])
        if existing_count >= 5:
            print(f"  {new_class}: already has {existing_count} images, skipping")
            continue

        count = 0
        for source in sources:
            source_dir = os.path.join(BASE_DIR, source)
            if not os.path.exists(source_dir):
                continue
            for fname in os.listdir(source_dir):
                if not fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                    continue
                src_path = os.path.join(source_dir, fname)
                try:
                    img = Image.open(src_path).convert("RGB")
                    augs = augment_image(img)
                    for i, aug_img in enumerate(augs):
                        name, ext = os.path.splitext(fname)
                        out_name = f"{new_class}_{name}_{i}{ext}"
                        out_path = os.path.join(target_dir, out_name)
                        aug_img.save(out_path, quality=85)
                        count += 1
                except Exception as e:
                    print(f"    Error processing {fname}: {e}")

        print(f"  {new_class}: created {count} augmented images -> {target_dir}")

    print("\nFinal dataset structure:")
    for d in sorted(os.listdir(BASE_DIR)):
        path = os.path.join(BASE_DIR, d)
        if os.path.isdir(path):
            num = len([f for f in os.listdir(path) if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))])
            print(f"  {d}: {num} images")

if __name__ == "__main__":
    expand_dataset()
