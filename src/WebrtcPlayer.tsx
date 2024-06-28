import React, { useState, useRef, useEffect } from "react";
import { Socket } from "./utils/socket";
import { Webrtc } from "./utils/webrtc";
import {
  E_SOCKET_CMD_RECIVE,
  E_USER_NAME,
  SIGNALING_SERVER,
} from "./constants";

const getLocalRemoteID = (user) => {
  return user === E_USER_NAME.Alice
    ? { localID: E_USER_NAME.Alice, remoteID: E_USER_NAME.Bob }
    : { localID: E_USER_NAME.Bob, remoteID: E_USER_NAME.Alice };
};
const { localID, remoteID } = getLocalRemoteID(__USER_IDENTITY__);

export const WebrtcPlayer = () => {
  const [isCalling, setIsCalling] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const webrtcRef = useRef<Webrtc | null>(null);

  useEffect(() => {
    // 与信令服务器建立ws连接
    const wsUrl = `${SIGNALING_SERVER}?user=${__USER_IDENTITY__}`;
    socketRef.current = new Socket(wsUrl, {
      onMessage: onSocketMsg,
    });

    return () => {
      socketRef.current?.close();
    };
  }, []);

  async function callAnother() {
    // 发送呼叫消息
    // socketRef.current?.send({
    //   cmd: E_SOCKET_CMD_RECIVE.calling,
    //   payload: {
    //     from: localID,
    //     to: remoteID,
    //   },
    // });
    start("active");
  }

  async function start(type: "active" | "passive" = "active", offer?: RTCSessionDescriptionInit) {
    setIsCalling(true);
    // 获取浏览器摄像头与音频流
    // streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    // 建立webrtc连接
    webrtcRef.current = new Webrtc({
      media: videoRef.current,
      stream: streamRef.current,
      signal: socketRef.current,
      localID,
      remoteID,
      localStream: streamRef.current,
    });

    if(type === "active"){
      webrtcRef.current.startActive();
    }
    if(type === "passive"){
      webrtcRef.current.startPassive(offer);
    }

    webrtcRef.current.sendMediaStream();
  }

  function stop() {
    setIsCalling(false);
  }

  const onSocketMsg = async (e: MessageEvent) => {
    const { cmd, payload } = JSON.parse(e.data);
    console.log(2333, cmd, payload);
    switch (cmd) {
      case E_SOCKET_CMD_RECIVE.offer:
          // 被呼叫方，收到offer建立连接
          start("passive", payload.offer)
        break;
      case E_SOCKET_CMD_RECIVE.answer:
         webrtcRef.current?.setAnswer(payload.answer);
        break;
      case E_SOCKET_CMD_RECIVE.candidate:
        webrtcRef.current?.setCandidate(payload.candidate);
        break;
      default:
        console.log("unknown cmd", cmd);
        break;
    }
  };

  return (
    <div>
      <div>
        <button disabled={isCalling} onClick={callAnother}>
          Call{" "}
          {__USER_IDENTITY__ === E_USER_NAME.Alice
            ? E_USER_NAME.Bob
            : E_USER_NAME.Alice}
        </button>
        <button
          style={{ marginLeft: "30px" }}
          disabled={!isCalling}
          onClick={stop}
        >
          Hang Up
        </button>
      </div>
      <video ref={videoRef} autoPlay id="rtc-video"></video>
    </div>
  );
};
