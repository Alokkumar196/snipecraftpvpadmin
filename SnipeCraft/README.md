# SnipeCraft Admin Panel

An **external, standalone admin panel** that shares the same Firebase project
and Realtime Database as the public SnipeCraft user app. It deploys on its own
hosting target (different subdomain or different site).

---

## Differences from the user app

| | User App | Admin Panel |
|---|---|---|
| Purpose | Public tournament site | Staff management |
| Deployment | `snipecraft.web.app` | `snipecraft-admin.web.app` (or `admin.snipecraft.gg`) |
| Login | None | Firebase Auth required |
| Data access | Read-only + public registration | Full read/write |
| Folder | `snipecraft/` | `snipecraft-admin/` |
| Firebase | Same project | Same project |

---

## Prerequisites

- Firebase project already set up (see the user app README).
- Realtime Database enabled, rules deployed (see `database.rules.json`).
- At least one admin UID in `admins/{uid}` with `status: "active"`.

---

## Setup

### 1. Configure Firebase

Open `js/firebase.js` and paste the **same** `firebaseConfig` you used in the
user app. Both apps must point to the same project.

### 2. Local development

```bash
python3 -m http.server 5174
# or
npx serve .