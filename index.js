const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios"); // npm install axios

// Bot token
const token = "8278965358:AAEPvb6vkX7y4BA06QIAUttRZY_1qFJEU3k";

// Botni ishga tushirish
const bot = new TelegramBot(token, { polling: true });

// API dan mahsulotlarni olish funksiyasi
async function getProducts() {
  try {
    const response = await axios.get("https://web-bot-node-bqye.onrender.com/api/products");
    // API dan kelgan ma'lumotni Telegram uchun mos formatga o'tkazamiz
    return response.data.map(item => ({
      name: item.name,
      price: item.price,
      img: item.img
    }));
  } catch (error) {
    console.error("API dan mahsulotlarni olishda xato:", error.message);
    return [];
  }
}

// /start komandasi
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Assalomu alaykum! Menyudan tanlang 👇🤍", {
    reply_markup: {
      keyboard: [
        ["📕 Rasmli katalog", "🛍 Buyurtma berish"],
        ["ℹ Biz haqimizda", "📞 Bog‘lanish"]
      ],
      resize_keyboard: true
    }
  });
});

// Tugmalarni tinglash
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "📕 Rasmli katalog") {
    const products = await getProducts(); // API dan mahsulotlarni olamiz
    if (products.length === 0) {
      bot.sendMessage(chatId, "Mahsulotlar hozircha mavjud emas.");
      return;
    }
    products.forEach((product) => {
      bot.sendPhoto(chatId, product.img, {
        caption: `**${product.name}**\n💵 Narxi: *${product.price}*`,
        parse_mode: "Markdown"
      });
    });
  } 
  else if (text === "🛍 Buyurtma berish") {
    bot.sendMessage(chatId, "Buyurtma uchun ismingizni yuboring.");
  }
  else if (text === "ℹ Biz haqimizda") {
    bot.sendMessage(chatId, "Namangan Parfume — Namangan shahridagi zamonaviy va sifatli parfyumeriya mahsulotlarini taklif etuvchi yetakchi do‘konlardan biridir. Bizning maqsadimiz har bir mijozimizga o‘ziga mos, original va yuqori sifatli atirlarni taqdim etishdir. ✨");
  }
  else if (text === "📞 Bog‘lanish") {
    bot.sendMessage(chatId, "Aloqa: +998 90 753 50 08");
  }
});
