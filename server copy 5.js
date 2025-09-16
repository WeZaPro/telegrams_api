const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const TelegramBot = require("node-telegram-bot-api");

const multer = require("multer");
const fs = require("fs");

const TOKEN = "7456331720:AAGVd5msA7HMOA7Gb5UzfQNGnp_wkP3toQ0";
const chatId = "7495702508"; // chatId ของผู้รับ
const bot = new TelegramBot(TOKEN, { polling: true });
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(express.json());
app.use(cors());

// Multer สำหรับ upload file
const upload = multer({ dest: "uploads/" });

// รับข้อความจาก frontend ส่งไป Telegram
app.post("/send", async (req, res) => {
  const { chatId, message } = req.body;
  try {
    await bot.sendMessage(chatId, message);
    res.json({ status: "success" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// รับไฟล์รูปจาก frontend

app.post("/send-photo", upload.single("photo"), async (req, res) => {
  try {
    const filePath = req.file.path;

    // ส่งไฟล์แบบเดิม
    await bot.sendPhoto(chatId, fs.createReadStream(filePath), {
      caption: req.body.caption || "",
    });

    fs.unlinkSync(filePath); // ลบไฟล์หลังส่ง
    res.json({ status: "success" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// เมื่อ Telegram ส่งข้อความมา
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  let imageUrl = null;

  // ถ้าเป็นข้อความปกติ
  if (msg.text) {
    console.log(`Received from ${chatId}: ${msg.text}`);
  }

  // ถ้ามีรูป
  if (msg.photo) {
    try {
      // เลือกขนาดสูงสุดของรูป
      const photo = msg.photo[msg.photo.length - 1];
      console.log(`Received photo from ${chatId}: file_id=${photo.file_id}`);

      // ใช้ getFile เพื่อดึง file_path ของ Telegram
      const file = await bot.getFile(photo.file_id);
      imageUrl = `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;
    } catch (err) {
      console.error("Error getting photo URL:", err);
    }
  }

  // ส่ง realtime ไป frontend ผ่าน socket.io
  io.emit("newMessage", {
    sender: "Bot",
    text: msg.text || null,
    image: imageUrl, // ส่ง URL แทน file_id
    chatId,
  });
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("Frontend connected");
});

const PORT = 3000;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
