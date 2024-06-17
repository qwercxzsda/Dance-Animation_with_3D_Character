// @ts-check

import './style.css';
import {CanvasController} from './src/canvas.js';
import {logger} from './src/logger.js';
import * as Config from './src/config.js';

main();

function main() {
    logger.info('setUpCanvas start');
    // @ts-ignore: renderCanvas is defined in index.html
    const canvasController = new CanvasController(document.querySelector('#renderCanvas'));
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
