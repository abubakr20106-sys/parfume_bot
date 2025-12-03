const TelegramBot = require("node-telegram-bot-api");


// =========================================
// BOT TOKEN
// =========================================
const token = "8278965358:AAEPvb6vkX7y4BA06QIAUttRZY_1qFJEU3k"; 

const bot = new TelegramBot(token, { polling: true });

// =========================================
// FOYDALANUVCHI SAVATLARI
// =========================================
const carts = {};

function getCartText(cart) {
  if (!cart || cart.length === 0) return "🛒 Savat bo‘sh!";

  let text = "🛍 **Savatdagi mahsulotlar:**\n\n";
  cart.forEach((item, index) => {
    text += `${index + 1}. **${item.name}**\n`;
    text += `🔢 Soni: *${item.count}*\n`;
    text += `💵 Narxi: *${item.price} so'm*\n\n`;
  });
  return text;
}

function getCartButtons(cart) {
  if (!cart || cart.length === 0) return { inline_keyboard: [] };

  return {
    inline_keyboard: cart.map((item) => [
      { text: "➖", callback_data: `minus_${item.id}` },
      { text: `${item.count} dona`, callback_data: "noop" },
      { text: "➕", callback_data: `plus_${item.id}` },
      { text: "❌ O'chirish", callback_data: `del_${item.id}` }
    ])
  };
}

// =========================================
// API DAN MAHSULOTLARNI OLISH
// =========================================
async function getProducts() {
  try {
    const res = await axios.get("https://web-bot-node-bqye.onrender.com/api/products");
    return res.data;
  } catch (e) {
    console.log("API ERROR:", e.message);
    return [];
  }
}

// =========================================
// /start
// =========================================
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "Assalomu alaykum! Menyudan tanlang 👇🤍", {
    reply_markup: {
      keyboard: [
        ["📕 Katalog", "🛒 Savat"],
        ["ℹ Biz haqimizda", "📞 Bog‘lanish"]
      ],
      resize_keyboard: true
    }
  });
});

// =========================================
// Asosiy tugmalar
// =========================================
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // 📕 Katalog
  if (text === "📕 Katalog") {
    const products = await getProducts();

    if (!products.length) {
      bot.sendMessage(chatId, "Mahsulotlar topilmadi.");
      return;
    }

    // Inline tugmalar bilan katalog
    const buttons = products.map((p) => [
      { text: p.name, callback_data: `product_${p._id}` }
    ]);

    bot.sendMessage(chatId, "📕 Mahsulotlar ro‘yxati:", {
      reply_markup: { inline_keyboard: buttons }
    });
  }

  // 🛒 Savatni ko‘rsatish
  if (text === "🛒 Savat") {
    const cart = carts[chatId] || [];

    bot.sendMessage(chatId, getCartText(cart), {
      parse_mode: "Markdown",
      reply_markup: getCartButtons(cart)
    });
  }

  // ℹ Biz haqimizda
  if (text === "ℹ Biz haqimizda") {
    bot.sendMessage(
      chatId,
      "Namangan Parfume — sifatli va original atirlar do‘koni. Har bir mijozga mos atir! ✨"
    );
  }

  // 📞 Bog‘lanish
  if (text === "📞 Bog‘lanish") {
    bot.sendMessage(chatId, "☎ Telefon: +998 90 753 50 08");
  }
});

// =========================================
// CALLBACK — INLINE TUGMALAR
// =========================================
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  // Savat yaratish
  if (!carts[chatId]) carts[chatId] = [];

  // ============================
  // Mahsulot sahifasi
  // ============================
  if (data.startsWith("product_")) {
    const id = data.split("product_")[1];
    const products = await getProducts();
    const p = products.find((i) => i._id === id);

    if (!p) return;

    bot.sendPhoto(chatId, p.img, {
      caption: `**${p.name}**\n💵 Narxi: *${p.price} so'm*`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🛒 Savatga qo‘shish", callback_data: `add_${p._id}` }]
        ]
      }
    });
  }

  // ============================
  // Savatga qo‘shish
  // ============================
  if (data.startsWith("add_")) {
    const id = data.split("add_")[1];
    const products = await getProducts();
    const p = products.find((i) => i._id === id);

    const exist = carts[chatId].find((i) => i.id === id);

    if (exist) exist.count++;
    else carts[chatId].push({ id: p._id, name: p.name, price: p.price, count: 1 });

    bot.answerCallbackQuery(query.id, { text: "Savatga qo‘shildi! 🛒" });
  }

  // ============================
  // + Qo‘shish
  // ============================
  if (data.startsWith("plus_")) {
    const id = data.split("plus_")[1];
    const item = carts[chatId].find((p) => p.id === id);
    if (item) item.count++;

    bot.editMessageText(getCartText(carts[chatId]), {
      chat_id: chatId,
      message_id: query.message.message_id,
      parse_mode: "Markdown",
      reply_markup: getCartButtons(carts[chatId])
    });
  }

  // ============================
  // - Kamaytirish
  // ============================
  if (data.startsWith("minus_")) {
    const id = data.split("minus_")[1];
    const item = carts[chatId].find((p) => p.id === id);

    if (item && item.count > 1) item.count--;
    else if (item && item.count === 1)
      carts[chatId] = carts[chatId].filter((p) => p.id !== id);

    bot.editMessageText(getCartText(carts[chatId]), {
      chat_id: chatId,
      message_id: query.message.message_id,
      parse_mode: "Markdown",
      reply_markup: getCartButtons(carts[chatId])
    });
  }

  // ============================
  // ❌ O'chirish
  // ============================
  if (data.startsWith("del_")) {
    const id = data.split("del_")[1];
    carts[chatId] = carts[chatId].filter((p) => p.id !== id);

    bot.editMessageText(getCartText(carts[chatId]), {
      chat_id: chatId,
      message_id: query.message.message_id,
      parse_mode: "Markdown",
      reply_markup: getCartButtons(carts[chatId])
    });
  }
});
