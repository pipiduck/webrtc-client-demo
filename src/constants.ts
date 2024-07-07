export const SIGNALING_SERVER = "ws://localhost:3322";

export const ICE_CONFIG = {
  iceServers: [
    { urls: ["stun:stun.ekiga.net:3478", "stun:stun.ekiga.net:3578"] },
    { urls: ["turn:turnserver.com"], username: "user", credential: "pass" },
  ]
};

export enum E_USER_NAME {
  Alice = "Alice",
  Bob = "Bob",
}

export enum E_SOCKET_CMD_SEND {
  candidate = "candidate",
  offer = "offer",
  answer = "answer",
  connected = "client-websocket-connected",
  calling = "calling", // 发起呼叫
  acceptCall = "accept-call", // 接受呼叫
  hangUp = "hang-up",
}

export enum E_SOCKET_CMD_RECIVE {
  calling = "calling", // 被动呼叫，建立webrtc连接
  acceptCall = "accept-call", // 接受呼叫
  offer = "offer",
  answer = "answer",
  candidate = "candidate",
  hangUp = "hang-up",
}
