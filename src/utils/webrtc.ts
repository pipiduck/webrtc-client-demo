import { E_SOCKET_CMD_SEND, ICE_CONFIG } from "../constants";
import { Socket } from "./socket";

interface IWebrtcOptions {
  media: HTMLVideoElement; // 播放视频流容器
  stream?: MediaStream; // 本地视频流
  signal: Socket;
  localID: string; // 本地用户id
  remoteID: string; // 远端用户id
  localStream?: MediaStream; // 本地视频流
}

export class Webrtc {
  private media: HTMLVideoElement | null;
  private peerConnection: RTCPeerConnection;
  private signal: Socket;
  private localID: string;
  private remoteID: string;
  private localStream: MediaStream;

  constructor(options: IWebrtcOptions) {
    this.media = options.media;
    this.signal = options.signal;
    this.localID = options.localID;
    this.remoteID = options.remoteID;
    this.localStream = options.localStream;
  }

  async startActive() {
    this.createPeerConnection();
    this.sendOffer();
  }

  async startPassive(offer: RTCSessionDescriptionInit) {
    if (!offer) {
      console.log("offer is null");
      return;
    }
    this.createPeerConnection();
    console.log(2333, __USER_IDENTITY__, "setRemoteDescription(offer)");
    this.peerConnection.setRemoteDescription(offer);
    this.sendAnswer();
  }

  async setAnswer(answer: RTCSessionDescriptionInit) {
    if (!answer) return;
    console.log(
      2333,
      __USER_IDENTITY__,
      "setRemoteDescription(answer)"
    );
    await this.peerConnection.setRemoteDescription(answer);
  }

  async setCandidate(candidate) {
    if (!candidate) return;
    console.log("addIceCandidate", candidate);
    await this.peerConnection.addIceCandidate(candidate);
  }

  async stop() {
    this.peerConnection.close();
    console.log(2333, __USER_IDENTITY__, "peerConnection.close");
  }

  private createPeerConnection() {
    const peerConnection = new RTCPeerConnection(); // ICE_CONFIG
    console.log(2333, __USER_IDENTITY__, "createPeerConnection");
    // 获取本机ice，并发送给信令服务器
    peerConnection.onicecandidate = (e) => {
      console.log("onicecandidate", e);
      if (e.candidate) {
        // https://developer.mozilla.org/zh-CN/docs/Web/API/RTCPeerConnection/addIceCandidate
        this.signal.send({
          cmd: E_SOCKET_CMD_SEND.candidate,
          payload: {
            from: this.localID,
            to: this.remoteID,
            candidate: {
              candidate: e.candidate.candidate,
              sdpMid: e.candidate.sdpMid,
              sdpMLineIndex: e.candidate.sdpMLineIndex,
            },
          },
        });
      } else {
        console.log("All ICE candidates have been sent");
      }
    };
    peerConnection.onicegatheringstatechange = (e) => {
      console.log("ice state change", e);
    };
    // 获取远端视频流并播放
    peerConnection.ontrack = (e) => {
      this.media.srcObject = e.streams[0];
    };

    // 必须在createOffer前提供媒体流，否则创建的sdp将缺少media信息，收集ice的流程也不会开启
    // https://stackoverflow.com/questions/27489881/webrtc-never-fires-onicecandidate/27758788#27758788
    if (!this.localStream) {
      console.log("localStream is null");
      return;
    }
    this.localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, this.localStream);
    });
    console.log(2333, __USER_IDENTITY__, "peerConnection.addTrack");

    this.peerConnection = peerConnection;
  }

  private async sendOffer() {
    // 创建offer并发送给对端
    console.log(2333, __USER_IDENTITY__, "createOffer");
    const offer = await this.peerConnection.createOffer();
    this.signal.send({
      cmd: E_SOCKET_CMD_SEND.offer,
      payload: { from: this.localID, to: this.remoteID, offer },
    });
    console.log(2333, __USER_IDENTITY__, "send Offer");
    // setLocalDescription 后才会触发收集ice流程
    this.peerConnection.setLocalDescription(offer);
    console.log(2333, __USER_IDENTITY__, "setLocalDescription(offer)");
  }

  private async sendAnswer() {
    console.log(2333, __USER_IDENTITY__, "createAnswer");
    const answer = await this.peerConnection.createAnswer();
    this.signal.send({
      cmd: E_SOCKET_CMD_SEND.answer,
      payload: { from: this.localID, to: this.remoteID, answer },
    });
    console.log(2333, __USER_IDENTITY__, "send answer");
    await this.peerConnection.setLocalDescription(answer);
    console.log(2333, __USER_IDENTITY__, "setLocalDescription(answer)");
  }
}
