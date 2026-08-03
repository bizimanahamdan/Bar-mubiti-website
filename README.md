# Bar Mubiti — Website + Admin Panel

A premium, mobile-first website for Bar Mubiti (bar & grill, Kigali), with a real admin
dashboard the owner can use to update everything — no code required after setup.

No build tools, no npm install. Plain HTML/CSS/JS + Supabase (free tier) for the database,
login, and photo storage. Deploys anywhere that serves static files (Netlify recommended, free).

---

## 1. What's inside

```
bar-mubiti/
├── index.html            ← public website (one page, all sections)
├── css/style.css
├── js/
│   ├── supabase-config.js   ← YOU EDIT THIS (connection keys — one place, used by site + admin)
│   └── main.js               ← renders the site from your data
├── admin/
│   ├── index.html            ← admin login
│   ├── dashboard.html        ← admin dashboard
│   ├── css/admin.css
│   └── js/
│       ├── admin-auth.js
│       └── admin-dashboard.js
├── assets/
│   ├── favicon.svg
│   └── og-image.svg          ← social share image (swap for a real photo later)
├── supabase/
│   └── schema.sql             ← run this once in Supabase to create your database
└── README.md
```

**Pages/sections built:** Home (hero), About, Menu, Gallery, Location & Hours, Reviews, Contact/Reservation, Footer — all on one scrolling page with a sticky nav, per the brief. Admin has its own separate pages (`admin/`).

---

## 2. Set up the backend (15 minutes, one-time)

### a) Create a free Supabase project
1. Go to https://supabase.com → Sign up / sign in → **New project**.
2. Pick any name/region, set a database password (save it somewhere safe), wait ~2 min for it to spin up.

### b) Create the database tables
1. In your project, open **SQL Editor → New query**.
2. Open `supabase/schema.sql` from this project, copy all of it, paste into the editor, click **Run**.
3. This creates all tables (business info, hours, menu, gallery, offers, reviews, reservations, social links, settings) with starter/placeholder rows, and locks them down so only a signed-in admin can edit them.

### c) Create two storage buckets (for photos)
1. Go to **Storage** in the left sidebar → **New bucket**.
2. Create a bucket named exactly `gallery` → toggle **Public bucket ON** → Create.
3. Create a second bucket named exactly `menu` → toggle **Public bucket ON** → Create.
   (These hold gallery photos and menu item photos uploaded from the admin panel.)

### d) Create your admin login
1. Go to **Authentication → Users → Add user → Create new user**.
2. Enter the email and password you (the business owner) will use to log in to the admin panel.
3. Leave "Auto Confirm User" turned on so you can log in immediately.
4. Do **not** enable public sign-ups — this keeps the admin panel private to just this account.

### e) Connect the website to your project
1. In Supabase, go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key.
3. Open `js/supabase-config.js` in this project and paste them in:
   ```js
   const SUPABASE_URL = "https://xxxxxxxx.supabase.co";
   const SUPABASE_ANON_KEY = "eyJhbGciOi...";
   ```
4. Save. Both the public site and the admin panel read from this one file.

That's it — the database, login, and file storage are all live on Supabase's free tier.

---

## 3. Deploy for free (Netlify)

**Easiest — drag and drop:**
1. Go to https://app.netlify.com/drop
2. Drag the whole `bar-mubiti` folder onto the page.
3. Netlify gives you a live URL in seconds (e.g. `bar-mubiti.netlify.app`). You can rename the site and later attach a custom domain, still free.

**Or via GitHub (better for ongoing updates):**
1. Push this folder to a new GitHub repo.
2. In Netlify: **Add new site → Import an existing project → GitHub** → pick the repo.
3. Leave build command empty and publish directory as `/` (it's a static site — nothing to build).
4. Deploy.

Every time you edit a file and push/re-upload, the live site updates. Content edited through the **admin panel** updates instantly — no redeploy needed, since that data lives in Supabase, not in the files.

---

## 4. Using the admin panel

1. Go to `yoursite.com/admin/` and sign in with the email/password you created in step 2d.
2. From the dashboard you can:
   - Edit business info (name, tagline, address, phone, WhatsApp, price range, Google rating)
   - Edit opening hours per day
   - Add/edit/delete menu categories and items, set prices, mark items available/unavailable, upload photos
   - Upload and remove gallery photos
   - Add/edit active promotions
   - View and update reservation/contact requests (mark as contacted/confirmed/closed)
   - Add/edit/hide reviews shown on the site
   - Update Instagram/Facebook/TikTok links and site text like the reservation note

Changes save straight to the database and appear on the live website immediately (refresh the page to see them).

---

## 5. Content you should replace with real information

The build followed the Google Business info you provided and did not invent any facts. A few things are placeholders until you (or the client) add the real version, all editable from the Admin panel — no code changes needed:

- **Menu items & prices** — only 4 example items were seeded as placeholders; add the real menu under Admin → Menu.
- **Gallery photos** — currently empty (shows a clean placeholder grid); upload real venue/food photos under Admin → Gallery.
- **About photo** — the About section has a placeholder panel; swap it for a real photo (ask to add an image-upload field there if wanted, or replace `assets/` and edit `index.html` directly).
- **Reviews** — one placeholder review is seeded; copy 4–6 real quotes from Google Reviews into Admin → Reviews.
- **Weekly opening hours** — seeded as 11:00 AM–12:00 AM every day based on the closing time shown on the Google card; confirm the exact daily hours with the owner and adjust per day in Admin → Opening Hours if they differ.
- **Social links** — Instagram/Facebook/TikTok URLs are empty; add them in Admin → Social & Settings.
- **WhatsApp number** — defaults to the listed phone number in international format (`250788582914`); confirm this is the number that should receive WhatsApp messages.

---

## 6. Notes for the developer (you)

- No build step. Open `index.html` directly in a browser to preview — but the reservation form, live menu/hours/gallery data, and admin login only work once Supabase is connected and the site is served over HTTP(S) (not `file://`), since browsers restrict some APIs on local files. Easiest local preview: `npx serve .` or Netlify's local dev, or just deploy a draft.
- All write access is protected by Postgres Row Level Security — the anon key in `supabase-config.js` is safe to expose publicly; it can only read public content and insert reservation requests. Only a signed-in admin user can write anything else.
- The ember-particle hero animation is pure canvas (no video/image assets needed) and automatically turns into a static soft-glow version when the visitor has "reduce motion" enabled.
- To add a second admin user later, repeat step 2d in Supabase Authentication.
