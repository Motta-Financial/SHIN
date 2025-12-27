import csv
import os
from datetime import datetime
from supabase import create_client, Client

# Initialize Supabase client
url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: Missing Supabase credentials")
    print("Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set")
    exit(1)

supabase: Client = create_client(url, key)

# Read the CSV file
csv_path = "user_read_only_context/text_attachments/MIGRATION_DEBRIEFS-VYtJJ.csv"

# First, fetch existing data for mapping
print("Fetching existing students...")
students_response = supabase.table("students").select("id, full_name, email, clinic").execute()
students = {s["full_name"].lower().strip(): s for s in students_response.data if s.get("full_name")}
print(f"Found {len(students)} students")

print("Fetching existing clients...")
clients_response = supabase.table("clients").select("id, name").execute()
clients = {c["name"].lower().strip(): c for c in clients_response.data if c.get("name")}
print(f"Found {len(clients)} clients")

print("Fetching existing clinics...")
clinics_response = supabase.table("clinics").select("id, name").execute()
clinics = {c["name"].lower().strip(): c for c in clinics_response.data if c.get("name")}
print(f"Found {len(clinics)} clinics")

# Fetch active semester
print("Fetching active semester...")
semester_response = supabase.table("semester_config").select("id").eq("is_active", True).execute()
semester_id = semester_response.data[0]["id"] if semester_response.data else None
print(f"Active semester ID: {semester_id}")

# Clinic name mapping (CSV values to database values)
clinic_mapping = {
    "consulting": "Consulting",
    "funding": "Resource Acquisition",
    "resource acquisition": "Resource Acquisition",
    "marketing": "Marketing",
    "accounting": "Accounting",
}

# Track statistics
stats = {
    "total": 0,
    "inserted": 0,
    "skipped": 0,
    "errors": 0,
    "unmapped_students": set(),
    "unmapped_clients": set(),
    "unmapped_clinics": set(),
}

# Read and process CSV
print("\nProcessing CSV file...")
with open(csv_path, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    
    debriefs_to_insert = []
    
    for row in reader:
        stats["total"] += 1
        
        # Skip empty rows
        if not row.get("Date") or not row.get("Student Name"):
            stats["skipped"] += 1
            continue
        
        # Parse date
        try:
            date_str = row["Date"].strip()
            date_obj = datetime.strptime(date_str, "%m/%d/%Y")
            date_submitted = date_obj.isoformat()
        except ValueError as e:
            print(f"Error parsing date '{row['Date']}': {e}")
            stats["errors"] += 1
            continue
        
        # Map clinic name
        clinic_csv = row.get("Clinic", "").strip().lower()
        clinic_name = clinic_mapping.get(clinic_csv, clinic_csv.title())
        clinic_id = None
        
        # Try to find clinic ID
        for db_clinic_name, clinic_data in clinics.items():
            if clinic_name.lower() in db_clinic_name or db_clinic_name in clinic_name.lower():
                clinic_id = clinic_data["id"]
                clinic_name = clinic_data["name"]
                break
        
        if not clinic_id:
            stats["unmapped_clinics"].add(clinic_name)
        
        # Map student
        student_name = row.get("Student Name", "").strip()
        student_lower = student_name.lower()
        student_id = None
        student_email = None
        
        # Try exact match first
        if student_lower in students:
            student_data = students[student_lower]
            student_id = student_data["id"]
            student_email = student_data.get("email")
        else:
            # Try partial match
            for db_name, student_data in students.items():
                if student_lower in db_name or db_name in student_lower:
                    student_id = student_data["id"]
                    student_email = student_data.get("email")
                    break
        
        if not student_id:
            stats["unmapped_students"].add(student_name)
        
        # Map client
        client_name = row.get("Client", "").strip()
        client_lower = client_name.lower()
        client_id = None
        
        # Try exact match first
        if client_lower in clients:
            client_id = clients[client_lower]["id"]
        else:
            # Try partial match
            for db_name, client_data in clients.items():
                if client_lower in db_name or db_name in client_lower:
                    client_id = client_data["id"]
                    client_name = client_data["name"]  # Use official name
                    break
        
        if not client_id:
            stats["unmapped_clients"].add(client_name)
        
        # Parse hours
        hours_str = row.get("Hours Worked", "0").strip()
        try:
            hours = float(hours_str) if hours_str else 0
        except ValueError:
            hours = 0
        
        # Build debrief record
        debrief = {
            "date_submitted": date_submitted,
            "created_at": date_submitted,
            "clinic": clinic_name,
            "clinic_id": clinic_id,
            "client_name": client_name,
            "client_id": client_id,
            "student_id": student_id,
            "student_email": student_email,
            "hours_worked": hours,
            "work_summary": row.get("Summary of work", "").strip(),
            "questions": row.get("Questions", "").strip() or None,
            "status": "reviewed",  # Historical data, mark as reviewed
            "semester_id": semester_id,
        }
        
        # Add action items to work summary if present
        action_items = row.get("Action Items", "").strip()
        if action_items:
            debrief["work_summary"] += f"\n\nAction Items:\n{action_items}"
        
        debriefs_to_insert.append(debrief)

print(f"\nPrepared {len(debriefs_to_insert)} debriefs for insertion")

# Insert in batches
batch_size = 50
for i in range(0, len(debriefs_to_insert), batch_size):
    batch = debriefs_to_insert[i:i + batch_size]
    try:
        result = supabase.table("debriefs").insert(batch).execute()
        stats["inserted"] += len(batch)
        print(f"Inserted batch {i // batch_size + 1}: {len(batch)} records")
    except Exception as e:
        print(f"Error inserting batch {i // batch_size + 1}: {e}")
        stats["errors"] += len(batch)

# Print summary
print("\n" + "=" * 50)
print("IMPORT SUMMARY")
print("=" * 50)
print(f"Total rows processed: {stats['total']}")
print(f"Successfully inserted: {stats['inserted']}")
print(f"Skipped (empty): {stats['skipped']}")
print(f"Errors: {stats['errors']}")

if stats["unmapped_students"]:
    print(f"\nUnmapped students ({len(stats['unmapped_students'])}):")
    for name in sorted(stats["unmapped_students"]):
        print(f"  - {name}")

if stats["unmapped_clients"]:
    print(f"\nUnmapped clients ({len(stats['unmapped_clients'])}):")
    for name in sorted(stats["unmapped_clients"]):
        print(f"  - {name}")

if stats["unmapped_clinics"]:
    print(f"\nUnmapped clinics ({len(stats['unmapped_clinics'])}):")
    for name in sorted(stats["unmapped_clinics"]):
        print(f"  - {name}")

print("\nImport complete!")
