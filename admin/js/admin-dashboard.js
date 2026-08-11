/* ============================================================
   BAR MUBITI ADMIN — dashboard logic
   ============================================================ */

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const setupBanner = document.getElementById("setupBanner");
const toastEl = document.getElementById("toast");

function toast(msg, type = "success") {
  toastEl.textContent = msg;
  toastEl.className = `toast show ${type}`;
  setTimeout(() => toastEl.classList.remove("show"), 3200);
}
function banner(msg, type = "error") {
  setupBanner.textContent = msg;
  setupBanner.className = `banner show ${type}`;
}

/* ---------------------------------------------------------
   AUTH GUARD
--------------------------------------------------------- */
if (!IS_SUPABASE_CONFIGURED || !supabaseClient) {
  document.querySelector(".main").innerHTML = `
    <div class="card">
      <h3>Backend not connected</h3>
      <p class="card-sub" style="margin-top:8px;line-height:1.6;">
        Open <code>js/supabase-config.js</code> in your project, add your Supabase Project URL and anon key,
        then reload this page. Full steps are in README.md.
      </p>
      <a href="/admin/index.html" class="btn btn-outline btn-sm" style="margin-top:14px;">Back to login</a>
    </div>`;
  document.querySelector(".sidebar").style.display = "none";
} else {
  init();
}

async function init() {
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) {
    window.location.href = "/admin/index.html";
    return;
  }
  document.getElementById("accountEmail").textContent = `Signed in as ${data.session.user.email}`;

  supabaseClient.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") window.location.href = "/admin/index.html";
  });

  wireNav();
  wireLogout();
  wireModal();
  wireBusinessForm();
  wireSocialSettingsForm();
  wireGalleryUpload();
  wireHeroVideoUpload();
  wireAboutImageUpload();
  document.getElementById("addCategoryBtn").addEventListener("click", () => openCategoryModal());
  document.getElementById("addOfferBtn").addEventListener("click", () => openOfferModal());
  document.getElementById("addTestimonialBtn").addEventListener("click", () => openTestimonialModal());

  loadOverview();
  loadBusinessForm();
  loadHours();
  loadMenu();
  loadGallery();
  loadOffers();
  loadReservations();
  loadTestimonials();
  loadSocialSettings();
  wireReservationRealtime();
  wireNotificationPermissionButton();
}

function wireLogout() {
  const signOut = async () => { await supabaseClient.auth.signOut(); };
  document.getElementById("logoutBtn").addEventListener("click", signOut);
  document.getElementById("logoutBtn2").addEventListener("click", signOut);
}

/* ---------------------------------------------------------
   NAV
--------------------------------------------------------- */
function wireNav() {
  const items = document.querySelectorAll(".nav-item[data-panel]");
  const panels = document.querySelectorAll(".panel");
  const titleEl = document.getElementById("panelTitle");

  function activate(panelId) {
    items.forEach((i) => i.classList.toggle("active", i.dataset.panel === panelId));
    panels.forEach((p) => p.classList.toggle("active", p.id === `panel-${panelId}`));
    titleEl.textContent = document.querySelector(`.nav-item[data-panel="${panelId}"]`)?.textContent.trim() || "Dashboard";
    document.getElementById("mobileNavOverlay").classList.remove("open");
    window.scrollTo({ top: 0 });
  }
  items.forEach((btn) => btn.addEventListener("click", () => activate(btn.dataset.panel)));

  // Mobile drawer mirrors sidebar items
  const mobileNavItems = document.getElementById("mobileNavItems");
  items.forEach((btn) => {
    const clone = document.createElement("button");
    clone.className = "nav-item";
    clone.textContent = btn.textContent.trim();
    clone.addEventListener("click", () => activate(btn.dataset.panel));
    mobileNavItems.appendChild(clone);
  });
  document.getElementById("mobileNavToggle").addEventListener("click", () => document.getElementById("mobileNavOverlay").classList.add("open"));
  document.getElementById("mobileNavClose").addEventListener("click", () => document.getElementById("mobileNavOverlay").classList.remove("open"));
}

/* ---------------------------------------------------------
   GENERIC MODAL (used for category/item/offer/testimonial forms)
--------------------------------------------------------- */
const modalOverlay = document.getElementById("modalOverlay");
const modalForm = document.getElementById("modalForm");
const modalTitle = document.getElementById("modalTitle");
let modalSubmitHandler = null;

function wireModal() {
  document.getElementById("modalClose").addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) closeModal(); });
  modalForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (modalSubmitHandler) await modalSubmitHandler(new FormData(modalForm));
  });
}
function closeModal() { modalOverlay.classList.remove("open"); }

function openModal(title, fieldsHtml, onSubmit, submitLabel = "Save") {
  modalTitle.textContent = title;
  modalForm.innerHTML = fieldsHtml + `<button type="submit" class="btn btn-primary btn-block">${submitLabel}</button>`;
  modalSubmitHandler = onSubmit;
  modalOverlay.classList.add("open");
}

function fieldHtml({ name, label, type = "text", value = "", placeholder = "", required = false, options = null, checked = false }) {
  if (type === "textarea") {
    return `<div class="field"><label>${label}</label><textarea name="${name}" placeholder="${placeholder}">${value ?? ""}</textarea></div>`;
  }
  if (type === "select") {
    const opts = options.map((o) => `<option value="${o.value}" ${String(o.value) === String(value) ? "selected" : ""}>${o.label}</option>`).join("");
    return `<div class="field"><label>${label}</label><select name="${name}">${opts}</select></div>`;
  }
  if (type === "checkbox") {
    return `<div class="field" style="display:flex;align-items:center;gap:8px;flex-direction:row;"><input type="checkbox" name="${name}" ${checked ? "checked" : ""} style="width:auto;"><label style="margin:0;">${label}</label></div>`;
  }
  return `<div class="field"><label>${label}</label><input type="${type}" name="${name}" value="${value ?? ""}" placeholder="${placeholder}" ${required ? "required" : ""}></div>`;
}

/* ---------------------------------------------------------
   OVERVIEW
--------------------------------------------------------- */
async function loadOverview() {
  const [{ count: menuCount }, { count: galleryCount }, { count: newResCount }, { count: reviewCount }] = await Promise.all([
    supabaseClient.from("menu_items").select("*", { count: "exact", head: true }),
    supabaseClient.from("gallery_images").select("*", { count: "exact", head: true }),
    supabaseClient.from("reservation_requests").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabaseClient.from("testimonials").select("*", { count: "exact", head: true }),
  ]);

  document.getElementById("overviewStats").innerHTML = `
    <div class="stat-box"><div class="num">${menuCount ?? 0}</div><div class="label">Menu items</div></div>
    <div class="stat-box"><div class="num">${galleryCount ?? 0}</div><div class="label">Gallery photos</div></div>
    <div class="stat-box"><div class="num">${newResCount ?? 0}</div><div class="label">New requests</div></div>
    <div class="stat-box"><div class="num">${reviewCount ?? 0}</div><div class="label">Reviews shown</div></div>
  `;
  const navBadge = document.getElementById("navResBadge");
  navBadge.textContent = newResCount ? `(${newResCount})` : "";

  const { data: recent, error } = await supabaseClient
    .from("reservation_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);
  const box = document.getElementById("overviewRecentReservations");
  if (error) { box.innerHTML = `<div class="empty">Couldn't load requests.</div>`; return; }
  if (!recent.length) { box.innerHTML = `<div class="empty">No reservation requests yet.</div>`; return; }
  box.innerHTML = recent.map((r) => reservationRowHtml(r, { compact: true })).join("") +
    `<button class="btn btn-outline btn-sm btn-block" id="viewAllReservationsBtn" style="margin-top:10px;">View all reservations</button>`;
  document.getElementById("viewAllReservationsBtn").addEventListener("click", () => {
    document.querySelector('.nav-item[data-panel="reservations"]')?.click();
  });
}

/* ---------------------------------------------------------
   BUSINESS INFO
--------------------------------------------------------- */
async function loadBusinessForm() {
  const { data, error } = await supabaseClient.from("business_info").select("*").eq("id", 1).single();
  if (error || !data) return;
  const form = document.getElementById("businessForm");
  Object.entries(data).forEach(([key, value]) => {
    const input = form.elements[key];
    if (input) input.value = value ?? "";
  });
  renderCurrentHeroVideo(data.hero_video_url);
  renderCurrentAboutImage(data.about_image_url);
}

function renderCurrentAboutImage(url) {
  const box = document.getElementById("currentAboutImage");
  const removeBtn = document.getElementById("removeAboutImageBtn");
  if (!url) {
    box.innerHTML = `<div class="empty" style="padding:16px;">No photo uploaded yet — the site shows a placeholder.</div>`;
    removeBtn.style.display = "none";
    return;
  }
  box.innerHTML = `<img src="${escapeAttr(url)}" style="width:100%;max-width:280px;border-radius:10px;border:1px solid var(--line);display:block;">`;
  removeBtn.style.display = "inline-flex";
}

function wireAboutImageUpload() {
  document.getElementById("aboutImageInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const status = document.getElementById("aboutImageUploadStatus");
    status.textContent = "Uploading…";
    const url = await uploadToBucket("gallery", file);
    e.target.value = "";
    if (!url) { status.textContent = ""; return; }
    const { error } = await supabaseClient.from("business_info").update({ about_image_url: url }).eq("id", 1);
    status.textContent = "";
    if (error) return toast("Couldn't save: " + error.message, "error");
    toast("Photo updated");
    renderCurrentAboutImage(url);
  });
  document.getElementById("removeAboutImageBtn").addEventListener("click", async () => {
    if (!confirm("Remove this photo? The site will show a placeholder instead.")) return;
    const { error } = await supabaseClient.from("business_info").update({ about_image_url: null }).eq("id", 1);
    if (error) return toast("Couldn't save: " + error.message, "error");
    toast("Photo removed");
    renderCurrentAboutImage(null);
  });
}

function renderCurrentHeroVideo(url) {
  const box = document.getElementById("currentHeroVideo");
  const removeBtn = document.getElementById("removeHeroVideoBtn");
  if (!url) {
    box.innerHTML = `<div class="empty" style="padding:16px;">No hero video uploaded yet — the site shows the animated ember background.</div>`;
    removeBtn.style.display = "none";
    return;
  }
  box.innerHTML = `<video src="${escapeAttr(url)}" controls muted style="width:100%;max-width:320px;border-radius:10px;border:1px solid var(--line);"></video>`;
  removeBtn.style.display = "inline-flex";
}

function wireHeroVideoUpload() {
  document.getElementById("heroVideoInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const status = document.getElementById("heroVideoUploadStatus");
    status.textContent = "Uploading… this can take a minute depending on your connection.";
    const url = await uploadToBucket("videos", file);
    e.target.value = "";
    if (!url) { status.textContent = ""; return; }
    const { error } = await supabaseClient.from("business_info").update({ hero_video_url: url }).eq("id", 1);
    status.textContent = "";
    if (error) return toast("Couldn't save: " + error.message, "error");
    toast("Hero video updated");
    renderCurrentHeroVideo(url);
  });
  document.getElementById("removeHeroVideoBtn").addEventListener("click", async () => {
    if (!confirm("Remove the hero video? The site will fall back to the animated background.")) return;
    const { error } = await supabaseClient.from("business_info").update({ hero_video_url: null }).eq("id", 1);
    if (error) return toast("Couldn't save: " + error.message, "error");
    toast("Hero video removed");
    renderCurrentHeroVideo(null);
  });
}
function wireBusinessForm() {
  document.getElementById("businessForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    payload.google_rating = payload.google_rating ? Number(payload.google_rating) : null;
    payload.google_review_count = payload.google_review_count ? Number(payload.google_review_count) : null;
    const { error } = await supabaseClient.from("business_info").update(payload).eq("id", 1);
    if (error) return toast("Couldn't save: " + error.message, "error");
    toast("Business info saved");
  });
}

/* ---------------------------------------------------------
   OPENING HOURS
--------------------------------------------------------- */
async function loadHours() {
  const { data, error } = await supabaseClient.from("opening_hours").select("*").order("day_of_week");
  const box = document.getElementById("hoursListAdmin");
  if (error || !data) { box.innerHTML = `<div class="empty">Couldn't load hours.</div>`; return; }
  box.innerHTML = data.map((h) => `
    <div class="list-item">
      <div class="list-item-body">
        <div class="list-item-title">${DAY_NAMES[h.day_of_week]}</div>
        <div class="list-item-sub">${h.is_closed ? "Closed" : `${h.open_time?.slice(0,5)} – ${h.close_time?.slice(0,5)}`}</div>
      </div>
      <div class="list-item-actions">
        <button class="icon-btn edit-hour" data-id="${h.id}" data-day="${h.day_of_week}" data-open="${h.open_time || ""}" data-close="${h.close_time || ""}" data-closed="${h.is_closed}">✎</button>
      </div>
    </div>
  `).join("");
  box.querySelectorAll(".edit-hour").forEach((btn) => btn.addEventListener("click", () => {
    const { id, day, open, close, closed } = btn.dataset;
    openModal(`Edit ${DAY_NAMES[day]}`,
      fieldHtml({ name: "open_time", label: "Opens", type: "time", value: open?.slice(0,5) }) +
      fieldHtml({ name: "close_time", label: "Closes", type: "time", value: close?.slice(0,5) }) +
      fieldHtml({ name: "is_closed", label: "Closed all day", type: "checkbox", checked: closed === "true" }),
      async (fd) => {
        const payload = {
          open_time: fd.get("open_time") || null,
          close_time: fd.get("close_time") || null,
          is_closed: fd.get("is_closed") === "on",
        };
        const { error } = await supabaseClient.from("opening_hours").update(payload).eq("id", id);
        if (error) return toast("Couldn't save: " + error.message, "error");
        closeModal(); toast("Hours updated"); loadHours();
      }
    );
  }));
}

/* ---------------------------------------------------------
   MENU (categories + items) — all categories shown at once
--------------------------------------------------------- */
async function loadMenu() {
  const { data: categories } = await supabaseClient.from("menu_categories").select("*").order("sort_order");
  const jumpBox = document.getElementById("categoryJumpLinks");
  const container = document.getElementById("menuCategoriesContainer");

  if (!categories || !categories.length) {
    jumpBox.innerHTML = "";
    container.innerHTML = `<div class="empty">No categories yet — add one above.</div>`;
    return;
  }

  jumpBox.innerHTML = categories.map((c) => `<button data-target="admin-cat-${c.id}">${escapeHtml(c.name)}</button>`).join("");
  jumpBox.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
    document.getElementById(b.dataset.target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));

  const { data: items } = await supabaseClient.from("menu_items").select("*").order("sort_order");

  container.innerHTML = categories.map((cat) => {
    const catItems = (items || []).filter((i) => i.category_id === cat.id);
    return `
      <div class="card" id="admin-cat-${cat.id}" style="margin-bottom:16px;">
        <div class="toolbar">
          <h3>${escapeHtml(cat.name)}</h3>
          <div style="display:flex;gap:6px;">
            <button class="icon-btn edit-cat" data-id="${cat.id}" data-name="${escapeAttr(cat.name)}" title="Rename category">✎</button>
            <button class="icon-btn del-cat" data-id="${cat.id}" title="Delete category">🗑</button>
            <button class="btn btn-primary btn-sm add-item-to-cat" data-cat="${cat.id}">+ Item</button>
          </div>
        </div>
        <div>
          ${catItems.length ? catItems.map((item) => `
            <div class="list-item">
              ${item.image_url ? `<img src="${escapeAttr(item.image_url)}" alt="">` : `<div class="thumb">🍢</div>`}
              <div class="list-item-body">
                <div class="list-item-title">${escapeHtml(item.name)} ${item.price ? `— RWF ${Number(item.price).toLocaleString()}` : ""}</div>
                <div class="list-item-sub">
                  <span class="badge ${item.is_available ? "available" : "unavailable"}">${item.is_available ? "Available" : "Unavailable"}</span>
                </div>
              </div>
              <div class="list-item-actions">
                <button class="icon-btn edit-item" data-id="${item.id}">✎</button>
                <button class="icon-btn del-item" data-id="${item.id}">🗑</button>
              </div>
            </div>
          `).join("") : `<div class="empty">No items in this category yet.</div>`}
        </div>
      </div>
    `;
  }).join("");

  container.querySelectorAll(".add-item-to-cat").forEach((b) => b.addEventListener("click", () => openMenuItemModal(null, Number(b.dataset.cat))));
  container.querySelectorAll(".edit-item").forEach((b) => b.addEventListener("click", () => {
    const item = (items || []).find((i) => i.id === Number(b.dataset.id));
    if (item) openMenuItemModal(item, item.category_id);
  }));
  container.querySelectorAll(".del-item").forEach((b) => b.addEventListener("click", async () => {
    if (!confirm("Delete this menu item?")) return;
    await supabaseClient.from("menu_items").delete().eq("id", b.dataset.id);
    toast("Item deleted"); loadMenu(); loadOverview();
  }));
  container.querySelectorAll(".edit-cat").forEach((b) => b.addEventListener("click", () => openCategoryModal({ id: Number(b.dataset.id), name: b.dataset.name })));
  container.querySelectorAll(".del-cat").forEach((b) => b.addEventListener("click", async () => {
    if (!confirm("Delete this category? Items inside it will be uncategorized, not deleted.")) return;
    await supabaseClient.from("menu_categories").delete().eq("id", b.dataset.id);
    toast("Category deleted"); loadMenu();
  }));
}

function openCategoryModal(category = null) {
  const isEdit = !!category;
  openModal(isEdit ? "Rename category" : "Add category",
    fieldHtml({ name: "name", label: "Category name", value: category?.name, required: true, placeholder: "e.g. Cocktails" }),
    async (fd) => {
      const q = isEdit
        ? supabaseClient.from("menu_categories").update({ name: fd.get("name") }).eq("id", category.id)
        : supabaseClient.from("menu_categories").insert({ name: fd.get("name"), sort_order: 99 });
      const { error } = await q;
      if (error) return toast("Couldn't save: " + error.message, "error");
      closeModal(); toast(isEdit ? "Category renamed" : "Category added"); loadMenu();
    },
    isEdit ? "Save changes" : "Add category"
  );
}

function openMenuItemModal(item = null, categoryId = null) {
  const isEdit = !!item;
  const targetCategoryId = isEdit ? item.category_id : categoryId;
  openModal(isEdit ? "Edit item" : "Add item",
    fieldHtml({ name: "name", label: "Item name", value: item?.name, required: true }) +
    fieldHtml({ name: "description", label: "Description", type: "textarea", value: item?.description }) +
    fieldHtml({ name: "price", label: "Price (RWF)", type: "number", value: item?.price }) +
    `<div class="field"><label>Photo</label>
      ${item?.image_url ? `<img src="${escapeAttr(item.image_url)}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;margin-bottom:8px;">` : ""}
      <input type="file" name="image_file" accept="image/*">
      <div class="upload-progress" id="itemUploadStatus"></div>
    </div>` +
    fieldHtml({ name: "is_available", label: "Available", type: "checkbox", checked: item ? item.is_available : true }),
    async (fd) => {
      let image_url = item?.image_url || null;
      const file = fd.get("image_file");
      if (file && file.size > 0) {
        const uploaded = await uploadToBucket("menu", file);
        if (!uploaded) return;
        image_url = uploaded;
      }
      const payload = {
        category_id: targetCategoryId,
        name: fd.get("name"),
        description: fd.get("description") || null,
        price: fd.get("price") ? Number(fd.get("price")) : null,
        image_url,
        is_available: fd.get("is_available") === "on",
      };
      const q = isEdit
        ? supabaseClient.from("menu_items").update(payload).eq("id", item.id)
        : supabaseClient.from("menu_items").insert(payload);
      const { error } = await q;
      if (error) return toast("Couldn't save: " + error.message, "error");
      closeModal(); toast(isEdit ? "Item updated" : "Item added"); loadMenu(); loadOverview();
    },
    isEdit ? "Save changes" : "Add item"
  );
}

/* ---------------------------------------------------------
   STORAGE UPLOAD HELPER
--------------------------------------------------------- */
async function uploadToBucket(bucket, file) {
  const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "")}`;
  const { error } = await supabaseClient.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) { toast("Upload failed: " + error.message, "error"); return null; }
  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/* ---------------------------------------------------------
   GALLERY
--------------------------------------------------------- */
function wireGalleryUpload() {
  document.getElementById("galleryFileInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const status = document.getElementById("galleryUploadStatus");
    status.textContent = "Uploading…";
    const url = await uploadToBucket("gallery", file);
    if (!url) { status.textContent = ""; return; }
    const { error } = await supabaseClient.from("gallery_images").insert({ image_url: url, sort_order: 99 });
    status.textContent = "";
    e.target.value = "";
    if (error) return toast("Couldn't save: " + error.message, "error");
    toast("Photo added"); loadGallery(); loadOverview();
  });
}

async function loadGallery() {
  const { data, error } = await supabaseClient.from("gallery_images").select("*").order("sort_order");
  const box = document.getElementById("galleryListAdmin");
  if (error || !data || !data.length) { box.innerHTML = `<div class="empty">No photos yet — upload your first one above.</div>`; return; }
  box.innerHTML = data.map((img) => `
    <div class="list-item">
      <img src="${escapeAttr(img.image_url)}" alt="">
      <div class="list-item-body"><div class="list-item-sub">${escapeHtml(img.caption || "Untitled photo")}</div></div>
      <div class="list-item-actions"><button class="icon-btn del-gallery" data-id="${img.id}">🗑</button></div>
    </div>
  `).join("");
  box.querySelectorAll(".del-gallery").forEach((b) => b.addEventListener("click", async () => {
    if (!confirm("Delete this photo?")) return;
    await supabaseClient.from("gallery_images").delete().eq("id", b.dataset.id);
    toast("Photo deleted"); loadGallery(); loadOverview();
  }));
}

/* ---------------------------------------------------------
   OFFERS
--------------------------------------------------------- */
async function loadOffers() {
  const { data, error } = await supabaseClient.from("offers").select("*").order("created_at", { ascending: false });
  const box = document.getElementById("offersListAdmin");
  if (error || !data || !data.length) { box.innerHTML = `<div class="empty">No offers yet.</div>`; return; }
  box.innerHTML = data.map((o) => `
    <div class="list-item">
      <div class="thumb">🎉</div>
      <div class="list-item-body">
        <div class="list-item-title">${escapeHtml(o.title)}</div>
        <div class="list-item-sub">${o.active ? '<span class="badge available">Active</span>' : '<span class="badge unavailable">Inactive</span>'}</div>
      </div>
      <div class="list-item-actions">
        <button class="icon-btn edit-offer" data-id="${o.id}">✎</button>
        <button class="icon-btn del-offer" data-id="${o.id}">🗑</button>
      </div>
    </div>
  `).join("");
  box.querySelectorAll(".edit-offer").forEach((b) => b.addEventListener("click", () => openOfferModal(data.find((o) => o.id === Number(b.dataset.id)))));
  box.querySelectorAll(".del-offer").forEach((b) => b.addEventListener("click", async () => {
    if (!confirm("Delete this offer?")) return;
    await supabaseClient.from("offers").delete().eq("id", b.dataset.id);
    toast("Offer deleted"); loadOffers();
  }));
}
function openOfferModal(offer = null) {
  const isEdit = !!offer;
  openModal(isEdit ? "Edit offer" : "Add offer",
    fieldHtml({ name: "title", label: "Title", value: offer?.title, required: true }) +
    fieldHtml({ name: "description", label: "Description", type: "textarea", value: offer?.description }) +
    fieldHtml({ name: "active", label: "Active (show on website)", type: "checkbox", checked: offer ? offer.active : true }),
    async (fd) => {
      const payload = { title: fd.get("title"), description: fd.get("description") || null, active: fd.get("active") === "on" };
      const q = isEdit ? supabaseClient.from("offers").update(payload).eq("id", offer.id) : supabaseClient.from("offers").insert(payload);
      const { error } = await q;
      if (error) return toast("Couldn't save: " + error.message, "error");
      closeModal(); toast(isEdit ? "Offer updated" : "Offer added"); loadOffers();
    },
    isEdit ? "Save changes" : "Add offer"
  );
}

/* ---------------------------------------------------------
   RESERVATIONS
--------------------------------------------------------- */
function reservationRowHtml(r, opts = {}) {
  const dt = r.created_at ? new Date(r.created_at).toLocaleString() : "";
  const compact = !!opts.compact;
  return `
    <div class="list-item" style="align-items:flex-start;">
      <div class="thumb">${r.request_type === "inquiry" ? "💬" : "📅"}</div>
      <div class="list-item-body">
        <div class="list-item-title">${escapeHtml(r.name)} · ${escapeHtml(r.phone)}</div>
        <div class="list-item-sub">
          ${r.party_size ? `Party of ${r.party_size} · ` : ""}${r.preferred_date || ""} ${r.preferred_time || ""}
        </div>
        ${r.message ? `<div class="list-item-sub" style="margin-top:4px;">${escapeHtml(r.message)}</div>` : ""}
        <div class="list-item-sub" style="margin-top:4px;">${dt}</div>
        <span class="badge ${r.status}">${r.status}</span>
      </div>
      ${compact ? "" : `
      <div class="list-item-actions" style="flex-direction:column;gap:8px;">
        <select class="status-select" data-id="${r.id}" style="background:var(--bg-alt);color:var(--text);border:1px solid var(--line-strong);border-radius:8px;padding:6px;font-size:0.78rem;">
          ${["new","contacted","confirmed","closed"].map((s) => `<option value="${s}" ${s === r.status ? "selected" : ""}>${s}</option>`).join("")}
        </select>
        <button class="icon-btn del-reservation" data-id="${r.id}" title="Delete">🗑</button>
      </div>`}
    </div>
  `;
}
async function loadReservations() {
  const { data, error } = await supabaseClient.from("reservation_requests").select("*").order("created_at", { ascending: false });
  const box = document.getElementById("reservationsList");
  if (error || !data || !data.length) { box.innerHTML = `<div class="empty">No reservation requests yet.</div>`; return; }
  box.innerHTML = data.map((r) => reservationRowHtml(r, { compact: false })).join("");
  box.querySelectorAll(".status-select").forEach((sel) => sel.addEventListener("change", async () => {
    const { error } = await supabaseClient.from("reservation_requests").update({ status: sel.value }).eq("id", sel.dataset.id);
    if (error) return toast("Couldn't update: " + error.message, "error");
    toast("Status updated"); loadOverview();
  }));
  box.querySelectorAll(".del-reservation").forEach((btn) => btn.addEventListener("click", async () => {
    if (!confirm("Delete this reservation request? This can't be undone.")) return;
    const { error } = await supabaseClient.from("reservation_requests").delete().eq("id", btn.dataset.id);
    if (error) return toast("Couldn't delete: " + error.message, "error");
    toast("Reservation deleted"); loadReservations(); loadOverview();
  }));
}

/* ---------------------------------------------------------
   TESTIMONIALS / REVIEWS
--------------------------------------------------------- */
async function loadTestimonials() {
  const { data, error } = await supabaseClient.from("testimonials").select("*").order("sort_order");
  const box = document.getElementById("testimonialsListAdmin");
  if (error || !data || !data.length) { box.innerHTML = `<div class="empty">No reviews yet — add one above.</div>`; return; }
  box.innerHTML = data.map((t) => `
    <div class="list-item">
      <div class="thumb">★</div>
      <div class="list-item-body">
        <div class="list-item-title">${escapeHtml(t.author_name)}${t.rating ? ` — ${t.rating}★` : ""}</div>
        <div class="list-item-sub">${escapeHtml(t.quote).slice(0, 80)}${t.quote.length > 80 ? "…" : ""}</div>
        <span class="badge ${t.is_featured ? "available" : "unavailable"}">${t.is_featured ? "Shown on site" : "Hidden"}</span>
      </div>
      <div class="list-item-actions">
        <button class="icon-btn edit-testimonial" data-id="${t.id}">✎</button>
        <button class="icon-btn del-testimonial" data-id="${t.id}">🗑</button>
      </div>
    </div>
  `).join("");
  box.querySelectorAll(".edit-testimonial").forEach((b) => b.addEventListener("click", () => openTestimonialModal(data.find((t) => t.id === Number(b.dataset.id)))));
  box.querySelectorAll(".del-testimonial").forEach((b) => b.addEventListener("click", async () => {
    if (!confirm("Delete this review?")) return;
    await supabaseClient.from("testimonials").delete().eq("id", b.dataset.id);
    toast("Review deleted"); loadTestimonials(); loadOverview();
  }));
}
function openTestimonialModal(t = null) {
  const isEdit = !!t;
  openModal(isEdit ? "Edit review" : "Add review",
    fieldHtml({ name: "author_name", label: "Reviewer name", value: t?.author_name, required: true }) +
    fieldHtml({ name: "quote", label: "Review text", type: "textarea", value: t?.quote }) +
    fieldHtml({ name: "rating", label: "Rating (1–5)", type: "number", value: t?.rating, placeholder: "5" }) +
    fieldHtml({ name: "source", label: "Source", value: t?.source || "Google Reviews" }) +
    fieldHtml({ name: "is_featured", label: "Show on website", type: "checkbox", checked: t ? t.is_featured : true }),
    async (fd) => {
      const payload = {
        author_name: fd.get("author_name"),
        quote: fd.get("quote"),
        rating: fd.get("rating") ? Number(fd.get("rating")) : null,
        source: fd.get("source") || "Google Reviews",
        is_featured: fd.get("is_featured") === "on",
      };
      const q = isEdit ? supabaseClient.from("testimonials").update(payload).eq("id", t.id) : supabaseClient.from("testimonials").insert(payload);
      const { error } = await q;
      if (error) return toast("Couldn't save: " + error.message, "error");
      closeModal(); toast(isEdit ? "Review updated" : "Review added"); loadTestimonials(); loadOverview();
    },
    isEdit ? "Save changes" : "Add review"
  );
}

/* ---------------------------------------------------------
   SOCIAL LINKS & SETTINGS
--------------------------------------------------------- */
async function loadSocialSettings() {
  const { data: social } = await supabaseClient.from("social_links").select("*");
  const socialForm = document.getElementById("socialForm");
  (social || []).forEach((s) => { if (socialForm.elements[s.platform]) socialForm.elements[s.platform].value = s.url || ""; });

  const { data: settings } = await supabaseClient.from("site_settings").select("*");
  const settingsForm = document.getElementById("settingsForm");
  (settings || []).forEach((s) => { if (settingsForm.elements[s.key]) settingsForm.elements[s.key].value = s.value || ""; });
}
function wireSocialSettingsForm() {
  document.getElementById("socialForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const rows = [...fd.entries()].map(([platform, url]) => ({ platform, url }));
    const { error } = await supabaseClient.from("social_links").upsert(rows, { onConflict: "platform" });
    if (error) return toast("Couldn't save: " + error.message, "error");
    toast("Social links saved");
  });
  document.getElementById("settingsForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const rows = [...fd.entries()].map(([key, value]) => ({ key, value }));
    const { error } = await supabaseClient.from("site_settings").upsert(rows, { onConflict: "key" });
    if (error) return toast("Couldn't save: " + error.message, "error");
    toast("Settings saved");
  });
}

/* ---------------------------------------------------------
   REALTIME — instant notification when a new reservation
   request comes in while the admin panel is open.
--------------------------------------------------------- */
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    [880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.14);
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.14 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.14 + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.3);
    });
  } catch (err) {
    console.warn("Notification sound unavailable:", err);
  }
}

function wireReservationRealtime() {
  supabaseClient
    .channel("reservation-requests-changes")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "reservation_requests" },
      (payload) => {
        const r = payload.new;
        playNotificationSound();
        toast(`New reservation: ${r.name} · ${r.phone}`, "success");
        showSystemNotification(
          "New reservation — Bar Mubiti",
          `${r.name} · ${r.phone}${r.party_size ? ` · party of ${r.party_size}` : ""}`
        );
        loadOverview();
        // Only refresh the full list if that panel is currently visible,
        // so we don't yank focus away from whatever the admin is doing.
        if (document.getElementById("panel-reservations").classList.contains("active")) {
          loadReservations();
        }
      }
    )
    .subscribe((status) => {
      console.log("Realtime reservation channel status:", status);
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.warn("Realtime reservation notifications couldn't connect. Make sure Realtime is enabled for reservation_requests in Supabase (see schema.sql, or Database → Replication in the dashboard).");
      }
    });
}

/* ---------------------------------------------------------
   NATIVE BROWSER / SYSTEM NOTIFICATIONS
   Shows an OS-level notification (phone/laptop notification
   tray) even if the admin has switched to another tab or app.
   Requires the admin to grant permission once — if they deny
   or never respond, we just skip it silently (the in-page
   toast + sound above still work regardless).
--------------------------------------------------------- */
function requestNotificationPermission() {
  if (!("Notification" in window)) return; // unsupported browser — fail quietly
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function wireNotificationPermissionButton() {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "default") return; // already granted or denied, nothing to ask
  const bar = document.createElement("div");
  bar.className = "banner show";
  bar.style.cssText = "background:var(--surface-2);border:1px solid var(--line-strong);color:var(--text);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;";
  bar.innerHTML = `
    <span>🔔 Turn on notifications to get alerted the instant a new reservation comes in — even if this tab isn't in front.</span>
    <button class="btn btn-primary btn-sm" id="enableNotifBtn" style="flex-shrink:0;">Enable notifications</button>
  `;
  document.querySelector(".main").insertBefore(bar, document.querySelector(".main").firstChild.nextSibling);
  document.getElementById("enableNotifBtn").addEventListener("click", async () => {
    const result = await Notification.requestPermission();
    if (result === "granted") {
      toast("Notifications enabled");
      bar.remove();
    } else {
      toast("Notifications blocked — you can still change this in your browser's site settings.", "error");
      bar.remove();
    }
  });
}

function showSystemNotification(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: "../assets/logo.png",
      badge: "../assets/favicon.svg",
      tag: "bar-mubiti-reservation", // replaces any previous unread one instead of stacking endlessly
    });
  } catch (err) {
    console.warn("System notification failed:", err);
  }
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function escapeAttr(str) { return escapeHtml(str); }
