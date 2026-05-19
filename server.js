const express = require("express");

const http = require("http");

const { Server } = require("socket.io");

const cors = require("cors");

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {

  cors: {

    origin: "*"

  }

});

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

server.listen(8088, () => {

  console.log(
    "server running on 8088"
  );

});