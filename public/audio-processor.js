class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.sampleRate = 16000; // Target sample rate for Gemini Live
        this.resampler = new Resampler(sampleRate, this.sampleRate, 1, 1024); // Simple resampler
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input.length > 0) {
            const monoChannel = input[0]; // Assuming mono input from microphone
            const downsampledAudio = this.resampler.resample(monoChannel);
            if (downsampledAudio.length > 0) {
                // Send raw 16-bit PCM audio
                const pcm16 = new Int16Array(downsampledAudio.length);
                for (let i = 0; i < downsampledAudio.length; i++) {
                    pcm16[i] = Math.max(-1, Math.min(1, downsampledAudio[i])) * 32767;
                }
                this.port.postMessage({ type: 'audioData', audioBuffer: pcm16.buffer }, [pcm16.buffer]);
            }
        }
        return true;
    }
}

// Basic Resampler implementation (you might want to use a more robust library for production)
class Resampler {
    constructor(fromSampleRate, toSampleRate, channels, outputBufferSize) {
        this.fromSampleRate = fromSampleRate;
        this.toSampleRate = toSampleRate;
        this.channels = channels;
        this.outputBufferSize = outputBufferSize;
        this.ratio = fromSampleRate / toSampleRate;
        this.tail = null;
    }

    resample(buffer) {
        const out = [];
        let offset = 0;
        let nextIndex = 0;

        if (this.tail) {
            buffer = new Float32Array(this.tail.length + buffer.length);
            buffer.set(this.tail, 0);
            buffer.set(buffer, this.tail.length);
            this.tail = null;
        }

        while (nextIndex < buffer.length) {
            const nextOffset = Math.round(nextIndex * this.ratio);
            if (nextOffset >= buffer.length) {
                this.tail = buffer.slice(nextIndex);
                break;
            }
            out.push(buffer[nextOffset]);
            nextIndex++;
        }
        return new Float32Array(out);
    }
}


registerProcessor('audio-processor', AudioProcessor);