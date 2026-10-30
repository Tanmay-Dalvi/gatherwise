import math
from typing import List, Dict
from backend.app.models import BudgetItem, BudgetSummary, CategoryCostSummary

def calculate_budget_summary(target_budget: float, items: List[BudgetItem]) -> BudgetSummary:
    """
    Deterministically computes budget totals, variances, and category breakdowns.
    Rejects NaN, infinite, or negative values.
    """
    if math.isnan(target_budget) or math.isinf(target_budget) or target_budget < 0:
        raise ValueError("Target budget must be a non-negative finite number")

    total_estimated = 0.0
    total_actual = 0.0
    category_map: Dict[str, Dict[str, float]] = {}

    for item in items:
        est = item.estimated_cost
        act = item.actual_cost

        if math.isnan(est) or math.isinf(est) or est < 0:
            raise ValueError(f"Invalid estimated cost: {est}")
        if math.isnan(act) or math.isinf(act) or act < 0:
            raise ValueError(f"Invalid actual cost: {act}")

        total_estimated += est
        total_actual += act

        cat = item.category.strip() or "General"
        if cat not in category_map:
            category_map[cat] = {"estimated": 0.0, "actual": 0.0}
        category_map[cat]["estimated"] += est
        category_map[cat]["actual"] += act

    total_estimated = round(total_estimated, 2)
    total_actual = round(total_actual, 2)
    target_budget = round(target_budget, 2)

    # Remaining unspent cash budget from target
    remaining_budget = round(target_budget - total_actual, 2)
    variance = round(total_actual - total_estimated, 2)
    is_over_budget = (total_actual > target_budget) or (total_estimated > target_budget)

    # Calculate category percentages
    category_breakdown: Dict[str, CategoryCostSummary] = {}
    for cat, data in category_map.items():
        cat_est = round(data["estimated"], 2)
        cat_act = round(data["actual"], 2)
        pct = round((cat_est / target_budget * 100.0), 1) if target_budget > 0 else 0.0
        category_breakdown[cat] = CategoryCostSummary(
            estimated=cat_est,
            actual=cat_act,
            percentage_of_budget=pct
        )

    return BudgetSummary(
        total_estimated=total_estimated,
        total_actual=total_actual,
        target_budget=target_budget,
        remaining_budget=remaining_budget,
        variance=variance,
        is_over_budget=is_over_budget,
        category_breakdown=category_breakdown
    )
