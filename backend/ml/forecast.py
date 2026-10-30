
"""Demand forecasting service for InCraft."""

from datetime import date, datetime, timedelta
from math import ceil

try:
    from sklearn.ensemble import RandomForestRegressor
except ImportError:
    RandomForestRegressor = None


def _parse_date(value):
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        try:
            return date.fromisoformat(value[:10])
        except ValueError:
            return None
    return None


def forecast_product(product, daily_sales, as_of=None):
    """Forecast product demand for the next 7 and 30 days."""
    as_of = as_of or date.today()
    observed = {}

    for row in daily_sales:
        sale_date = _parse_date(
            row.get("sale_day", row.get("date", row.get("day")))
        )
        if sale_date is None or sale_date > as_of:
            continue

        try:
            quantity = max(
                0.0,
                float(row.get("units_sold", row.get("quantity", 0)) or 0),
            )
        except (TypeError, ValueError):
            quantity = 0.0

        observed[sale_date] = observed.get(sale_date, 0.0) + quantity

    start = as_of - timedelta(days=179)
    history = [
        (start + timedelta(days=i), observed.get(start + timedelta(days=i), 0.0))
        for i in range(180)
    ]
    values = [quantity for _, quantity in history]
    nonzero_days = sum(quantity > 0 for quantity in values)

    average_7 = sum(values[-7:]) / 7
    average_28 = sum(values[-28:]) / 28
    baseline = max(0.0, 0.65 * average_7 + 0.35 * average_28)

    predictions = []
    method = "weighted_moving_average"

    if RandomForestRegressor is not None and nonzero_days >= 8:
        try:
            features, targets = [], []

            for i in range(28, len(values)):
                previous_7 = values[i - 7:i]
                previous_28 = values[i - 28:i]
                features.append([
                    float(i),
                    float(history[i][0].weekday()),
                    values[i - 1],
                    values[i - 7],
                    sum(previous_7) / 7,
                    sum(previous_28) / 28,
                ])
                targets.append(values[i])

            model = RandomForestRegressor(
                n_estimators=100,
                max_depth=6,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=1,
            )
            model.fit(features, targets)

            rolling = values.copy()

            for offset in range(1, 31):
                target_date = as_of + timedelta(days=offset)
                i = len(rolling)
                previous_7 = rolling[-7:]
                previous_28 = rolling[-28:]
                row_features = [[
                    float(i),
                    float(target_date.weekday()),
                    rolling[-1],
                    rolling[-7],
                    sum(previous_7) / 7,
                    sum(previous_28) / 28,
                ]]
                predicted = max(0.0, float(model.predict(row_features)[0]))
                predicted = 0.8 * predicted + 0.2 * baseline
                predictions.append(predicted)
                rolling.append(predicted)

            method = "random_forest"
        except Exception:
            predictions = []

    if not predictions:
        weekday_averages = [baseline] * 7
        recent = history[-56:]

        if nonzero_days >= 8:
            for weekday in range(7):
                matching = [
                    quantity for day, quantity in recent
                    if day.weekday() == weekday
                ]
                if matching:
                    weekday_averages[weekday] = sum(matching) / len(matching)

        predictions = [
            max(
                0.0,
                weekday_averages[
                    (as_of + timedelta(days=offset)).weekday()
                ],
            )
            for offset in range(1, 31)
        ]

    confidence = (
        "high" if nonzero_days >= 45
        else "medium" if nonzero_days >= 15
        else "low"
    )

    return {
        "product_id": product.get("product_id"),
        "product_code": product.get("product_code"),
        "name": product.get("name", "Unknown product"),
        "current_stock": int(product.get("quantity") or 0),
        "minimum_stock": int(product.get("minimum_stock") or 0),
        "forecast_units_7d": ceil(sum(predictions[:7])),
        "forecast_units_30d": ceil(sum(predictions[:30])),
        "average_daily_demand": round(sum(predictions) / 30, 3),
        "history_days": 180,
        "nonzero_sales_days": nonzero_days,
        "confidence": confidence,
        "method": method,
    }
