const TelegramBot = require("node-telegram-bot-api");

// Bot token
const token = "8278965358:AAEPvb6vkX7y4BA06QIAUttRZY_1qFJEU3k"; // <-- tokenni shu yerga yozing

// Botni ishga tushirish
const bot = new TelegramBot(token, { polling: true });

// 📦 Mahsulotlar ro‘yxati
const products = [
  {
    name: "Dior Sauvage",
    price: "350 000 so‘m",
    img: "https://i.imgur.com/Vp8YRhZ.jpeg"
  },
  {
    name: "Chanel Coco",
    price: "280 000 so‘m",
    img: "https://i.imgur.com/8BlKcPm.jpeg"
  },
  {
    name: "Gucci Bloom",
    price: "300 000 so‘m",
    img: "https://i.imgur.com/kJ4dj3P.jpeg"
  }
];

// ▶ /start komandasi + menyu
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "Assalomu alaykum! Menyudan tanlang 👇✨", {
    reply_markup: {
      keyboard: [
        ["📕 Rasmli katalog", "🛍 Buyurtma berish"],
        ["ℹ Biz haqimizda", "📞 Bog‘lanish"]
      ],
      resize_keyboard: true
    }
  });
});

// ▶ Tugmalarni tinglash
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // ⭐ Rasmli katalog
  if (text === "📕 Rasmli katalog") {
    products.forEach((product) => {
      bot.sendPhoto(chatId, product.img, {
        caption: `**${product.name}**\n💵 Narxi: *${product.price}*`,
        parse_mode: "Markdown"
      });
    });
  }

  // ▶ Buyurtma berish
  else if (text === "🛍 Buyurtma berish") {
    bot.sendMessage(chatId, "Buyurtma uchun ismingizni yuboring.");
  }

  // ▶ Biz haqimizda
  else if (text === "ℹ Biz haqimizda") {
    bot.sendMessage(chatId, "Namangan Parfume – sifatli attorlik mahsulotlari 💖");
  }

  // ▶ Bog‘lanish
  else if (text === "📞 Bog‘lanish") {
    bot.sendMessage(chatId, "Aloqa: +998 ** *** ** **");
  }
});
