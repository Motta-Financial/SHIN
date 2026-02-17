-- ============================================================
-- 1. Create the superuser auth account
-- ============================================================
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@shin.ai';

  IF v_user_id IS NULL THEN
    -- Insert into auth.users via Supabase's internal signup
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@shin.ai',
      crypt('SHINADMIN!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '',
      '',
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"SHIN Admin"}'
    )
    RETURNING id INTO v_user_id;

    -- Create identity record for email auth
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      created_at,
      updated_at,
      last_sign_in_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'admin@shin.ai'),
      'email',
      v_user_id::text,
      NOW(),
      NOW(),
      NOW()
    );

    RAISE NOTICE 'Created superuser with ID: %', v_user_id;
  ELSE
    RAISE NOTICE 'Superuser already exists with ID: %', v_user_id;
  END IF;

  -- Upsert the profile with is_admin = true
  INSERT INTO profiles (id, email, full_name, role, is_admin, created_at, updated_at)
  VALUES (v_user_id, 'admin@shin.ai', 'SHIN Admin', 'admin', true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    is_admin = true,
    role = 'admin',
    full_name = 'SHIN Admin',
    updated_at = NOW();

END $$;

-- ============================================================
-- 2. Add admin SELECT bypass to all RLS-enabled tables missing it
-- ============================================================

-- announcements
DROP POLICY IF EXISTS "admin_read_announcements" ON announcements;
CREATE POLICY "admin_read_announcements" ON announcements FOR SELECT USING (is_admin());

-- app_settings
DROP POLICY IF EXISTS "admin_read_app_settings" ON app_settings;
CREATE POLICY "admin_read_app_settings" ON app_settings FOR SELECT USING (is_admin());

-- class_recordings
DROP POLICY IF EXISTS "admin_read_class_recordings" ON class_recordings;
CREATE POLICY "admin_read_class_recordings" ON class_recordings FOR SELECT USING (is_admin());

-- class_sessions
DROP POLICY IF EXISTS "admin_read_class_sessions" ON class_sessions;
CREATE POLICY "admin_read_class_sessions" ON class_sessions FOR SELECT USING (is_admin());

-- client_assignments
DROP POLICY IF EXISTS "admin_read_client_assignments" ON client_assignments;
CREATE POLICY "admin_read_client_assignments" ON client_assignments FOR SELECT USING (is_admin());

-- client_directors
DROP POLICY IF EXISTS "admin_read_client_directors" ON client_directors;
CREATE POLICY "admin_read_client_directors" ON client_directors FOR SELECT USING (is_admin());

-- client_documents
DROP POLICY IF EXISTS "admin_read_client_documents" ON client_documents;
CREATE POLICY "admin_read_client_documents" ON client_documents FOR SELECT USING (is_admin());

-- client_intake
DROP POLICY IF EXISTS "admin_read_client_intake" ON client_intake;
CREATE POLICY "admin_read_client_intake" ON client_intake FOR SELECT USING (is_admin());

-- client_messages
DROP POLICY IF EXISTS "admin_read_client_messages" ON client_messages;
CREATE POLICY "admin_read_client_messages" ON client_messages FOR SELECT USING (is_admin());

-- client_questions
DROP POLICY IF EXISTS "admin_read_client_questions" ON client_questions;
CREATE POLICY "admin_read_client_questions" ON client_questions FOR SELECT USING (is_admin());

-- client_task_comments
DROP POLICY IF EXISTS "admin_read_client_task_comments" ON client_task_comments;
CREATE POLICY "admin_read_client_task_comments" ON client_task_comments FOR SELECT USING (is_admin());

-- client_tasks
DROP POLICY IF EXISTS "admin_read_client_tasks" ON client_tasks;
CREATE POLICY "admin_read_client_tasks" ON client_tasks FOR SELECT USING (is_admin());

-- clients
DROP POLICY IF EXISTS "admin_read_clients" ON clients;
CREATE POLICY "admin_read_clients" ON clients FOR SELECT USING (is_admin());

-- clinic_agendas
DROP POLICY IF EXISTS "admin_read_clinic_agendas" ON clinic_agendas;
CREATE POLICY "admin_read_clinic_agendas" ON clinic_agendas FOR SELECT USING (is_admin());

-- clinic_clients
DROP POLICY IF EXISTS "admin_read_clinic_clients" ON clinic_clients;
CREATE POLICY "admin_read_clinic_clients" ON clinic_clients FOR SELECT USING (is_admin());

-- clinic_directors
DROP POLICY IF EXISTS "admin_read_clinic_directors" ON clinic_directors;
CREATE POLICY "admin_read_clinic_directors" ON clinic_directors FOR SELECT USING (is_admin());

-- clinic_students
DROP POLICY IF EXISTS "admin_read_clinic_students" ON clinic_students;
CREATE POLICY "admin_read_clinic_students" ON clinic_students FOR SELECT USING (is_admin());

-- clinic_syllabi
DROP POLICY IF EXISTS "admin_read_clinic_syllabi" ON clinic_syllabi;
CREATE POLICY "admin_read_clinic_syllabi" ON clinic_syllabi FOR SELECT USING (is_admin());

-- clinics
DROP POLICY IF EXISTS "admin_read_clinics" ON clinics;
CREATE POLICY "admin_read_clinics" ON clinics FOR SELECT USING (is_admin());

-- course_materials
DROP POLICY IF EXISTS "admin_read_course_materials" ON course_materials;
CREATE POLICY "admin_read_course_materials" ON course_materials FOR SELECT USING (is_admin());

-- directors
DROP POLICY IF EXISTS "admin_read_directors" ON directors;
CREATE POLICY "admin_read_directors" ON directors FOR SELECT USING (is_admin());

-- discussion_posts
DROP POLICY IF EXISTS "admin_read_discussion_posts" ON discussion_posts;
CREATE POLICY "admin_read_discussion_posts" ON discussion_posts FOR SELECT USING (is_admin());

-- discussion_replies
DROP POLICY IF EXISTS "admin_read_discussion_replies" ON discussion_replies;
CREATE POLICY "admin_read_discussion_replies" ON discussion_replies FOR SELECT USING (is_admin());

-- evaluations
DROP POLICY IF EXISTS "admin_read_evaluations" ON evaluations;
CREATE POLICY "admin_read_evaluations" ON evaluations FOR SELECT USING (is_admin());

-- prospect_interviews
DROP POLICY IF EXISTS "admin_read_prospect_interviews" ON prospect_interviews;
CREATE POLICY "admin_read_prospect_interviews" ON prospect_interviews FOR SELECT USING (is_admin());

-- prospects
DROP POLICY IF EXISTS "admin_read_prospects" ON prospects;
CREATE POLICY "admin_read_prospects" ON prospects FOR SELECT USING (is_admin());

-- published_agendas
DROP POLICY IF EXISTS "admin_read_published_agendas" ON published_agendas;
CREATE POLICY "admin_read_published_agendas" ON published_agendas FOR SELECT USING (is_admin());

-- scheduled_client_meetings
DROP POLICY IF EXISTS "admin_read_scheduled_client_meetings" ON scheduled_client_meetings;
CREATE POLICY "admin_read_scheduled_client_meetings" ON scheduled_client_meetings FOR SELECT USING (is_admin());

-- semester_schedule
DROP POLICY IF EXISTS "admin_read_semester_schedule" ON semester_schedule;
CREATE POLICY "admin_read_semester_schedule" ON semester_schedule FOR SELECT USING (is_admin());

-- signed_agreements
DROP POLICY IF EXISTS "admin_read_signed_agreements" ON signed_agreements;
CREATE POLICY "admin_read_signed_agreements" ON signed_agreements FOR SELECT USING (is_admin());

-- students
DROP POLICY IF EXISTS "admin_read_students" ON students;
CREATE POLICY "admin_read_students" ON students FOR SELECT USING (is_admin());

-- weekly_summaries
DROP POLICY IF EXISTS "admin_read_weekly_summaries" ON weekly_summaries;
CREATE POLICY "admin_read_weekly_summaries" ON weekly_summaries FOR SELECT USING (is_admin());
