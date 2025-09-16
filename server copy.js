const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const bodyParser = require("body-parser");

const cors = require("cors");

// ใส่ Token จาก BotFather
const TOKEN = "7456331720:AAGVd5msA7HMOA7Gb5UzfQNGnp_wkP3toQ0";
const bot = new TelegramBot(TOKEN, { polling: true });

const app = express();
app.use(bodyParser.json());
app.use(cors());

// -------------------- รับข้อความจากผู้ใช้ --------------------
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  console.log(`Received from ${chatId}: ${text}`);

  // ตอบกลับข้อความ
  bot.sendMessage(chatId, `คุณส่งข้อความ: ${text}`);
});

// -------------------- รับข้อมูลจาก Webhook / API --------------------
app.post("/send", (req, res) => {
  const { chatId, message } = req.body;
  if (!chatId || !message) {
    return res.status(400).json({ error: "chatId และ message ต้องมีค่า" });
  }

  bot.sendMessage(chatId, message);
  res.json({ status: "success", chatId, message });
});

// -------------------- Start Server --------------------
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
