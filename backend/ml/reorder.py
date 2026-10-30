
"""Smart reorder recommendation service for InCraft."""


def recommend_reorder(forecast, lead_time_days=7, safety_stock=None):
    """Recommend reorder timing and quantity without changing inventory."""
    lead_time_days = max(1, min(int(lead_time_days), 180))

    current_stock = max(0, int(forecast.get("current_stock") or 0))
    minimum_stock = max(0, int(forecast.get("minimum_stock") or 0))
    daily_demand = max(
        0.0, float(forecast.get("average_daily_demand") or 0)
    )

    safety = (
        minimum_stock
        if safety_stock is None
        else max(0, int(safety_stock))
    )

    reorder_point = int(daily_demand * lead_time_days + safety + 0.999999)
    target_stock = int(
        daily_demand * (lead_time_days + 30) + safety + 0.999999
    )

    reorder_now = current_stock <= reorder_point
    order_quantity = (
        max(0, target_stock - current_stock) if reorder_now else 0
    )

    if current_stock <= 0:
        urgency = "urgent"
    elif reorder_now and current_stock <= daily_demand * lead_time_days:
        urgency = "high"
    elif reorder_now:
        urgency = "medium"
    else:
        urgency = "monitor"

    return {
        "product_id": forecast.get("product_id"),
        "product_code": forecast.get("product_code"),
        "name": forecast.get("name"),
        "current_stock": current_stock,
        "average_daily_demand": round(daily_demand, 3),
        "lead_time_days": lead_time_days,
        "safety_stock_units": safety,
        "estimated_reorder_point": reorder_point,
        "recommended_order_quantity": order_quantity,
        "reorder_now": reorder_now,
        "urgency": urgency,
        "target_coverage_days_after_reorder": lead_time_days + 30,
    }


# Compatibility alias for alternate route naming.
calculate_reorder_recommendation = recommend_reorder
