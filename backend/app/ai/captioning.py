from app.core.bedrock import generate_image_caption


def generate_caption(image_path):
    try:
        return generate_image_caption(image_path)

    except Exception as e:
        print("Bedrock Caption Error:", e)
        return ""