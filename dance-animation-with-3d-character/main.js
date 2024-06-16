// @ts-check

import './style.css';
import {CanvasController} from './src/canvas.js';
import {logger} from './src/logger.js';

main();

function main() {
    logger.info('setUpCanvas start');
    // @ts-ignore: renderCanvas is defined in index.html
    const canvasController = new CanvasController(document.querySelector('#renderCanvas'));
    canvasController.setUpCanvas('/Kachujin.glb', '.glb');
    logger.info('setUpCanvas complete');

    logger.info('setUpInputModel start');
    // @ts-ignore: inputModel is defined in index.html
    setUpInputModel(document.querySelector('#inputModel'), canvasController);
    logger.info('setUpInputModel complete');

    logger.info('setUpInputSong start');
    // @ts-ignore: inputSong is defined in index.html
    setUpInputSong(document.querySelector('#inputSong'), canvasController);
    logger.info('setUpInputSong complete');
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
 * @param {HTMLInputElement} inputSong
 * @param {CanvasController} canvasController
 * @returns {void}
 */
function setUpInputSong(inputSong, canvasController) {
    inputSong.addEventListener('change', async function () {
        logger.info('Event: inputSong change');
        if (inputSong.files === null || inputSong.files.length === 0) {
            logger.warn('inputSong.files is null or empty');
            return;
        }

        const file = inputSong.files[0];
        const inputSongPath = URL.createObjectURL(file);
        const BPM = await canvasController.changeSong(inputSongPath);
    });
}
