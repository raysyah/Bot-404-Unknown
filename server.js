require("dotenv").config();

const express = require("express");
const products = require("./products");

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = Number(process.env.PORT || 3000);
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || "v23.0";
const ADMIN_NUMBER = (process.env.ADMIN_WHATSAPP_NUMBER || "").replace(/\D/g, "");
const STORE_NAME = process.env.STORE_NAME || "Moon Light Store";
const ADMIN_CONTACT_TEXT = process.env.ADMIN_CONTACT_TEXT || "Silakan hubungi admin untuk dibantu lebih lanjut.";
const PAYMENT_INSTRUCTIONS = process.env.PAYMENT_INSTRUCTIONS ||
  "Hubungi admin untuk mendapatkan instruksi pembayaran resmi. Pembayaran akan diperiksa manual.";

app.get("/", (_req, res) => {
  res.status(200).send(`${escapeHtml(STORE_NAME)} bot server aktif. Webhook: /webhook`);
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "moon-light-store-whatsapp-bot" });
});

// Meta memakai GET untuk verifikasi webhook.
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token && token === VERIFY_TOKEN) {
    return res.status(200).send(String(challenge || ""));
  }
  return res.sendStatus(403);
});

// Meta mengirim pesan masuk ke endpoint ini.
app.post("/webhook", async (req, res) => {
  // Balas cepat agar webhook tidak dianggap gagal oleh Meta.
  res.sendStatus(200);

  try {
    const body = req.body;
    if (body.object !== "whatsapp_business_account") return;

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        for (const message of value.messages || []) {
          if (!message.from || message.type !== "text") continue;
          const text = (message.text?.body || "").trim();
          if (text) await handleIncomingMessage(message.from, text);
        }
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err.message);
  }
});

function menuText() {
  return [
    `🌙 *${STORE_NAME}*`,
    "Selamat datang! Toko Roblox, top up game, dan produk digital.",
    "",
    "Pilih menu dengan membalas angka:",
    "1. Semua katalog",
    "2. Roblox / Robux / Gamepass",
    "3. Top up game",
    "4. Aplikasi premium",
    "5. Voucher & produk digital",
    "6. Cara pemesanan",
    "7. Pembayaran",
    "8. Hubungi admin",
    "9. Format order",
    "",
    "Ketik MENU untuk kembali ke menu utama.",
    "Untuk memilih produk, kirim kode produk, misalnya RBLX atau MLBB."
  ].join("\n");
}

function catalogText(category = null) {
  const list = category ? products.filter(p => p.category === category) : products;
  if (!list.length) return "Produk untuk kategori ini belum tersedia. Hubungi admin untuk informasi lebih lanjut.";

  const lines = [category ? `🛍️ *KATALOG ${category.toUpperCase()}*` : `🛍️ *KATALOG ${STORE_NAME.toUpperCase()}*`, ""];
  let currentCategory = "";
  for (const p of list) {
    if (!category && p.category !== currentCategory) {
      currentCategory = p.category;
      lines.push(`\n— *${currentCategory}* —`);
    }
    lines.push(`*${p.name}* [${p.code}]`);
    lines.push(`Harga: ${p.price}`);
    lines.push(`Info: ${p.note}`);
    lines.push("");
  }
  lines.push("Harga/stok perlu dikonfirmasi admin sebelum pembayaran.");
  lines.push("Kirim kode produk untuk meminta detail atau ketik 9 untuk format order.");
  return lines.join("\n");
}

function orderFormatText(product = null) {
  return [
    "🧾 *FORMAT ORDER*",
    "Salin, isi, lalu kirim kembali dengan awalan ORDER:",
    "",
    "ORDER",
    `Produk: ${product ? product.name : ""}`,
    "Nominal/paket:",
    "Player ID / detail yang diperlukan:",
    "Nama pemesan:",
    "Catatan:",
    "",
    "Admin akan mengonfirmasi harga dan stok sebelum pembayaran.",
    "Jangan pernah kirim password, PIN, kode OTP, atau data login akun."
  ].join("\n");
}

function findProductByCode(input) {
  const code = input.trim().toUpperCase();
  return products.find(p => p.code === code);
}

async function handleIncomingMessage(from, rawText) {
  const normalized = rawText.trim().toLowerCase();

  if (["menu", "halo", "hai", "hello", "hi", "start", "assalamualaikum"].includes(normalized)) {
    return sendText(from, menuText());
  }

  if (["1", "katalog", "produk", "semua produk"].includes(normalized)) {
    return sendText(from, catalogText());
  }
  if (normalized === "2" || normalized.includes("roblox") || normalized === "robux") {
    return sendText(from, catalogText("Roblox"));
  }
  if (normalized === "3" || normalized === "topup" || normalized === "top up" || normalized === "game") {
    return sendText(from, catalogText("Top Up Game"));
  }
  if (normalized === "4" || normalized.includes("premium") || normalized === "apk") {
    return sendText(from, [
      catalogText("Aplikasi Premium"),
      "",
      "Catatan: Moon Light Store hanya boleh menjual akses/langganan yang sah. Kami tidak menyediakan APK mod/crack atau akses tanpa izin."
    ].join("\n"));
  }
  if (normalized === "5" || normalized.includes("voucher") || normalized === "digital") {
    return sendText(from, catalogText("Voucher & Digital"));
  }

  if (normalized === "6" || normalized === "cara order" || normalized === "pemesanan") {
    return sendText(from, [
      "📦 *CARA PEMESANAN*",
      "1. Pilih kategori lewat menu 2–5 atau lihat katalog lewat menu 1.",
      "2. Kirim kode produk, misalnya RBLX atau MLBB.",
      "3. Isi format order yang diberikan bot.",
      "4. Admin memeriksa detail, harga, dan ketersediaan.",
      "5. Minta instruksi pembayaran resmi dari admin.",
      "6. Admin memeriksa pembayaran secara manual dan mengabarkan status pesanan.",
      "",
      "Jangan memberikan password akun, PIN, atau OTP."
    ].join("\n"));
  }

  if (normalized === "7" || normalized === "pembayaran" || normalized === "bayar") {
    return sendText(from, [
      "💳 *INFORMASI PEMBAYARAN*",
      PAYMENT_INSTRUCTIONS,
      "",
      "Pastikan nama penerima dan nominal sesuai konfirmasi admin.",
      "Bot tidak memverifikasi pembayaran secara otomatis."
    ].join("\n"));
  }

  if (normalized === "8" || normalized === "admin" || normalized === "cs") {
    return sendText(from, [
      "👨‍💻 *HUBUNGI ADMIN*",
      ADMIN_CONTACT_TEXT,
      ADMIN_NUMBER ? `Nomor admin: ${ADMIN_NUMBER}` : "Nomor admin belum dikonfigurasi.",
      "",
      "Ketik MENU untuk kembali."
    ].join("\n"));
  }

  if (normalized === "9" || normalized === "order" || normalized === "format order") {
    return sendText(from, orderFormatText());
  }

  // Pesanan pelanggan dikirim dengan awalan ORDER pada baris pertama.
  if (normalized.startsWith("order\n") || normalized.startsWith("order ")) {
    if (ADMIN_NUMBER) {
      const adminText = [
        `📥 *ORDER BARU — ${STORE_NAME}*`,
        `Nomor pelanggan: ${from}`,
        "",
        rawText,
        "",
        "Periksa detail, konfirmasi harga/stok, dan hubungi pelanggan manual."
      ].join("\n");
      await sendText(ADMIN_NUMBER, adminText);
    }

    return sendText(from, [
      "Terima kasih, detail order sudah diterima oleh bot.",
      ADMIN_NUMBER
        ? "Permintaan sudah diteruskan ke nomor admin yang dikonfigurasi. Admin akan memeriksa detailnya."
        : "Nomor admin belum dikonfigurasi, jadi pesanan belum diteruskan. Silakan hubungi admin toko.",
      "",
      "Ini bukan konfirmasi pembayaran dan belum menjamin stok tersedia."
    ].join("\n"));
  }

  // Memungkinkan pelanggan mengirim kode produk, seperti RBLX, FF, CANVA.
  const product = findProductByCode(rawText);
  if (product) {
    return sendText(from, [
      `🛒 *${product.name}*`,
      `Kode: ${product.code}`,
      `Kategori: ${product.category}`,
      `Harga: ${product.price}`,
      `Info: ${product.note}`,
      "",
      "Untuk memesan, balas dengan:",
      `ORDER`,
      `Produk: ${product.name}`,
      "Nominal/paket:",
      "Player ID / detail yang diperlukan:",
      "Nama pemesan:",
      "Catatan:",
      "",
      "Admin akan mengonfirmasi harga dan ketersediaan."
    ].join("\n"));
  }

  return sendText(from, [
    "Maaf, pilihan belum dikenali.",
    "Ketik MENU untuk melihat menu, atau kirim kode produk dari katalog."
  ].join("\n"));
}

async function sendText(to, text) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.error("Missing WHATSAPP_ACCESS_TOKEN or PHONE_NUMBER_ID.");
    return;
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${PHONE_NUMBER_ID}/messages`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body: text }
    })
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("WhatsApp API error:", response.status, JSON.stringify(result));
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

app.listen(PORT, () => {
  console.log(`${STORE_NAME} bot listening on port ${PORT}`);
});
