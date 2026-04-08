"""
NORA-DEPLOY: Deploys to AWS, GCP, Azure.
Handles deploy validation, target selection, and status tracking.
All production deploys go through NORA-HUMAN HumanLoop approval first.
"""
from typing import Optional, TypedDict

SUPPORTED_TARGETS = {"aws", "gcp", "azure", "local", "docker"}


class DeployTarget(TypedDict):
    provider: str
    region: str
    environment: str
    requires_approval: bool


def parse_deploy_target(input_text: str) -> DeployTarget:
    """
    Parse a deploy command input into a structured target.
    Examples: "deploy to aws", "deploy production gcp us-east-1"
    """
    text = input_text.lower()

    provider = "local"
    for t in SUPPORTED_TARGETS:
        if t in text:
            provider = t
            break

    region = "us-east-1"
    if "eu" in text or "europe" in text:
        region = "eu-west-1"
    elif "asia" in text or "ap" in text:
        region = "ap-southeast-1"

    environment = "production"
    if "staging" in text or "stage" in text:
        environment = "staging"
    elif "dev" in text or "development" in text:
        environment = "development"

    requires_approval = environment == "production"

    return DeployTarget(
        provider=provider,
        region=region,
        environment=environment,
        requires_approval=requires_approval,
    )


def get_deploy_checklist(target: DeployTarget) -> list[str]:
    """Return the steps for a deployment to the given target."""
    steps = [
        f"[NORA-DEPLOY] Target: {target['provider'].upper()} / {target['environment']} / {target['region']}",
        "[NORA-DEPLOY] Running pre-deploy checks...",
        "[NORA-DEPLOY] Validating build artifacts...",
        "[NORA-DEPLOY] Checking environment variables...",
    ]
    if target["provider"] == "aws":
        steps += [
            "[NORA-DEPLOY] Building Docker image...",
            "[NORA-DEPLOY] Pushing to ECR...",
            "[NORA-DEPLOY] Updating ECS service...",
        ]
    elif target["provider"] == "gcp":
        steps += [
            "[NORA-DEPLOY] Building container...",
            "[NORA-DEPLOY] Pushing to GCR...",
            "[NORA-DEPLOY] Deploying to Cloud Run...",
        ]
    elif target["provider"] == "azure":
        steps += [
            "[NORA-DEPLOY] Building container...",
            "[NORA-DEPLOY] Pushing to ACR...",
            "[NORA-DEPLOY] Deploying to App Service...",
        ]
    else:
        steps += [
            "[NORA-DEPLOY] Building Docker image...",
            "[NORA-DEPLOY] Starting local container...",
        ]
    steps.append(f"[NORA-DEPLOY] ✓ Deployed to {target['provider'].upper()} ({target['environment']})")
    return steps


def validate_deploy_permission(user_role: str, target: DeployTarget) -> tuple[bool, Optional[str]]:
    """
    Check if the user role is allowed to deploy to the given target.
    Returns (allowed, reason_if_not).
    """
    if user_role == "VIEWER":
        return False, "VIEWER role cannot deploy. Requires DEVELOPER or ADMIN."
    if target["environment"] == "production" and user_role != "ADMIN":
        return False, "Production deploys require ADMIN role or HumanLoop approval."
    return True, None
