import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models
from transformers import AutoModel, AutoTokenizer

CLASS_DEPARTMENTS = [
    "roads", "drainage", "garbage", "water",
    "streetlight", "electricity", "safety", "traffic"
]
PRIORITY_LEVELS = ["low", "medium", "high"]

DEPARTMENT_MAP = {name: i for i, name in enumerate(CLASS_DEPARTMENTS)}
PRIORITY_MAP = {name: i for i, name in enumerate(PRIORITY_LEVELS)}

class MultimodalFusionModel(nn.Module):
    def __init__(self, num_departments=8, num_priorities=3, fusion_dim=512, dropout=0.3):
        super().__init__()
        self.vision_encoder = models.efficientnet_b0(weights="DEFAULT")
        vision_feat_dim = self.vision_encoder.classifier[1].in_features
        self.vision_encoder.classifier = nn.Identity()

        self.text_encoder = AutoModel.from_pretrained("google/muril-base-cased")
        text_feat_dim = self.text_encoder.config.hidden_size

        self.text_proj = nn.Linear(text_feat_dim, fusion_dim)
        self.vision_proj = nn.Linear(vision_feat_dim, fusion_dim)
        self.fusion_norm = nn.LayerNorm(fusion_dim)

        self.fusion_layer = nn.Sequential(
            nn.Linear(fusion_dim * 2, fusion_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(fusion_dim, fusion_dim // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
        )

        self.department_head = nn.Sequential(
            nn.Linear(fusion_dim // 2, fusion_dim // 4),
            nn.ReLU(),
            nn.Dropout(dropout * 0.5),
            nn.Linear(fusion_dim // 4, num_departments),
        )
        self.priority_head = nn.Sequential(
            nn.Linear(fusion_dim // 2, fusion_dim // 4),
            nn.ReLU(),
            nn.Dropout(dropout * 0.5),
            nn.Linear(fusion_dim // 4, num_priorities),
        )

    def forward(self, images, input_ids, attention_mask):
        vision_feats = self.vision_encoder(images)
        vision_feats = self.vision_proj(vision_feats)

        text_outputs = self.text_encoder(input_ids=input_ids, attention_mask=attention_mask)
        text_feats = text_outputs.pooler_output
        text_feats = self.text_proj(text_feats)

        vision_feats = self.fusion_norm(vision_feats)
        text_feats = self.fusion_norm(text_feats)

        combined = torch.cat([vision_feats, text_feats], dim=1)
        fused = self.fusion_layer(combined)

        dept_logits = self.department_head(fused)
        priority_logits = self.priority_head(fused)

        return dept_logits, priority_logits

    @torch.no_grad()
    def predict(self, image, input_ids, attention_mask):
        self.eval()
        dept_logits, priority_logits = self.forward(image, input_ids, attention_mask)
        dept_probs = F.softmax(dept_logits, dim=1)
        priority_probs = F.softmax(priority_logits, dim=1)

        dept_conf, dept_idx = torch.max(dept_probs, dim=1)
        priority_conf, priority_idx = torch.max(priority_probs, dim=1)

        return {
            "department": CLASS_DEPARTMENTS[dept_idx.item()],
            "department_confidence": round(dept_conf.item() * 100, 2),
            "priority": PRIORITY_LEVELS[priority_idx.item()],
            "priority_confidence": round(priority_conf.item() * 100, 2),
            "department_scores": {CLASS_DEPARTMENTS[i]: round(dept_probs[0][i].item() * 100, 2) for i in range(len(CLASS_DEPARTMENTS))},
            "priority_scores": {PRIORITY_LEVELS[i]: round(priority_probs[0][i].item() * 100, 2) for i in range(len(PRIORITY_LEVELS))},
        }
