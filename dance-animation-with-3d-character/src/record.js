// @ts-check

import * as Babylon from '@babylonjs/core';
import {logger} from './logger.js';
import * as Config from './config.js';

export class VideoRecorder {
    /**
     * @type {Babylon.Engine}
     */
    #engine;
    /**
     * @type {Babylon.VideoRecorder | null}
     */
    #videoRecorder = null;
    /**
     * @type {Promise<Blob> | null}
     */
    #recordedVideoPromise = null;

    /**
     * @type {boolean}
     */
    #isRecording = false;
    /**
     * @type {number}
     */
    #recordStartTime = 0;

    /**
     * @param {Babylon.Engine} engine
     */
    constructor(engine) {
        this.#engine = engine;
    }

    /**
     * @returns {void}
     */
    startRecording() {
        if (this.#isRecording) {
            logger.info('startRecording: already recording');
            return;
        }
        if (!Babylon.VideoRecorder.IsSupported(this.#engine)) {
            logger.warn('startRecording: VideoRecorder is not supported');
            return;
        }

        let audioTracks = [];
        if (Babylon.Engine.audioEngine !== null && Babylon.Engine.audioEngine.audioContext !== null) {
            const outputNode = Babylon.Engine.audioEngine.audioContext.createMediaStreamDestination();
            Babylon.Engine.audioEngine.masterGain.connect(outputNode);
            audioTracks = outputNode.stream.getAudioTracks()
        }

        this.#videoRecorder =
            new Babylon.VideoRecorder(this.#engine, {audioTracks: audioTracks});

        this.#recordedVideoPromise = this.#videoRecorder.startRecording(null, 0);
        this.#isRecording = true;
        this.#recordStartTime = Date.now();
    }

    /**
     * @returns {void}
     */
    stopRecording() {
        if (!this.#isRecording) {
            return;
        }
        if (this.#videoRecorder === null) {
            logger.warn('stopRecording: VideoRecorder is not supported');
            return;
        }
        this.#videoRecorder.stopRecording();
        this.#videoRecorder = null;
        this.#isRecording = false;
    }

    /**
     * Using setInterval to update the recording time is not accurate
     * We use the difference between the current time and the start time instead
     * @returns {number}
     */
    getRecordingTime() {
        const delta = Date.now() - this.#recordStartTime;
        return Math.floor(delta / 1000);
    }

    /**
     * @returns {boolean}
     */
    getIsRecording() {
        return this.#isRecording;
    }

    /**
     * @returns {Promise<void>}
     */
    async downloadRecordedVideo() {
        if (this.#recordedVideoPromise === null) {
            logger.warn('getRecordedVideo: recordedVideo is null');
            return;
        }
        const recordedVideo = await this.#recordedVideoPromise;

        const dummyLink = document.createElement('a');
        dummyLink.href = URL.createObjectURL(recordedVideo);
        dummyLink.download = Config.defualtRecordedVideoName;
        dummyLink.click();
    }
}
