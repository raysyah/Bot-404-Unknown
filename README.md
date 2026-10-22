# Moon Light Store — WhatsApp Store Bot

Node.js + Express + WhatsApp Cloud API resmi Meta. Proyek ini menyediakan menu, katalog kategori, format order, instruksi pembayaran manual, dan notifikasi order ke admin.

## Fitur
- Menu utama dan kategori: Roblox, top up game, aplikasi premium, voucher/produk digital.
- Pelanggan dapat mengirim kode produk seperti `RBLX`, `MLBB`, `FF`, `CANVA`.
- Format order dan penerusan pesan order ke admin jika nomor admin dikonfigurasi.
- Informasi pembayaran manual; tidak memverifikasi transfer.
- Endpoint health `/health` dan webhook `/webhook`.
- Katalog mudah diedit di `products.js`.

## Penting
- Semua harga katalog default adalah "Konfirmasi ke admin". Edit dengan harga dan stok sebenarnya.
- Jual hanya produk digital/langganan yang kamu berhak distribusikan. Jangan jual APK mod/crack, akun curian, atau akses tanpa izin.
- Jangan pernah meminta password game, PIN, kode OTP, atau data login.
- Proyek awal ini belum memakai database, belum menyimpan riwayat order, belum mengelola stok, dan belum memverifikasi pembayaran.
- Webhook hanya menangani pesan teks. Media, bukti transfer, tombol interaktif, dan status order otomatis belum dibuat.
- Meta dapat mengirim ulang webhook. Untuk produksi, tambahkan database dan deduplikasi berdasarkan `message.id`.

## Persiapan
1. Buat aplikasi di Meta for Developers dan aktifkan WhatsApp Cloud API.
2. Siapkan `WHATSAPP_ACCESS_TOKEN`, `PHONE_NUMBER_ID`, dan nomor uji/bisnis.
3. Buat repository GitHub, lalu upload file proyek tanpa `.env` atau `node_modules`.
4. Deploy repository sebagai Web Service Node.js di Render.

## Build dan start
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/health`

## Environment Variables
Atur di dashboard hosting:
- `VERIFY_TOKEN`: rahasia buatan sendiri untuk verifikasi webhook.
- `WHATSAPP_ACCESS_TOKEN`: token akses Cloud API.
- `PHONE_NUMBER_ID`: Phone Number ID dari Meta.
- `GRAPH_API_VERSION`: versi Graph API yang masih didukung Meta.
- `ADMIN_WHATSAPP_NUMBER`: nomor admin format internasional angka saja, contoh `62812xxxxxxx`.
- `STORE_NAME`: `Moon Light Store`.
- `ADMIN_CONTACT_TEXT`: teks bantuan admin.
- `PAYMENT_INSTRUCTIONS`: instruksi pembayaran manual.

Jangan menyimpan token asli dalam kode atau mengunggahnya ke GitHub.

## Hubungkan webhook
1. Setelah deploy, salin URL HTTPS Render.
2. Di dashboard Meta, atur Callback URL menjadi `https://URL-RENDER-KAMU/webhook`.
3. Isi Verification Token sama persis dengan `VERIFY_TOKEN`.
4. Verifikasi dan subscribe ke field `messages`.
5. Kirim pesan `MENU` ke nomor WhatsApp uji dan coba menu 1–9.

## Keterbatasan hosting gratis
Hosting gratis dapat tidur setelah tidak aktif. Untuk toko yang butuh respons konsisten, pertimbangkan paket hosting berbayar. Patuhi aturan Meta terkait jendela layanan pelanggan, template pesan, dan persetujuan pelanggan.
