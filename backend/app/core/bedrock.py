import boto3
import os

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

BEDROCK_MODEL_ID = "us.amazon.nova-2-lite-v1:0"

bedrock_client = boto3.client(
    "bedrock-runtime",
    region_name=AWS_REGION
)


def generate_text(prompt: str) -> str:
    response = bedrock_client.converse(
        modelId=BEDROCK_MODEL_ID,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        inferenceConfig={
            "maxTokens": 1000,
            "temperature": 0.3
        }
    )

    content = response["output"]["message"]["content"]

    return next(
        item["text"]
        for item in content
        if "text" in item
    )
def generate_image_caption(image_path: str) -> str:
    import mimetypes

    with open(image_path, "rb") as f:
        image_bytes = f.read()

    mime_type, _ = mimetypes.guess_type(image_path)

    if mime_type == "image/png":
        image_format = "png"
    elif mime_type == "image/webp":
        image_format = "webp"
    elif mime_type == "image/gif":
        image_format = "gif"
    else:
        image_format = "jpeg"

    prompt = """
Describe the main civic or public infrastructure issue visible in this image.

Examples:
- potholes
- garbage accumulation
- drainage problems
- water leakage
- damaged roads
- broken street lights
- open manholes

Return ONLY one short sentence describing the issue.
Do not explain your reasoning.
"""

    response = bedrock_client.converse(
        modelId=BEDROCK_MODEL_ID,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "image": {
                            "format": image_format,
                            "source": {
                                "bytes": image_bytes
                            }
                        }
                    },
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        inferenceConfig={
            "maxTokens": 100,
            "temperature": 0.2
        }
    )

    content = response["output"]["message"]["content"]

    return next(
        item["text"]
        for item in content
        if "text" in item
    ).strip()
def generate_image_priority(
    image_path: str,
    issue: str,
    description: str = ""
) -> dict:
    import mimetypes
    import json

    with open(image_path, "rb") as f:
        image_bytes = f.read()

    mime_type, _ = mimetypes.guess_type(image_path)

    if mime_type == "image/png":
        image_format = "png"
    elif mime_type == "image/webp":
        image_format = "webp"
    elif mime_type == "image/gif":
        image_format = "gif"
    else:
        image_format = "jpeg"

    prompt = f"""
You are a senior municipal emergency officer analyzing a civic complaint image.

Detected Issue:
{issue}

Citizen Description:
{description if description else "Not provided"}

Your task is to determine the REAL severity and priority of the issue visible in the image.

IMPORTANT:
Analyze the actual image carefully. Do not determine priority only from the issue name.

SEVERITY RULES:

HIGH:
- Large or widespread garbage accumulation
- Overflowing garbage
- Garbage creating a public-health hazard
- Garbage attracting pests or animals
- Flooding
- Major water leakage
- Water flooding roads or affecting residents
- Large or multiple potholes
- Road blockage
- Dangerous electrical problems
- Exposed electrical wires
- Open manholes
- Major infrastructure damage

MEDIUM:
- Moderate garbage accumulation
- Moderate water leakage
- Moderate potholes
- Partial drainage blockage
- Water leakage affecting nearby residents
- Moderate infrastructure damage

LOW:
- Small isolated garbage
- Small contained garbage
- Minor water leakage
- Small isolated pothole
- Minor maintenance issue
- No significant public safety risk

IMPORTANT RULES:
1. Judge the specific situation visible in the image.
2. Do not classify every issue of the same type as High.
3. Small isolated problems should normally be Low.
4. Moderate problems should normally be Medium.
5. Large, multiple, overflowing, blocked, dangerous, hazardous, or widespread problems should normally be High.
6. For garbage, overflowing or widespread garbage with sanitation/public-health risk should be High.
7. For water, major leakage, flooding, or water affecting roads/residents should be High.
8. For roads, large or multiple potholes or road blockage should be High.
9. For drainage, major blockage, overflow, or flooding should be High.

Return ONLY valid JSON in exactly this format:

{{
    "severity": "Low",
    "priority": "Low",
    "reason": "Brief explanation based on the visible image."
}}

The values for severity and priority must be exactly one of:
Low
Medium
High
"""

    response = bedrock_client.converse(
        modelId=BEDROCK_MODEL_ID,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "image": {
                            "format": image_format,
                            "source": {
                                "bytes": image_bytes
                            }
                        }
                    },
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        inferenceConfig={
            "maxTokens": 300,
            "temperature": 0.1
        }
    )

    content = response["output"]["message"]["content"]

    result_text = next(
        item["text"]
        for item in content
        if "text" in item
    ).strip()

    if result_text.startswith("```json"):
        result_text = result_text.split("```json", 1)[1].split("```", 1)[0].strip()
    elif result_text.startswith("```"):
        result_text = result_text.split("```", 1)[1].split("```", 1)[0].strip()

    result = json.loads(result_text)

    priority = str(result.get("priority", "Low")).capitalize()
    severity = str(result.get("severity", priority)).capitalize()

    if priority not in ("Low", "Medium", "High"):
        priority = "Low"

    if severity not in ("Low", "Medium", "High"):
        severity = priority

    return {
        "severity": severity,
        "priority": priority,
        "reason": str(result.get("reason", ""))
    }