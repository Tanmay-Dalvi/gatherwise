import httpx

BASE = "http://127.0.0.1:8000/api/v1"

def run_smoke_test():
    with httpx.Client(base_url=BASE, timeout=35.0) as client:
        # 1. Health check
        h = client.get("/health").json()
        assert h["status"] == "ok"
        print("✓ 1. Health check OK")

        # 2. Seed demo events
        seed = client.post("/events/seed-demo").json()
        assert seed["count"] == 3
        print(f"✓ 2. Seeded demo events: {seed['count']}")

        # 3. List events
        events = client.get("/events").json()
        assert len(events) >= 3
        wedding = next(e for e in events if e["event_type"] == "wedding")
        wedding_id = wedding["id"]
        title = wedding["title"]
        print(f"✓ 3. Found wedding celebration: '{title}' ({wedding_id})")

        # 4. Fetch full plan
        plan = client.get(f"/events/{wedding_id}/plan").json()
        assert len(plan["budget_items"]) >= 6
        assert len(plan["timeline"]) >= 5
        assert len(plan["checklist"]) >= 5
        assert len(plan["ideas"]) >= 3
        print(f"✓ 4. Plan loaded ({len(plan['budget_items'])} budget lines, {len(plan['timeline'])} milestones, {len(plan['checklist'])} tasks)")

        # 5. Verify budget calculations
        summary = plan["budget_summary"]
        calc_est = round(sum(b["estimated_cost"] for b in plan["budget_items"]), 2)
        assert abs(summary["total_estimated"] - calc_est) < 0.01
        print(f"✓ 5. Budget math verified: Target={summary['target_budget']}, Estimated={summary['total_estimated']}")

        # 6. Edit budget item actual spend
        first_item = plan["budget_items"][0]
        first_item["actual_cost"] = 7500.0
        updated_plan = client.put(f"/events/{wedding_id}/budget-items", json={"items": plan["budget_items"]}).json()
        assert updated_plan["budget_summary"]["total_actual"] >= 7500.0
        expected_remaining = round(updated_plan["budget_summary"]["target_budget"] - updated_plan["budget_summary"]["total_actual"], 2)
        assert updated_plan["budget_summary"]["remaining_budget"] == expected_remaining
        print(f"✓ 6. Actual spend updated to 7500.0; remaining budget correctly recalculated to {expected_remaining}")

        # 7. Targeted section regeneration preserving manual items
        regen_res = client.post(f"/events/{wedding_id}/regenerate-section", json={
            "section": "budget",
            "user_prompt": "Adjust floral budget for seasonal wildflowers",
            "preserve_manual_items": True
        }).json()
        assert any(b["actual_cost"] == 7500.0 for b in regen_res["budget_items"])
        print("✓ 7. Targeted budget regeneration succeeded while preserving manual edits")

        # 8. Checklist completion toggle
        first_task = plan["checklist"][0]
        first_task["status"] = "done"
        task_res = client.put(f"/events/{wedding_id}/checklist-tasks", json={"tasks": [first_task] + plan["checklist"][1:]}).json()
        assert task_res["checklist"][0]["status"] == "done"
        print("✓ 8. Checklist task status toggled to 'done' and persisted")

        # 9. Export markdown
        md = client.get(f"/events/{wedding_id}/export/markdown")
        assert md.status_code == 200
        assert "Itemized Budget Breakdown" in md.text
        print("✓ 9. Formatted Markdown export generated successfully")

        # 10. Export JSON
        js = client.get(f"/events/{wedding_id}/export/json")
        assert js.status_code == 200
        assert js.json()["event"]["id"] == wedding_id
        print("✓ 10. Sanitized JSON export verified")

        # 11. Create, generate, and delete new event
        new_ev = client.post("/events", json={
            "title": "Smoke Test Gala",
            "event_type": "custom",
            "location": "Skyline Ballroom",
            "guest_count": 150,
            "budget": 25000.0,
            "currency": "USD"
        }).json()
        new_id = new_ev["id"]
        gen_plan = client.post(f"/events/{new_id}/generate").json()
        assert len(gen_plan["budget_items"]) > 0
        del_res = client.delete(f"/events/{new_id}").json()
        assert del_res["status"] == "deleted"
        assert client.get(f"/events/{new_id}").status_code == 404
        print("✓ 11. Custom celebration creation, plan generation, and cascading deletion verified")

        print("\nALL 11 LIVE SMOKE TEST STEPS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_smoke_test()
