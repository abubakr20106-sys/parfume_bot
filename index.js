const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

// ===============================
// BOT TOKEN
// ===============================
const token = "8278965358:AAEPvb6vkX7y4BA06QIAUttRZY_1qFJEU3k";
const bot = new TelegramBot(token, { polling: true });

// ===============================
// ADMIN ID — O'ZGARTIRASIZ!!!
// ===============================
const ADMIN_ID = 748927843;

// ===============================
// SAVATLAR
// ===============================
const carts = {};

// ===============================
// API’DAN MAHSULOTLARNI O‘QISH
// ===============================
async function getProducts() {
  try {
    const res = await axios.get("https://web-bot-node-bqye.onrender.com/api/products");
    return res.data;
  } catch (err) {
    console.error("API ERROR:", err.message);
    return [];
  }
}

// ===============================
// /start
// ===============================
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  if (!carts[chatId]) carts[chatId] = [];

  bot.sendMessage(chatId, "Assalomu alaykum! Menyudan tanlang 👇", {
    reply_markup: {
      keyboard: [
        ["🖼 Maxsulotlar", "🛒 Savat"],
        ["🛍 Buyurtma berish", "ℹ️ Biz haqimizda"],
        ["🏠 Manzil", "📞 Biz bilan bog‘lanish"],
      ],
      resize_keyboard: true,
    },
  });
});

// ===============================
// MESSAGE HANDLER
// ===============================
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // 🖼 Maxsulotlar
  if (text === "🖼 Maxsulotlar") {
    const products = await getProducts();

    if (!products.length) {
      return bot.sendMessage(chatId, "❌ API dan mahsulot topilmadi.");
    }

    for (const product of products) {
      await bot.sendPhoto(chatId, product.image, {
        caption: `💎 *${product.name}*\n💰 Narxi: *${product.price} $*\n📄 ${product.description || ""}`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "➕", callback_data: `plus_${product._id}` },
              { text: "➖", callback_data: `minus_${product._id}` },
              { text: "🛒 Qo‘shish", callback_data: `add_${product._id}` },
              { text: "📄 Batafsil", callback_data: `product_${product._id}` },
            ],
          ],
        },
      });
    }
  }

  // 🛒 Savat
  else if (text === "🛒 Savat") {
    const cart = carts[chatId] || [];
    if (!cart.length) return bot.sendMessage(chatId, "Savat bo‘sh 🛒");

    let txt = "🛒 **Savatdagi mahsulotlar:**\n\n";

    cart.forEach((item) => {
      const total = item.price * item.count;
      txt += `*${item.name}*\n💵 Narxi: ${item.price} $\n🔢 Soni: ${item.count}\n📦 Umumiy: *${total} $*\n\n`;
    });

    bot.sendMessage(chatId, txt, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🧹 Savatni tozalash", callback_data: "clear" }],
          [{ text: "🛍 Buyurtma berish", callback_data: "order" }],
        ],
      },
    });
  }

  // ℹ️ Biz haqimizda
  else if (text === "ℹ️ Biz haqimizda") {
    bot.sendMessage(
      chatId,
      "Namangan Parfume — Namangan shahridagi zamonaviy va sifatli parfyumeriya do‘koni.✨"
    );
  }

  // Manzil
  else if (text === "🏠 Manzil") {
    bot.sendMessage(chatId, "📍 Manzil: Namangan shahar, XYZ ko‘chasi, 123-uy");
  }

  // Kontakt
  else if (text === "📞 Biz bilan bog‘lanish") {
    bot.sendMessage(chatId, "Telefon: +998 90 753 50 08");
  }

  // =================================
  // BUYURTMA — ISM
  // =================================
  if (carts[chatId]?.step === "name") {
    carts[chatId].order.name = text;
    carts[chatId].step = "phone";

    return bot.sendMessage(chatId, "📞 Telefon raqamingizni kiriting:");
  }

  // =================================
  // BUYURTMA — TELEFON
  // =================================
  if (carts[chatId]?.step === "phone") {
    carts[chatId].order.phone = text;
    carts[chatId].step = "location";

    return bot.sendMessage(chatId, "📍 Lokatsiya yuboring:", {
      reply_markup: {
        keyboard: [
          [{ text: "📍 Lokatsiya yuborish", request_location: true }]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    });
  }

  // =================================
  // BUYURTMA — LOKATSIYA
  // =================================
  if (msg.location && carts[chatId]?.step === "location") {
    carts[chatId].order.location = msg.location;
    carts[chatId].step = "confirm";

    return bot.sendMessage(chatId, "✔️ Buyurtmani tasdiqlaysizmi?", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Tasdiqlash ✅", callback_data: "confirm_order" }],
          [{ text: "Bekor qilish ❌", callback_data: "cancel_order" }],
        ],
      },
    });
  }
});

// ===============================
// CALLBACK HANDLER
// ===============================
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  const products = await getProducts();
  if (!products.length) return;

  if (!carts[chatId]) carts[chatId] = [];
  const cart = carts[chatId];

  // 🛒 Savatga qo‘shish
  if (data.startsWith("add_")) {
    const id = data.split("_")[1];
    const product = products.find((p) => p._id == id);

    const exists = cart.find((i) => i._id == id);
    if (exists) exists.count++;
    else cart.push({ ...product, count: 1 });

    carts[chatId] = cart;

    return bot.answerCallbackQuery(query.id, {
      text: "🛒 Savatga qo‘shildi!",
    });
  }

  // ➕ Soni oshirish
  if (data.startsWith("plus_")) {
    const id = data.split("_")[1];
    const item = cart.find((i) => i._id == id);
    if (!item) return;

    item.count++;
    carts[chatId] = cart;

    return bot.answerCallbackQuery(query.id, {
      text: `➕ +1 qo‘shildi (${item.count} ta)`,
    });
  }

  // ➖ Soni kamaytirish
  if (data.startsWith("minus_")) {
    const id = data.split("_")[1];
    const item = cart.find((i) => i._id == id);
    if (!item) return;

    if (item.count > 1) {
      item.count--;
      bot.answerCallbackQuery(query.id, {
        text: `➖ -1 kamaydi (${item.count} ta)`,
      });
    } else {
      cart.splice(cart.indexOf(item), 1);
      bot.answerCallbackQuery(query.id, { text: "❌ Savatdan o‘chirildi" });
    }

    carts[chatId] = cart;
  }

  // 📄 Batafsil
  if (data.startsWith("product_")) {
    const id = data.split("_")[1];
    const p = products.find((i) => i._id == id);

    return bot.sendPhoto(chatId, p.image, {
      caption: `💎 *${p.name}*\n💰 Narxi: *${p.price} $*\n📄 ${p.description || ""}`,
      parse_mode: "Markdown",
    });
  }

  // 🛍 Buyurtma berish
  if (data === "order") {
    if (!cart.length)
      return bot.answerCallbackQuery(query.id, { text: "Savat bo‘sh!" });

    carts[chatId].step = "name";
    carts[chatId].order = {}; 

    bot.answerCallbackQuery(query.id);
    bot.sendMessage(chatId, "✍️ Ismingizni kiriting:");
  }

  // ✔️ Buyurtma tasdiqlash
  if (data === "confirm_order") {
    const order = carts[chatId].order;
    let total = 0;
    let textAdmin = "🛍 *Yangi Buyurtma!*\n\n";

    textAdmin += `👤 Ism: *${order.name}*\n`;
    textAdmin += `📞 Tel: *${order.phone}*\n`;
    textAdmin += `📍 Lokatsiya: https://maps.google.com/?q=${order.location.latitude},${order.location.longitude}\n\n`;
    textAdmin += "📦 *Mahsulotlar:*\n";

    cart.forEach((item) => {
      if (item.name) {
        const sum = item.price * item.count;
        total += sum;
        textAdmin += `• ${item.name} — ${item.count} dona — ${sum} $\n`;
      }
    });

    textAdmin += `\n💰 *Jami: ${total} $*`;

    bot.sendMessage(ADMIN_ID, textAdmin, { parse_mode: "Markdown" });
    bot.sendMessage(chatId, "✅ Buyurtma tasdiqlandi! Operator tez orada aloqaga chiqadi.");

    carts[chatId] = [];
  }

  // ❌ Buyurtma bekor qilish
  if (data === "cancel_order") {
    carts[chatId] = [];
    return bot.sendMessage(chatId, "❌ Buyurtma bekor qilindi.");
  }

  // 🧹 Savatni tozalash
  if (data === "clear") {
    carts[chatId] = [];
    bot.answerCallbackQuery(query.id, { text: "Savat tozalandi!" });
    bot.sendMessage(chatId, "🛒 Savat bo‘sh");
  }
});
