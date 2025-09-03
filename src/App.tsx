import { useEffect, useState } from 'react';
import { RecordingService } from './RecordingService';
import { ScreenRecorder } from './ScreenRecorder';

const recorder = new ScreenRecorder();
const recordingService = new RecordingService(recorder);

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [fileSize, setFileSize] = useState(0);
  const [timeLimit, setTimeLimit] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);

  const handleStart = async () => {
    const timeLimitSeconds = timeLimit * 60;
    setRemainingTime(timeLimitSeconds);
    await recordingService.startRecording((size) => setFileSize(size));
    setIsRecording(true);
  };

  const handleStop = async () => {
    await recordingService.stopRecording();
    setIsRecording(false);
    setFileSize(0);
    setRemainingTime(0);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies(handleStop): suppress dependency handleStop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRecording && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            // Timer expired - stop recording
            handleStop();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording, remainingTime]);

  return (
    <div>
      <div>
        <label htmlFor="timeLimit">Time Limit (minutes):</label>
        <input
          id="timeLimit"
          type="number"
          min="0"
          max="60"
          value={timeLimit}
          onChange={(e) => setTimeLimit(Number(e.target.value))}
          disabled={isRecording}
        />
      </div>

      <div>
        <button type="button" onClick={handleStart} disabled={isRecording}>
          Start Recording
        </button>

        <button type="button" onClick={handleStop} disabled={!isRecording}>
          Stop Recording
        </button>
      </div>

      {isRecording && (
        <div>
          Recording size: <strong>{formatSize(fileSize)}</strong>
          {timeLimit > 0 && (
            <span>
              Time remaining: <strong>{formatTime(remainingTime)}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
