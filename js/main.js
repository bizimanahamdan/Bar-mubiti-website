/* ============================================================
   BAR MUBITI — site logic
   Renders everything from Supabase. If Supabase isn't configured
   yet (fresh checkout) or a table is empty, falls back to sensible
   placeholder content so the site still looks complete for demos.
   ============================================================ */

document.getElementById("year").textContent = new Date().getFullYear();

/* ---------------------------------------------------------
   FALLBACK / DEMO DATA
   Used only when Supabase isn't connected yet, or a table has
   no rows. Replace real content via the Admin panel instead of
   editing this.
--------------------------------------------------------- */
const FALLBACK = {
  business: {
    name: "Bar Mubiti",
    tagline: "Bar Mubiti is Kigali's home for smoky brochettes, cold drinks and an evening crowd that keeps the night going.",
    description: "Bar Mubiti brings together everything a good evening needs — brochettes straight off the grill, cold drinks, and a lively atmosphere that fills up as the sun goes down. Whether you're stopping by after work or settling in for the night, there's a table with your name on it.",
    address: "2332+M8F, Kigali",
    phone: "0788 582 914",
    whatsapp_phone: "250788582914",
    price_range: "RF 1,000 – 15,000",
    google_rating: 3.7,
    google_review_count: 111,
  },
  hours: [0, 1, 2, 3, 4, 5, 6].map((d) => ({
    day_of_week: d,
    open_time: "11:00",
    close_time: "00:00",
    is_closed: false,
  })),
  categories: [
    { id: 1, name: "Grill & Brochettes", sort_order: 1 },
    { id: 2, name: "Starters & Snacks", sort_order: 2 },
    { id: 3, name: "Drinks & Cocktails", sort_order: 3 },
  ],
  menuItems: [
    { id: 1, category_id: 1, name: "Beef Brochettes", description: "Add real prices and descriptions in Admin → Menu.", price: null, is_available: true },
    { id: 2, category_id: 1, name: "Chicken Brochettes", description: "Add real prices and descriptions in Admin → Menu.", price: null, is_available: true },
    { id: 3, category_id: 2, name: "Grilled Plantain", description: "Add real prices and descriptions in Admin → Menu.", price: null, is_available: true },
    { id: 4, category_id: 3, name: "Cold Beer", description: "Add real prices and descriptions in Admin → Menu.", price: null, is_available: true },
  ],
  gallery: [],
  offers: [],
  testimonials: [
    { author_name: "Google Reviewer", quote: "Add your first real review from Google in Admin → Reviews — this is placeholder text.", rating: 4, source: "Google Reviews" },
  ],
  social: { instagram: "", facebook: "", tiktok: "" },
  settings: { reservation_note: "We'll confirm your table by phone or WhatsApp shortly after you submit." },
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/* ---------------------------------------------------------
   NAV
--------------------------------------------------------- */
const nav = document.getElementById("siteNav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 20);
}, { passive: true });

const navToggle = document.getElementById("navToggle");
const mobileMenu = document.getElementById("mobileMenu");
navToggle.addEventListener("click", () => {
  const isOpen = mobileMenu.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});
mobileMenu.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    mobileMenu.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  })
);

/* ---------------------------------------------------------
   EMBER PARTICLE HERO ANIMATION (signature visual)
   Rising embers, like glow drifting off a charcoal grill.
   Skipped entirely under prefers-reduced-motion.
--------------------------------------------------------- */
(function emberField() {
  const canvas = document.getElementById("emberCanvas");
  if (!canvas) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d");
  let w, h, particles;

  function resize() {
    w = canvas.width = canvas.offsetWidth * devicePixelRatio;
    h = canvas.height = canvas.offsetHeight * devicePixelRatio;
  }

  function makeParticle() {
    return {
      x: Math.random() * w,
      y: h + Math.random() * 100,
      r: (Math.random() * 2.2 + 0.6) * devicePixelRatio,
      speed: (Math.random() * 0.6 + 0.25) * devicePixelRatio,
      drift: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.2,
      hue: Math.random() > 0.5 ? "232,98,46" : "201,154,75",
      flicker: Math.random() * 0.02,
    };
  }

  function init() {
    resize();
    const count = window.innerWidth < 720 ? 26 : 46;
    particles = Array.from({ length: count }, makeParticle);
  }

  function drawStatic() {
    // Reduced-motion: draw a few soft static glows instead of animating.
    resize();
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 18; i++) {
      const p = makeParticle();
      ctx.beginPath();
      ctx.fillStyle = `rgba(${p.hue},${p.alpha * 0.5})`;
      ctx.arc(p.x, h - Math.random() * h * 0.6, p.r * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.y -= p.speed;
      p.x += p.drift;
      p.alpha += (Math.random() - 0.5) * p.flicker;
      p.alpha = Math.max(0.05, Math.min(0.75, p.alpha));
      if (p.y < -20) Object.assign(p, makeParticle(), { y: h + 10 });
      ctx.beginPath();
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      gradient.addColorStop(0, `rgba(${p.hue},${p.alpha})`);
      gradient.addColorStop(1, `rgba(${p.hue},0)`);
      ctx.fillStyle = gradient;
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", () => {
    if (reduceMotion) drawStatic();
    else resize();
  });

  if (reduceMotion) {
    drawStatic();
  } else {
    init();
    requestAnimationFrame(tick);
  }
})();

/* ---------------------------------------------------------
   DATA LOADING (Supabase, with fallback)
--------------------------------------------------------- */
async function fetchTable(table, opts = {}) {
  if (!supabaseClient) return null;
  try {
    let q = supabaseClient.from(table).select(opts.select || "*");
    if (opts.eq) q = q.eq(opts.eq[0], opts.eq[1]);
    if (opts.order) q = q.order(opts.order[0], { ascending: opts.order[1] !== "desc" });
    const { data, error } = await q;
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn(`Supabase fetch failed for "${table}":`, err.message || err);
    return null;
  }
}

async function loadAll() {
  const [business, hours, categories, menuItems, gallery, offers, testimonials, social, settings] = await Promise.all([
    fetchTable("business_info"),
    fetchTable("opening_hours", { order: ["day_of_week", "asc"] }),
    fetchTable("menu_categories", { order: ["sort_order", "asc"] }),
    fetchTable("menu_items", { order: ["sort_order", "asc"] }),
    fetchTable("gallery_images", { order: ["sort_order", "asc"] }),
    fetchTable("offers", { eq: ["active", true] }),
    fetchTable("testimonials", { eq: ["is_featured", true], order: ["sort_order", "asc"] }),
    fetchTable("social_links"),
    fetchTable("site_settings"),
  ]);

  const businessInfo = (business && business[0]) || FALLBACK.business;
  const openingHours = hours && hours.length ? hours : FALLBACK.hours;
  const menuCategories = categories && categories.length ? categories : FALLBACK.categories;
  const items = menuItems && menuItems.length ? menuItems : FALLBACK.menuItems;
  const galleryImages = gallery && gallery.length ? gallery : FALLBACK.gallery;
  const activeOffers = offers && offers.length ? offers : FALLBACK.offers;
  const featuredTestimonials = testimonials && testimonials.length ? testimonials : FALLBACK.testimonials;
  const socialLinks = (social && social.length)
    ? Object.fromEntries(social.map((s) => [s.platform, s.url]))
    : FALLBACK.social;
  const siteSettings = (settings && settings.length)
    ? Object.fromEntries(settings.map((s) => [s.key, s.value]))
    : FALLBACK.settings;

  renderBusinessInfo(businessInfo);
  renderHours(openingHours, businessInfo);
  renderMenu(menuCategories, items);
  renderOffers(activeOffers);
  renderGallery(galleryImages);
  renderReviews(businessInfo, featuredTestimonials);
  renderSocial(socialLinks);
  renderSettings(siteSettings);
  wireWhatsapp(businessInfo);
}

/* ---------------------------------------------------------
   RENDERERS
--------------------------------------------------------- */
function renderBusinessInfo(b) {
  document.getElementById("heroTagline").textContent = b.tagline || FALLBACK.business.tagline;
  document.getElementById("heroPriceRange").textContent = b.price_range || FALLBACK.business.price_range;
  document.getElementById("heroRatingText").textContent = `${b.google_rating ?? "–"} · ${b.google_review_count ?? "–"} Google reviews`;
  document.getElementById("aboutDescription").textContent = b.description || FALLBACK.business.description;
  document.getElementById("statRating").textContent = `${b.google_rating ?? "–"}★`;
  document.getElementById("statReviews").textContent = b.google_review_count ?? "–";
  document.getElementById("locAddress").textContent = b.address || FALLBACK.business.address;
  document.getElementById("footerAddress").textContent = b.address || FALLBACK.business.address;
  const phoneDisplay = b.phone || FALLBACK.business.phone;
  const phoneHref = `tel:${(b.phone || FALLBACK.business.phone).replace(/\s+/g, "")}`;
  [document.getElementById("locPhone"), document.getElementById("footerPhone")].forEach((el) => {
    el.textContent = phoneDisplay;
    el.href = phoneHref;
  });
  document.querySelectorAll('a[href^="tel:0788582914"]').forEach((el) => (el.href = phoneHref));

  const starCount = Math.round(b.google_rating || 0);
  const starStr = "★".repeat(starCount) + "☆".repeat(5 - starCount);
  document.getElementById("heroRatingStars").textContent = starStr;
}

function isOpenNow(hoursForToday) {
  if (!hoursForToday || hoursForToday.is_closed) return false;
  const now = new Date();
  const [oh, om] = (hoursForToday.open_time || "00:00").split(":").map(Number);
  const [ch, cm] = (hoursForToday.close_time || "00:00").split(":").map(Number);
  const open = oh * 60 + om;
  let close = ch * 60 + cm;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (close <= open) close += 24 * 60; // crosses midnight
  let n = nowMin;
  if (n < open) n += 24 * 60;
  return n >= open && n < close;
}

function formatTime(t) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function renderHours(hours, business) {
  const todayIdx = new Date().getDay();
  const list = document.getElementById("hoursList");
  list.innerHTML = "";
  const sorted = [...hours].sort((a, b) => a.day_of_week - b.day_of_week);
  sorted.forEach((h) => {
    const row = document.createElement("div");
    row.className = "hours-row" + (h.day_of_week === todayIdx ? " today" : "");
    const time = h.is_closed ? "Closed" : `${formatTime(h.open_time)} – ${formatTime(h.close_time)}`;
    row.innerHTML = `<span class="day">${DAY_NAMES[h.day_of_week]}</span><span class="time">${time}</span>`;
    list.appendChild(row);
  });

  const today = sorted.find((h) => h.day_of_week === todayIdx);
  const open = isOpenNow(today);
  document.getElementById("heroOpenStatus").textContent = open ? "Open now" : "Closed now";
  document.getElementById("statStatus").textContent = open ? "Open" : "Closed";
  document.getElementById("footerHoursToday").textContent = open ? "Open today" : "Closed today";
  document.getElementById("footerHoursClose").textContent = today && !today.is_closed
    ? `${open ? "Closes" : "Opens"} ${formatTime(open ? today.close_time : today.open_time)}`
    : "Hours vary — call ahead";
}

let ALL_MENU_ITEMS = [];
let ALL_CATEGORIES = [];

function renderMenu(categories, items) {
  ALL_CATEGORIES = categories;
  ALL_MENU_ITEMS = items;
  const tabsEl = document.getElementById("menuTabs");
  tabsEl.innerHTML = "";
  categories.forEach((cat, i) => {
    const btn = document.createElement("button");
    btn.className = "menu-tab" + (i === 0 ? " active" : "");
    btn.textContent = cat.name;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", i === 0 ? "true" : "false");
    btn.addEventListener("click", () => {
      tabsEl.querySelectorAll(".menu-tab").forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      renderMenuItems(cat.id);
    });
    tabsEl.appendChild(btn);
  });
  if (categories.length) renderMenuItems(categories[0].id);
  else document.getElementById("menuGrid").innerHTML = `<div class="menu-empty">Menu coming soon — add categories and items in Admin → Menu.</div>`;
}

function renderMenuItems(categoryId) {
  const grid = document.getElementById("menuGrid");
  const items = ALL_MENU_ITEMS.filter((i) => i.category_id === categoryId);
  if (!items.length) {
    grid.innerHTML = `<div class="menu-empty">No items in this category yet.</div>`;
    return;
  }
  grid.innerHTML = items.map((item) => `
    <div class="menu-item">
      ${item.image_url
        ? `<img class="menu-item-img" src="${escapeAttr(item.image_url)}" alt="${escapeAttr(item.name)}">`
        : `<div class="menu-item-img placeholder">🍢</div>`}
      <div class="menu-item-body">
        <div class="menu-item-top">
          <span class="menu-item-name">${escapeHtml(item.name)}</span>
          ${item.price ? `<span class="menu-item-price">RWF ${Number(item.price).toLocaleString()}</span>` : `<span class="menu-item-price">—</span>`}
        </div>
        ${item.description ? `<p class="menu-item-desc">${escapeHtml(item.description)}</p>` : ""}
        ${item.is_available === false ? `<span class="badge-unavailable">Currently unavailable</span>` : ""}
      </div>
    </div>
  `).join("");
}

function renderOffers(offers) {
  const strip = document.getElementById("offersStrip");
  if (!offers.length) { strip.innerHTML = ""; return; }
  strip.innerHTML = offers.map((o) => `
    <div class="offer-card">
      <h4>${escapeHtml(o.title)}</h4>
      ${o.description ? `<p>${escapeHtml(o.description)}</p>` : ""}
    </div>
  `).join("");
}

function renderGallery(images) {
  const grid = document.getElementById("galleryGrid");
  if (!images.length) {
    grid.innerHTML = Array.from({ length: 6 }).map(() =>
      `<div class="gallery-item placeholder">📷</div>`
    ).join("");
    return;
  }
  grid.innerHTML = images.map((img) => `
    <div class="gallery-item">
      <img src="${escapeAttr(img.image_url)}" alt="${escapeAttr(img.caption || "Bar Mubiti")}" loading="lazy">
    </div>
  `).join("");
}

function renderReviews(business, testimonials) {
  document.getElementById("reviewsRatingNum").textContent = business.google_rating ?? "–";
  const starCount = Math.round(business.google_rating || 0);
  document.getElementById("reviewsStars").textContent = "★".repeat(starCount) + "☆".repeat(5 - starCount);
  document.getElementById("reviewsCount").textContent = `Based on ${business.google_review_count ?? "–"} Google reviews`;

  const grid = document.getElementById("testimonialGrid");
  grid.innerHTML = testimonials.map((t) => `
    <div class="testimonial-card">
      <p class="testimonial-quote">${escapeHtml(t.quote)}</p>
      <div class="testimonial-foot">
        <div>
          <div class="testimonial-author">${escapeHtml(t.author_name)}</div>
          <div class="testimonial-source">${escapeHtml(t.source || "Google Reviews")}</div>
        </div>
        ${t.rating ? `<div class="testimonial-stars">${"★".repeat(Math.round(t.rating))}</div>` : ""}
      </div>
    </div>
  `).join("");
}

function renderSocial(social) {
  const el = document.getElementById("footerSocial");
  const icons = {
    instagram: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>`,
    facebook: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z"/></svg>`,
    tiktok: `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.82a4.28 4.28 0 0 1-2.63-2.7h-3.13v13.5a2.6 2.6 0 1 1-2.05-2.55V10.9a5.8 5.8 0 1 0 5.18 5.77V9.4a7.4 7.4 0 0 0 4.32 1.39V7.66a4.3 4.3 0 0 1-1.69-1.84Z"/></svg>`,
  };
  const links = Object.entries(social).filter(([, url]) => url);
  el.innerHTML = links.length
    ? links.map(([platform, url]) => `<a href="${escapeAttr(url)}" target="_blank" rel="noopener" aria-label="${platform}">${icons[platform] || ""}</a>`).join("")
    : "";
}

function renderSettings(settings) {
  if (settings.reservation_note) {
    document.getElementById("reservationNote").textContent = settings.reservation_note;
  }
}

function wireWhatsapp(business) {
  const phone = (business.whatsapp_phone || FALLBACK.business.whatsapp_phone).replace(/\D/g, "");
  const msg = encodeURIComponent("Hi Bar Mubiti! I'd like to know more / book a table.");
  const url = `https://wa.me/${phone}?text=${msg}`;
  ["heroWhatsapp", "quickWhatsapp", "stickyWhatsapp"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = url;
  });
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function escapeAttr(str) { return escapeHtml(str); }

/* ---------------------------------------------------------
   RESERVATION FORM
--------------------------------------------------------- */
const reservationForm = document.getElementById("reservationForm");
const rStatus = document.getElementById("rStatus");
const rSubmit = document.getElementById("rSubmit");

reservationForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  rStatus.className = "form-status";
  const payload = {
    request_type: "reservation",
    name: document.getElementById("rName").value.trim(),
    phone: document.getElementById("rPhone").value.trim(),
    party_size: document.getElementById("rParty").value ? Number(document.getElementById("rParty").value) : null,
    preferred_date: document.getElementById("rDate").value || null,
    preferred_time: document.getElementById("rTime").value || null,
    message: document.getElementById("rMessage").value.trim() || null,
  };

  if (!payload.name || !payload.phone) {
    rStatus.textContent = "Please add your name and phone number.";
    rStatus.classList.add("error");
    return;
  }

  rSubmit.disabled = true;
  rSubmit.textContent = "Sending…";

  if (!supabaseClient) {
    // Not configured yet — fall back to WhatsApp so nothing is ever lost.
    const phone = FALLBACK.business.whatsapp_phone;
    const text = encodeURIComponent(
      `Reservation request\nName: ${payload.name}\nPhone: ${payload.phone}\nParty: ${payload.party_size || "-"}\nDate: ${payload.preferred_date || "-"} ${payload.preferred_time || ""}\nMessage: ${payload.message || "-"}`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
    rStatus.textContent = "Backend isn't connected yet — opened WhatsApp instead so your request isn't lost.";
    rStatus.classList.add("success");
    rSubmit.disabled = false;
    rSubmit.textContent = "Send reservation request";
    return;
  }

  const { error } = await supabaseClient.from("reservation_requests").insert(payload);
  rSubmit.disabled = false;
  rSubmit.textContent = "Send reservation request";

  if (error) {
    console.error(error);
    rStatus.textContent = "Something went wrong sending your request. Please call or WhatsApp us instead.";
    rStatus.classList.add("error");
  } else {
    reservationForm.reset();
    rStatus.textContent = "Thanks! Your request has been sent — we'll confirm by phone or WhatsApp shortly.";
    rStatus.classList.add("success");
  }
});

loadAll();
