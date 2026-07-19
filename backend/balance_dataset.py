import os
import shutil
import random
from PIL import Image, ImageEnhance, ImageFilter

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dataset")
TARGET_PER_CLASS = 200


def augment_image(img):
    augs = []
    for _ in range(3):
        a = img
        if random.random() > 0.5:
            a = ImageEnhance.Brightness(a).enhance(random.uniform(0.7, 1.3))
        if random.random() > 0.5:
            a = ImageEnhance.Contrast(a).enhance(random.uniform(0.7, 1.3))
        if random.random() > 0.5:
            a = a.filter(ImageFilter.GaussianBlur(radius=random.uniform(0, 1.0)))
        if random.random() > 0.5:
            a = a.transpose(Image.FLIP_LEFT_RIGHT)
        if random.random() > 0.5:
            a = a.transpose(Image.FLIP_TOP_BOTTOM)
        if random.random() > 0.5:
            a = a.rotate(random.uniform(-15, 15))
        augs.append(a)
    return augs


def balance():
    for cls_name in sorted(os.listdir(BASE)):
        cls_dir = os.path.join(BASE, cls_name)
        if not os.path.isdir(cls_dir) or cls_name.startswith("."):
            continue

        images = [f for f in os.listdir(cls_dir)
                  if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))]
        count = len(images)
        print(f"{cls_name}: {count} images", end="")

        if count >= TARGET_PER_CLASS:
            # Downsample: randomly remove extras
            to_remove = count - TARGET_PER_CLASS
            if to_remove > 0:
                remove = random.sample(images, to_remove)
                for f in remove:
                    os.remove(os.path.join(cls_dir, f))
                print(f" -> downsized to {TARGET_PER_CLASS} (removed {to_remove})")
            else:
                print(f" -> already at target {TARGET_PER_CLASS}")
        else:
            # Upsample: create augmented copies
            needed = TARGET_PER_CLASS - count
            created = 0
            while created < needed:
                src = random.choice(images)
                try:
                    img = Image.open(os.path.join(cls_dir, src)).convert("RGB")
                    augs = augment_image(img)
                    for a in augs:
                        if created >= needed:
                            break
                        name, ext = os.path.splitext(src)
                        out = os.path.join(cls_dir, f"{name}_aug_{created}{ext}")
                        a.save(out, quality=85)
                        created += 1
                except Exception as e:
                    print(f"  error: {e}")

            final = len([f for f in os.listdir(cls_dir)
                        if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))])
            print(f" -> upsampled to {final} (added {created})")


if __name__ == "__main__":
    balance()
    print("\nFinal counts:")
    for d in sorted(os.listdir(BASE)):
        p = os.path.join(BASE, d)
        if os.path.isdir(p) and not d.startswith("."):
            cnt = len([f for f in os.listdir(p)
                      if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))])
            print(f"  {d}: {cnt}")
