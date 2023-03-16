import { useEffect, useRef, useState } from "react";

const useRecorder = (setAudioURL: (url: string) => void) => {
  const [recording, setRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (recording) {
      setElapsedTime(0);
      const timer = setInterval(() => {
        setElapsedTime((prevElapsedTime) => prevElapsedTime + 1);
      }, 1000);
      setTimerId(timer);
    } else {
      if (timerId !== null) {
        clearInterval(timerId);
        setTimerId(null);
      }
    }

    return () => {
      if (timerId !== null) {
        clearInterval(timerId);
        setTimerId(null);
      }
    };
  }, [recording]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setStream(stream);

    mediaRecorder.current = new MediaRecorder(stream);

    const chunks: BlobPart[] = [];

    mediaRecorder.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.current.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      setAudioURL(URL.createObjectURL(blob));
    };

    mediaRecorder.current.start();
    setRecording(true);

    const now = new Date();
    setStartTime(now);
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setRecording(false);
    }

    if (timerId !== null) {
      clearInterval(timerId);
      setTimerId(null);
    }
  };

  const getDownloadFilename = () => {
    if (startTime) {
      const year = startTime.getFullYear();
      const month = String(startTime.getMonth() + 1).padStart(2, "0");
      const date = String(startTime.getDate()).padStart(2, "0");
      const hours = String(startTime.getHours()).padStart(2, "0");
      const minutes = String(startTime.getMinutes()).padStart(2, "0");

      return `${year}${month}${date}${hours}${minutes}.webm`;
    }
    return "recording.webm";
  };

  return {
    recording,
    stream,
    startRecording,
    stopRecording,
    elapsedTime,
    getDownloadFilename,
  };
};

export default useRecorder;
