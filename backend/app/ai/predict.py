import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
from .complaint_generator import generate_complaint
# Class names
classes = [
    "drainage",
    "garbage",
    "roads",
    "water"
]

# Load model
model = models.efficientnet_b0(
    weights=None
)

model.classifier[1] = nn.Linear(
    model.classifier[1].in_features,
    len(classes)
)

model.load_state_dict(
    torch.load(
        "civic_model.pth",
        map_location=torch.device("cpu")
    )
)

model.eval()

# Image transform
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])




def predict_issue(image_path):

    image = Image.open(
        image_path
    ).convert("RGB")

    image = transform(
        image
    ).unsqueeze(0)

    with torch.no_grad():

        outputs = model(image)

        probabilities = torch.softmax(
            outputs,
            dim=1
        )

        confidence, predicted = torch.max(
            probabilities,
            1
        )

    issue = classes[
        predicted.item()
    ]

    confidence_score = round(
        confidence.item() * 100,
        2
    )

    complaint = generate_complaint(
        issue
    )

    return {
        "issue": issue,
        "confidence":
        confidence_score,
        "complaint":
        complaint
    }
