/* ============================================================
   BAR MUBITI — EmailJS connection settings
   ------------------------------------------------------------
   Sends the manager an email the moment a reservation is submitted.
   100% free (EmailJS free tier: 200 emails/month), no backend needed.

   SETUP (about 5 minutes):
   1. Go to https://www.emailjs.com → sign up free.
   2. Email Services → Add New Service → connect Gmail (or any inbox)
      the manager checks. Copy the "Service ID".
   3. Email Templates → Create New Template. Use these variable names
      in the template body (click "..." to insert variables):
        {{name}}  {{phone}}  {{party_size}}  {{preferred_date}}
        {{preferred_time}}  {{message}}
      Set the template's "To email" field to the manager's email address.
      Copy the "Template ID".
   4. Account → General → copy your "Public Key".
   5. Paste all three below.
   6. In EmailJS dashboard → Account → Security, add your site's domain
      (e.g. bar-mubiti-website.vercel.app) to the allowed origins list —
      this is what keeps the public key safe to expose in client code,
      the same way Supabase's anon key works.
   ============================================================ */

const EMAILJS_PUBLIC_KEY = "wGaNkv0dAtrOCKBfv";
const EMAILJS_SERVICE_ID = "service_mit5c2j";
const EMAILJS_TEMPLATE_ID = "template_06sjaar";

const IS_EMAILJS_CONFIGURED =
  !EMAILJS_PUBLIC_KEY.startsWith("YOUR_") &&
  !EMAILJS_SERVICE_ID.startsWith("YOUR_") &&
  !EMAILJS_TEMPLATE_ID.startsWith("YOUR_");

if (IS_EMAILJS_CONFIGURED && window.emailjs) {
  window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}
