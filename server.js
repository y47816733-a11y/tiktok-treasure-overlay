import express from "express";
import http from "http";
import { Server } from "socket.io";
import TikTokLiveConnector from "tiktok-live-connector";

const { TikTokLiveConnection, WebcastEvent } = TikTokLiveConnector;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let connection = null;

io.on("connection", (socket) => {
  socket.on("connectTikTok", async (username) => {
    username = username.replace("@", "").trim();

    if (!username) return;

    try {
      connection = new TikTokLiveConnection(username);

      connection.on(WebcastEvent.CONNECTED, () => {
        console.log("TikTok bağlandı:", username);
        socket.emit("status", "TikTok'a bağlandı ✅");
      });

      connection.on(WebcastEvent.DISCONNECTED, () => {
        socket.emit("status", "Bağlantı kesildi");
      });

      connection.on(WebcastEvent.ERROR, (error) => {
        console.error("TikTok hata:", error);
        socket.emit("status", "TikTok bağlantı hatası ❌");
      });

      await connection.connect();

    } catch (error) {
      console.error("BAĞLANTI HATASI:", error);
      socket.emit("status", "Bağlanamadı ❌");
    }
  });
});

const PORT = process.env.PORT || 10000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server çalışıyor:", PORT);
});
