import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import torch
from torch.utils.data import DataLoader
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_recall_fscore_support
import numpy as np

from app.ai.multimodal_model import MultimodalFusionModel, CLASS_DEPARTMENTS, PRIORITY_LEVELS
from app.ai.dataset_generator import MultimodalDataset

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Device: {device}")

model = MultimodalFusionModel(
    num_departments=len(CLASS_DEPARTMENTS),
    num_priorities=len(PRIORITY_LEVELS),
).to(device)

model_path = "civic_model_multimodal.pth"
if os.path.exists(model_path):
    model.load_state_dict(torch.load(model_path, map_location=device, weights_only=True))
    print(f"Loaded trained model: {model_path}")
else:
    print("No trained model found. Using untrained baseline.")
    print("Train first with: python app/ai/train_multimodal.py")

dataset = MultimodalDataset("dataset", augment=False)
loader = DataLoader(dataset, batch_size=8, shuffle=False)

model.eval()
all_dept_preds = []
all_dept_true = []
all_pri_preds = []
all_pri_true = []

with torch.no_grad():
    for batch in loader:
        images = batch["image"].to(device)
        input_ids = batch["input_ids"].to(device)
        attention_mask = batch["attention_mask"].to(device)

        dept_logits, pri_logits = model(images, input_ids, attention_mask)

        _, dept_pred = torch.max(dept_logits, 1)
        _, pri_pred = torch.max(pri_logits, 1)

        all_dept_preds.extend(dept_pred.cpu().numpy())
        all_dept_true.extend(batch["department_label"].numpy())
        all_pri_preds.extend(pri_pred.cpu().numpy())
        all_pri_true.extend(batch["priority_label"].numpy())

print("\n" + "=" * 60)
print("DEPARTMENT CLASSIFICATION REPORT")
print("=" * 60)
print(classification_report(
    all_dept_true, all_dept_preds,
    target_names=CLASS_DEPARTMENTS,
    digits=3,
))

dept_acc = accuracy_score(all_dept_true, all_dept_preds)
print(f"\nDepartment Accuracy: {dept_acc:.3f} ({dept_acc*100:.1f}%)")

print("\n" + "=" * 60)
print("CONFUSION MATRIX (Departments)")
print("=" * 60)
cm = confusion_matrix(all_dept_true, all_dept_preds)
header = " " * 14 + "".join(f"{d[:6]:>7}" for d in CLASS_DEPARTMENTS)
print(header)
for i, dept in enumerate(CLASS_DEPARTMENTS):
    row = f"{dept[:12]:>12} " + " ".join(f"{cm[i][j]:>6}" for j in range(len(CLASS_DEPARTMENTS)))
    print(row)

print("\n" + "=" * 60)
print("PRIORITY CLASSIFICATION REPORT")
print("=" * 60)
print(classification_report(
    all_pri_true, all_pri_preds,
    target_names=PRIORITY_LEVELS,
    digits=3,
))

pri_acc = accuracy_score(all_pri_true, all_pri_preds)
print(f"\nPriority Accuracy: {pri_acc:.3f} ({pri_acc*100:.1f}%)")

print("\n" + "=" * 60)
print("PER-CLASS METRICS (Department)")
print("=" * 60)
prec, rec, f1, sup = precision_recall_fscore_support(all_dept_true, all_dept_preds, labels=range(len(CLASS_DEPARTMENTS)))
for i, dept in enumerate(CLASS_DEPARTMENTS):
    print(f"  {dept:15s}  Prec: {prec[i]:.3f}  Rec: {rec[i]:.3f}  F1: {f1[i]:.3f}  Support: {sup[i]}")

macro_f1 = np.mean(f1)
weighted_f1 = np.average(f1, weights=sup)
print(f"\n  Macro F1:     {macro_f1:.3f}")
print(f"  Weighted F1:  {weighted_f1:.3f}")

print("\n" + "=" * 60)
print("PER-CLASS METRICS (Priority)")
print("=" * 60)
prec_p, rec_p, f1_p, sup_p = precision_recall_fscore_support(all_pri_true, all_pri_preds, labels=range(len(PRIORITY_LEVELS)))
for i, pri in enumerate(PRIORITY_LEVELS):
    print(f"  {pri:8s}  Prec: {prec_p[i]:.3f}  Rec: {rec_p[i]:.3f}  F1: {f1_p[i]:.3f}  Support: {sup_p[i]}")

print(f"\n  Macro F1:     {np.mean(f1_p):.3f}")
print(f"  Weighted F1:  {np.average(f1_p, weights=sup_p):.3f}")

total_params = sum(p.numel() for p in model.parameters())
trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f"\n" + "=" * 60)
print("MODEL STATISTICS")
print("=" * 60)
print(f"  Total parameters:     {total_params:,}")
print(f"  Trainable parameters: {trainable_params:,}")
print(f"  Frozen parameters:    {total_params - trainable_params:,}")

print("\nEvaluation complete!")
