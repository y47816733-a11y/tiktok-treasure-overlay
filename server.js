const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { TikTokLiveConnection } = require("tiktok-live-connector");

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

      connection.on("connected", () => {
        console.log("TikTok bağlandı:", username);
        socket.emit("status", "TikTok'a bağlandı ✅");
      });

      connection.on("disconnected", () => {
        socket.emit("status", "TikTok bağlantısı kesildi");
      });

      connection.on("error", (error) => {
        console.log(error);
        socket.emit("status", "TikTok bağlantı hatası ❌");
      });

      await connection.connect();

    } catch (error) {

      console.log(error);
      socket.emit("status", "Bağlanamadı ❌");

    }

  });

});

const PORT = process.env.PORT || 10000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server çalışıyor:", PORT);
});
