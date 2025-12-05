const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

// BOT TOKEN
const token = "8278965358:AAEPvb6vkX7y4BA06QIAUttRZY_1qFJEU3k";
const bot = new TelegramBot(token, { polling: true });

const carts = {};

// API’dan mahsulotlarni olish
async function getProducts() {
  try {
    const res = await axios.get("https://web-bot-node-bqye.onrender.com/api/products");

    if (res.data.products && Array.isArray(res.data.products)) {
      return res.data.products;
    }

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
        ["🖼 Maxsulotlar", "🛒 Savat"],
        ["🛍 Buyurtma berish", "ℹ️ Biz haqimizda"],
        ["🏠 Manzil", "📞 Biz bilan bog‘lanish"],
      ],
      resize_keyboard: true,
    },
  });
});

// MESSAGE HANDLER
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Maxsulotlar katalogi
  if (text === "🖼 Maxsulotlar") {
    const products = await getProducts();

    if (!products.length) {
      return bot.sendMessage(chatId, "❌ API dan mahsulot topilmadi.");
    }

    for (const product of products) {
      const img =
        product.img ||
        product.image ||
        product.imageUrl ||
        "https://via.placeholder.com/300x200.png?text=No+Image";

      if (!product._id) {
        console.log("❌ ID yo‘q mahsulot:", product);
        continue;
      }

      await bot.sendPhoto(chatId, img, {
        caption: `💎 *${product.name}*\n💰 Narxi: *${product.price} so'm*`,
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

  // Savat
  else if (text === "🛒 Savat") {
    const cart = carts[chatId] || [];
    if (!cart.length) return bot.sendMessage(chatId, "Savat bo‘sh 🛒");

    let txt = "🛒 **Savatdagi mahsulotlar:**\n\n";
    cart.forEach((item) => {
      txt += `*${item.name}*\n💵 Narxi: ${item.price} so'm\n🔢 Soni: ${item.count}\n\n`;
    });

    bot.sendMessage(chatId, txt, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🧹 Savatni tozalash", callback_data: "clear" }],
        ],
      },
    });
  }

  // Buyurtma
  else if (text === "🛍 Buyurtma berish") {
    bot.sendMessage(chatId, "Ismingizni yuboring:");
  }

  // Biz haqimizda
  else if (text === "ℹ️ Biz haqimizda") {
    bot.sendMessage(
      chatId,
      "Namangan Parfume — Namangan shahridagi zamonaviy va sifatli parfyumeriya do‘koni. Har bir mijozimizga original va yuqori sifatli atirlar taqdim etamiz."
    );
  }

  // Manzil
  else if (text === "🏠 Manzil") {
    bot.sendMessage(chatId, "Manzil: Namangan shahar, XYZ ko‘chasi, 123-uy");
  }

  // Kontakt
  else if (text === "📞 Biz bilan bog‘lanish") {
    bot.sendMessage(chatId, "Telefon: +998 90 753 50 08");
  }
});

// CALLBACK HANDLER
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const products = await getProducts();

  // Savatga qo‘shish
  if (data.startsWith("add_")) {
    const id = data.split("_")[1];
    const product = products.find((p) => p._id == id);
    if (!product) return;

    if (!carts[chatId]) carts[chatId] = [];
    const cart = carts[chatId];
    const exists = cart.find((i) => i._id == id);

    if (exists) exists.count++;
    else cart.push({ ...product, count: 1 });

    bot.answerCallbackQuery(query.id, { text: "Savatga qo‘shildi 🛒" });
  }

  // Batafsil
  if (data.startsWith("product_")) {
    const id = data.split("_")[1];
    const p = products.find((i) => i._id == id);
    if (!p) return;

    const img =
      p.img ||
      p.image ||
      p.imageUrl ||
      "https://via.placeholder.com/300x200.png?text=No+Image";

    bot.sendPhoto(chatId, img, {
      caption: `💎 *${p.name}*\n💰 Narxi: *${p.price} so'm*\n📄 Tavsif: ${
        p.description || "Tavsif yo'q"
      }`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "➕", callback_data: `plus_${p._id}` },
            { text: "➖", callback_data: `minus_${p._id}` },
            { text: "🛒 Qo‘shish", callback_data: `add_${p._id}` },
          ],
        ],
      },
    });
  }

  // Soni oshirish
  if (data.startsWith("plus_")) {
    const id = data.split("_")[1];
    const cart = carts[chatId];
    if (!cart) return;
    const item = cart.find((i) => i._id == id);
    if (!item) return;

    item.count++;
    bot.answerCallbackQuery(query.id, { text: "Soni oshirildi ➕" });
  }

  // Soni kamaytirish
  if (data.startsWith("minus_")) {
    const id = data.split("_")[1];
    const cart = carts[chatId];
    if (!cart) return;
    const item = cart.find((i) => i._id == id);
    if (!item) return;

    if (item.count > 1) item.count--;
    else cart.splice(cart.indexOf(item), 1);

    bot.answerCallbackQuery(query.id, { text: "Soni kamaytirildi ➖" });
  }

  // Savatni tozalash
  if (data === "clear") {
    carts[chatId] = [];
    bot.answerCallbackQuery(query.id, { text: "Savat tozalandi 🧹" });
    bot.sendMessage(chatId, "Savat bo‘sh 🛒");
  }
});
