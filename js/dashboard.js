/* =========================================================
   SnipeCraft Admin - Dashboard & Sections
   ========================================================= */
(function () {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  /* -------- Tiny DOM helpers -------- */
  const el = (tag, attrs, kids) => {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k.startsWith("on") && typeof v === "function")
        n.addEventListener(k.slice(2).toLowerCase(), v);
      else n.setAttribute(k, v);
    }
    if (kids != null) (Array.isArray(kids) ? kids : [kids]).forEach(c => {
      if (c == null) return;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return n;
  };
  const clear = (n) => { while (n.firstChild) n.removeChild(n.firstChild); };
  const fmt = (ts) => {
    if (!ts) return "-";
    const d = new Date(Number(ts));
    if (isNaN(d)) return "-";
    return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };
  const sortByOrder = (list) => list.slice().sort((a, b) => {
    const ao = Number(a.order), bo = Number(b.order);
    const aOk = Number.isFinite(ao), bOk = Number.isFinite(bo);
    if (aOk && bOk && ao !== bo) return ao - bo;
    if (aOk && !bOk) return -1;
    if (!aOk && bOk) return 1;
    return 0;
  });

  /* -------- Toast -------- */
  let toastTimer = null;
  function toast(msg, kind) {
    const t = $("#toast");
    t.textContent = msg;
    t.className = "toast is-open" + (kind ? " toast--" + kind : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = "toast"; }, 3200);
  }

  /* -------- Modal -------- */
  const modal = $("#modal");
  let onModalSubmit = null;

  function openModal({ title, fields, submitLabel = "Save", onSubmit, values = {} }) {
    $("#modalTitle").textContent = title;
    const body = $("#modalBody");
    clear(body);

    fields.forEach(f => {
      const wrap = document.createElement("div");
      const id = "f_" + f.name;
      const val = values[f.name] != null ? values[f.name] : (f.value != null ? f.value : "");

      if (f.type === "checkbox") {
        wrap.className = "field field--check";
        const cb = el("input", { type: "checkbox", id, name: f.name });
        cb.checked = !!val;
        const lbl = el("label", { for: id, text: f.label });
        wrap.appendChild(cb); wrap.appendChild(lbl);
        body.appendChild(wrap);
        return;
      }

      wrap.className = "field";
      const lbl = document.createElement("label");
      lbl.htmlFor = id;
      lbl.innerHTML = f.label + (f.required ? ' <span class="req">*</span>' : "");
      wrap.appendChild(lbl);

      let input;
      if (f.type === "textarea") { input = el("textarea", { rows: f.rows || 4 }); }
      else if (f.type === "select") {
        input = el("select");
        (f.options || []).forEach(o => {
          const opt = el("option", { value: o.value, text: o.label });
          if (o.value === val) opt.selected = true;
          input.appendChild(opt);
        });
      } else { input = el("input", { type: f.type || "text" }); }

      input.id = id; input.name = f.name;
      if (input.tagName !== "SELECT") input.value = val;
      if (f.placeholder) input.placeholder = f.placeholder;
      if (f.required) input.required = true;
      if (f.type === "number") { input.min = f.min != null ? f.min : 0; input.step = 1; }
      wrap.appendChild(input);
      if (f.hint) wrap.appendChild(el("p", { class: "field__hint", text: f.hint }));
      body.appendChild(wrap);
    });

    const foot = $("#modalFoot");
    clear(foot);
    const cancel = el("button", { class: "btn btn--ghost", type: "button", text: "Cancel" });
    cancel.addEventListener("click", closeModal);
    const submit = el("button", { class: "btn btn--primary", type: "button", text: submitLabel });
    foot.appendChild(cancel); foot.appendChild(submit);

    onModalSubmit = () => {
      const data = {};
      fields.forEach(f => {
        const i = document.getElementById("f_" + f.name);
        if (!i) return;
        if (f.type === "checkbox") data[f.name] = i.checked;
        else if (f.type === "number") data[f.name] = i.value === "" ? "" : Number(i.value);
        else data[f.name] = i.value.trim();
      });
      onSubmit(data);
    };
    submit.addEventListener("click", () => onModalSubmit());

    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add("is-open"));
    const first = body.querySelector("input, textarea, select");
    if (first) first.focus();
  }
  function closeModal() {
    modal.classList.remove("is-open");
    setTimeout(() => { modal.hidden = true; }, 180);
    onModalSubmit = null;
  }
  modal.addEventListener("click", e => { if (e.target.dataset.close !== undefined) closeModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

  /* -------- Confirm -------- */
  const confirmEl = $("#confirm");
  function askConfirm(text, onYes) {
    $("#confirmText").textContent = text;
    confirmEl.hidden = false;
    requestAnimationFrame(() => confirmEl.classList.add("is-open"));
    const yes = $("#confirmYes");
    const handler = () => { closeConfirm(); yes.removeEventListener("click", handler); onYes(); };
    yes.addEventListener("click", handler);
  }
  function closeConfirm() {
    confirmEl.classList.remove("is-open");
    setTimeout(() => { confirmEl.hidden = true; }, 180);
  }
  confirmEl.addEventListener("click", e => { if (e.target.dataset.close !== undefined) closeConfirm(); });

  /* -------- Table helpers -------- */
  function td(label, content) {
    const c = document.createElement("td");
    c.setAttribute("data-label", label);
    if (content instanceof Node) c.appendChild(content);
    else c.textContent = content == null ? "-" : String(content);
    return c;
  }
  function badge(text, kind) {
    return el("span", { class: "badge" + (kind ? " badge--" + kind : ""), text });
  }
  function tableWrap(thead, rows) {
    const wrap = el("div", { class: "table-wrap" });
    const t = el("table", { class: "table" });
    const theadEl = el("thead");
    const tr = el("tr");
    thead.forEach(h => tr.appendChild(el("th", { text: h })));
    theadEl.appendChild(tr);
    t.appendChild(theadEl);
    const tb = el("tbody");
    rows.forEach(r => tb.appendChild(r));
    t.appendChild(tb);
    wrap.appendChild(t);
    return wrap;
  }
  function emptyBlock(title, text) {
    return el("div", { class: "placeholder" }, [
      el("span", { class: "placeholder__icon", "aria-hidden": "true", text: "\u25C7" }),
      el("h3", { class: "placeholder__title", text: title || "Nothing here yet" }),
      el("p", { class: "placeholder__text", text: text || "" })
    ]);
  }
  function errorBlock(text, retry) {
    const btn = el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Try Again" });
    if (retry) btn.addEventListener("click", retry);
    const w = el("div", { class: "placeholder" }, [
      el("span", { class: "placeholder__icon", "aria-hidden": "true", text: "!" }),
      el("h3", { class: "placeholder__title", text: "Something went wrong" }),
      el("p", { class: "placeholder__text", text: text || "Please try again." }),
      btn
    ]);
    return w;
  }

  /* -------- State -------- */
  let currentUser = null;
  let currentAdmin = null;
  let activeRef = null;

  /* -------- Auth -------- */
  function boot() {
    if (!window.firebaseReady || !window.auth) {
      showDenied("Firebase is not configured. Edit js/firebase.js.");
      return;
    }
    window.auth.onAuthStateChanged(async (user) => {
      if (activeRef) { activeRef.off(); activeRef = null; }
      currentUser = null; currentAdmin = null;

      if (!user) {
        window.location.replace("index.html");
        return;
      }

      let adminSnap;
      try {
        adminSnap = await window.db.ref("admins/" + user.uid).once("value");
      } catch (_) {
        showDenied("Could not verify admin status.");
        return;
      }
      const admin = adminSnap.val();
      if (!admin || admin.status !== "active") {
        showDenied("Your account is not registered as an active admin.");
        return;
      }

      currentUser = user;
      currentAdmin = admin;
      $("#userEmail").textContent = user.email || user.uid;
      $("#userRole").textContent = (admin.role || "admin").toUpperCase();

      $("#boot").hidden = true;
      $("#denied").hidden = true;
      $("#shell").hidden = false;
      openSection("dashboard");
    });
  }

  function showDenied(msg) {
    $("#boot").hidden = true;
    $("#shell").hidden = true;
    $("#denied").hidden = false;
    const p = $("#denied .auth-sub");
    if (p) p.textContent = msg;
  }

  $("#logoutBtn").addEventListener("click", () => window.auth.signOut());
  $("#deniedLogout").addEventListener("click", () => window.auth.signOut());

  /* -------- Router -------- */
  const TITLES = {
    dashboard: "Dashboard",
    registrations: "Registrations",
    staff: "Staff",
    rules: "Rules",
    event: "Event Settings",
    winners: "Winners",
    announcements: "Announcements",
    admins: "Admins"
  };

  function openSection(name) {
    $("#sectionTitle").textContent = TITLES[name] || name;
    $$(".nav-item").forEach(b => b.classList.toggle("is-active", b.dataset.section === name));
    if (activeRef) { activeRef.off(); activeRef = null; }

    const content = $("#sectionContent");
    clear(content);
    if (window.innerWidth <= 960) $("#shell").classList.remove("nav-open");

    switch (name) {
      case "dashboard":     renderDashboard(content); break;
      case "registrations": renderRegistrations(content); break;
      case "staff":         renderStaff(content); break;
      case "rules":         renderRules(content); break;
      case "event":         renderEvent(content); break;
      case "winners":       renderWinners(content); break;
      case "announcements": renderAnnouncements(content); break;
      case "admins":        renderAdmins(content); break;
    }
  }

  $$(".nav-item").forEach(btn =>
    btn.addEventListener("click", () => openSection(btn.dataset.section))
  );
  $("#sidebarToggle").addEventListener("click", () => {
    const open = $("#shell").classList.toggle("nav-open");
    $("#sidebarToggle").setAttribute("aria-expanded", open ? "true" : "false");
  });

  /* =====================================================
     SECTION: DASHBOARD
     ===================================================== */
  function renderDashboard(root) {
    const stats = el("div", { class: "stat-grid" });
    root.appendChild(stats);

    const counts = { registrations: "Registrations", staff: "Staff", rules: "Rules",
                     winners: "Winners", announcements: "Announcements", admins: "Admins" };
    const valueEls = {};
    Object.keys(counts).forEach(k => {
      const card = el("div", { class: "stat" }, [
        el("p", { class: "stat__label", text: counts[k] }),
        el("p", { class: "stat__value", text: "..." })
      ]);
      stats.appendChild(card);
      valueEls[k] = card.querySelector(".stat__value");
    });

    const db = window.db;
    Object.keys(counts).forEach(p => {
      db.ref(p).once("value")
        .then(s => { valueEls[p].textContent = Object.keys(s.val() || {}).length; })
        .catch(() => { valueEls[p].textContent = "!"; });
    });

    root.appendChild(el("h2", { class: "section-title", text: "Quick Actions" }));
    const quick = el("div", { class: "stat-grid" });
    [
      ["Enroll a player", () => openSection("registrations")],
      ["Add a rule",      () => openSection("rules")],
      ["Post announcement", () => openSection("announcements")],
      ["Update event info", () => openSection("event")],
      ["Add a winner",    () => openSection("winners")],
      ["Manage staff",    () => openSection("staff")]
    ].forEach(([label, fn]) => {
      const b = el("button", { class: "btn btn--ghost", type: "button", text: label });
      b.style.width = "100%";
      b.addEventListener("click", fn);
      quick.appendChild(b);
    });
    root.appendChild(quick);

    const note = el("div", { class: "section-note", style: "margin-top:22px" });
    note.innerHTML = "<strong>Signed in as:</strong> " + (currentUser.email || currentUser.uid) +
                     " &nbsp;&middot;&nbsp; <strong>Role:</strong> " + (currentAdmin.role || "admin");
    root.appendChild(note);
  }

  /* =====================================================
     SECTION: REGISTRATIONS
     ===================================================== */
  function renderRegistrations(root) {
    const bar = el("div", { class: "toolbar" });
    const search = el("input", { class: "toolbar__search", type: "search", placeholder: "Search username or discord..." });
    const filter = el("select", { class: "toolbar__select" });
    ["All statuses", "pending", "approved", "rejected"].forEach(s =>
      filter.appendChild(el("option", { value: s === "All statuses" ? "" : s, text: s }))
    );
    const enrollBtn = el("button", { class: "btn btn--primary", type: "button", text: "+ Enroll Player" });
    bar.appendChild(search); bar.appendChild(filter); bar.appendChild(enrollBtn);
    root.appendChild(bar);

    const host = el("div");
    root.appendChild(host);

    let all = [];
    function draw() {
      clear(host);
      const q = search.value.trim().toLowerCase();
      const f = filter.value;
      const list = all.filter(r => {
        if (f && r.status !== f) return false;
        if (!q) return true;
        return (r.minecraftUsername || "").toLowerCase().includes(q) ||
               (r.discordUsername || "").toLowerCase().includes(q);
      });
      if (!list.length) {
        host.appendChild(emptyBlock("No registrations", all.length
          ? "Nothing matches the current filters."
          : "Public and admin enrollments will appear here."));
        return;
      }
      const rows = list.map(r => {
        const tr = el("tr");
        tr.appendChild(td("Username", r.minecraftUsername || r._id));
        tr.appendChild(td("Discord", r.discordUsername || "-"));
        tr.appendChild(td("Registered", fmt(r.registeredAt)));
        tr.appendChild(td("Source", badge(r.source || "public", r.source === "admin" ? "warn" : "muted")));
        tr.appendChild(td("Status", badge(r.status || "pending",
          r.status === "approved" ? "success" : r.status === "rejected" ? "danger" : "warn")));

        const acts = el("div", { class: "table__actions" });
        if (r.status !== "approved") {
          const b = el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Approve" });
          b.addEventListener("click", () => patch(r._id, { status: "approved" }));
          acts.appendChild(b);
        }
        if (r.status !== "rejected") {
          const b = el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Reject" });
          b.addEventListener("click", () => patch(r._id, { status: "rejected" }));
          acts.appendChild(b);
        }
        const ed = el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Edit" });
        ed.addEventListener("click", () => editReg(r));
        acts.appendChild(ed);

        const del = el("button", { class: "btn btn--danger btn--sm", type: "button", text: "Delete" });
        del.addEventListener("click", () => askConfirm('Delete registration for "' + r.minecraftUsername + '"?', () => {
          window.db.ref("registrations/" + r._id).remove()
            .then(() => toast("Deleted.", "success"))
            .catch(e => toast("Delete failed: " + e.message, "error"));
        }));
        acts.appendChild(del);

        tr.appendChild(td("Actions", acts));
        return tr;
      });
      host.appendChild(tableWrap(["Username", "Discord", "Registered", "Source", "Status", "Actions"], rows));
    }

    function patch(key, p) {
      window.db.ref("registrations/" + key).update(p)
        .then(() => toast("Updated.", "success"))
        .catch(e => toast("Failed: " + e.message, "error"));
    }

    function editReg(r) {
      openModal({
        title: "Edit Registration",
        submitLabel: "Save Changes",
        fields: [
          { name: "minecraftUsername", label: "Minecraft Username", required: true, value: r.minecraftUsername },
          { name: "discordUsername",   label: "Discord Username",   value: r.discordUsername || "" },
          { name: "status", label: "Status", type: "select", value: r.status || "pending",
            options: [
              { value: "pending",  label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" }
            ] }
        ],
        onSubmit: (d) => {
          const lower = d.minecraftUsername.toLowerCase();
          const dbKey = lower.replace(/\./g, "-");
          const newPatch = {
            minecraftUsername: d.minecraftUsername,
            minecraftUsernameLower: lower,
            discordUsername: d.discordUsername,
            status: d.status
          };
          if (dbKey !== r._id) {
            newPatch.registeredAt = r.registeredAt || Date.now();
            newPatch.source = r.source || "admin";
            newPatch.enrolledBy = r.enrolledBy || "";
            window.db.ref("registrations/" + dbKey).once("value").then(s => {
              if (s.exists()) { toast("That username is already registered.", "error"); return; }
              window.db.ref("registrations/" + dbKey).set(newPatch).then(() => {
                window.db.ref("registrations/" + r._id).remove();
                toast("Updated.", "success"); closeModal();
              });
            });
          } else {
            patch(r._id, newPatch);
            closeModal();
          }
        }
      });
    }

    enrollBtn.addEventListener("click", () => {
      openModal({
        title: "Enroll Player",
        submitLabel: "Enroll",
        fields: [
          { name: "minecraftUsername", label: "Minecraft Username", required: true, placeholder: "PlayerName" },
          { name: "discordUsername",   label: "Discord Username",   placeholder: "optional" },
          { name: "status", label: "Status", type: "select", value: "approved",
            options: [
              { value: "approved", label: "Approved" },
              { value: "pending",  label: "Pending" },
              { value: "rejected", label: "Rejected" }
            ] }
        ],
        onSubmit: (d) => {
          const trimmed = (d.minecraftUsername || "").trim();

          if (!/^[A-Za-z0-9_.]{3,16}$/.test(trimmed)) {
            toast("Invalid Minecraft username.", "error");
            return;
          }

          const lower = trimmed.toLowerCase();
          const dbKey = lower.replace(/\./g, "-");

          window.db.ref("registrations/" + dbKey).set({
            minecraftUsername: trimmed,
            minecraftUsernameLower: lower,
            discordUsername: d.discordUsername,
            registeredAt: firebase.database.ServerValue.TIMESTAMP,
            status: d.status,
            source: "admin",
            enrolledBy: currentUser.uid
          })
          .then(() => { toast("Player enrolled.", "success"); closeModal(); })
          .catch((err) => {
            console.error("[Admin] enroll error:", err);
            const msg = (err && err.message ? err.message : "").toLowerCase();
            if (msg.includes("permission")) {
              toast("That username is already registered, or your admin status is inactive.", "error");
            } else {
              toast("Enroll failed: " + err.message, "error");
            }
          });
        }
      });
    });

    search.addEventListener("input", draw);
    filter.addEventListener("change", draw);

    activeRef = window.db.ref("registrations");
    activeRef.on("value", s => {
      const v = s.val() || {};
      all = Object.keys(v).map(k => Object.assign({ _id: k }, v[k]));
      draw();
    }, err => {
      clear(host);
      host.appendChild(errorBlock("Could not load registrations: " + err.message, () => openSection("registrations")));
    });
  }

  /* =====================================================
     SECTION: STAFF
     ===================================================== */
  function renderStaff(root) {
    const bar = el("div", { class: "toolbar" });
    const add = el("button", { class: "btn btn--primary", type: "button", text: "+ Add Staff" });
    bar.appendChild(add);
    root.appendChild(bar);
    const host = el("div");
    root.appendChild(host);

    function openForm(existing) {
      openModal({
        title: existing ? "Edit Staff Member" : "Add Staff Member",
        submitLabel: existing ? "Save" : "Create",
        values: existing || { order: 0 },
        fields: [
          { name: "name",        label: "Name",        required: true, value: existing ? existing.name : "" },
          { name: "role",        label: "Role",        type: "select",
            value: existing ? existing.role : "Helper",
            options: [
              { value: "Owner",           label: "Owner" },
              { value: "Moderator",       label: "Moderator" },
              { value: "Trial Moderator", label: "Trial Moderator" },
              { value: "Sr.Helper",       label: "Sr.Helper" },
              { value: "Helper",          label: "Helper" }
            ] },
          { name: "description", label: "Description", type: "textarea", value: existing ? existing.description : "" },
          { name: "imageUrl",    label: "Image URL",   type: "url", value: existing ? existing.imageUrl : "" },
          { name: "discord",     label: "Discord",     value: existing ? existing.discord : "" },
          { name: "order",       label: "Order",       type: "number", min: 0, value: existing ? existing.order : 0 }
        ],
        onSubmit: (d) => {
          if (!d.name || !d.role) { toast("Name and role required.", "error"); return; }
          const key = existing ? existing._id : window.db.ref("staff").push().key;
          window.db.ref("staff/" + key).set(d)
            .then(() => { toast(existing ? "Updated." : "Added.", "success"); closeModal(); })
            .catch(e => toast("Failed: " + e.message, "error"));
        }
      });
    }

    add.addEventListener("click", () => openForm(null));

    activeRef = window.db.ref("staff");
    activeRef.on("value", s => {
      const v = s.val() || {};
      const list = sortByOrder(Object.keys(v).map(k => Object.assign({ _id: k }, v[k])));
      clear(host);
      if (!list.length) { host.appendChild(emptyBlock("No staff yet", "Add your team members.")); return; }
      const rows = list.map(st => {
        const tr = el("tr");
        tr.appendChild(td("Order", st.order != null ? st.order : "-"));
        tr.appendChild(td("Name", st.name || "-"));
        tr.appendChild(td("Role", st.role || "-"));
        tr.appendChild(td("Discord", st.discord || "-"));
        const acts = el("div", { class: "table__actions" });
        const ed = el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Edit" });
        ed.addEventListener("click", () => openForm(st));
        acts.appendChild(ed);
        const del = el("button", { class: "btn btn--danger btn--sm", type: "button", text: "Delete" });
        del.addEventListener("click", () => askConfirm('Delete "' + st.name + '"?', () => {
          window.db.ref("staff/" + st._id).remove().then(() => toast("Deleted.", "success"));
        }));
        acts.appendChild(del);
        tr.appendChild(td("Actions", acts));
        return tr;
      });
      host.appendChild(tableWrap(["Order", "Name", "Role", "Discord", "Actions"], rows));
    });
  }

  /* =====================================================
     SECTION: RULES
     ===================================================== */
  function renderRules(root) {
    const bar = el("div", { class: "toolbar" });
    const add = el("button", { class: "btn btn--primary", type: "button", text: "+ Add Rule" });
    bar.appendChild(add);
    root.appendChild(bar);
    const host = el("div");
    root.appendChild(host);

    function openForm(existing) {
      openModal({
        title: existing ? "Edit Rule" : "Add Rule",
        submitLabel: existing ? "Save" : "Create",
        values: existing || { order: 0, published: true },
        fields: [
          { name: "title",       label: "Title",        required: true, value: existing ? existing.title : "" },
          { name: "description", label: "Description",  type: "textarea", required: true, value: existing ? existing.description : "" },
          { name: "order",       label: "Order",        type: "number", min: 0, value: existing ? existing.order : 0 },
          { name: "published",   label: "Published (visible to public)", type: "checkbox", value: existing ? !!existing.published : true }
        ],
        onSubmit: (d) => {
          if (!d.title || !d.description) { toast("Title and description required.", "error"); return; }
          const key = existing ? existing._id : window.db.ref("rules").push().key;
          const payload = Object.assign({}, d, {
            createdAt: (existing && existing.createdAt) || firebase.database.ServerValue.TIMESTAMP
          });
          window.db.ref("rules/" + key).set(payload)
            .then(() => { toast(existing ? "Updated." : "Created.", "success"); closeModal(); })
            .catch(e => toast("Failed: " + e.message, "error"));
        }
      });
    }
    add.addEventListener("click", () => openForm(null));

    activeRef = window.db.ref("rules");
    activeRef.on("value", s => {
      const v = s.val() || {};
      const list = sortByOrder(Object.keys(v).map(k => Object.assign({ _id: k }, v[k])));
      clear(host);
      if (!list.length) { host.appendChild(emptyBlock("No rules yet", "Add your first rule.")); return; }
      const rows = list.map(r => {
        const tr = el("tr");
        tr.appendChild(td("Order", r.order != null ? r.order : "-"));
        tr.appendChild(td("Title", r.title || "-"));
        tr.appendChild(td("Published", badge(r.published ? "yes" : "no", r.published ? "success" : "muted")));
        const acts = el("div", { class: "table__actions" });
        const t = el("button", { class: "btn btn--ghost btn--sm", type: "button", text: r.published ? "Unpublish" : "Publish" });
        t.addEventListener("click", () => window.db.ref("rules/" + r._id).update({ published: !r.published })
          .then(() => toast("Updated.", "success")));
        acts.appendChild(t);
        const ed = el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Edit" });
        ed.addEventListener("click", () => openForm(r));
        acts.appendChild(ed);
        const dl = el("button", { class: "btn btn--danger btn--sm", type: "button", text: "Delete" });
        dl.addEventListener("click", () => askConfirm('Delete rule "' + r.title + '"?', () => {
          window.db.ref("rules/" + r._id).remove().then(() => toast("Deleted.", "success"));
        }));
        acts.appendChild(dl);
        tr.appendChild(td("Actions", acts));
        return tr;
      });
      host.appendChild(tableWrap(["Order", "Title", "Published", "Actions"], rows));
    });
  }

  /* =====================================================
     SECTION: EVENT
     ===================================================== */
  function renderEvent(root) {
    const FIELDS = [
      { name: "name",           label: "Event Name",         placeholder: "SnipeCraft PvP Tournament" },
      { name: "description",    label: "Description",        type: "textarea" },
      { name: "date",           label: "Date",               placeholder: "2025-12-01" },
      { name: "time",           label: "Time",               placeholder: "20:00" },
      { name: "timezone",       label: "Timezone",           placeholder: "UTC / IST / EST" },
      { name: "serverIP",       label: "Server IP",          placeholder: "play.snipecraft.gg" },
      { name: "version",        label: "Version",            placeholder: "1.20.x" },
      { name: "format",         label: "Format",             placeholder: "1v1 / 2v2 / FFA" },
      { name: "maxPlayers",     label: "Max Players",        type: "number", min: 0 },
      { name: "prize",          label: "Prize" },
      { name: "status",         label: "Status",             placeholder: "Upcoming / Live / Completed" },
      { name: "bannerImageUrl", label: "Banner Image URL",   type: "url" }
    ];

    const form = el("form", { class: "form", style: "max-width:720px" });
    const inputs = {};
    FIELDS.forEach(f => {
      const wrap = el("div", { class: "field" });
      const id = "e_" + f.name;
      const lbl = el("label", { for: id, text: f.label });
      wrap.appendChild(lbl);
      let i;
      if (f.type === "textarea") { i = el("textarea", { rows: 3 }); }
      else { i = el("input", { type: f.type || "text" }); }
      i.id = id;
      if (f.placeholder) i.placeholder = f.placeholder;
      if (f.type === "number") { i.min = f.min != null ? f.min : 0; i.step = 1; }
      wrap.appendChild(i);
      inputs[f.name] = i;
      form.appendChild(wrap);
    });

    const actions = el("div", { class: "toolbar" });
    const save = el("button", { class: "btn btn--primary", type: "submit", text: "Save Settings" });
    const reload = el("button", { class: "btn btn--ghost", type: "button", text: "Reload" });
    actions.appendChild(save); actions.appendChild(reload);
    form.appendChild(actions);
    root.appendChild(form);

    function fill(s) {
      FIELDS.forEach(f => {
        inputs[f.name].value = s && s[f.name] != null ? s[f.name] : "";
      });
    }

    function load() {
      window.db.ref("event/settings").once("value")
        .then(snap => fill(snap.val()))
        .catch(e => toast("Load failed: " + e.message, "error"));
    }
    reload.addEventListener("click", load);
    form.addEventListener("submit", e => {
      e.preventDefault();
      const data = {};
      FIELDS.forEach(f => { data[f.name] = inputs[f.name].value.trim(); });
      save.disabled = true;
      window.db.ref("event/settings").set(data)
        .then(() => toast("Event settings saved.", "success"))
        .catch(e => toast("Save failed: " + e.message, "error"))
        .finally(() => { save.disabled = false; });
    });

    load();
  }

  /* =====================================================
     SECTION: WINNERS
     ===================================================== */
  function renderWinners(root) {
    const bar = el("div", { class: "toolbar" });
    const add = el("button", { class: "btn btn--primary", type: "button", text: "+ Add Winner" });
    bar.appendChild(add);
    root.appendChild(bar);
    const host = el("div");
    root.appendChild(host);

    function openForm(existing) {
      openModal({
        title: existing ? "Edit Winner" : "Add Winner",
        submitLabel: existing ? "Save" : "Create",
        values: existing || { placement: 1 },
        fields: [
          { name: "minecraftUsername", label: "Minecraft Username", required: true, value: existing ? existing.minecraftUsername : "" },
          { name: "placement",         label: "Placement (#)", type: "number", min: 1, required: true, value: existing ? existing.placement : 1 },
          { name: "announcement",      label: "Announcement", type: "textarea", value: existing ? existing.announcement : "" },
          { name: "imageUrl",          label: "Image URL", type: "url", value: existing ? existing.imageUrl : "" }
        ],
        onSubmit: (d) => {
          if (!d.minecraftUsername || !d.placement) { toast("Username and placement required.", "error"); return; }
          const key = existing ? existing._id : window.db.ref("winners").push().key;
          const payload = Object.assign({}, d, {
            announcedAt: (existing && existing.announcedAt) || firebase.database.ServerValue.TIMESTAMP,
            announcedBy: currentUser.uid
          });
          window.db.ref("winners/" + key).set(payload)
            .then(() => { toast(existing ? "Updated." : "Added.", "success"); closeModal(); })
            .catch(e => toast("Failed: " + e.message, "error"));
        }
      });
    }
    add.addEventListener("click", () => openForm(null));

    activeRef = window.db.ref("winners");
    activeRef.on("value", s => {
      const v = s.val() || {};
      const list = Object.keys(v)
        .map(k => Object.assign({ _id: k }, v[k]))
        .sort((a, b) => (Number(a.placement) || 0) - (Number(b.placement) || 0));
      clear(host);
      if (!list.length) { host.appendChild(emptyBlock("No winners yet", "Add them after the tournament.")); return; }
      const rows = list.map(w => {
        const tr = el("tr");
        tr.appendChild(td("Place", "#" + (w.placement != null ? w.placement : "?")));
        tr.appendChild(td("Username", w.minecraftUsername || "-"));
        tr.appendChild(td("Announced", fmt(w.announcedAt)));
        const acts = el("div", { class: "table__actions" });
        const ed = el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Edit" });
        ed.addEventListener("click", () => openForm(w));
        acts.appendChild(ed);
        const dl = el("button", { class: "btn btn--danger btn--sm", type: "button", text: "Delete" });
        dl.addEventListener("click", () => askConfirm('Delete "' + w.minecraftUsername + '"?', () => {
          window.db.ref("winners/" + w._id).remove().then(() => toast("Deleted.", "success"));
        }));
        acts.appendChild(dl);
        tr.appendChild(td("Actions", acts));
        return tr;
      });
      host.appendChild(tableWrap(["Place", "Username", "Announced", "Actions"], rows));
    });
  }

  /* =====================================================
     SECTION: ANNOUNCEMENTS
     ===================================================== */
  function renderAnnouncements(root) {
    const bar = el("div", { class: "toolbar" });
    const add = el("button", { class: "btn btn--primary", type: "button", text: "+ New Announcement" });
    bar.appendChild(add);
    root.appendChild(bar);
    const host = el("div");
    root.appendChild(host);

    function openForm(existing) {
      openModal({
        title: existing ? "Edit Announcement" : "New Announcement",
        submitLabel: existing ? "Save" : "Publish",
        values: existing || { published: true },
        fields: [
          { name: "title",     label: "Title",     required: true, value: existing ? existing.title : "" },
          { name: "message",   label: "Message",   type: "textarea", required: true, value: existing ? existing.message : "" },
          { name: "imageUrl",  label: "Image URL", type: "url", value: existing ? existing.imageUrl : "" },
          { name: "published", label: "Published (visible to public)", type: "checkbox", value: existing ? !!existing.published : true }
        ],
        onSubmit: (d) => {
          if (!d.title || !d.message) { toast("Title and message required.", "error"); return; }
          const key = existing ? existing._id : window.db.ref("announcements").push().key;
          const payload = Object.assign({}, d, {
            createdAt: (existing && existing.createdAt) || firebase.database.ServerValue.TIMESTAMP,
            createdBy: currentUser.uid
          });
          window.db.ref("announcements/" + key).set(payload)
            .then(() => { toast(existing ? "Updated." : "Published.", "success"); closeModal(); })
            .catch(e => toast("Failed: " + e.message, "error"));
        }
      });
    }
    add.addEventListener("click", () => openForm(null));

    activeRef = window.db.ref("announcements");
    activeRef.on("value", s => {
      const v = s.val() || {};
      const list = Object.keys(v)
        .map(k => Object.assign({ _id: k }, v[k]))
        .sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
      clear(host);
      if (!list.length) { host.appendChild(emptyBlock("No announcements yet", "Publish your first one.")); return; }
      const rows = list.map(a => {
        const tr = el("tr");
        tr.appendChild(td("Date", fmt(a.createdAt)));
        tr.appendChild(td("Title", a.title || "-"));
        tr.appendChild(td("Published", badge(a.published ? "yes" : "no", a.published ? "success" : "muted")));
        const acts = el("div", { class: "table__actions" });
        const t = el("button", { class: "btn btn--ghost btn--sm", type: "button", text: a.published ? "Unpublish" : "Publish" });
        t.addEventListener("click", () => window.db.ref("announcements/" + a._id).update({ published: !a.published })
          .then(() => toast("Updated.", "success")));
        acts.appendChild(t);
        const ed = el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Edit" });
        ed.addEventListener("click", () => openForm(a));
        acts.appendChild(ed);
        const dl = el("button", { class: "btn btn--danger btn--sm", type: "button", text: "Delete" });
        dl.addEventListener("click", () => askConfirm('Delete "' + a.title + '"?', () => {
          window.db.ref("announcements/" + a._id).remove().then(() => toast("Deleted.", "success"));
        }));
        acts.appendChild(dl);
        tr.appendChild(td("Actions", acts));
        return tr;
      });
      host.appendChild(tableWrap(["Date", "Title", "Published", "Actions"], rows));
    });
  }

  /* =====================================================
     SECTION: ADMINS
     ===================================================== */
  function renderAdmins(root) {
    const note = el("div", { class: "section-note" });
    note.innerHTML =
      "<strong>How to add an admin:</strong> " +
      "1) Create the account in Firebase Console &rarr; Authentication &rarr; Users. " +
      "2) Copy the new user's <code>UID</code>. " +
      "3) Click <em>+ Add Admin</em> below and paste the UID with <code>status: active</code>.";
    root.appendChild(note);

    const bar = el("div", { class: "toolbar" });
    const add = el("button", { class: "btn btn--primary", type: "button", text: "+ Add Admin" });
    bar.appendChild(add);
    root.appendChild(bar);
    const host = el("div");
    root.appendChild(host);

    function openForm(existing) {
      openModal({
        title: existing ? "Edit Admin" : "Add Admin",
        submitLabel: existing ? "Save" : "Add",
        values: existing || { status: "active", role: "admin" },
        fields: [
          { name: "_uid", label: "Firebase UID", required: !existing,
            placeholder: "Paste from Authentication > Users",
            value: existing ? existing._id : "",
            hint: existing ? "UID cannot be changed." : "" },
          { name: "name", label: "Display Name", required: true, value: existing ? existing.name : "" },
          { name: "role", label: "Role", type: "select", value: existing ? existing.role : "admin",
            options: [
              { value: "owner",     label: "owner" },
              { value: "admin",     label: "admin" },
              { value: "moderator", label: "moderator" },
              { value: "editor",    label: "editor" }
            ] },
          { name: "status", label: "Status", type: "select", value: existing ? existing.status : "active",
            options: [
              { value: "active",   label: "active" },
              { value: "inactive", label: "inactive" }
            ] }
        ],
        onSubmit: (d) => {
          const uid = (d._uid || "").trim();
          if (!uid) { toast("UID required.", "error"); return; }
          window.db.ref("admins/" + uid).set({
            name: d.name, role: d.role, status: d.status
          }).then(() => { toast(existing ? "Updated." : "Added.", "success"); closeModal(); })
            .catch(e => toast("Failed: " + e.message, "error"));
        }
      });
    }
    add.addEventListener("click", () => openForm(null));

    activeRef = window.db.ref("admins");
    activeRef.on("value", s => {
      const v = s.val() || {};
      const list = Object.keys(v).map(k => Object.assign({ _id: k }, v[k]));
      clear(host);
      if (!list.length) { host.appendChild(emptyBlock("No admins yet")); return; }
      const rows = list.map(a => {
        const tr = el("tr");
        tr.appendChild(td("UID", a._id));
        tr.appendChild(td("Name", a.name || "-"));
        tr.appendChild(td("Role", a.role || "-"));
        tr.appendChild(td("Status", badge(a.status || "inactive", a.status === "active" ? "success" : "muted")));
        const acts = el("div", { class: "table__actions" });
        const ed = el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Edit" });
        ed.addEventListener("click", () => openForm(a));
        acts.appendChild(ed);
        if (a._id === currentUser.uid) {
          acts.appendChild(el("span", { class: "badge badge--muted", text: "you" }));
        } else {
          const dl = el("button", { class: "btn btn--danger btn--sm", type: "button", text: "Remove" });
          dl.addEventListener("click", () => askConfirm('Remove admin "' + (a.name || a._id) + '"?', () => {
            window.db.ref("admins/" + a._id).remove().then(() => toast("Removed.", "success"));
          }));
          acts.appendChild(dl);
        }
        tr.appendChild(td("Actions", acts));
        return tr;
      });
      host.appendChild(tableWrap(["UID", "Name", "Role", "Status", "Actions"], rows));
    });
  }

  /* -------- Boot -------- */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
