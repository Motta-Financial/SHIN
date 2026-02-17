import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createAdminUser() {
  console.log("Creating admin user via Supabase Admin API...");

  // Step 1: Create the auth user via Admin API (proper password hashing)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: "admin@shin.ai",
    password: "SHINADMIN!",
    email_confirm: true,
    user_metadata: { full_name: "SHIN Admin" },
  });

  if (authError) {
    console.error("Error creating auth user:", authError.message);
    process.exit(1);
  }

  console.log("Auth user created:", authData.user.id);

  // Step 2: Create the profile with is_admin = true
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: authData.user.id,
      full_name: "SHIN Admin",
      name: "SHIN Admin",
      role: "admin",
      is_admin: true,
    }, { onConflict: "id" });

  if (profileError) {
    console.error("Error creating profile:", profileError.message);
    // Profile might fail due to RLS - try direct SQL
    console.log("Trying direct SQL for profile...");
    const { error: sqlError } = await supabase.rpc("exec_sql", {
      sql: `INSERT INTO profiles (id, full_name, name, role, is_admin, created_at) 
            VALUES ('${authData.user.id}', 'SHIN Admin', 'SHIN Admin', 'admin', true, NOW())
            ON CONFLICT (id) DO UPDATE SET is_admin = true, role = 'admin', full_name = 'SHIN Admin', name = 'SHIN Admin'`
    });
    if (sqlError) {
      console.error("SQL fallback also failed:", sqlError.message);
    }
  }

  console.log("Admin user setup complete!");
  console.log("Email: admin@shin.ai");
  console.log("Password: SHINADMIN!");
  console.log("User ID:", authData.user.id);
}

createAdminUser();
