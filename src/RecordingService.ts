import type { IScreenRecorder } from './ScreenRecorder';

export class RecordingService {
  constructor(private recorder: IScreenRecorder) {}

  async startRecording(onData?: (sizeInBytes: number) => void): Promise<void> {
    await this.recorder.start(onData);
  }

  async stopRecording(): Promise<void> {
    const blob = await this.recorder.stop();
    if (blob) {
      this.download(blob);
    }
  }

  private download(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording_${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
