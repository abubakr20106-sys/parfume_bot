const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

// ===============================
// BOT TOKEN (o'zingizniki bilan almashtiring agar kerak bo'lsa)
// ===============================
const token = "8278965358:AAEPvb6vkX7y4BA06QIAUttRZY_1qFJEU3k";
const bot = new TelegramBot(token, { polling: true });

// ===============================
// Global: foydalanuvchi savatlari
// strukturasi: { [chatId]: [ { _id, name, price, image, count, ... } ] }
// ===============================
const carts = {};

// ===============================
// API’dan mahsulotlarni olish funksiyasi
// ===============================
async function getProducts() {
  try {
    const res = await axios.get("https://web-bot-node-bqye.onrender.com/api/products");
    // API qaytargan formatiga qarab moslashtiring
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("API ERROR:", err.message);
    return [];
  }
}

// yordamchi: ma'lum mahsulot id bo'yicha savatdagi sonini qaytaradi
function getCountFromCart(cart, id) {
  const item = cart.find((i) => String(i._id) === String(id));
  return item ? item.count : 0;
}

// yordamchi: savatni tekstga aylantiradi (umumiy narx bilan)
function cartToText(cart) {
  if (!cart || !cart.length) return "🛒 Savat bo‘sh.";

  let totalAll = 0;
  let txt = "🛒 *Savatdagi mahsulotlar:*\n\n";

  cart.forEach((item, idx) => {
    const total = Number(item.price || 0) * Number(item.count || 0);
    totalAll += total;
    txt += `${idx + 1}. *${item.name || item.title || "Noma'lum"}*\n   💵 Narxi: ${item.price} $\n   🔢 Soni: ${item.count}\n   📦 Umumiy: *${total} $*\n\n`;
  });

  txt += `*Jami to'lov: ${totalAll} $*`;
  return txt;
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

  // Maxsulotlar
  if (text === "🖼 Maxsulotlar") {
    const products = await getProducts();
    if (!products || products.length === 0) {
      return bot.sendMessage(chatId, "❌ API dan mahsulot topilmadi.");
    }

    if (!carts[chatId]) carts[chatId] = [];
    const cart = carts[chatId];

    // Har bir mahsulot uchun rasm va inline tugmalar bilan xabar jo'natamiz
    for (const product of products) {
      const img = product.image || product.img || product.imageUrl || "https://via.placeholder.com/400x300.png?text=No+Image";
      const count = getCountFromCart(cart, product._id);

      const caption = 
        `💎 *${product.name || product.title || "Noma'lum mahsulot"}*\n` +
        `💰 Narxi: *${product.price} $*\n` +
        `🔢 Soni: *${count}*\n` +
        `📄 ${product.description || ""}`;

      // inline tugmalar: plus, count (noop), minus va qo'shish/batafsil
      const keyboard = {
        inline_keyboard: [
          [
            { text: "➕", callback_data: `plus_${product._id}` },
            { text: `Soni: ${count}`, callback_data: `noop` },
            { text: "➖", callback_data: `minus_${product._id}` }
          ],
          [
            { text: "🛒 Qo‘shish", callback_data: `add_${product._id}` },
            { text: "📄 Batafsil", callback_data: `product_${product._id}` }
          ]
        ]
      };

      try {
        await bot.sendPhoto(chatId, img, { caption, parse_mode: "Markdown", reply_markup: keyboard });
      } catch (err) {
        // agar rasm yuborishda xatolik bo'lsa, oddiy matn xabar
        await bot.sendMessage(chatId, caption, { parse_mode: "Markdown", reply_markup: keyboard });
      }
    }
    return;
  }

  // Savatni ko'rsatish
  if (text === "🛒 Savat") {
    if (!carts[chatId] || carts[chatId].length === 0) {
      return bot.sendMessage(chatId, "🛒 Savat bo‘sh.");
    }
    const txt = cartToText(carts[chatId]);
    return bot.sendMessage(chatId, txt, { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "🧹 Savatni tozalash", callback_data: "clear" }]] } });
  }

  // Buyurtma berish - soddalashtirilgan
  if (text === "🛍 Buyurtma berish") {
    return bot.sendMessage(chatId, "Buyurtma berish uchun ismingizni yuboring:");
  }

  // Biz haqimizda
  if (text === "ℹ️ Biz haqimizda") {
    return bot.sendMessage(chatId, "Namangan Parfume — Namangan shahridagi zamonaviy va sifatli parfyumeriya do‘koni. Har bir mijozimizga original va yuqori sifatli atirlar taqdim etamiz.✨");
  }

  // Manzil
  if (text === "🏠 Manzil") {
    return bot.sendMessage(chatId, "Manzil: Namangan shahar, XYZ ko‘chasi, 123-uy");
  }

  // Kontakt
  if (text === "📞 Biz bilan bog‘lanish") {
    return bot.sendMessage(chatId, "Telefon: +998 90 753 50 08");
  }
});

// ===============================
// CALLBACK HANDLER
// ===============================
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const messageId = query.message.message_id;

  // noop tugma bosilganda hech nima qilmasin (masalan Soni: X tugmasi)
  if (data === "noop") {
    return bot.answerCallbackQuery(query.id, { text: "—" , show_alert: false});
  }

  const products = await getProducts();
  if (!products || !products.length) {
    return bot.answerCallbackQuery(query.id, { text: "API bilan bog'liq xato." });
  }

  if (!carts[chatId]) carts[chatId] = [];
  const cart = carts[chatId];

  // Savatga qo'shish
  if (data.startsWith("add_")) {
    const id = data.split("_")[1];
    const product = products.find((p) => String(p._id) === String(id));
    if (!product) return bot.answerCallbackQuery(query.id, { text: "Mahsulot topilmadi." });

    const exists = cart.find((i) => String(i._id) === String(id));
    if (exists) exists.count++;
    else cart.push({ ...product, count: 1 });

    carts[chatId] = cart;

    // captionni yangilash (boshqa foydalanuvchi xabarini ham tahrirlashga harakat qilmaslik uchun try-catch)
    try {
      const newCount = getCountFromCart(cart, id);
      const newCaption =
        `💎 *${product.name || product.title}*\n` +
        `💰 Narxi: *${product.price} $*\n` +
        `🔢 Soni: *${newCount}*\n` +
        `📄 ${product.description || ""}`;

      await bot.editMessageCaption(newCaption, { chat_id: chatId, message_id: messageId, parse_mode: "Markdown", reply_markup: query.message.reply_markup });
    } catch (err) {
      // ba'zan edit qilib bo'lmasligi mumkin, bu xolatni e'tibordan chetda qoldiramiz
    }

    return bot.answerCallbackQuery(query.id, { text: "🛒 Savatga qo‘shildi!" });
  }

  // Batafsil
  if (data.startsWith("product_")) {
    const id = data.split("_")[1];
    const p = products.find((i) => String(i._id) === String(id));
    if (!p) return bot.answerCallbackQuery(query.id, { text: "Mahsulot topilmadi." });

    const img = p.img || p.image || p.imageUrl || "https://via.placeholder.com/400x300.png?text=No+Image";
    const cartCount = getCountFromCart(cart, id);

    try {
      await bot.sendPhoto(chatId, img, {
        caption: `💎 *${p.name || p.title}*\n💰 Narxi: *${p.price} $*\n🔢 Soni: *${cartCount}*\n\n📄 ${p.description || "Tavsif mavjud emas"}`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "➕", callback_data: `plus_${p._id}` },
              { text: `Soni: ${cartCount}`, callback_data: "noop" },
              { text: "➖", callback_data: `minus_${p._id}` }
            ],
            [{ text: "🛒 Savatga qo‘shish", callback_data: `add_${p._id}` }]
          ]
        }
      });
    } catch (err) {
      await bot.sendMessage(chatId, `💎 ${p.name}\nNarx: ${p.price} $\nSoni: ${cartCount}\n\n${p.description || ""}`);
    }

    return bot.answerCallbackQuery(query.id);
  }

  // Plus: son oshirish
  if (data.startsWith("plus_")) {
    const id = data.split("_")[1];
    const product = products.find((p) => String(p._id) === String(id));
    if (!product) return bot.answerCallbackQuery(query.id, { text: "Mahsulot topilmadi." });

    const item = cart.find((i) => String(i._id) === String(id));
    if (!item) {
      cart.push({ ...product, count: 1 });
    } else {
      item.count++;
    }
    carts[chatId] = cart;

    // captionni yangilash
    try {
      const newCount = getCountFromCart(cart, id);
      const newCaption =
        `💎 *${product.name || product.title}*\n` +
        `💰 Narxi: *${product.price} $*\n` +
        `🔢 Soni: *${newCount}*\n` +
        `📄 ${product.description || ""}`;

      await bot.editMessageCaption(newCaption, { chat_id: chatId, message_id: messageId, parse_mode: "Markdown", reply_markup: query.message.reply_markup });
    } catch (err) {}

    return bot.answerCallbackQuery(query.id, { text: `➕ +1 qo‘shildi — Jami: ${getCountFromCart(cart, id)} ta` });
  }

  // Minus: son kamaytirish yoki o'chirish
  if (data.startsWith("minus_")) {
    const id = data.split("_")[1];
    const product = products.find((p) => String(p._id) === String(id));
    if (!product) return bot.answerCallbackQuery(query.id, { text: "Mahsulot topilmadi." });

    const item = cart.find((i) => String(i._id) === String(id));
    if (!item) return bot.answerCallbackQuery(query.id, { text: "Savatda bu mahsulot yo'q." });

    if (item.count > 1) {
      item.count--;
      carts[chatId] = cart;

      // yangilangan caption
      try {
        const newCount = getCountFromCart(cart, id);
        const newCaption =
          `💎 *${product.name || product.title}*\n` +
          `💰 Narxi: *${product.price} $*\n` +
          `🔢 Soni: *${newCount}*\n` +
          `📄 ${product.description || ""}`;

        await bot.editMessageCaption(newCaption, { chat_id: chatId, message_id: messageId, parse_mode: "Markdown", reply_markup: query.message.reply_markup });
      } catch (err) {}

      return bot.answerCallbackQuery(query.id, { text: `➖ -1 kamaytirildi — Jami: ${getCountFromCart(cart, id)} ta` });
    } else {
      // count === 1 → o'chirish
      carts[chatId] = cart.filter((i) => String(i._id) !== String(id));

      // captionni yangilash: count 0 bo'ldi
      try {
        const newCaption =
          `💎 *${product.name || product.title}*\n` +
          `💰 Narxi: *${product.price} $*\n` +
          `🔢 Soni: *0*\n` +
          `📄 ${product.description || ""}`;

        await bot.editMessageCaption(newCaption, { chat_id: chatId, message_id: messageId, parse_mode: "Markdown", reply_markup: query.message.reply_markup });
      } catch (err) {}

      return bot.answerCallbackQuery(query.id, { text: `❌ Mahsulot savatdan olib tashlandi` });
    }
  }

  // Savatni tozalash
  if (data === "clear") {
    carts[chatId] = [];
    await bot.answerCallbackQuery(query.id, { text: "Savat tozalandi 🧹" });
    return bot.sendMessage(chatId, "🛒 Savat bo‘sh.");
  }

  // Default
  return bot.answerCallbackQuery(query.id, { text: "Amal bajarildi." });
});

// ===============================
// Error handling (konsolda)
// ===============================
bot.on("polling_error", (err) => {
  console.error("Polling error:", err.code, err.message);
});
