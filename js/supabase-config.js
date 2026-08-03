/* ============================================================
   BAR MUBITI — Supabase connection settings
   ------------------------------------------------------------
   1. Create a free project at https://supabase.com
   2. Go to Project Settings → API
   3. Copy "Project URL" and "anon public" key below
   4. Save this file — both the public site AND the admin panel
      read from here, so you only edit it once.
   ============================================================ */

const SUPABASE_URL = "https://sbhjmqghnvcndreifeyu.supabase.co"; // e.g. https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = "sb_publishable_Ihxri7TaKy92gKBMYjV9yg_rTXLhtMi";

const IS_SUPABASE_CONFIGURED =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_ANON_KEY.startsWith("YOUR_");

let supabaseClient = null;
if (IS_SUPABASE_CONFIGURED && window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
