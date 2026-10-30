
"""
InCraft — The Art of Intelligent Inventory
Stockout Risk Assessment Service
"""

from math import ceil


def assess_stockout(forecast, lead_time_days=7):
    """
    Estimate stockout risk using current inventory,
    average daily demand, and supplier lead time.

    Args:
        forecast (dict): Product and demand forecast information.
        lead_time_days (int): Estimated supplier delivery time.

    Returns:
        dict: Stockout risk assessment.
    """
    lead_time_days = max(1, min(int(lead_time_days), 180))

    stock = max(
        0,
        int(forecast.get("current_stock") or 0),
    )

    daily_demand = max(
        0.0,
        float(forecast.get("average_daily_demand") or 0),
    )

    lead_time_demand = daily_demand * lead_time_days

    days_of_stock = (
        stock / daily_demand
        if daily_demand > 0
        else None
    )

    # Determine risk level and score.
    if stock <= 0:
        risk_level = "high"
        risk_score = 100

    elif daily_demand <= 0:
        risk_level = "low"
        risk_score = 5

    else:
        coverage_ratio = stock / max(lead_time_demand, 0.01)

        if coverage_ratio <= 0.75:
            risk_level = "high"
            risk_score = min(
                99,
                max(75, int((1 - coverage_ratio) * 100)),
            )

        elif coverage_ratio <= 1.15:
            risk_level = "medium"
            risk_score = min(
                74,
                max(
                    40,
                    int(
                        40
                        + ((1.15 - coverage_ratio) / 0.4) * 34
                    ),
                ),
            )

        else:
            risk_level = "low"
            risk_score = max(
                5,
                min(39, int(40 / coverage_ratio)),
            )

    # Explain the assessment.
    if stock <= 0:
        reason = "No stock available."

    elif daily_demand <= 0:
        reason = (
            "No demand estimated from the available sales history."
        )

    elif stock < lead_time_demand:
        reason = (
            f"Current stock may run out before replenishment. "
            f"Estimated lead-time demand: "
            f"{ceil(lead_time_demand)} units."
        )

    else:
        reason = (
            f"Estimated demand during the "
            f"{lead_time_days}-day lead time is "
            f"{ceil(lead_time_demand)} units."
        )

    return {
        "product_id": forecast.get("product_id"),
        "product_code": forecast.get("product_code"),
        "name": forecast.get("name"),
        "current_stock": stock,
        "lead_time_days": lead_time_days,
        "average_daily_demand": round(daily_demand, 3),
        "expected_demand_during_lead_time": round(
            lead_time_demand, 2
        ),
        "estimated_days_of_stock": (
            round(days_of_stock, 1)
            if days_of_stock is not None
            else None
        ),
        "risk_level": risk_level,
        "risk_score": risk_score,
        "reason": reason,
    }


# Compatibility alias for routes using the alternate function name.
calculate_stockout_risk = assess_stockout
