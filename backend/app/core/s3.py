import boto3
import os

S3_BUCKET = os.getenv("S3_BUCKET", "civicconnect-images-nagaranetra")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

s3_client = boto3.client(
    "s3",
    region_name=AWS_REGION
)


def upload_file_to_s3(
    file_path: str,
    object_name: str,
    content_type: str = "image/jpeg"
):
    s3_client.upload_file(
        file_path,
        S3_BUCKET,
        object_name,
        ExtraArgs={
            "ContentType": content_type
        }
    )

    return (
        f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/"
        f"{object_name}"
    )
def generate_presigned_url(object_name: str, expiration: int = 3600):
    """
    Generate a temporary URL for securely viewing an S3 object.
    URL expires after the specified number of seconds.
    """
    try:
        return s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": S3_BUCKET,
                "Key": object_name
            },
            ExpiresIn=expiration
        )
    except Exception as e:
        print(f"S3 presigned URL generation failed: {e}")
        return None