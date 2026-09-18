import boto3
import json
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

sns_client = boto3.client(
    "sns",
    region_name="us-east-1"
)


def get_user_subscription(email: str):
    """Find an existing SNS email subscription for this user."""

    try:
        response = sns_client.list_subscriptions_by_topic(
            TopicArn=settings.SNS_TOPIC_ARN
        )

        for subscription in response.get("Subscriptions", []):
            if (
                subscription.get("Protocol") == "email"
                and subscription.get("Endpoint") == email
            ):
                return subscription.get("SubscriptionArn")

        return None

    except Exception as e:
        logger.error("SNS subscription lookup failed for %s: %s", email, e)
        return None


def subscribe_user_email(email: str, user_id: str):
    """
    Subscribe the user's email to the existing SNS topic
    and attach a filter for that specific user.
    """

    try:
        subscription_arn = get_user_subscription(email)

        # Subscription already exists
        if subscription_arn:
            if subscription_arn == "PendingConfirmation":
                logger.info("SNS confirmation still pending for %s", email)
                return subscription_arn

            set_user_filter(subscription_arn, user_id)

            logger.info(
                  "SNS subscription already exists for %s: %s",
                  email,
                  subscription_arn 
            )
            return subscription_arn

        # Create a new email subscription
        response = sns_client.subscribe(
            TopicArn=settings.SNS_TOPIC_ARN,
            Protocol="email",
            Endpoint=email,
            ReturnSubscriptionArn=True
        )

        subscription_arn = response.get("SubscriptionArn")

        logger.info(
              "SNS subscription created for %s: %s",
              email,
              subscription_arn
       )

        # New email subscriptions require confirmation.
        # Do not try to publish until confirmed.
        if subscription_arn == "pending confirmation":
            print(
                f"SNS confirmation required for {email}"
            )
            return subscription_arn

        # If AWS immediately returns an ARN, attach the filter.
        set_user_filter(subscription_arn, user_id)

        return subscription_arn

    except Exception as e:
        print(
            f"SNS subscription failed for {email}: {e}"
        )
        return None


def set_user_filter(subscription_arn: str, user_id: str):
    """Allow this SNS subscription to receive only this user's messages."""

    try:
        filter_policy = json.dumps({
            "user_id": [str(user_id)]
        })

        sns_client.set_subscription_attributes(
            SubscriptionArn=subscription_arn,
            AttributeName="FilterPolicy",
            AttributeValue=filter_policy
        )

        sns_client.set_subscription_attributes(
            SubscriptionArn=subscription_arn,
            AttributeName="FilterPolicyScope",
            AttributeValue="MessageAttributes"
        )

        print(
            f"SNS filter configured for user {user_id}"
        )

        return True

    except Exception as e:
        print(
            f"SNS filter configuration failed: {e}"
        )
        return False


def publish_notification_to_user(
    user_id: str,
    email: str,
    message: str,
    subject: str = "Nagara Netra Notification"
):
    """
    Publish a notification to the common SNS topic.

    SNS uses the user_id message attribute to deliver the
    notification only to the matching user's subscription.
    """

    try:
        subscription_arn = subscribe_user_email(
            email=email,
            user_id=str(user_id)
        )

        if not subscription_arn:
            return None

        # New subscription has not been confirmed yet.
        if subscription_arn == "pending confirmation":
            return {
                "status": "pending_confirmation",
                "email": email
            }

        response = sns_client.publish(
            TopicArn=settings.SNS_TOPIC_ARN,
            Message=message,
            Subject=subject,
            MessageAttributes={
                "user_id": {
                    "DataType": "String",
                    "StringValue": str(user_id)
                }
            }
        )

        logger.info(
              "SNS notification sent to %s: %s",
              email,
              response.get("MessageId")
        )

        return response

    except Exception as e:
        logger.error(
             "SNS notification failed for %s: %s",
             email,
             e
        )
        return None