const TelegramBot = require("node-telegram-bot-api");

// ใส่ Token ของคุณ
const TOKEN = "7456331720:AAGVd5msA7HMOA7Gb5UzfQNGnp_wkP3toQ0";
const bot = new TelegramBot(TOKEN, { polling: true });

console.log("Bot started. ส่งข้อความหา bot เพื่อดู chatId");

bot.on("message", (msg) => {
  console.log("--- New Message ---");
  console.log("From user:", msg.from.username || msg.from.first_name);
  console.log("Chat ID:", msg.chat.id); // <-- นี่คือ chatId
  console.log("Message:", msg.text);
});
