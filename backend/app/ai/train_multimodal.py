import os
import sys
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split, Subset
import random

from app.ai.multimodal_model import MultimodalFusionModel, CLASS_DEPARTMENTS, PRIORITY_LEVELS
from app.ai.dataset_generator import MultimodalDataset, image_transforms, eval_transforms

DATA_DIR = "dataset"
EPOCHS = 8
BATCH_SIZE = 4
LR = 5e-4

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def train(
    data_dir=DATA_DIR,
    epochs=EPOCHS,
    batch_size=BATCH_SIZE,
    lr=LR,
):
    print(f"Device: {device}")
    print(f"Data: {data_dir} | Epochs: {epochs} | Batch: {batch_size} | LR: {lr}")

    full_dataset = MultimodalDataset(data_dir, augment=True, max_length=48)
    if len(full_dataset) == 0:
        raise RuntimeError("Dataset is empty!")

    max_samples = min(2000, len(full_dataset))
    indices = sorted(random.sample(range(len(full_dataset)), max_samples))
    subset = Subset(full_dataset, indices)

    train_size = int(0.8 * len(subset))
    val_size = len(subset) - train_size
    train_sub, val_sub = random_split(subset, [train_size, val_size])

    train_idx = [subset.indices[i] for i in train_sub.indices]
    val_idx = [subset.indices[i] for i in val_sub.indices]

    class SimpleDataset(torch.utils.data.Dataset):
        def __init__(self, base, indices):
            self.base = base
            self.indices = indices
        def __len__(self):
            return len(self.indices)
        def __getitem__(self, i):
            return self.base[self.indices[i]]

    train_dataset = SimpleDataset(full_dataset, train_idx)
    val_dataset = SimpleDataset(full_dataset, val_idx)

    train_loader = DataLoader(train_dataset, batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size, shuffle=False)
    print(f"Train: {len(train_dataset)} | Val: {len(val_dataset)}")

    model = MultimodalFusionModel(
        num_departments=len(CLASS_DEPARTMENTS),
        num_priorities=len(PRIORITY_LEVELS),
    ).to(device)

    for p in model.text_encoder.parameters(): p.requires_grad = False
    for p in model.vision_encoder.parameters(): p.requires_grad = False

    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"Trainable: {trainable:,}/{total:,} params")

    dept_criterion = nn.CrossEntropyLoss()
    pri_criterion = nn.CrossEntropyLoss()

    optimizer = optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=lr,
    )
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_val = float("inf")
    for epoch in range(epochs):
        model.train()
        t_loss = 0; t_dc = 0; t_pc = 0; t_t = 0
        for batch in train_loader:
            im = batch["image"].to(device)
            ids = batch["input_ids"].to(device)
            mask = batch["attention_mask"].to(device)
            dl = batch["department_label"].to(device)
            pl = batch["priority_label"].to(device)
            optimizer.zero_grad()
            d_logits, p_logits = model(im, ids, mask)
            loss = dept_criterion(d_logits, dl) + pri_criterion(p_logits, pl)
            loss.backward(); optimizer.step()
            t_loss += loss.item()
            _, dp = torch.max(d_logits, 1); _, pp = torch.max(p_logits, 1)
            t_dc += (dp == dl).sum().item(); t_pc += (pp == pl).sum().item()
            t_t += dl.size(0)
        scheduler.step()

        model.eval()
        v_loss = 0; v_dc = 0; v_pc = 0; v_t = 0
        with torch.no_grad():
            for batch in val_loader:
                im = batch["image"].to(device)
                ids = batch["input_ids"].to(device)
                mask = batch["attention_mask"].to(device)
                dl = batch["department_label"].to(device)
                pl = batch["priority_label"].to(device)
                d_logits, p_logits = model(im, ids, mask)
                loss = dept_criterion(d_logits, dl) + pri_criterion(p_logits, pl)
                v_loss += loss.item()
                _, dp = torch.max(d_logits, 1); _, pp = torch.max(p_logits, 1)
                v_dc += (dp == dl).sum().item(); v_pc += (pp == pl).sum().item()
                v_t += dl.size(0)

        print(f"Epoch {epoch+1}/{epochs} | "
              f"Train L:{t_loss/len(train_loader):.3f} D:{100*t_dc/t_t:.0f}% P:{100*t_pc/t_t:.0f}% | "
              f"Val L:{v_loss/len(val_loader):.3f} D:{100*v_dc/v_t:.0f}% P:{100*v_pc/v_t:.0f}%")

        if v_loss < best_val:
            best_val = v_loss
            torch.save(model.state_dict(), "civic_model_multimodal.pth")
            print(f"  -> Saved (loss: {v_loss:.3f})")

    print(f"\nDone! Best val loss: {best_val:.3f}")
    return model


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    sys.path.insert(0, os.getcwd())
    train()
