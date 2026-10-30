import uuid
from typing import List, Tuple
from backend.app.models import (
    Event, BudgetItem, TimelineMilestone, ChecklistTask, CreativeIdea
)

def generate_fallback_plan(
    event: Event,
    custom_prompt: str = ""
) -> Tuple[List[BudgetItem], List[TimelineMilestone], List[ChecklistTask], List[CreativeIdea], List[str]]:
    """
    Deterministically generates a rich, realistic, cohesive event plan
    tailored to the event type, budget, guest count, location, style, and priorities.
    Used for demo mode and graceful provider fallback.
    """
    event_type = event.event_type.lower()
    budget = event.budget
    guests = max(event.guest_count, 1)
    location = event.location
    style = event.style or "Celebratory"
    currency = event.currency

    # 1. Budget Generation
    budget_items: List[BudgetItem] = []
    
    # Weight allocations by event type
    if "wedding" in event_type:
        allocations = [
            ("Venue & Rentals", "Ceremony & Reception Space Rental (incl. tables/chairs)", 0.28, "Reserve at least 9 months ahead; includes indoor backup"),
            ("Catering & Bar", f"Full-Service Plated/Buffet Dinner for ~{guests} guests", 0.32, f"Estimated ~{round(budget * 0.32 / guests, 1)} {currency}/guest incl. service and gratuity"),
            ("Photography & Video", "Full-day photo and highlight video coverage (8 hrs)", 0.12, "Includes high-res digital gallery and second shooter"),
            ("Florals & Decor", f"{style} Floral Arrangements, Ceremony Arch & Centerpieces", 0.08, "Seasonal blooms to maximize budget impact"),
            ("Music & Entertainment", "Professional DJ/MC & Sound System Setup", 0.07, "Includes ceremony microphones and reception sound"),
            ("Attire & Beauty", "Bridal/Groom Attire Alterations, Hair & Makeup", 0.05, "Trials booked 6 weeks before wedding day"),
            ("Stationery & Signage", "Invitations, Welcome Sign, Table Numbers & Menus", 0.02, "Digital RSVP tracking recommended to curb waste"),
            ("Contingency Buffer", "Emergency Reserve Fund & Miscellaneous Overages", 0.06, "Reserved for unexpected vendor tips or weather adjustments"),
        ]
    elif "birthday" in event_type:
        allocations = [
            ("Venue Rental", f"Private Event Space / Lounge in {location}", 0.30, "Rental window includes 2-hour early setup time"),
            ("Catering & Drinks", f"Cocktail Bites, Signature Drinks & Cake for {guests} guests", 0.35, "Curated menu featuring crowd favorites and mocktail options"),
            ("Entertainment", "Live DJ / Acoustic Musician or Interactive Entertainment", 0.14, "Curated custom playlist and guest requests"),
            ("Decor & Lighting", f"{style} Themed Balloon Installation, Photo Backdrop & Lighting", 0.09, "Instagrammable focal photo zone"),
            ("Photography", "Event Photographer (3-hour party coverage)", 0.06, "Captures candid guest moments and group portraits"),
            ("Favors & Cake", "Custom Tiered Celebration Cake & Take-home Favors", 0.03, "Includes gluten-free / vegan cupcakes"),
            ("Contingency Buffer", "Incidentals & Day-of Tips", 0.03, "Held for extra beverage tabs or day-of extensions"),
        ]
    elif "community" in event_type:
        allocations = [
            ("Permits & Venue", f"Public Park / Community Hall Rental & Municipal Permits", 0.20, "Ensure sound ordinances and park ranger approvals are signed"),
            ("Refreshments", f"Community Food Trucks / Bulk Refreshments for {guests} attendees", 0.30, "Family-friendly healthy snacks, hydration stations, and coffee"),
            ("Sound & Staging", "PA Audio System, Microphones & Stage Rental", 0.18, "Suitable for speeches, acoustic performers, and announcements"),
            ("Safety & Sanitation", "Porta-potties, Recycling/Trash Stations & First Aid Kit", 0.12, "Compliance with municipal gathering sanitation standards"),
            ("Signage & Promotion", "Welcome Banners, Directional Signs & Local Flyers", 0.08, "Reusable weather-resistant vinyl signs"),
            ("Activities & Games", "Family Lawn Games, Crafts Booth & Community Raffle", 0.07, "Engaging activities for all age demographics"),
            ("Contingency Buffer", "Weather Logistics / Emergency Fund", 0.05, "Pop-up canopies or rain poncho backup supplies"),
        ]
    else: # Custom / Gala / Gathering
        allocations = [
            ("Venue", f"Event Space Rental in {location}", 0.30, "Confirmed for full setup, event duration, and teardown"),
            ("Food & Beverage", f"Gourmet Catering & Refreshments for {guests} guests", 0.35, "Covers dietary accommodations and bar service"),
            ("Atmosphere & Decor", f"{style} Themed Styling, Table Linens & Ambient Lighting", 0.12, "Elevates venue aesthetics to match theme"),
            ("Audio/Visual & Music", "Sound System, Microphones, Ambient Lighting & Music", 0.10, "Ensures speeches and music are audible everywhere"),
            ("Staff & Coordination", "Event Day Coordinator & Clean-up Crew", 0.08, "Manages timeline and keeps organizers stress-free"),
            ("Contingency Fund", "General Contingency Buffer", 0.05, "Buffer for last-minute guest additions"),
        ]

    for cat, desc, pct, notes in allocations:
        est_cost = round(budget * pct, 2)
        budget_items.append(
            BudgetItem(
                id=str(uuid.uuid4()),
                event_id=event.id,
                category=cat,
                description=desc,
                estimated_cost=est_cost,
                actual_cost=0.0,
                notes=notes,
                is_custom=False
            )
        )

    # 2. Timeline Milestones Generation
    timeline: List[TimelineMilestone] = []
    if "wedding" in event_type:
        timeline = [
            TimelineMilestone(
                event_id=event.id,
                phase="Planning Phase (6-9 Months Out)",
                title="Lock Down Ceremony & Reception Venue",
                target_date="6-9 Months Prior",
                priority="high",
                status="completed",
                notes="Signed contract with deposit; verified noise curfew and catering guidelines."
            ),
            TimelineMilestone(
                event_id=event.id,
                phase="Vendor Booking (4-6 Months Out)",
                title="Contract Key Vendors: Photographer, Caterer & DJ",
                target_date="4-6 Months Prior",
                priority="high",
                status="in_progress",
                notes="Review portfolios and schedule menu tasting sessions."
            ),
            TimelineMilestone(
                event_id=event.id,
                phase="Guest Experience (2-3 Months Out)",
                title="Send Invitations & Launch RSVP Registry",
                target_date="8-10 Weeks Prior",
                priority="high",
                status="pending",
                notes="Track RSVPs digitally; gather dietary allergies and song requests."
            ),
            TimelineMilestone(
                event_id=event.id,
                phase="Final Adjustments (2-4 Weeks Out)",
                title="Finalize Seating Chart & Headcount with Caterer",
                target_date="3 Weeks Prior",
                priority="medium",
                status="pending",
                notes="Submit final place cards and dietary breakdown."
            ),
            TimelineMilestone(
                event_id=event.id,
                phase="Week-Of Execution",
                title="Ceremony Rehearsal & Vendor Schedule Distribution",
                target_date="2 Days Prior",
                priority="high",
                status="pending",
                notes="Walkthrough with wedding party and coordinator; confirm load-in times."
            ),
            TimelineMilestone(
                event_id=event.id,
                phase="Day-Of Run of Show",
                title="Bridal Party Prep, First Look & Ceremony Launch",
                target_date="Event Day - 14:00",
                priority="high",
                status="pending",
                notes="Photographer arrives for getting-ready shots; florals delivered by noon."
            ),
            TimelineMilestone(
                event_id=event.id,
                phase="Post-Event Wrap-up",
                title="Vendor Settlement, Rental Returns & Thank You Cards",
                target_date="+1 Week Post-Event",
                priority="low",
                status="pending",
                notes="Distribute vendor gratuities and mail personalized thank you notes."
            ),
        ]
    elif "birthday" in event_type:
        timeline = [
            TimelineMilestone(
                event_id=event.id,
                phase="Initial Concept (4-6 Weeks Out)",
                title="Confirm Theme, Guest List & Reserve Space",
                target_date="4 Weeks Prior",
                priority="high",
                status="completed",
                notes=f"Selected '{style}' theme tailored for {guests} guests."
            ),
            TimelineMilestone(
                event_id=event.id,
                phase="Invitations & Entertainment (3 Weeks Out)",
                title="Send Digital Invites & Book DJ / Music Equipment",
                target_date="3 Weeks Prior",
                priority="high",
                status="in_progress",
                notes="Request RSVPs with two weeks notice."
            ),
            TimelineMilestone(
                event_id=event.id,
                phase="Details & Orders (1-2 Weeks Out)",
                title="Order Custom Cake & Source Themed Photo Decor",
                target_date="10 Days Prior",
                priority="medium",
                status="pending",
                notes="Confirm pickup time for cake on morning of event."
            ),
            TimelineMilestone(
                event_id=event.id,
                phase="Event Day Run of Show",
                title="Venue Setup, Ice/Drinks Delivery & Music Soundcheck",
                target_date="Event Day - 17:00",
                priority="high",
                status="pending",
                notes="Complete soundcheck 45 mins before first guest arrival."
            ),
            TimelineMilestone(
                event_id=event.id,
                phase="Event Day Highlight",
                title="Guest Welcome, Cake Cutting & Birthday Toast",
                target_date="Event Day - 20:30",
                priority="medium",
                status="pending",
                notes="Gather all guests around the focal dessert table for speeches and photos."
            ),
        ]
    else:
        timeline = [
            TimelineMilestone(
                event_id=event.id,
                phase="Planning & Permissions (8 Weeks Out)",
                title="Secure Venue & File City/Park Permits",
                target_date="8 Weeks Prior",
                priority="high",
                status="completed",
                notes="Permits approved for sound amplification and public gathering."
            ),
            TimelineMilestone(
                event_id=event.id,
                phase="Community Outreach (4 Weeks Out)",
                title="Publish Announcements, Flyers & Volunteer Signup",
                target_date="4 Weeks Prior",
                priority="high",
                status="in_progress",
                notes="Distribute promo on local community boards and social groups."
            ),
            TimelineMilestone(
                event_id=event.id,
                phase="Logistics Alignment (2 Weeks Out)",
                title="Confirm Audio Equipment, Waste Bins & Food Trucks",
                target_date="2 Weeks Prior",
                priority="medium",
                status="pending",
                notes="Review electrical access map with all vendors."
            ),
            TimelineMilestone(
                event_id=event.id,
                phase="Event Day Operations",
                title="Volunteer Briefing, Station Setup & Gate Opening",
                target_date="Event Day - 09:00",
                priority="high",
                status="pending",
                notes="Safety lead checks first aid booth and clear signage."
            ),
            TimelineMilestone(
                event_id=event.id,
                phase="Teardown & Cleanup",
                title="Litter Sweep, Equipment Return & Venue Handover",
                target_date="Event Day - 18:00",
                priority="high",
                status="pending",
                notes="Leave venue in pristine condition to reclaim security deposit."
            ),
        ]

    # 3. Vendor & Task Checklist Generation
    checklist: List[ChecklistTask] = []
    if "wedding" in event_type:
        checklist = [
            ChecklistTask(
                event_id=event.id,
                category="Venue & Facilities",
                title="Schedule final venue walkthrough and review floorplan",
                due_date="30 Days Prior",
                assigned_to="Lead Planner",
                contact_info="Venue Coordinator",
                status="in_progress",
                notes="Verify power outlets for DJ and rain shelter arrangement."
            ),
            ChecklistTask(
                event_id=event.id,
                category="Catering & Bar",
                title="Submit final dietary breakdown and vendor meal counts",
                due_date="14 Days Prior",
                assigned_to="Host / Couple",
                contact_info="Catering Manager",
                status="todo",
                notes="Include meals for photographer, videographer, and DJ."
            ),
            ChecklistTask(
                event_id=event.id,
                category="Photography & Media",
                title="Compile mandatory family photo shot list",
                due_date="10 Days Prior",
                assigned_to="Host / Couple",
                contact_info="Lead Photographer",
                status="todo",
                notes="Assign a vocal family member to help gather relatives for shots."
            ),
            ChecklistTask(
                event_id=event.id,
                category="Music & Audio",
                title="Curate 'Must-Play' and 'Do-Not-Play' song lists",
                due_date="14 Days Prior",
                assigned_to="Couple",
                contact_info="DJ / Emcee",
                status="todo",
                notes="Specify processional, first dance, and parent dance tracks."
            ),
            ChecklistTask(
                event_id=event.id,
                category="Decor & Rentals",
                title="Confirm rental drop-off and pickup logistics",
                due_date="7 Days Prior",
                assigned_to="Coordinator",
                contact_info="Party Rental Co.",
                status="todo",
                notes="Ensure delivery team has venue dock access code."
            ),
            ChecklistTask(
                event_id=event.id,
                category="Legal & Officiant",
                title="Obtain marriage license & review vows with officiant",
                due_date="21 Days Prior",
                assigned_to="Couple",
                contact_info="County Clerk / Officiant",
                status="done",
                notes="Keep signed license safely packed in marriage binder."
            )
        ]
    elif "birthday" in event_type:
        checklist = [
            ChecklistTask(
                event_id=event.id,
                category="Venue",
                title="Confirm booking hours, cleaning deposit, and parking",
                due_date="2 Weeks Prior",
                assigned_to="Organizer",
                contact_info="Space Manager",
                status="done",
                notes="Check if confetti or open flames are prohibited."
            ),
            ChecklistTask(
                event_id=event.id,
                category="Food & Bar",
                title="Finalize drink quantities, ice supply, and glassware",
                due_date="5 Days Prior",
                assigned_to="Beverage Lead",
                contact_info="Beverage Depot",
                status="in_progress",
                notes="Estimate 1.5 drinks per person per hour."
            ),
            ChecklistTask(
                event_id=event.id,
                category="Decor & Atmosphere",
                title="Assemble balloon arch or photo backdrop",
                due_date="Day Before",
                assigned_to="Decor Committee",
                contact_info="",
                status="todo",
                notes="Bring extra command hooks, zip ties, and pump."
            ),
            ChecklistTask(
                event_id=event.id,
                category="Dessert",
                title="Confirm birthday cake flavor, inscription & candle lighter",
                due_date="3 Days Prior",
                assigned_to="Organizer",
                contact_info="Local Bakery",
                status="todo",
                notes="Verify cake knife, server, and matches are packed."
            ),
        ]
    else:
        checklist = [
            ChecklistTask(
                event_id=event.id,
                category="Permits & Safety",
                title="Submit park gathering permit and amplified sound waiver",
                due_date="4 Weeks Prior",
                assigned_to="Community Lead",
                contact_info="City Parks & Rec",
                status="done",
                notes="Approved permit document must be printed and on site."
            ),
            ChecklistTask(
                event_id=event.id,
                category="Logistics",
                title="Reserve portable restrooms and recycling receptacles",
                due_date="3 Weeks Prior",
                assigned_to="Logistics Volunteer",
                contact_info="Sanitation Services",
                status="in_progress",
                notes="Arrange servicing or prompt next-day removal."
            ),
            ChecklistTask(
                event_id=event.id,
                category="Volunteers",
                title="Host 30-minute virtual orientation for event volunteers",
                due_date="5 Days Prior",
                assigned_to="Volunteer Coordinator",
                contact_info="Volunteer Group Chat",
                status="todo",
                notes="Assign shift leads for welcome table, refreshments, and cleanup."
            ),
            ChecklistTask(
                event_id=event.id,
                category="Audio / Visual",
                title="Test wireless microphones and outdoor speaker coverage",
                due_date="Day of Event - 08:00",
                assigned_to="AV Tech",
                contact_info="",
                status="todo",
                notes="Have spare 9V/AA batteries and extension cords ready."
            )
        ]

    # 4. Creative & Personalized Ideas Generation
    ideas: List[CreativeIdea] = []
    if "wedding" in event_type:
        ideas = [
            CreativeIdea(
                event_id=event.id,
                category="Theme & Aesthetic",
                title=f"Curated '{style}' Focal Palette",
                description=f"Incorporate warm terracotta, subtle champagne, and olive greens into table runners and botanical foliage to bring {style} elegance alive in {location}.",
                tags=["decor", "palette", "aesthetic"]
            ),
            CreativeIdea(
                event_id=event.id,
                category="Food & Beverage",
                title="Signature 'His & Hers' Cocktail Station",
                description=f"Create two personalized signature drinks named after special moments, paired with artisanal local bites tailored for {guests} guests.",
                tags=["cocktails", "bar", "interactive"]
            ),
            CreativeIdea(
                event_id=event.id,
                category="Entertainment & Activities",
                title="Audio Guestbook Vintage Telephone",
                description="Replace traditional guestbooks with a rotary telephone where attendees pick up the receiver to record heartfelt audio messages for the couple.",
                tags=["guestbook", "audio", "keepsake"]
            ),
            CreativeIdea(
                event_id=event.id,
                category="Logistics & Savings",
                title="Dual-Use Ceremony & Reception Florals",
                description="Have your coordinator reposition the ceremony arch florals behind the sweetheart table and reuse bridesmaids bouquets as cocktail table centerpieces.",
                tags=["budget-hack", "florals", "efficiency"]
            )
        ]
    elif "birthday" in event_type:
        ideas = [
            CreativeIdea(
                event_id=event.id,
                category="Theme & Aesthetic",
                title=f"Illuminated '{style}' Neon Feature Wall",
                description=f"Rent or build a customized faux-hedge photo wall with a warm LED neon quote, framing the celebration theme perfectly in photos.",
                tags=["photo-op", "neon", "decor"]
            ),
            CreativeIdea(
                event_id=event.id,
                category="Food & Beverage",
                title="Late-Night Gourmet Slider & Fry Bar",
                description=f"Surprise {guests} guests at 22:00 with mini warm sliders and truffle fries in paper cones as a memorable high-energy late night snack.",
                tags=["food", "late-night", "party"]
            ),
            CreativeIdea(
                event_id=event.id,
                category="Entertainment & Activities",
                title="Decade Trivia & Crowd Roasts",
                description="Run a 15-minute trivia game with questions about the guest of honor, featuring small novelty prizes for the highest scorers.",
                tags=["trivia", "icebreaker", "fun"]
            ),
            CreativeIdea(
                event_id=event.id,
                category="Logistics & Savings",
                title="Crowdsourced Digital Photo Wall",
                description="Display a live QR code on tables linking to a shared photo album so everyone can upload raw party clips throughout the night.",
                tags=["digital", "photos", "community"]
            )
        ]
    else: # Community / Custom
        ideas = [
            CreativeIdea(
                event_id=event.id,
                category="Theme & Aesthetic",
                title="Community Heritage Art Wall",
                description="Set up a communal chalkboard or canvas where neighbors and attendees write what community means to them or doodle neighborhood landmarks.",
                tags=["community", "art", "collaborative"]
            ),
            CreativeIdea(
                event_id=event.id,
                category="Food & Beverage",
                title="Taste of the Neighborhood Food Stalls",
                description=f"Partner with 3-4 local family-owned eateries in {location} to offer bite-sized sampling tickets, keeping vendor costs low while celebrating local culture.",
                tags=["local-food", "partnerships", "community"]
            ),
            CreativeIdea(
                event_id=event.id,
                category="Entertainment & Activities",
                title="Acoustic Porch-Style Music Showcase",
                description="Feature acoustic sets by local high school and neighborhood musicians, keeping sound levels friendly while championing local talent.",
                tags=["live-music", "all-ages", "entertainment"]
            ),
            CreativeIdea(
                event_id=event.id,
                category="Logistics & Savings",
                title="BYO Picnic Blanket & Reusable Hydration Hub",
                description="Encourage visitors to bring reusable bottles and blankets to reduce seating rental costs and eliminate single-use plastic cups.",
                tags=["sustainability", "eco-friendly", "cost-saving"]
            )
        ]

    assumptions = [
        f"Budgets are calculated for ~{guests} guests based on average vendor market estimates in {location}.",
        "All vendor checklist items represent logistical action items, not verified live availability or contractual bookings.",
        "A 5-10% contingency allocation has been preserved for unforeseen expenses or tax/gratuity variances.",
        "Timeline intervals can be adjusted according to your venue booking window and personal schedule."
    ]

    return budget_items, timeline, checklist, ideas, assumptions
