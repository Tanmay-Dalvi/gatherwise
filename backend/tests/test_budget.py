import pytest
import math
from backend.app.models import BudgetItem
from backend.app.services.budget_calculator import calculate_budget_summary

def test_budget_calculation_deterministic():
    items = [
        BudgetItem(event_id="e1", category="Venue", description="Hall", estimated_cost=1000.0, actual_cost=950.0),
        BudgetItem(event_id="e1", category="Catering", description="Food", estimated_cost=2000.0, actual_cost=2100.0),
        BudgetItem(event_id="e1", category="Music", description="DJ", estimated_cost=500.0, actual_cost=500.0),
    ]
    summary = calculate_budget_summary(target_budget=4000.0, items=items)

    assert summary.total_estimated == 3500.0
    assert summary.total_actual == 3550.0
    assert summary.target_budget == 4000.0
    assert summary.remaining_budget == 450.0 # 4000 - 3550
    assert summary.variance == 50.0 # 3550 - 3500 (over estimated by 50)
    assert not summary.is_over_budget

    assert "Venue" in summary.category_breakdown
    assert summary.category_breakdown["Venue"].estimated == 1000.0
    assert summary.category_breakdown["Venue"].actual == 950.0
    assert summary.category_breakdown["Venue"].percentage_of_budget == 25.0

def test_budget_over_target():
    items = [
        BudgetItem(event_id="e1", category="Venue", description="Hall", estimated_cost=3000.0, actual_cost=3200.0),
        BudgetItem(event_id="e1", category="Catering", description="Food", estimated_cost=2500.0, actual_cost=2000.0),
    ]
    summary = calculate_budget_summary(target_budget=5000.0, items=items)
    assert summary.total_actual == 5200.0
    assert summary.remaining_budget == -200.0
    assert summary.is_over_budget is True

def test_budget_zero_target():
    items = [
        BudgetItem(event_id="e1", category="Venue", description="Free Park", estimated_cost=0.0, actual_cost=0.0)
    ]
    summary = calculate_budget_summary(target_budget=0.0, items=items)
    assert summary.target_budget == 0.0
    assert summary.total_estimated == 0.0
    assert summary.total_actual == 0.0
    assert summary.remaining_budget == 0.0
    assert not summary.is_over_budget
    assert summary.category_breakdown["Venue"].percentage_of_budget == 0.0

def test_budget_all_actuals_zero():
    items = [
        BudgetItem(event_id="e1", category="Venue", description="Hall", estimated_cost=2000.0, actual_cost=0.0),
        BudgetItem(event_id="e1", category="Catering", description="Food", estimated_cost=1500.0, actual_cost=0.0)
    ]
    summary = calculate_budget_summary(target_budget=5000.0, items=items)
    assert summary.total_actual == 0.0
    assert summary.total_estimated == 3500.0
    assert summary.remaining_budget == 5000.0 # 5000 - 0 spent
    assert not summary.is_over_budget

def test_budget_estimated_over_target_flags_over_budget():
    items = [
        BudgetItem(event_id="e1", category="Venue", description="Luxury Villa", estimated_cost=6000.0, actual_cost=0.0)
    ]
    summary = calculate_budget_summary(target_budget=5000.0, items=items)
    assert summary.total_estimated == 6000.0
    assert summary.is_over_budget is True # Plan estimates exceed target budget

def test_budget_rejection_negative_and_nan():
    with pytest.raises(ValueError):
        calculate_budget_summary(-100.0, [])

    with pytest.raises(ValueError):
        calculate_budget_summary(float("nan"), [])

    with pytest.raises(ValueError):
        calculate_budget_summary(float("inf"), [])
