const TelegramBot = require("node-telegram-bot-api");

// Bot token
const token = "8278965358:AAEPvb6vkX7y4BA06QIAUttRZY_1qFJEU3k"; // <-- tokenni shu yerga yozing

// Botni ishga tushirish
const bot = new TelegramBot(token, { polling: true });

// 📦 Mahsulotlar ro‘yxati
const products = [
  {
    name: "Louis vuitton",
    price: "500$",
    img: "https://aeworld.com/wp-content/uploads/2021/05/MENS_FRAGRANCES.jpg"
  },
  {
    name: "Sauvage",
    price: "120$",
    img: "https://avatars.mds.yandex.net/get-mpic/5332938/2a00000191a7a4ab9edc53538d348def1abf/orig"
  },
  {
    name: "Lyon Extreme ",
    price: "50$",
    img: "https://assets.dragonmart.ae/pictures/0529610_paris-world-lyon-extreme-luxury-eau-de-parfum-85-ml.jpeg"
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
    bot.sendMessage(chatId, "Namangan Parfume — Namangan shahridagi zamonaviy va sifatli parfyumeriya mahsulotlarini taklif etuvchi yetakchi do‘konlardan biridir. Bizning maqsadimiz har bir mijozimizga o‘ziga mos, original va yuqori sifatli atirlarni taqdim etishdir. ✨");
  }

  // ▶ Bog‘lanish
  else if (text === "📞 Bog‘lanish") {
    bot.sendMessage(chatId, "Aloqa: +998 90 753 50 08");
  }
});
