import { E_SOCKET_CMD_SEND } from "../constants";

interface ISocketOptions {
  onMessage?: (e: MessageEvent) => void;
  onOpen?: (e: Event) => void;
}

export class Socket {
  private socket: WebSocket;
  private options: ISocketOptions | null;

  constructor(url: string, options?: ISocketOptions) {
    this.options = options || null;
    const connection = new WebSocket(url);
    connection.onmessage = this.onMessage.bind(this);
    connection.onopen = this.onOpen.bind(this);
    connection.onerror = this.onError.bind(this);
    this.socket = connection;
  }

  send(data: { cmd: string; payload?: any }) {
    this.socket.send(JSON.stringify(data));
    console.log("socket send", data);
  }

  close() {
    this.socket.close();
  }

  private onMessage(e: MessageEvent) {
    console.log("socket onMessage", e);
    this?.options?.onMessage && this.options.onMessage(e);
  }

  private onOpen(e: Event) {
    console.log("socket established", e);
    this.send({ cmd: E_SOCKET_CMD_SEND.connected }); // 建立ws连接成功后发送消息给服务端
  }

  private onError(e: Event) {
    console.log("socket error", e);
  }
}
