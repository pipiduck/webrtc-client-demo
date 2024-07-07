import React, { useState, useRef, useEffect } from "react";
import { Socket } from "./utils/socket";
import { Webrtc } from "./utils/webrtc";
import {
  E_SOCKET_CMD_RECIVE,
  E_SOCKET_CMD_SEND,
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
  const [isShowVideo, setIsShowVideo] = useState(false);
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

  async function call(type: "active" | "passive" = "active") {
    // getUserMedia 本地摄像头
    // getDisplayMedia 浏览器录屏
    streamRef.current = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    socketRef.current.send({
      cmd:
        type === "active"
          ? E_SOCKET_CMD_SEND.calling
          : E_SOCKET_CMD_SEND.acceptCall,
      payload: { from: localID, to: remoteID },
    });
  }

  async function start(
    type: "active" | "passive" = "active",
    offer?: RTCSessionDescriptionInit
  ) {
    setIsCalling(true);
    // 建立webrtc连接
    webrtcRef.current = new Webrtc({
      media: videoRef.current,
      stream: streamRef.current,
      signal: socketRef.current,
      localID,
      remoteID,
      localStream: streamRef.current,
    });

    if (type === "active") {
      webrtcRef.current.startActive();
    }
    if (type === "passive") {
      webrtcRef.current.startPassive(offer);
    }
    setIsShowVideo(true);
  }

  function stop(isActive: boolean = true) {
    // websocket通知对端结束通话
    isActive &&
      socketRef.current.send({
        cmd: E_SOCKET_CMD_SEND.hangUp,
        payload: { from: localID, to: remoteID },
      });
    // 关闭webrtc连接
    if (webrtcRef.current) {
      webrtcRef.current.stop();
      webrtcRef.current = null;
    }
    // 停止获取媒体流
    if (!streamRef.current) return;
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    setIsCalling(false);
    setIsShowVideo(false);
  }

  const onSocketMsg = async (e: MessageEvent) => {
    const { cmd, payload } = JSON.parse(e.data);
    switch (cmd) {
      case E_SOCKET_CMD_RECIVE.calling:
        // 被呼叫方接听电话
        call("passive");
        break;
      case E_SOCKET_CMD_RECIVE.acceptCall:
        start("active");
        break;
      case E_SOCKET_CMD_RECIVE.offer:
        // 被呼叫方，收到offer建立连接
        start("passive", payload.offer);
        break;
      case E_SOCKET_CMD_RECIVE.answer:
        webrtcRef.current?.setAnswer(payload.answer);
        break;
      case E_SOCKET_CMD_RECIVE.candidate:
        webrtcRef.current?.setCandidate(payload.candidate);
        break;
      case E_SOCKET_CMD_RECIVE.hangUp:
        stop(false);
        break;
      default:
        console.log("unknown cmd", cmd);
        break;
    }
  };

  return (
    <div>
      <div>
        <button
          style={{ marginLeft: "30px" }}
          disabled={isCalling}
          onClick={() => call("active")}
        >
          Call{" "}
          {__USER_IDENTITY__ === E_USER_NAME.Alice
            ? E_USER_NAME.Bob
            : E_USER_NAME.Alice}
        </button>
        <button
          style={{ marginLeft: "30px" }}
          disabled={!isCalling}
          onClick={() => stop()}
        >
          Hang Up
        </button>
      </div>
      <video
        style={{ display: isShowVideo ? "block" : "none", marginTop: "30px" }}
        ref={videoRef}
        autoPlay
        id="rtc-video"
      ></video>
    </div>
  );
};
