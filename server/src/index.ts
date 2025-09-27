import express from "express";
import http from "http";
import cors from "cors";
import { Server as IOServer } from "socket.io";
import { roomStore } from "@/lib/roomStore";

const app = express();
app.use(cors({ origin: true, credentials: true }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const server = http.createServer(app);
const io = new IOServer(server, {
  path: "/api/socket",
  cors: { origin: true, credentials: true },
});

io.on("connection", (socket) => {
  socket.on("room:create", ({ name }: { name: string }) => {
    const snapshot = roomStore.createRoom(socket.id, name);
    socket.join(snapshot.code);
    io.to(snapshot.code).emit("room:update", snapshot);
  });

  socket.on("room:join", ({ code, name }: { code: string; name: string }) => {
    const result = roomStore.joinRoom(code, socket.id, name);
    if (!result.ok) {
      socket.emit("room:error", result.reason);
      return;
    }
    socket.join(result.snapshot.code);
    io.to(result.snapshot.code).emit("room:update", result.snapshot);
  });

  socket.on("room:start", ({ code }: { code: string }) => {
    const outcome = roomStore.startGame(code, socket.id);
    if (!outcome.ok) {
      socket.emit("room:error", outcome.reason);
      return;
    }
    io.to(code).emit("room:update", outcome.snapshot);
  });

  socket.on("room:next-level", ({ code }: { code: string }) => {
    const outcome = roomStore.nextLevel(code, socket.id);
    if (!outcome.ok) {
      socket.emit("room:error", outcome.reason);
      return;
    }
    io.to(code).emit("room:update", outcome.snapshot);
  });

  socket.on("room:answer", ({ code, optionIndex }: { code: string; optionIndex: number }) => {
    const result = roomStore.submitAnswer(code, socket.id, optionIndex);
    if (!result.ok) {
      socket.emit("room:error", result.reason);
      return;
    }
    io.to(code).emit("room:update", result.snapshot);
  });

  socket.on("room:snapshot", ({ code }: { code: string }) => {
    const snap = roomStore.snapshot(code);
    if (snap) {
      socket.emit("room:update", snap);
    } else {
      socket.emit("room:error", "room-not-found");
    }
  });

  socket.on("disconnect", () => {
    const left = roomStore.leaveRoom(socket.id);
    if (left && left.snapshot) {
      io.to(left.code).emit("room:update", left.snapshot);
    }
  });
});

const PORT = Number(process.env.PORT || 8080);
server.listen(PORT, () => {
  /* eslint-disable no-console */
  console.log(`Socket server listening on :${PORT}`);
});


