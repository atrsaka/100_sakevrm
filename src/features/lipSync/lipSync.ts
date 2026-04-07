import { LipSyncAnalyzeResult } from "./lipSyncAnalyzeResult";

const TIME_DOMAIN_DATA_LENGTH = 2048;
const STREAM_LEAD_TIME_SECONDS = 0.05;

type PcmStreamOptions = {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
};

export class LipSync {
  public readonly audio: AudioContext;
  public readonly analyser: AnalyserNode;
  public readonly timeDomainData: Float32Array<ArrayBuffer>;
  private _activeSources = new Set<AudioBufferSourceNode>();
  private _scheduledPlaybackTime = 0;
  private _isStreaming = false;
  private _hasQueuedStreamingAudio = false;
  private _pendingPcmBytes = new Uint8Array(0);
  private _streamOptions?: PcmStreamOptions;
  private _streamFormatKey = "";
  private _streamFinishedPromise?: Promise<void>;
  private _resolveStreamFinished?: () => void;

  public constructor(audio: AudioContext) {
    this.audio = audio;

    this.analyser = audio.createAnalyser();
    this.timeDomainData = new Float32Array(
      new ArrayBuffer(TIME_DOMAIN_DATA_LENGTH * Float32Array.BYTES_PER_ELEMENT)
    );
  }

  public update(): LipSyncAnalyzeResult {
    this.analyser.getFloatTimeDomainData(
      this.timeDomainData as Float32Array<ArrayBuffer>
    );

    let volume = 0.0;
    for (let i = 0; i < TIME_DOMAIN_DATA_LENGTH; i++) {
      volume = Math.max(volume, Math.abs(this.timeDomainData[i]));
    }

    // cook
    volume = 1 / (1 + Math.exp(-45 * volume + 5));
    if (volume < 0.1) volume = 0;

    return {
      volume,
    };
  }

  public isPlaying(): boolean {
    return this._activeSources.size > 0 || this._hasQueuedStreamingAudio;
  }

  public async playFromArrayBuffer(buffer: ArrayBuffer, onEnded?: () => void) {
    this.stop();
    await this.ensureAudioReady();
    const audioBuffer = await this.audio.decodeAudioData(buffer);
    this.scheduleAudioBuffer(audioBuffer, this.audio.currentTime, onEnded);
  }

  public async playFromURL(url: string, onEnded?: () => void) {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    this.playFromArrayBuffer(buffer, onEnded);
  }

  public async beginStreaming() {
    this.stop();
    await this.ensureAudioReady();

    this._isStreaming = true;
    this._hasQueuedStreamingAudio = false;
    this._pendingPcmBytes = new Uint8Array(0);
    this._streamOptions = undefined;
    this._streamFormatKey = "";
    this._scheduledPlaybackTime = this.audio.currentTime + STREAM_LEAD_TIME_SECONDS;
    this._streamFinishedPromise = new Promise<void>((resolve) => {
      this._resolveStreamFinished = resolve;
    });
  }

  public enqueuePCMChunk(buffer: Uint8Array, mimeType: string) {
    const options = parsePcmMimeType(mimeType);
    const formatKey = serializePcmOptions(options);

    if (this._streamFormatKey && this._streamFormatKey !== formatKey) {
      throw new Error("Gemini Live changed audio formats mid-stream.");
    }

    this._streamOptions = options;
    this._streamFormatKey = formatKey;

    const playableBytes = this.extractPlayablePCMBytes(buffer, options);
    if (!playableBytes) {
      return;
    }

    const audioBuffer = this.createAudioBufferFromPCM(playableBytes, options);
    const startAt = Math.max(
      this.audio.currentTime + STREAM_LEAD_TIME_SECONDS,
      this._scheduledPlaybackTime
    );

    this._isStreaming = true;
    this._hasQueuedStreamingAudio = true;
    this._scheduledPlaybackTime = startAt + audioBuffer.duration;
    this.scheduleAudioBuffer(audioBuffer, startAt);
  }

  public async finishStreaming() {
    this.flushPendingPCMBytes();
    this._isStreaming = false;

    if (!this._hasQueuedStreamingAudio) {
      this.resetStreamingState();
      return;
    }

    this.tryResolveStreamingPromise();
    await this._streamFinishedPromise;
  }

  public stop() {
    for (const source of this._activeSources) {
      try {
        source.stop();
      } catch {
        // Ignore sources that have already ended.
      }

      source.disconnect();
    }

    this._activeSources.clear();
    this.resolveStreamingPromise();
    this.resetStreamingState();
  }

  public async dispose() {
    this.stop();

    if (this.audio.state === "closed") {
      return;
    }

    try {
      await this.audio.close();
    } catch {
      // Ignore duplicate close or browser-specific disposal failures.
    }
  }

  private async ensureAudioReady() {
    const initialState = this.audio.state;
    if (initialState === "running") {
      return;
    }

    try {
      await this.audio.resume();
    } catch {
      throw new Error(
        "Audio playback was blocked by the browser. Click the page once and try again."
      );
    }

    const resumedState = this.audio.state;
    if (resumedState !== "running") {
      throw new Error(
        "Audio playback was blocked by the browser. Click the page once and try again."
      );
    }
  }

  private scheduleAudioBuffer(
    audioBuffer: AudioBuffer,
    startAt: number,
    onEnded?: () => void
  ) {
    const bufferSource = this.audio.createBufferSource();
    bufferSource.buffer = audioBuffer;

    bufferSource.connect(this.audio.destination);
    bufferSource.connect(this.analyser);

    this._activeSources.add(bufferSource);
    bufferSource.addEventListener(
      "ended",
      () => {
        this._activeSources.delete(bufferSource);
        bufferSource.disconnect();
        onEnded?.();
        this.tryResolveStreamingPromise();
      },
      { once: true }
    );
    bufferSource.start(startAt);
  }

  private createAudioBufferFromPCM(
    buffer: Uint8Array,
    options: PcmStreamOptions
  ): AudioBuffer {
    if (options.bitsPerSample !== 16) {
      throw new Error(
        `Unsupported PCM bit depth "${options.bitsPerSample}". Expected 16-bit PCM.`
      );
    }

    const bytesPerSample = options.bitsPerSample / 8;
    const bytesPerFrame = bytesPerSample * options.numChannels;
    const totalSamples = buffer.byteLength / bytesPerFrame;
    const audioBuffer = this.audio.createBuffer(
      options.numChannels,
      totalSamples,
      options.sampleRate
    );
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    for (let channelIndex = 0; channelIndex < options.numChannels; channelIndex += 1) {
      const channelData = audioBuffer.getChannelData(channelIndex);
      for (let sampleIndex = 0; sampleIndex < totalSamples; sampleIndex += 1) {
        const offset =
          (sampleIndex * options.numChannels + channelIndex) * bytesPerSample;
        channelData[sampleIndex] = view.getInt16(offset, true) / 32768;
      }
    }

    return audioBuffer;
  }

  private extractPlayablePCMBytes(
    buffer: Uint8Array,
    options: PcmStreamOptions
  ): Uint8Array | null {
    const bytesPerFrame = (options.bitsPerSample / 8) * options.numChannels;
    const merged =
      this._pendingPcmBytes.length > 0
        ? concatUint8Arrays(this._pendingPcmBytes, buffer)
        : buffer;
    const playableLength = merged.byteLength - (merged.byteLength % bytesPerFrame);

    if (playableLength <= 0) {
      this._pendingPcmBytes = merged.slice();
      return null;
    }

    this._pendingPcmBytes =
      playableLength === merged.byteLength
        ? new Uint8Array(0)
        : merged.slice(playableLength);

    return merged.slice(0, playableLength);
  }

  private flushPendingPCMBytes() {
    if (!this._streamOptions || this._pendingPcmBytes.length === 0) {
      return;
    }

    const bytesPerFrame =
      (this._streamOptions.bitsPerSample / 8) * this._streamOptions.numChannels;
    const paddedBytes = new Uint8Array(bytesPerFrame);
    paddedBytes.set(this._pendingPcmBytes);
    this._pendingPcmBytes = new Uint8Array(0);

    const audioBuffer = this.createAudioBufferFromPCM(
      paddedBytes,
      this._streamOptions
    );
    const startAt = Math.max(
      this.audio.currentTime + STREAM_LEAD_TIME_SECONDS,
      this._scheduledPlaybackTime
    );

    this._hasQueuedStreamingAudio = true;
    this._scheduledPlaybackTime = startAt + audioBuffer.duration;
    this.scheduleAudioBuffer(audioBuffer, startAt);
  }

  private tryResolveStreamingPromise() {
    if (this._isStreaming || this._activeSources.size > 0) {
      return;
    }

    this.resolveStreamingPromise();
    this.resetStreamingState();
  }

  private resolveStreamingPromise() {
    this._resolveStreamFinished?.();
    this._resolveStreamFinished = undefined;
    this._streamFinishedPromise = undefined;
  }

  private resetStreamingState() {
    this._isStreaming = false;
    this._hasQueuedStreamingAudio = false;
    this._pendingPcmBytes = new Uint8Array(0);
    this._streamOptions = undefined;
    this._streamFormatKey = "";
    this._scheduledPlaybackTime = this.audio.currentTime;
  }
}

function parsePcmMimeType(mimeType: string): PcmStreamOptions {
  if (!mimeType) {
    throw new Error("Gemini Live audio format was missing.");
  }

  const [fileType = "", ...params] = mimeType
    .split(";")
    .map((value) => value.trim());
  const [, rawFormat = "PCM"] = fileType.split("/");
  const format = rawFormat.toUpperCase();

  const options: PcmStreamOptions = {
    numChannels: 1,
    sampleRate: 24000,
    bitsPerSample: 16,
  };

  if (format === "PCM") {
    options.bitsPerSample = 16;
  } else if (format.startsWith("L")) {
    const bitsPerSample = Number.parseInt(format.slice(1), 10);
    if (!Number.isNaN(bitsPerSample)) {
      options.bitsPerSample = bitsPerSample;
    }
  } else {
    throw new Error(`Unsupported Gemini Live audio format "${mimeType}".`);
  }

  for (const param of params) {
    const [key, value] = param.split("=").map((item) => item.trim());
    if (key === "rate") {
      const sampleRate = Number.parseInt(value, 10);
      if (!Number.isNaN(sampleRate)) {
        options.sampleRate = sampleRate;
      }
    }

    if (key === "channels") {
      const numChannels = Number.parseInt(value, 10);
      if (!Number.isNaN(numChannels)) {
        options.numChannels = numChannels;
      }
    }
  }

  validatePcmOptions(options, mimeType);
  return options;
}

function validatePcmOptions(options: PcmStreamOptions, mimeType: string) {
  if (
    !Number.isInteger(options.numChannels) ||
    options.numChannels <= 0 ||
    !Number.isInteger(options.sampleRate) ||
    options.sampleRate <= 0 ||
    !Number.isInteger(options.bitsPerSample) ||
    options.bitsPerSample <= 0
  ) {
    throw new Error(`Invalid Gemini Live audio format "${mimeType}".`);
  }

  if (options.bitsPerSample !== 16) {
    throw new Error(
      `Unsupported Gemini Live audio format "${mimeType}". Expected 16-bit PCM.`
    );
  }
}

function serializePcmOptions(options: PcmStreamOptions): string {
  return `${options.sampleRate}:${options.numChannels}:${options.bitsPerSample}`;
}

function concatUint8Arrays(first: Uint8Array, second: Uint8Array): Uint8Array {
  const merged = new Uint8Array(first.byteLength + second.byteLength);
  merged.set(first, 0);
  merged.set(second, first.byteLength);
  return merged;
}
