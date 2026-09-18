from app.core.bedrock import generate_text
import re
import logging

logger = logging.getLogger(__name__)


def predict_priority(issue, description="", image_caption=""):
    if not image_caption:
        image_caption = issue

    prompt = f"""
You are a senior Municipal Emergency Officer.

Issue Type:
{issue}

Citizen Description:
{description if description else "Not provided"}

Image Caption:
{image_caption}

Evaluate the REAL severity of the specific issue described above.

HIGH
- Garbage occupies a large area
- Garbage overflowing onto roads
- Garbage attracting animals or insects
- Public health hazard
- Flooding
- Large potholes
- Multiple potholes
- Road blockage
- Dangerous electrical problems
- Open manholes
- Major infrastructure damage

MEDIUM
- Moderate garbage pile
- Moderate potholes
- Partial drainage blockage
- Water leakage affecting nearby residents
- Moderate infrastructure damage

LOW
- Small isolated garbage
- Small contained garbage pile
- Minor maintenance issue
- Small isolated pothole
- Minor damage
- No public safety risk

IMPORTANT RULES:

1. Evaluate the specific situation, not just the issue type.

2. Small or isolated issues with no public safety risk → Low.

3. Moderate issues → Medium.

4. Large, multiple, overflowing, blocked, dangerous, hazardous,
   or widespread issues → High.

5. Garbage that is overflowing, spread over a large area,
   attracting pests, or creating a public-health concern → High.

6. A small isolated pothole should be Low.

7. Moderate potholes should be Medium.

8. Large or multiple potholes, especially when blocking or
   creating danger on the road, should be High.

9. Do not classify an issue as High merely because that issue
   can sometimes be dangerous. Consider the actual description
   and image caption.

10. Do not let words mentioned in the explanation affect the
    final classification. Only the final decision matters.

IMPORTANT:
Return the final decision on the LAST line exactly in this format:

FINAL_PRIORITY: Low

or

FINAL_PRIORITY: Medium

or

FINAL_PRIORITY: High
"""

    try:
        logger.info("Priority prediction started")

        result = generate_text(prompt)

        if not result:
            logger.warning("Priority model returned no response")
            return "Low"

        # First choice: extract the explicit final decision.
        match = re.search(
            r"FINAL_PRIORITY\s*:\s*(High|Medium|Low)",
            result,
            re.IGNORECASE
        )

        if match:
            priority = match.group(1).capitalize()
            logger.info("Priority prediction completed: %s", priority)
            return priority

        # Fallback: look for an explicit final/conclusion statement.
        conclusion_patterns = [
            r"(?:final severity|final priority|conclusion)\s*:\s*\**\s*(High|Medium|Low)",
            r"(?:qualifies as|classified as)\s*\**\s*(High|Medium|Low)",
        ]

        for pattern in conclusion_patterns:
            matches = re.findall(pattern, result, re.IGNORECASE)

            if matches:
                priority = matches[-1].capitalize()
                logger.info("Priority prediction completed: %s", priority)
                return priority

        logger.warning(
            "Could not determine priority from Bedrock response"
        )
        return "Low"

    except Exception as e:
        logger.error("Priority prediction error: %s", e)
        return "Low"