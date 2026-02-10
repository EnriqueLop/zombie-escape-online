/**
 * Zombie Escape Online
 * Audio Controller - Retro Synth
 */

import { logger } from "./utils/logger.js";

export class SoundManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.masterGain = null;
        this.sequencer = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3; // Default volume
            this.masterGain.connect(this.ctx.destination);

            this.sequencer = new MusicSequencer(this.ctx, this.masterGain);
            this.initialized = true;
            logger.debug("Audio initialized");
        } catch (e) {
            logger.error("Web Audio API not supported", e);
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(
                this.isMuted ? 0 : 0.3,
                this.ctx.currentTime,
                0.1
            );
        }
        return this.isMuted;
    }

    startMusic() {
        if (!this.initialized) this.init();
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        if (this.sequencer) {
            this.sequencer.start();
        }
    }

    stopMusic() {
        if (this.sequencer) {
            this.sequencer.stop();
        }
    }
}

class MusicSequencer {
    constructor(ctx, output) {
        this.ctx = ctx;
        this.output = output;
        this.isPlaying = false;
        this.tempo = 120;
        this.noteTime = 0;
        this.lookahead = 25.0; // ms
        this.scheduleAheadTime = 0.1; // s
        this.currentNote = 0;
        this.nextNoteTime = 0.0;
        this.timerID = null;

        // Simple retro melody (C minor pentatonic-ish)
        // Note numbers: MIDI (60 = C4)
        this.sequence = [
            { note: 48, len: 0.5 }, { note: 51, len: 0.5 }, { note: 55, len: 0.5 }, { note: 48, len: 0.5 },
            { note: 51, len: 0.5 }, { note: 55, len: 0.5 }, { note: 58, len: 0.5 }, { note: 55, len: 0.5 },
            { note: 48, len: 0.5 }, { note: 48, len: 0.5 }, { note: 60, len: 0.5 }, { note: 58, len: 0.5 },
            { note: 55, len: 0.5 }, { note: 51, len: 0.5 }, { note: 48, len: 1.0 }, { note: -1, len: 0.5 }
        ];
    }

    freqFromMidi(note) {
        return 440 * Math.pow(2, (note - 69) / 12);
    }

    nextNote() {
        const secondsPerBeat = 60.0 / this.tempo;
        // Advance current note index
        const currentStep = this.sequence[this.currentNote];
        this.nextNoteTime += currentStep.len * secondsPerBeat;

        this.currentNote++;
        if (this.currentNote === this.sequence.length) {
            this.currentNote = 0;
        }
    }

    scheduleNote(noteIndex, time) {
        const step = this.sequence[noteIndex];
        if (step.note === -1) return; // Rest

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.output);

        osc.type = 'square'; // 8-bit sound
        osc.frequency.value = this.freqFromMidi(step.note);

        const volume = 0.1;
        const length = (60.0 / this.tempo) * step.len;

        // Envelope
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + length - 0.05);

        osc.start(time);
        osc.stop(time + length);
    }

    scheduler() {
        while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.currentNote, this.nextNoteTime);
            this.nextNote();
        }
        this.timerID = window.setTimeout(this.scheduler.bind(this), this.lookahead);
    }

    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.currentNote = 0;
        this.nextNoteTime = this.ctx.currentTime + 0.1;
        this.scheduler();
    }

    stop() {
        this.isPlaying = false;
        window.clearTimeout(this.timerID);
    }
}
