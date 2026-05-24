# Sistem Semakan Penghantaran Tugasan Murid

Aplikasi web ringkas untuk guru merekod penghantaran buku kerja atau tugasan murid, mengira mata terkumpul, dan memaparkan dashboard rekod untuk analisis serta cetakan.

## Fungsi Utama

- Dropdown kelas dan nama murid diambil daripada Google Sheet.
- Dropdown subjek diambil daripada Google Sheet.
- Rekod penghantaran murid:
  - Hantar + Lengkap: 3 mata
  - Hantar + Tidak Lengkap: 1 mata
  - Tidak Hantar + Tidak Hadir: 0 mata
  - Tidak Hantar + Tiada Sebab: -2 mata
- Dashboard rekod dengan tapisan kelas, subjek, julat tarikh dan nama tugasan.
- Kolum tarikh dinamik berdasarkan rekod.
- Warna status penghantaran:
  - Hijau: Lengkap
  - Kuning: Tidak Lengkap
  - Kelabu: Tidak Hadir
  - Merah: Tiada Sebab
- Fungsi cetak laporan dashboard.
- Simpan dan baca semula rekod melalui Google Apps Script.

## Struktur Fail

```text
.
├── index.html
├── README.md
└── apps-script
    └── Code.gs
```

## Cara Publish Di GitHub Pages

1. Buat repository baharu di GitHub.
2. Upload fail `index.html`, `README.md`, dan folder `apps-script`.
3. Pergi ke `Settings > Pages`.
4. Pada bahagian `Build and deployment`, pilih:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Klik `Save`.
6. GitHub akan beri URL laman web selepas beberapa minit.

## Cara Setup Google Apps Script

1. Buka Google Sheet utama.
2. Pergi ke `Extensions > Apps Script`.
3. Padam kod sedia ada dan tampal kandungan daripada `apps-script/Code.gs`.
4. Klik `Save`.
5. Pergi ke `Deploy > Manage deployments`.
6. Klik `Edit`, pilih `New version`, kemudian `Deploy`.
7. Tetapan Web App:
   - Execute as: `Me`
   - Who has access: `Anyone`
8. Salin URL Web App yang berakhir dengan `/exec`.
9. Dalam `index.html`, cari:

```js
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwS5cYslO7saSdEonyTsotqKNBWR3LyOEAmO3E7IHtXujTqLUNl1k3Kzll8h3tb4rez/exec";
```

10. Pastikan URL tersebut ialah URL Web App Apps Script yang betul.

## Google Sheet Sumber Dropdown

Data kelas dan nama murid:

```text
KELAS, NAMA MURID
```

Data subjek:

```text
BIL, SUBJEK
```

Pautan CSV Google Sheet telah dikonfigurasi terus di dalam `index.html` dan `apps-script/Code.gs`.

ID Google Sheet semasa:

```text
1KRewWoEcVYxFvlCgcLDG2UdKRZIHsKsoOi7IvVf8IhY
```

## Nota Penting

- Selepas mengubah `Code.gs`, deploy Apps Script sebagai versi baharu.
- Jika dashboard tidak memaparkan data terkini, refresh laman web.
- Untuk penggunaan sebenar, pastikan Google Sheet sumber dropdown telah dipublish sebagai CSV.
