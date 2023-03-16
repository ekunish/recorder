import { useEffect, useRef, useState } from "react";

const Home = () => {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [animationFrameId, setAnimationFrameId] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const dataArray = useRef<Float32Array | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContext.current = new AudioContext();
      analyser.current = audioContext.current.createAnalyser();
      dataArray.current = new Float32Array(analyser.current.frequencyBinCount);
    }
  }, []);

  useEffect(() => {
    if (recording && stream) {
      draw();
    } else {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        setAnimationFrameId(null);
      }
    }
  }, [recording, stream]);

  const draw = () => {
    if (!analyser.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const barWidth = (canvas.width / bufferLength) * 2.5;

    analyser.current.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i] / 2;
      ctx.fillStyle = `rgba(${dataArray[i]}, 50, 50, 0.8)`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }

    const id = requestAnimationFrame(draw);
    setAnimationFrameId(id);
  };

  const startRecording = async () => {
    if (!audioContext.current || !analyser.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const source = audioContext.current.createMediaStreamSource(stream);
    source.connect(analyser.current);
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
    setStream(stream);

    setElapsedTime(0);
    const timer = setInterval(() => {
      setElapsedTime((prevElapsedTime) => prevElapsedTime + 1);
    }, 1000);
    setTimerId(timer);

  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setRecording(false);
    }

    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      setAnimationFrameId(null);
    }

    if (timerId !== null) {
      clearInterval(timerId);
      setTimerId(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <button
        onClick={recording ? stopRecording : startRecording}
        className={`mb-4 px-4 py-2 text-white ${
          recording ? "bg-red-500" : "bg-blue-500"
        }`}
      >
        {recording ? "録音を停止" : "録音を開始"}
      </button>
      {recording && (
        <div className="mt-2">
          録音時間:{" "}
          {Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(
            2,
            "0",
          )}
        </div>
      )}
      {audioURL && (
        <div className="mb-4">
          <audio controls src={audioURL} />
          <a
            href={audioURL}
            download="recording.webm"
            className="block mt-2 text-blue-500"
          >
            録音した音声をダウンロード
          </a>
        </div>
      )}
      <canvas ref={canvasRef} width="640" height="300" className="border">
      </canvas>
    </div>
  );
};

export default Home;
