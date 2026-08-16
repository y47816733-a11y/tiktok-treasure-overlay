import express from "express";
import http from "http";
import { Server } from "socket.io";
import { TikTokLiveConnection, WebcastEvent } from "tiktok-live-connector";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let connection = null;
let timer = null;

function startTimer(seconds) {
  clearInterval(timer);

  let remaining = Number(seconds) || 65;

  io.emit("timer", remaining);

  timer = setInterval(() => {
    remaining--;

    if (remaining <= 0) {
      remaining = 0;
      clearInterval(timer);
    }

    io.emit("timer", remaining);
  }, 1000);
}

io.on("connection", (socket) => {

  socket.on("connectTikTok", async (username) => {

    try {
      username = username.replace("@", "").trim();

      if (!username) return;

      if (connection) {
        try {
          await connection.disconnect();
        } catch {}
      }

      connection = new TikTokLiveConnection(username);

      connection.on(WebcastEvent.ENVELOPE, (data) => {

        console.log("TREASURE BOX:", data);

        const envelope = data.envelopeInfo || {};

        const diamonds = envelope.diamondCount || 0;
        const people = envelope.peopleCount || 0;

        io.emit("treasure", {
          diamonds,
          people
        });

        startTimer(65);
      });

      connection.on("connected", () => {
        console.log("TikTok connected:", username);
        socket.emit("status", "Bağlandı ✅");
      });

      connection.on("disconnected", () => {
        socket.emit("status", "Bağlantı kesildi");
      });

      connection.on("error", (error) => {
        console.error(error);
        socket.emit("status", "TikTok bağlantı hatası ❌");
      });

      await connection.connect();

    } catch (error) {
      console.error(error);
      socket.emit("status", "Bağlanamadı ❌");
    }
  });
});

const PORT = process.env.PORT || 10000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server çalışıyor: ${PORT}`);
});
