import type { NextApiRequest } from "next";
import type { NextApiResponseServerIO } from "../../types/next";
import { Server as NetServer } from "http";
import { Server as IOServer } from "socket.io";
import { roomStore } from "@/lib/roomStore";

type ServerWithIO = NetServer & { io?: IOServer };

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket) {
    res.status(500).end();
    return;
  }
  const server = res.socket.server as unknown as { io?: IOServer } & { httpServer?: ServerWithIO };
  if (!server.io) {
    const io = new IOServer(res.socket.server as unknown as ServerWithIO, {
      path: "/api/socket",
      cors: { origin: true, credentials: true },
    });
    server.io = io;

    io.on("connection", (socket) => {
      socket.on("room:create", ({ code, name }: { code: string; name: string }) => {
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
        const current = roomStore.snapshot(code);
        if (!current) {
          socket.emit("room:error", "room-not-found");
          return;
        }
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
  }
  res.end();
}


