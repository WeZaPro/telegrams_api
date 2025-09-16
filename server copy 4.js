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
// app.post("/send-photo", upload.single("photo"), async (req, res) => {
//   try {
//     const filePath = req.file.path;
//     await bot.sendPhoto(chatId, fs.createReadStream(filePath), {
//       caption: req.body.caption || "",
//       filename: req.file.originalname, // ชื่อไฟล์
//       contentType: req.file.mimetype, // MIME type ของไฟล์ เช่น image/jpeg
//     });
//     fs.unlinkSync(filePath); // ลบไฟล์หลังส่ง
//     res.json({ status: "success" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

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
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  console.log(`Received from ${chatId}: ${text}`);

  // ส่งข้อความ realtime ไป frontend ผ่าน socket.io
  io.emit("newMessage", {
    sender: "Bot",
    text,
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
