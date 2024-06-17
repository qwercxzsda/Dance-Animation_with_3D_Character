// @ts-check

import './style.css';
import {CanvasController} from './src/canvas.js';
import {logger} from './src/logger.js';
import * as Config from './src/config.js';
import {VideoRecorder} from './src/record.js';

main();

async function main() {
    logger.info('setUpCanvas start');
    // @ts-ignore: renderCanvas is defined in index.html
    const canvasController = new CanvasController(document.querySelector('#renderCanvas'));
    const enginePromise =
        canvasController.setUpCanvas(Config.defaultModelPath, Config.defaultModelExtension);
    logger.info('setUpCanvas complete');

    logger.info('setUpInputModel start');
    // @ts-ignore: inputModel is defined in index.html
    setUpInputModel(document.querySelector('#inputModel'), canvasController);
    logger.info('setUpInputModel complete');

    logger.info('setUpInputSong start');
    // @ts-ignore: inputSong is defined in index.html
    setUpInputSong(document.querySelector('#bpmButton'),
        document.querySelector('#inputSong'), canvasController);
    logger.info('setUpInputSong complete');

    logger.info('setUpMediaButton start');
    // @ts-ignore: playButton is defined in index.html
    setUpPlayButton(document.querySelector('#playButton'), canvasController);
    // @ts-ignore: pauseButton is defined in index.html
    setUpPauseButton(document.querySelector('#pauseButton'), canvasController);
    // @ts-ignore: stopButton is defined in index.html
    setUpStopButton(document.querySelector('#stopButton'), canvasController);
    logger.info('setUpMediaButton complete');

    logger.info('setUpVideoRecord start');
    const videoRecorder = new VideoRecorder(await enginePromise);
    logger.info('setUpVideoRecord complete');

    logger.info('setUpRecordingButton start');
    // @ts-ignore: startRecordingButton is defined in index.html
    setUpStartRecordingButton(document.querySelector('#startRecordingButton'), videoRecorder);
    // @ts-ignore: stopRecordingButton is defined in index.html
    setUpStopRecordingButton(document.querySelector('#stopRecordingButton'), videoRecorder);
    // @ts-ignore: recordingTimer is defined in index.html
    setUpRecordingTimer(document.querySelector('#recordingTimer'), videoRecorder);
    logger.info('setUpRecordingButton complete');
}

/**
 * @param {HTMLInputElement} inputModel
 * @param {CanvasController} canvasController
 * @returns {void}
 */
function setUpInputModel(inputModel, canvasController) {
    inputModel.addEventListener('change', function () {
        logger.info('Event: inputModel change');
        if (inputModel.files === null || inputModel.files.length === 0) {
            logger.warn('inputModel.files is null or empty');
            return;
        }

        const file = inputModel.files[0];
        const inputModelPath = URL.createObjectURL(file);
        const extension = '.' + file.name.split('.').pop();
        canvasController.changeModel(inputModelPath, extension);
    });
}

/**
 * @param {HTMLLabelElement} bpmButton
 * @param {HTMLInputElement} inputSong
 * @param {CanvasController} canvasController
 * @returns {void}
 */
function setUpInputSong(bpmButton, inputSong, canvasController) {
    bpmButton.innerHTML = `BPM: ${Config.defaultBpm}`;
    inputSong.addEventListener('change', async function () {
        logger.info('Event: inputSong change');
        if (inputSong.files === null || inputSong.files.length === 0) {
            logger.warn('inputSong.files is null or empty');
            return;
        }

        const file = inputSong.files[0];
        const inputSongPath = URL.createObjectURL(file);
        const bpm = await canvasController.changeSong(inputSongPath);
        bpmButton.innerHTML = `BPM: ${bpm}`;
    });
}

/**
 * @param {HTMLLabelElement} playButton
 * @param {CanvasController} canvasController
 * @returns {void}
 */
function setUpPlayButton(playButton, canvasController) {
    playButton.addEventListener('click', function () {
        logger.info('Event: playButton click');
        canvasController.play();
    });
}

/**
 * @param {HTMLLabelElement} pauseButton
 * @param {CanvasController} canvasController
 * @returns {void}
 */
function setUpPauseButton(pauseButton, canvasController) {
    pauseButton.addEventListener('click', function () {
        logger.info('Event: pauseButton click');
        canvasController.pause();
    });
}

/**
 * @param {HTMLLabelElement} stopButton
 * @param {CanvasController} canvasController
 * @returns {void}
 */
function setUpStopButton(stopButton, canvasController) {
    stopButton.addEventListener('click', function () {
        logger.info('Event: stopButton click');
        canvasController.stop();
    });
}

function setUpStartRecordingButton(startRecordingButton, videoRecorder) {
    startRecordingButton.addEventListener('click', function () {
        logger.info('Event: startRecordingButton click');
        videoRecorder.startRecording();
    });
}

function setUpStopRecordingButton(stopRecordingButton, videoRecorder) {
    stopRecordingButton.addEventListener('click', function () {
        logger.info('Event: stopRecordingButton click');
        videoRecorder.stopRecording();
        videoRecorder.downloadRecordedVideo();
    });
}

function setUpRecordingTimer(recordingTimer, videoRecorder) {
    recordingTimer.innerHTML = `0 sec / ${Config.recordingTimeout} sec`;

    setInterval(function () {
        // Update recording timer only when recording
        if (!videoRecorder.getIsRecording()) {
            return;
        }
        const recordingTime = videoRecorder.getRecordingTime();
        recordingTimer.innerHTML = `${recordingTime} sec / ${Config.recordingTimeout} sec`;
        if (recordingTime >= Config.recordingTimeout) {
            logger.info(`Recording timeout, recordingTime: ${recordingTime}`);
            videoRecorder.stopRecording();
            videoRecorder.downloadRecordedVideo();
        }
    }, 100);
}