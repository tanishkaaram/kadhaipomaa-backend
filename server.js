const express = require("express");

const http = require("http");

const { Server } = require("socket.io");

const Filter = require("bad-words");
const filter = new Filter();

const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {

  cors: {

    origin: "*"

  }

});

const ipViolations = new Map();
const BAN_DURATION = 24 * 60 * 60 * 1000; // 24 hours

let waitingUser = null;

io.on("connection", (socket) => {

  console.log("user connected");

  socket.on(

    "find-match",

    (userData) => {

      console.log(

        "find match request",

        userData.username

      );

      if (!waitingUser) {

        waitingUser = {

          socket,

          userData

        };

        socket.emit(
          "waiting"
        );

      } else {

        const commonInterests =

          userData.interests.filter(

            (interest) =>

              waitingUser
                .userData
                .interests
                .includes(interest)

          );

        const matchedInterests =

          commonInterests.length > 0

            ? commonInterests

            : ["random chat"];

        const roomId =
          "room-" + Date.now();

        socket.join(roomId);

        waitingUser.socket.join(roomId);

        socket.emit(

          "matched",

          {

            roomId,

            stranger:

              waitingUser
                .userData
                .username,

            matchedInterests

          }

        );

        waitingUser.socket.emit(

          "matched",

          {

            roomId,

            stranger:
              userData.username,

            matchedInterests

          }

        );

        waitingUser = null;

      }

    }

  );

  socket.on(

    "send-message",

    (data) => {

      const ip = socket.handshake.address;
      const violation = ipViolations.get(ip) || { count: 0, bannedUntil: null };

      if (violation.bannedUntil && new Date() < violation.bannedUntil) {
         socket.emit("banned", { message: "You are temporarily banned for 24 hours." });
         socket.disconnect(true);
         return;
      }

      if (data && data.content && filter.isProfane(data.content)) {
         violation.count += 1;
         if (violation.count >= 3) {
            violation.bannedUntil = new Date(Date.now() + BAN_DURATION);
            ipViolations.set(ip, violation);
            socket.emit("banned", { message: "You have been temporarily banned for 24 hours for repeated inappropriate language." });
            socket.disconnect(true);
            return;
         }
         ipViolations.set(ip, violation);
         data.content = filter.clean(data.content);
         socket.emit("warning", { message: `Warning: Inappropriate language detected. Strike ${violation.count}/3.` });
      } else if (data && data.content) {
         data.content = filter.clean(data.content);
      }

      io.to(data.roomId)
        .emit(

          "receive-message",

          data

        );

    }

  );

  socket.on(

    "message-seen",

    (data) => {

      socket.to(data.roomId)
        .emit(

          "message-seen-update",

          data.messageId

        );

    }

  );

  socket.on(

    "typing",

    (data) => {

      socket.to(data.roomId)
        .emit(

          "stranger-typing"

        );

    }

  );

  socket.on(

    "skip",

    (data) => {

      socket.to(data.roomId)
        .emit(

          "stranger-disconnected"

        );

    }

  );

  socket.on(

    "disconnect",

    () => {

      console.log(
        "user disconnected"
      );

      if (

        waitingUser &&

        waitingUser.socket.id ===
        socket.id

      ) {

        waitingUser = null;

      }

    }

  );

});

app.post("/admin/stats", (req, res) => {
  const { password } = req.body;
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const violations = Array.from(ipViolations.entries()).map(([ip, data]) => ({
    ip,
    count: data.count,
    bannedUntil: data.bannedUntil
  }));
  res.json({
    activeConnections: io.engine.clientsCount,
    violations
  });
});

app.post("/admin/unban", (req, res) => {
  const { password, ip } = req.body;
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  ipViolations.delete(ip);
  res.json({ success: true });
});

server.listen(8088, () => {

  console.log(
    "server running on 8088"
  );

});