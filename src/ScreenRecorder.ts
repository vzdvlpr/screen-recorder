export interface IScreenRecorder {
  start(onData?: (sizeInBytes: number) => void): Promise<void>;
  stop(): Promise<Blob | null>;
}

export class ScreenRecorder implements IScreenRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private onDataCallback?: (sizeInBytes: number) => void;
  private totalSize = 0;

  async start(onData?: (sizeInBytes: number) => void): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        // @ts-ignore
        preferCurrentTab: true,
        audio: false,
      });

      this.recordedChunks = [];
      this.totalSize = 0;
      this.onDataCallback = onData;

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'video/webm; codecs=vp9',
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
          this.totalSize += event.data.size;
          if (this.onDataCallback) {
            this.onDataCallback(this.totalSize);
          }
        }
      };

      this.mediaRecorder.start(1000); // request data every 1 second
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  async stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        this.cleanup();
        resolve(blob);
      };

      this.mediaRecorder.stop();
      this.stream?.getTracks().forEach((track) => track.stop());
    });
  }

  private cleanup() {
    this.mediaRecorder = null;
    this.stream = null;
    this.recordedChunks = [];
    this.totalSize = 0;
    this.onDataCallback = undefined;
  }
}
