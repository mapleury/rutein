<div align="center">

  # RUTEIN
  ### Navigasi transportasi publik, tanpa ribet.

  [![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_Site-success?style=for-the-badge)](https://[URL_DEMO])
  [![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://[URL_REPO])
  [![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

  **Submission for ITECHNO CUP 2026 - Web Development**

  **By Tim CEO, CTO, CMO**

</div>

---

## Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur Unggulan](#-fitur-unggulan)
- [Demo & Screenshot](#-demo--screenshot)
- [Teknologi](#-teknologi)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Instalasi & Setup](#-instalasi--setup)
- [Penggunaan](#-penggunaan)
- [Pembagian Tugas Tim](#-pembagian-tugas-tim)
- [Progress & To-Do](#-progress--to-do)
- [Lisensi](#-lisensi)

---

## Tim Developer

| Nama | Peran | GitHub |
|------|-------|--------|
| **Quan** | Backend Developer & System Architect | [GitHub](https://github.com/mapleury) |
| **Syakir** | Frontend Developer & UI/UX Designer | [GitHub](https://github.com/syakirahh8) |
| **Nael** | Frontend Developer & UI/UX Designer | [GitHub](https://github.com/nnaelmuna) |

---

## Tentang Proyek

### Latar Belakang

Menggunakan transportasi publik di kota-kota besar Indonesia seperti Jakarta sering kali membingungkan. Ada banyak moda transportasi yang tersedia — TransJakarta, MRT, LRT, KRL, bus kota, hingga ojek online — namun tidak ada satu platform yang memudahkan pengguna untuk membandingkan waktu tempuh, biaya, dan jumlah transit dari semua moda tersebut sekaligus. Ditambah lagi, informasi gangguan lalu lintas dan jadwal keberangkatan seringkali tersebar di berbagai sumber yang tidak terintegrasi, membuat perencanaan perjalanan menjadi tidak efisien — terutama bagi pengguna baru yang belum familiar dengan rute transportasi di kotanya sendiri.

### Solusi yang Ditawarkan

**RUTEIN** hadir sebagai asisten navigasi transportasi publik yang menggabungkan peta interaktif, perbandingan rute multi-moda, estimasi biaya perjalanan, jadwal keberangkatan, hingga notifikasi gangguan lalu lintas — semuanya dalam satu aplikasi web. Fitur andalan kami, **Confused Mode**, memungkinkan pengguna yang benar-benar bingung untuk cukup bertanya "aku harus naik apa?" atau "aku ada di mana?", dan RUTEIN akan menjawab menggunakan lokasi GPS real-time, data transportasi terdekat, serta rute yang benar-benar terhitung — bukan sekadar jawaban generik.

### Tujuan Proyek

- **Tujuan Utama**: Membuat perjalanan dengan transportasi publik lebih terencana, transparan, dan mudah dipahami.
- **Target Pengguna**: Warga urban (khususnya Jabodetabek) yang menggunakan transportasi publik untuk aktivitas sehari-hari — pelajar, pekerja, hingga pendatang baru.
- **Value Proposition**: Perbandingan rute yang logis (efisien, termurah, tercepat), data transportasi Indonesia yang terkurasi secara nyata, serta asisten AI kontekstual yang memahami lokasi dan situasi pengguna secara real-time.

---

## Fitur Unggulan

### Fitur Utama

| Fitur | Deskripsi | Keunggulan |
|----------|--------------|---------------|
| **Peta Interaktif** | Peta berbasis MapLibre dengan lapisan halte/stasiun, filter per moda transportasi, mode satelit, dan street-level view. | Semua titik transportasi publik Indonesia tervisualisasi dalam satu peta yang bisa diklik langsung. |
| **Route Comparison** | Membandingkan 3 pendekatan perjalanan: *Efficient*, *Cheapest*, dan *Hurry*. | Pengguna bisa memilih rute sesuai prioritas mereka — waktu, biaya, atau kenyamanan. |
| **Multi-Transit Routing** | Menggabungkan berjalan kaki, bus, TransJakarta, MRT, LRT, KRL, dan ojek online dalam satu rencana perjalanan. | Rute dihitung sebagai satu perjalanan utuh, bukan per moda terpisah. |
| **Confused Mode** | Chat assistant berbasis AI yang memakai lokasi GPS, tempat & transportasi terdekat, serta rute yang benar-benar dihitung. | Jawaban AI tidak "mengarang" — semua angka berasal dari data lokasi dan mesin rute yang nyata. |

### Fitur Tambahan

- **Budget Planner** - Menghitung estimasi biaya transportasi harian/mingguan/bulanan berdasarkan rute favorit, dan menyimpannya sebagai portofolio anggaran.
- **Transport Schedule** - Menampilkan jadwal keberangkatan per stasiun/halte, lengkap dengan status *on time*, *delayed*, atau *cancelled*.
- **Live Disruption Alerts** - Informasi gangguan lalu lintas aktif (banjir, kemacetan, kecelakaan, kebijakan rekayasa lalu lintas) lengkap dengan tingkat keparahan.
- **Live GPS Tracking** - Melacak posisi pengguna secara real-time selama perjalanan berlangsung dan mendeteksi kedatangan di setiap titik pemberhentian.
- **Street-Level View** - Melihat kondisi jalan/lokasi dari sudut pandang jalanan langsung di peta menggunakan citra Mapillary.
- **Saved Places & Preferences** - Menyimpan lokasi favorit (Rumah, Sekolah, Kantor) serta preferensi moda transportasi untuk mempercepat perencanaan rute berikutnya.

---

## 📸 Demo & Screenshot

### Live Demo

🔗 **[Kunjungi Website](https://[URL_DEMO])**

### Screenshot Aplikasi

<div align="center">
  <img src="[URL_SCREENSHOT_LANDING]" alt="Landing Page" width="800"/>
  <p><em>Landing Page - Perkenalan RUTEIN</em></p>

  <img src="[URL_SCREENSHOT_DASHBOARD]" alt="Dashboard" width="800"/>
  <p><em>Dashboard - Titik awal perencanaan perjalanan</em></p>

  <img src="[URL_SCREENSHOT_MAP]" alt="Interactive Map" width="800"/>
  <p><em>Peta Interaktif - Filter transportasi, mode satelit, dan street view</em></p>

  <img src="[URL_SCREENSHOT_ROUTES]" alt="Route Comparison" width="800"/>
  <p><em>Route Comparison - Efficient, Cheapest, dan Hurry</em></p>

  <img src="[URL_SCREENSHOT_CONFUSED]" alt="Confused Mode" width="800"/>
  <p><em>Confused Mode - Asisten navigasi berbasis AI</em></p>
</div>

### Video Demo

📹 **[Link Video Demo](https://[URL_VIDEO])** _(opsional)_

---

## 🛠️ Teknologi

### Tech Stack

#### Frontend
```
Framework    : React 18 + TypeScript (Vite)
Routing      : React Router DOM
UI/Design    : Design System kustom (CSS variables & komponen sendiri) — dibangun sendiri oleh tim, tanpa UI library pihak ketiga
Icons        : lucide-react
Peta         : MapLibre GL JS + react-map-gl, Leaflet & react-leaflet (live GPS tracking)
Street View  : mapillary-js
```

#### Backend & Data
```
BaaS         : Supabase (PostgreSQL, Auth, Edge Functions)
AI Assistant : Supabase Edge Function (Confused Mode chat)
Geocoding    : Nominatim (OpenStreetMap)
Peta Dasar   : OpenFreeMap (vector tiles), Esri World Imagery (mode satelit)
Data Transit : Dataset transportasi publik Indonesia yang dikurasi manual (TransJakarta, MRT, LRT, KRL, kereta antarkota, feri, terminal)
```

#### DevOps & Tools
```
Build Tool   : Vite
Deployment   : [Vercel / Netlify / dll — sesuaikan]
Version Ctrl : Git & GitHub
```

### Alasan Pemilihan Teknologi

| Teknologi | Alasan Pemilihan |
|-----------|------------------|
| **React + TypeScript** | Memberikan struktur komponen yang jelas dan type-safety untuk data rute, jadwal, dan lokasi yang kompleks. |
| **Supabase** | Menyediakan Auth, database Postgres, dan Edge Functions dalam satu platform tanpa perlu membangun backend terpisah dari nol. |
| **MapLibre GL + OpenFreeMap** | Rendering peta vektor yang ringan, open-source, dan tidak bergantung pada API key berbayar seperti Google Maps. |
| **Design System kustom** | Karena tampilan RUTEIN dirancang sepenuhnya oleh tim sendiri, kami membangun token warna, tipografi, dan komponen UI sendiri agar identitas visual RUTEIN konsisten di seluruh halaman. |

### Dependencies Utama

```json
{
  "dependencies": {
    "react": "^18.x.x",
    "react-dom": "^18.x.x",
    "react-router-dom": "^6.x.x",
    "@supabase/supabase-js": "^2.x.x",
    "maplibre-gl": "^4.x.x",
    "react-map-gl": "^7.x.x",
    "leaflet": "^1.x.x",
    "react-leaflet": "^4.x.x",
    "mapillary-js": "^4.x.x",
    "lucide-react": "^0.x.x"
  }
}
```

---

## Arsitektur Sistem

### System Architecture

```
[Browser / React SPA]
        │
        ├── PlaceSearchInput / MapPage  ──►  Nominatim (Geocoding & Reverse Geocoding)
        ├── MapPage                     ──►  OpenFreeMap (tiles) / Esri (satellite)
        ├── StreetViewModal             ──►  Mapillary API (street-level imagery)
        ├── ConfusedMode                ──►  Supabase Edge Function ──►  AI Model
        └── Auth / Data (Places, Budget,
            Preferences, Disruptions)   ──►  Supabase (Postgres + Auth)
```

### Folder Structure

```
project-root/
├── src/
│   ├── components/     # Komponen UI yang dapat dipakai ulang (NavBar, PlaceSearchInput, dsb.)
│   ├── pages/           # Halaman aplikasi (Dashboard, MapPage, RouteComparison, dsb.)
│   ├── hooks/           # Custom hooks (lokasi, geocoding, nearby context, dsb.)
│   ├── services/        # Pemanggilan API/Supabase (routeService, geocodingService, dsb.)
│   ├── lib/              # Fungsi murni pembantu (pembangun konteks AI, deteksi intent, dsb.)
│   ├── contexts/        # React Context (AuthContext)
│   ├── data/             # Dataset statis yang dikurasi (transportasi & gangguan lalu lintas Indonesia)
│   ├── types/            # Definisi TypeScript
│   └── assets/           # Ilustrasi & aset visual landing page
└── public/               # Aset statis
```

---

## Instalasi & Setup

### Prerequisites

Pastikan Anda telah menginstall:
- **Node.js** (v18.x atau lebih tinggi)
- **npm** / **yarn** / **pnpm**
- Akun **Supabase** (untuk Auth, database, dan Edge Function Confused Mode)
- **Git**

### Langkah Instalasi

#### 1. Clone Repository

```bash
git clone https://github.com/[username]/rutein.git
cd rutein
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Setup Environment Variables

Buat file `.env` di root directory:

```env
# Supabase
VITE_SUPABASE_URL="[url_project_supabase_anda]"
VITE_SUPABASE_ANON_KEY="[anon_key_supabase_anda]"

# Peta
VITE_MAP_STYLE="positron"

# Street View (opsional — dapatkan token gratis di mapillary.com)
VITE_MAPILLARY_TOKEN="[token_mapillary_anda]"
```

#### 4. Setup Database

Jalankan skema tabel Supabase Anda (auth, saved_places, budget_plans, user_preferences, transport_stops, transport_routes, disruptions, dsb.) sesuai migrasi proyek, lalu deploy Edge Function untuk **Confused Mode** melalui Supabase CLI.

#### 5. Run Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173` (port default Vite).

---

## Penggunaan

### Menjalankan Aplikasi

```bash
# Development mode
npm run dev

# Production build
npm run build
npm run preview

# Linting
npm run lint
```

### User Guide Singkat

1. **Masuk/Daftar**: Buat akun untuk menyimpan preferensi dan tempat favorit.
2. **Cari Tujuan**: Gunakan kotak pencarian di Dashboard untuk memilih ke mana Anda pergi.
3. **Bandingkan Rute**: Pilih dari tiga opsi — *Efficient*, *Cheapest*, atau *Hurry* — di halaman Route Comparison.
4. **Lacak Perjalanan**: Aktifkan pelacakan langsung dari halaman Route Detail untuk memandu Anda sampai tujuan.
5. **Bingung mau naik apa?**: Buka **Confused Mode** dan tanyakan langsung — RUTEIN akan menjawab berdasarkan lokasi Anda saat ini.

---

## Pembagian Tugas Tim

| Anggota | Fitur yang Dikerjakan |
|---------|------------------------|
| **Quan** | Sign Up / Sign In, User Preferences, Profile, Saved Places, Backend & System Architecture, Deployment & Submission |
| **Syakir** | Landing Page, Transport Schedule, Budget Planner, Confused Mode, Tutorial Penggunaan Web |
| **Nael** | Interactive Map, Dashboard, Route Comparison, Multi-Transit Routes, Live Disruption, Design System, App Design Mockup |

---

## Progress & To-Do

- [x] README.md Update — *Quan*
- [ ] Finish Design System — *Nael*
- [ ] App Design Mockup — *Nael*
- [ ] Deployment & Submission — *Quan*
- [ ] Tutorial Cara Menggunakan Web — *Syakir*
- [ ] Code Cleanup (hapus catatan AI & minimalkan error) — *Syakir*

---

## Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE) - lihat file LICENSE untuk detail lebih lanjut.

---

<div align="center">

  **Made proudly by Tim CEO, CTO, CMO for ITECHNO CUP 2026**

</div>