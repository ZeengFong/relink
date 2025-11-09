"""Input validation helpers to keep the route files tidy."""
from __future__ import annotations

import re
from typing import Any, Dict, Tuple

EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")


class ValidationError(ValueError):
    """Raised when incoming payloads are rejected."""


def require_fields(payload: Dict[str, Any], fields: Tuple[str, ...]) -> None:
    missing = [field for field in fields if not payload.get(field)]
    if missing:
        raise ValidationError(f"Missing fields: {', '.join(missing)}")


def validate_email(email: str) -> None:
    if not EMAIL_RE.match(email or ""):
        raise ValidationError("Invalid email format")


def validate_password(password: str) -> None:
    if len(password or "") < 8:
        raise ValidationError("Password must be at least 8 characters")


def validate_capacity(capacity: int) -> None:
    if capacity < 1:
        raise ValidationError("Capacity must be at least 1")


def validate_location(location: Dict[str, Any]) -> Dict[str, float]:
    try:
        lat = float(location["lat"])
        lng = float(location["lng"])
    except (KeyError, TypeError, ValueError) as exc:
        raise ValidationError("Location requires numeric lat and lng") from exc
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        raise ValidationError("Location out of bounds")
    return {"lat": lat, "lng": lng}


def validate_radius(radius: Any) -> int:
    try:
        radius_int = int(radius)
    except (TypeError, ValueError) as exc:
        raise ValidationError("Radius must be an integer") from exc
    if radius_int <= 0:
        raise ValidationError("Radius must be positive")
    return radius_int
