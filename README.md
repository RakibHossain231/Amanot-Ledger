# আমানত লেজার (Amanot Ledger)
> **Smart Money & Person-based Ledger Management System**
> Production-Ready, Mobile-First, Offline-First Progressive Web Application (PWA).

---

## 📖 ১. প্রকল্পের পরিচিতি (Project Overview)
**আমানত লেজার (Amanot Ledger)** কোনো সাধারণ খরচ ট্র্যাকার নয়। এটি মূলত একটি ব্যক্তিভিত্তিক আমানত ও লেনদেন হিসাবের খাতা। বিভিন্ন মানুষ যখন আপনার কাছে টাকা জমা রাখে (আমানত) এবং প্রয়োজনের সময় আপনি তাদের টাকা ফেরত বা ঋণ দেন, এই অ্যাপটি স্বয়ংক্রিয়ভাবে হিসাব রাখে—কার কত টাকা আপনার কাছে জমা আছে অথবা আপনি কার কাছে কত টাকা পাবেন।

### কোর অ্যাকাউন্টিং নিয়ম:
* **জমা / Credit (+):** কোনো ব্যক্তি আপনাকে টাকা দিলে (আমানত বৃদ্ধি পায়, ব্যালেন্স সবুজ দেখায়)।
* **প্রদান / Debit (−):** আপনি ব্যক্তিকে টাকা ফেরত দিলে বা ঋণ দিলে (ব্যালেন্স কমে, লাল দেখায়)।
* **ব্যালেন্স সূত্র:** `ব্যালেন্স = মোট জমা (Credit) − মোট প্রদান (Debit)`
  * **পজিটিভ (+):** ওই ব্যক্তির টাকা আপনার কাছে আমানত হিসেবে জমা আছে।
  * **নেগেটিভ (−):** আপনি ওই ব্যক্তির কাছে টাকা পাবেন (Receivable)।
  * **শূন্য (০):** দেনা-পাওনা সমান (Settled)।

---

## 🛠️ ২. ব্যবহৃত প্রযুক্তি (Tech Stack)
* **Frontend:** React + JavaScript (Vite 6)
* **UI & Styling:** Tailwind CSS, Lucide Icons, Hind Siliguri (Bengali Unicode Font)
* **Local Database (Offline-first):** IndexedDB via Dexie.js
* **Cloud Database & Auth:** Supabase PostgreSQL with Row Level Security (RLS)
* **Hosting:** Cloudflare Pages (Free Tier)
* **PWA:** Service Worker & Web App Manifest via `vite-plugin-pwa`
* **Reports Export:** jsPDF (with high-res Bengali canvas engine) & ExcelJS
* **Test Suite:** Vitest

---

## 🚀 ৩. লোকাল ডেভেলপমেন্ট রান করার নিয়ম

### ১. ডিপেন্ডেন্সি ইনস্টল ও লোকাল সার্ভার চালু:
```powershell
npm install
npm run dev
```
ব্রাউজারে ওপেন করুন: `http://localhost:5173`

### ২. প্রোডাকশন বিল্ড তৈরি:
```powershell
npm run build
```

### ৩. স্বয়ংক্রিয় অ্যাকাউন্টিং টেস্ট রান করা:
```powershell
npm test
```

---

## ☁️ ৪. ক্লাউড ডিপ্লয়মেন্ট গাইড (Cloudflare Pages - Free Tier)

1. আপনার গিট রিপোজিটোরি গিটহাবে পুশ করুন:
   ```powershell
   git remote add origin https://github.com/your-username/amanot-ledger.git
   git push -u origin master
   ```
2. **Cloudflare Dashboard**-এ লগইন করুন -> **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git** সিলেক্ট করুন।
3. আপনার রিপোজিটোরি সিলেক্ট করে নিচের সেটিংস দিন:
   * **Framework preset:** `Vite`
   * **Build command:** `npm run build`
   * **Build output directory:** `dist`
4. **Save and Deploy** এ ক্লিক করুন। ১ মিনিটের মধ্যে আপনার আমানত লেজার লাইভ হয়ে যাবে!
*(নোট: `public/_redirects` ফাইলটি অলরেডি কনফিগার করা আছে, ফলে পেজ রিফ্রেশ দিলেও 404 আসবে না।)*

---

## 🗄️ ৫. Supabase ক্লাউড ডেটাবেজ সেটআপ (ঐচ্ছিক সিঙ্ক)

অ্যাপটি ইন্টারনেট ছাড়াও ১০০% লোকাল অফলাইন ডেটাবেজে (IndexedDB) সম্পূর্ণ কাজ করে। আপনি যদি একাধিক ডিভাইসে ডাটা সিঙ্ক করতে চান:

1. [Supabase](https://supabase.com)-এ ফ্রি প্রজেক্ট তৈরি করুন।
2. **SQL Editor**-এ গিয়ে `supabase/migrations/20261120_initial_schema.sql` ফাইলের কোড রান করুন।
3. প্রজেক্টের রুট ডিরেক্টরিতে `.env` ফাইলে আপনার কী বসিয়ে দিন:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
4. **ফ্রি টিয়ার লিমিট:**
   * Supabase ফ্রি টিয়ারে ৫০০ MB ডেটাবেজ ও ৫০,০০০ মাসিক অ্যাক্টিভ ইউজার সাপোর্ট করে, যা ব্যক্তিগত ও মাঝারি ব্যবসার জন্য আজীবনের জন্য যথেষ্ট।

---

## 📱 ৬. মোবাইল ফোনে ইনস্টল (PWA Install)
1. মোবাইল ব্রাউজারে (Chrome / Safari) আপনার ডিপ্লয় করা সাইট ওপেন করুন।
2. ব্রাউজারের থ্রি-ডট মেনু চাপুন -> **"Add to Home screen"** বা **"Install app"** সিলেক্ট করুন।
3. আপনার ফোনে আমানত লেজার একটি নেটিভ অ্যাপের মতো পার্পল আইকন সহ ইনস্টল হয়ে যাবে এবং কোনো ইন্টারনেট ছাড়াই অফলাইনে চলবে!
