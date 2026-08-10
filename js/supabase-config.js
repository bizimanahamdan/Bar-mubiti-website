/* ============================================================
   BAR MUBITI — Supabase connection settings
   ============================================================ */

const SUPABASE_URL = "https://sbhjmqghnvcndreifeyu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Ihxri7TaKy92gKBMYjV9yg_rTXLhtMi";

const IS_SUPABASE_CONFIGURED =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_ANON_KEY.startsWith("YOUR_");

let supabaseClient = null;
if (IS_SUPABASE_CONFIGURED && window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
