const TelegramBot = require('node-telegram-bot-api');

// Bot tokeningiz
const token = '8278965358:AAH04-_-DxMjMQXO1D4qKWs7kR6I9tgBtTw';

// Botni ishga tushirish
const bot = new TelegramBot(token, { polling: true });

// /start komandasi
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  // Menyu tugmalari
  const menu = {
    reply_markup: {
      keyboard: [
        [{ text: "📦 Mahsulotlar" }, { text: "📍 Manzil" }],
        [{ text: "📞 Bog‘lanish" }]
      ],
      resize_keyboard: true
    }
  };

  bot.sendMessage(
    chatId,
    `Assalomu alaykum! Namangan Parfume botiga xush kelibsiz.\n\nQuyidagi menyudan tanlang 👇`,
    menu
  );
});

// Matnli xabarlarni qayta ishlash
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // start bo‘lsa qaytarmaymiz
  if (text === "/start") return;

  if (text === "📦 Mahsulotlar") {
    bot.sendMessage(chatId, "Bu yerda mahsulotlar ro‘yxati bo‘ladi.");
  } else if (text === "📍 Manzil") {
    bot.sendMessage(chatId, "Bizning manzil: Namangan shahar...");
  } else if (text === "📞 Bog‘lanish") {
    bot.sendMessage(chatId, "Aloqa: +998 90 753 50 08");
  } else {
    // boshqa matnlar
    bot.sendMessage(chatId, `Siz yozdingiz: "${text}"`);
  }
});
