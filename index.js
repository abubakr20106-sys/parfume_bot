const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

// BOT TOKEN
const token = "8278965358:AAEPvb6vkX7y4BA06QIAUttRZY_1qFJEU3k";

// BOT RUN
const bot = new TelegramBot(token, { polling: true });

// SAVAT SAQLANADI
const carts = {};

// API DAN MAHSULOTLARNI OLISH
async function getProducts() {
  try {
    const res = await axios.get("https://web-bot-node-bqye.onrender.com/api/products");
    // API data tuzilishi: res.data.products yoki shunga o‘xshash bo‘lishi mumkin
    if (Array.isArray(res.data)) return res.data; 
    if (Array.isArray(res.data.products)) return res.data.products;
    return [];
  } catch (err) {
    console.log("API error:", err.message);
    return [];
  }
}

// /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  if (!carts[chatId]) carts[chatId] = [];

  bot.sendMessage(chatId, "Assalomu alaykum! Menyudan tanlang 👇", {
    reply_markup: {
      keyboard: [
        ["📕 Katalog"],
        ["🛒 Savat", "🛍 Buyurtma berish"]
      ],
      resize_keyboard: true
    }
  });
});

// MESSAGE HANDLER
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "📕 Katalog") {
    const products = await getProducts();

    if (!products.length) return bot.sendMessage(chatId, "Mahsulotlar topilmadi");

    for (const p of products) {
      // agar rasm URL mavjud bo'lmasa, default rasm berish
      const img = p.img || "https://via.placeholder.com/300x200.png?text=No+Image";

      await bot.sendPhoto(chatId, img, {
        caption: `*${p.name}*\n💵 Narxi: ${p.price ? p.price + " so'm" : "Noma'lum"}`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🛒 Savatga qo‘shish", callback_data: `add_${p._id}` }],
            [{ text: "📄 Batafsil", callback_data: `product_${p._id}` }]
          ]
        }
      });
    }
  }

  if (text === "🛒 Savat") {
    const cart = carts[chatId] || [];
    if (!cart.length) return bot.sendMessage(chatId, "Savat bo‘sh 🛒");

    let txt = "🛒 **Savatdagi mahsulotlar:**\n\n";
    cart.forEach((item) => {
      txt += `*${item.name}*\n💵 Narxi: ${item.price} so'm\n🔢 Soni: ${item.count}\n\n`;
    });

    bot.sendMessage(chatId, txt, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "🧹 Savatni tozalash", callback_data: "clear" }]]
      }
    });
  }

  if (text === "🛍 Buyurtma berish") {
    bot.sendMessage(chatId, "Ismingizni yuboring:");
  }
});

// CALLBACK QUERY
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  const products = await getProducts();

  if (data.startsWith("add_")) {
    const id = data.split("_")[1];
    const product = products.find((p) => p._id === id);
    if (!product) return;

    if (!carts[chatId]) carts[chatId] = [];
    const cart = carts[chatId];
    const exists = cart.find((i) => i._id === id);

    if (exists) exists.count++;
    else cart.push({ ...product, count: 1 });

    bot.answerCallbackQuery(query.id, { text: "Savatga qo‘shildi 🛒" });
  }

  if (data.startsWith("product_")) {
    const id = data.split("_")[1];
    const p = products.find((i) => i._id === id);
    if (!p) return;

    const img = p.img || "https://via.placeholder.com/300x200.png?text=No+Image";

    bot.sendPhoto(chatId, img, {
      caption: `*${p.name}*\n💵 Narxi: ${p.price ? p.price + " so'm" : "Noma'lum"}\n📄 Tavsif: ${p.description || "Tavsif yo'q"}`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "➕", callback_data: `plus_${p._id}` }, { text: "➖", callback_data: `minus_${p._id}` }],
          [{ text: "🛒 Savatga qo‘shish", callback_data: `add_${p._id}` }]
        ]
      }
    });
  }

  if (data.startsWith("plus_")) {
    const id = data.split("_")[1];
    const cart = carts[chatId];
    const item = cart.find((i) => i._id === id);
    if (!item) return;
    item.count++;
    bot.answerCallbackQuery(query.id, { text: "Soni oshirildi ➕" });
  }

  if (data.startsWith("minus_")) {
    const id = data.split("_")[1];
    const cart = carts[chatId];
    const item = cart.find((i) => i._id === id);
    if (!item) return;
    if (item.count > 1) item.count--;
    else cart.splice(cart.indexOf(item), 1);
    bot.answerCallbackQuery(query.id, { text: "Soni kamaytirildi ➖" });
  }

  if (data === "clear") {
    carts[chatId] = [];
    bot.answerCallbackQuery(query.id, { text: "Savat tozalandi 🧹" });
    bot.sendMessage(chatId, "Savat bo‘sh 🛒");
  }
});
