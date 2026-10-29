# Habit Tracker

Aplikasi pelacak kebiasaan selama *n* hari, mobile-first dengan bottom navigation dan tema terang/gelap.

- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS v4 + TanStack Query + React Router
- **Backend:** Express 5 + TypeScript + Zod
- **Penyimpanan:** file JSON (lokal) atau Upstash Redis (Vercel, free tier). Dipilih otomatis lewat environment variable.

## Fitur

| Halaman | Isi |
|---|---|
| **Hari Ini** | Tanggal, progress challenge (rantai hari berwarna per tanggal), daftar kegiatan, jumlah berhasil/gagal/belum, catatan harian (simpan otomatis), ringkasan 10 hari terakhir. Tombol ‹ › untuk mengisi hari yang terlewat. |
| **Kalender** | Warna per tanggal sesuai tingkat keberhasilan. Klik tanggal untuk melihat detail. Statistik bulan ini atau seluruh challenge: persentase, hari sempurna, streak, statistik per kegiatan. |
| **Kegiatan** | Tambah, ubah, hapus, dan urutkan kegiatan. Pilih emoji (emoji-mart), centang atau isi jumlah (target + satuan, misalnya 2 L), durasi opsional, jadwal: setiap hari, hari tertentu, atau X kali per minggu. |
| **Pengaturan** | Tema (terang/gelap/sistem), gaya emoji (Apple/Google/Twitter), ubah periode, perpanjang challenge. |

### Aturan penilaian

- Hari yang sudah lewat dan belum dicentang dihitung **gagal**. Hari ini yang belum dicentang dihitung **belum**.
- **Isi jumlah:** berhasil jika nilai ≥ target. Di bawah target pada hari yang sudah lewat dihitung gagal (progres parsial tetap terlihat).
- **Hari tertentu:** kegiatan hanya muncul dan dihitung di hari yang dipilih.
- **X kali per minggu** (Senin–Minggu): setiap hari yang dikerjakan dihitung berhasil, hari yang tidak dikerjakan tidak dihitung gagal. Jika target minggu itu tidak tercapai, dihitung **satu kali gagal di hari Minggu** (atau hari terakhir challenge).
- **Riwayat tetap utuh:** mengubah kegiatan membuat versi baru yang berlaku mulai hari ini. Menghapus kegiatan hanya menyembunyikannya mulai hari ini, sedangkan data lama tetap tercatat.
- Hanya ada satu challenge aktif dan bisa diperpanjang kapan saja tanpa memutus riwayat.
- Pergantian hari mengikuti zona waktu `Asia/Jakarta` (WIB), diatur dengan `APP_TIMEZONE`.

## Menjalankan secara lokal

Prasyarat: **Node.js 20+**.

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173. Buka di HP lewat jaringan yang sama dengan `npm run dev -w client -- --host`.
- API: http://localhost:4000/api. Request `/api` dari Vite otomatis di-proxy ke sini.
- Data tersimpan di `server/data/db.json`. Backup cukup dengan menyalin file ini.

Perintah lain:

```bash
npm run typecheck   # cek TypeScript client + server
npm run build       # build frontend ke client/dist
```

Konfigurasi opsional: salin `server/.env.example` menjadi `server/.env`.

## Deploy ke Vercel (gratis)

Di Vercel, backend berjalan sebagai serverless function sehingga **file JSON tidak bisa disimpan permanen**. Karena itu, versi deploy memakai **Upstash Redis** (free tier).

1. Push folder ini ke repository GitHub.
2. Di [vercel.com](https://vercel.com), pilih **Add New → Project**, lalu import repository tersebut. Root directory biarkan default (root repo). Build settings sudah diatur di `vercel.json`.
3. Buat database Redis gratis, pilih salah satu cara:
   - **Lewat Vercel:** tab **Storage** di project → **Create Database** → pilih **Upstash (Redis)** → plan gratis → hubungkan ke project. Variabel `KV_REST_API_URL` dan `KV_REST_API_TOKEN` akan otomatis ditambahkan.
   - **Lewat [upstash.com](https://upstash.com):** buat database Redis, salin **REST URL** dan **REST Token**, lalu tambahkan di Vercel (**Settings → Environment Variables**) sebagai `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN`.
4. **Redeploy** agar environment variable terbaca.

> Ingin memindahkan data lokal ke cloud? Isi variabel Upstash di `server/.env`, lalu jalankan lokal dan buat ulang challenge. Bisa juga tulis skrip kecil yang membaca `db.json` lalu memanggil `RedisStorage.saveMeta` / `saveDay`.

⚠️ Saat ini belum ada login. Siapa pun yang tahu URL deploy bisa membuka aplikasinya. Jangan bagikan URL tersebut sampai autentikasi ditambahkan.

## Struktur proyek

```
habit-tracker/
├── api/index.ts               # Entry serverless Vercel → Express app
├── vercel.json                # Build frontend + rewrite /api dan SPA
├── server/
│   └── src/
│       ├── app.ts             # Express app (dipakai lokal & Vercel)
│       ├── index.ts           # Server lokal (app.listen)
│       ├── routes.ts          # Endpoint + validasi Zod
│       ├── services/tracker.ts# Logika status harian/mingguan, statistik, streak
│       ├── storage/           # Interface Storage + JsonStorage + RedisStorage
│       ├── lib/date.ts        # Utilitas tanggal (WIB)
│       └── types.ts
└── client/
    └── src/
        ├── pages/             # Hari Ini, Kalender, Kegiatan (+form), Pengaturan
        ├── components/        # BottomNav, HabitRow, DayChain, Sheet, EmojiPicker, ...
        ├── hooks/queries.ts   # TanStack Query (cache + update optimistis)
        └── lib/               # api, types, tanggal, format, preferensi tema/emoji
```

## API

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/meta` | Hari ini, challenge, kegiatan aktif, jenis storage |
| POST | `/api/setup` | `{ startDate, totalDays, useSamples }`, membuat challenge pertama |
| PUT | `/api/challenge` | `{ startDate, totalDays }` |
| POST | `/api/challenge/extend` | `{ days }` |
| POST | `/api/habits` | Kegiatan baru (+ `startFrom` opsional) |
| PUT / DELETE | `/api/habits/:id` | Ubah (versi baru mulai hari ini) / hapus (soft delete) |
| POST | `/api/habits/reorder` | `{ ids: [...] }` |
| GET | `/api/days/:date` | Detail hari + status setiap kegiatan |
| GET | `/api/days?from=&to=` | Ringkasan per hari (kalender, 10 hari terakhir) |
| PATCH | `/api/days/:date/entries/:habitId` | `{ done }` atau `{ value }` |
| PUT | `/api/days/:date/note` | `{ note }` |
| GET | `/api/stats?from=&to=` | Statistik + streak |

## Rencana pengembangan

- **Database cloud lain** (Postgres/MongoDB/Firestore): buat class baru yang mengimplementasikan `Storage` di `server/src/storage/types.ts`, lalu daftarkan di `storage/index.ts`. Service dan frontend tidak perlu diubah.
- **Login/autentikasi:** tambahkan middleware auth di `app.ts`, lalu buat instance storage per user (misalnya `STORAGE_PREFIX` = `user:<id>`). Struktur key Redis sudah disiapkan dengan prefix.
- Gambar emoji dimuat dari CDN jsDelivr (`emoji-datasource-*`). Jika gagal dimuat, otomatis kembali ke emoji bawaan perangkat.
