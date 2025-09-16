const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const TelegramBot = require("node-telegram-bot-api");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");

// Bot Token (ใช้ของจริงจาก Telegram BotFather)
const TOKEN = "7456331720:AAGVd5msA7HMOA7Gb5UzfQNGnp_wkP3toQ0";
const bot = new TelegramBot(TOKEN, { polling: true });

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(cors());

// Multer สำหรับ upload file
const upload = multer({ dest: "uploads/" });

/**
 * ✅ Route ทดสอบปกติ
 */
app.post("/send", async (req, res) => {
  const { chatId, message } = req.body;
  try {
    await bot.sendMessage(chatId, message);
    res.json({ status: "ok", data: req.body });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ Route รับข้อมูลจาก ESP8266
 * ESP จะส่ง JSON แบบนี้:
 * { "chatId": "7495702508", "token": "123456:ABC", "message": "hello" }
 */
app.post("/esp-send", async (req, res) => {
  const { chatId, token, message } = req.body;

  console.log("📩 Data from ESP8266:", req.body);

  try {
    // ✅ ส่งข้อความไป Telegram โดยไม่ต้อง validate token
    await bot.sendMessage(chatId, `[ESP8266]\n${message}\n(token=${token})`);

    res.json({ status: "ok", data: req.body });
  } catch (err) {
    console.error("❌ Error sending to Telegram:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ Upload photo
 */
app.post("/send-photo", upload.single("photo"), async (req, res) => {
  try {
    const filePath = req.file.path;
    await bot.sendPhoto(req.body.chatId, fs.createReadStream(filePath), {
      caption: req.body.caption || "",
    });
    fs.unlinkSync(filePath);
    res.json({ status: "success" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ เมื่อมีข้อความจาก Telegram
 */
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  let imageUrl = null;

  if (msg.text) {
    console.log(`💬 Received from ${chatId}: ${msg.text}`);
  }

  if (msg.photo) {
    try {
      const photo = msg.photo[msg.photo.length - 1];
      console.log(`📷 Received photo: file_id=${photo.file_id}`);
      const file = await bot.getFile(photo.file_id);
      imageUrl = `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;
    } catch (err) {
      console.error("Error getting photo URL:", err);
    }
  }

  io.emit("newMessage", {
    sender: "Bot",
    text: msg.text || null,
    image: imageUrl,
    chatId,
  });
});

// ✅ Socket.io connection
io.on("connection", (socket) => {
  console.log("⚡ Frontend connected");
});

// ✅ Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
