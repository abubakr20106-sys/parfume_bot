const TelegramBot = require('node-telegram-bot-api');

// Bot tokeningizni shu yerga yozing
const token = '8278965358:AAH04-_-DxMjMQXO1D4qKWs7kR6I9tgBtTw';

// Polling yordamida botni ishga tushirish
const bot = new TelegramBot(token, { polling: true });

// /start komandasi
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `Assalomu aleykum Namangan Parfume ga xush kelibsiz.`);
});

// Har qanday matn xabarini qayta ishlash
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text !== '/start') {
    bot.sendMessage(chatId, `Siz yozdingiz: "${text}"`);
  }
});
