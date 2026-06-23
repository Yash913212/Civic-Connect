import os
import json
import random
from PIL import Image
from torchvision import transforms
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer

from .multimodal_model import CLASS_DEPARTMENTS, PRIORITY_LEVELS

CLASS_TEXTS = {
    "roads": [
        "road lo pedda gunta undi chala dangerous ga undi",
        "pothole on the road please fix immediately road safety issue",
        "road completely damaged cars cant pass, chala rojulu nundi ilage undi",
        "pedda road cracks unnayi night lo chala risk",
        "road sagging and broken near junction, immediate repair needed",
    ],
    "drainage": [
        "drainage block ayipoyindi water stagnating everywhere",
        "blocked drain causing filthy water overflow on road",
        "nagar lo drainage system sarigga pani cheyatledu, doorsa undi",
        "open drainage dangerous pit near footpath please cover",
        "sewage line broken waste water flowing on street health hazard",
    ],
    "garbage": [
        "garbage dump untidy bin overflowing since one week",
        "trash not collected in our area from many days",
        "dustbin pakkana antha chetta padesaru, clean cheyandi",
        "garbage vehicle ravatledu, waste piling up on roads",
        "illegal waste dumping ongoing at corner site alarming",
    ],
    "water": [
        "water leakage from main pipe since morning wasting drinking water",
        "water pipe burst street flooded need urgent repair",
        "nandu water supply sarigga ravatledu, pressure chaala takkuva",
        "drinking water contaminated muddy water coming from tap",
        "borewell water problems, no water supply for colony",
    ],
    "streetlight": [
        "street light not working from many days night lo complete dark",
        "broken street light pole dangerous for pedestrians wire exposed",
        "e road meeda street light ledu, ratri time chala danger",
        "multiple street lights not working in a stretch very dark area",
        "lights flickering since weeks, electric shock risk",
    ],
    "electricity": [
        "exposed electric wire hanging dangerously from pole",
        "transformer giving problems frequent power cuts since one month",
        "power lines sagging very low near houses dangerous situation",
        "e area lo voltage fluctuations unnayi, electronics spoil avuthunnayi",
        "electric wire sparking visible near junction box immediate danger",
    ],
    "safety": [
        "open manhole on footpath no cover very dangerous for kids",
        "fallen tree blocking road since 2 days no one clearing",
        "broken railing on bridge dangerous for pedestrians and vehicles",
        "abandoned building partially collapsed dangerous structure near school",
        "construction debris left on road causing accident risk",
    ],
    "traffic": [
        "traffic signal not working at major junction causing jams",
        "broken traffic light junction lo signal ledu accidents happening",
        "road obstruction due to parked vehicles on both sides congestion",
        "traffic sign board missing at crucial turn causing confusion",
        "speed breaker damaged vehicles overspeeding near school zone",
    ],
}

DEPT_PRIORITIES = {
    "roads": ["medium", "high", "medium"],
    "drainage": ["high", "medium", "high"],
    "garbage": ["low", "medium", "low"],
    "water": ["high", "high", "medium"],
    "streetlight": ["low", "medium", "low"],
    "electricity": ["high", "high", "medium"],
    "safety": ["high", "high", "medium"],
    "traffic": ["medium", "medium", "high"],
}

image_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.15, hue=0.05),
    transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

eval_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


class MultimodalDataset(Dataset):
    def __init__(self, data_dir, tokenizer_name="google/muril-base-cased", augment=True, max_length=128):
        self.tokenizer = AutoTokenizer.from_pretrained(tokenizer_name)
        self.max_length = max_length
        self.transform = image_transforms if augment else eval_transforms
        self.samples = []

        dir_depts = sorted([d for d in os.listdir(data_dir)
                           if os.path.isdir(os.path.join(data_dir, d)) and not d.startswith(".")])
        if not dir_depts:
            dir_depts = CLASS_DEPARTMENTS

        all_depts = CLASS_DEPARTMENTS
        self.dept_to_idx = {d: i for i, d in enumerate(all_depts)}
        self.pri_to_idx = {p: i for i, p in enumerate(PRIORITY_LEVELS)}

        for dept in dir_depts:
            dept_dir = os.path.join(data_dir, dept)
            images = [os.path.join(dept_dir, f) for f in os.listdir(dept_dir)
                     if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))]
            if not images:
                for root, dirs, files in os.walk(dept_dir):
                    for f in files:
                        if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                            images.append(os.path.join(root, f))
            if not images:
                continue

            texts = CLASS_TEXTS.get(dept, [f"civic issue related to {dept}"])
            priorities = DEPT_PRIORITIES.get(dept, ["medium"])

            dept_idx = self.dept_to_idx.get(dept, 0)
            for img_path in images:
                for text in texts:
                    for pri in priorities:
                        self.samples.append({
                            "image_path": img_path,
                            "text": text,
                            "department_idx": dept_idx,
                            "priority_idx": self.pri_to_idx[pri],
                        })

        print(f"Dataset: {len(self.samples)} samples from {len(dir_depts)} departments")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        sample = self.samples[idx]
        image = Image.open(sample["image_path"]).convert("RGB")
        image = self.transform(image)

        encoding = self.tokenizer(
            sample["text"],
            padding="max_length",
            truncation=True,
            max_length=self.max_length,
            return_tensors="pt",
        )

        return {
            "image": image,
            "input_ids": encoding["input_ids"].squeeze(0),
            "attention_mask": encoding["attention_mask"].squeeze(0),
            "department_label": torch.tensor(sample["department_idx"], dtype=torch.long),
            "priority_label": torch.tensor(sample["priority_idx"], dtype=torch.long),
        }
