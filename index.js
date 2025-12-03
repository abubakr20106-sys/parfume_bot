const TelegramBot = require("node-telegram-bot-api");

// Bot token
const token = "8278965358:AAH04-_-DxMjMQXO1D4qKWs7kR6I9tgBtTw";

// Kanal ID
const CHANNEL_ID = parfume_nmg_bot;

// Admin ID (o‘zingiz)
const ADMIN_ID = t.me/abubakir_706 ;

const bot = new TelegramBot(token, { polling: true });

// Foydalanuvchilar savati
let carts = {};

// ============================
// Kanalga xush kelibsiz
// ============================
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  // savatni yaratib qo‘yamiz
  if (!carts[chatId]) carts[chatId] = [];

  // Inline menyu
  const menu = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🛒 Mahsulotlar", callback_data: "products" }],
        [{ text: "📦 Savat", callback_data: "cart" }],
        [{ text: "👨‍💻 Admin Panel", callback_data: "admin" }],
      ],
    },
  };

  // Start xabari
  bot.sendPhoto(
    chatId,
    "https://i.ibb.co/Y2nP7Fm/perfume.jpg",
    {
      caption: "🌸 *Namangan Parfume* ga xush kelibsiz!\n\nQuyidan menyuni tanlang 👇",
      parse_mode: "Markdown",
      ...menu,
    }
  );

  // Kanalga habar
  bot.sendMessage(
    CHANNEL_ID,
    `🎉 Yangi foydalanuvchi: *${msg.from.first_name}* botga kirdi!`,
    { parse_mode: "Markdown" }
  );
});

// ============================
// Inline tugmalarni qayta ishlash
// ============================
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  // ---------------------------
  // Mahsulotlar menyusi
  // ---------------------------
  if (data === "products") {
    const productsMenu = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "💐 Dior Sauvage", callback_data: "p1" },
            { text: "🌹 Chanel Coco", callback_data: "p2" },
          ],
          [{ text: "⬅️ Orqaga", callback_data: "back" }],
        ],
      },
    };

    bot.sendMessage(chatId, "🛍 Mahsulotlardan birini tanlang:", productsMenu);
  }

  // Mahsulotlar
  const products = {
    p1: { name: "Dior Sauvage", price: 250000, img: "https://i.ibb.co/wR3WQx5/dior.jpg" },
    p2: { name: "Chanel Coco", price: 300000, img: "https://i.ibb.co/ZmHPVxL/chanel.jpg" },
  };

  if (products[data]) {
    const pr = products[data];

    bot.sendPhoto(chatId, pr.img, {
      caption: `✨ *${pr.name}*\nNarxi: *${pr.price} so‘m*\n\nSavatga qo‘shamizmi?`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "➕ Savatga qo‘shish", callback_data: "add_" + data }],
          [{ text: "⬅️ Orqaga", callback_data: "products" }],
        ],
      },
    });
  }

  // ---------------------------
  // Savatga qo‘shish
  // ---------------------------
  if (data.startsWith("add_")) {
    const prKey = data.split("_")[1];
    const product = products[prKey];

    carts[chatId].push(product);

    bot.answerCallbackQuery(query.id, { text: "Savatga qo‘shildi ✅" });
  }

  // ---------------------------
  // Savat ko‘rish
  // ---------------------------
  if (data === "cart") {
    const cart = carts[chatId];

    if (!cart || cart.length === 0) {
      bot.sendMessage(chatId, "🛒 Savat bo‘sh!");
      return;
    }

    let text = "🛒 *Savatdagi mahsulotlar:*\n\n";
    let total = 0;

    cart.forEach((item, i) => {
      text += `${i + 1}. ${item.name} - ${item.price} so‘m\n`;
      total += item.price;
    });

    text += `\n💰 *Jami: ${total} so‘m*`;

    bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
  }

  // ---------------------------
  // Admin Panel
  // ---------------------------
  if (data === "admin") {
    if (chatId !== ADMIN_ID) {
      bot.answerCallbackQuery(query.id, { text: "🚫 Siz admin emassiz!" });
      return;
    }

    bot.sendMessage(chatId, "👨‍💻 *Admin panel*\n\n— Foydalanuvchilar savati\n— Sotuv statistikasi\n— Mahsulot qo‘shish", {
      parse_mode: "Markdown",
    });
  }

  // ---------------------------
  // Orqaga
  // ---------------------------
  if (data === "back") {
    bot.sendMessage(chatId, "Menyudan tanlang:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🛒 Mahsulotlar", callback_data: "products" }],
          [{ text: "📦 Savat", callback_data: "cart" }],
          [{ text: "👨‍💻 Admin Panel", callback_data: "admin" }],
        ],
      },
    });
  }
});
