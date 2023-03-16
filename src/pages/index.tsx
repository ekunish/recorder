import { useEffect, useRef, useState } from "react";
import useRecorder from "../hooks/useRecorder";
import useAudioVisualizer from "../hooks/useAudioVisualizer";

const Home = () => {
  const [audioURL, setAudioURL] = useState("");
  const {
    recording,
    stream,
    startRecording,
    stopRecording,
    elapsedTime,
    getDownloadFilename,
  } = useRecorder(setAudioURL);

  const { canvasRef } = useAudioVisualizer(stream, recording);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="fixed top-24 z-10">
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`mb-4 w-32 py-2 text-white rounded-full ${
            recording ? "bg-red-500" : "bg-blue-500"
          }`}
        >
          {recording
            ? (
              <div>
                {Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60)
                  .padStart(
                    2,
                    "0",
                  )}
              </div>
            )
            : "録音開始"}
        </button>
      </div>

      {audioURL && !recording && (
        <div className="mb-4">
          <audio controls src={audioURL} />
          <a
            href={audioURL}
            download={getDownloadFilename()}
            className="block mt-3 text-blue-500 text-center"
          >
            録音した音声をダウンロード
          </a>
        </div>
      )}

      {recording && (
        <div className="text-center">
          <canvas
            ref={canvasRef}
            width="640"
            height="300"
            className="border-none bg-gray-800 shadow-gray-600 rounded-sm"
          >
          </canvas>
        </div>
      )}
    </div>
  );
};

export default Home;
