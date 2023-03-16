import { useEffect, useRef, useState } from "react";

const useAudioVisualizer = (
  stream: MediaStream | null,
  recording: boolean,
) => {
  const [animationFrameId, setAnimationFrameId] = useState<number | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const source = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArray = useRef<Float32Array | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (recording && stream) {
      audioContext.current = new AudioContext();
      source.current = audioContext.current.createMediaStreamSource(
        stream as MediaStream,
      );
      analyser.current = audioContext.current.createAnalyser();
      source.current?.connect(analyser.current);
      dataArray.current = new Float32Array(
        analyser.current.frequencyBinCount,
      );
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
      const hue = (i / bufferLength) * 360;
      ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.8)`;
      recording &&
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }

    const id = requestAnimationFrame(draw);
    setAnimationFrameId(id);
  };

  return { canvasRef };
};

export default useAudioVisualizer;
