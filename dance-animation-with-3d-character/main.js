import './style.css';
import {CanvasController} from './src/canvas.js';
import {logger} from './src/logger.js';

logger.info('setUpCanvas start');
const canvasController = new CanvasController(document.querySelector('#renderCanvas'));
canvasController.setUpCanvas('/Kachujin.glb', '.glb');
logger.info('setUpCanvas complete');

logger.info('setUpInputModel start');
const inputModel = document.querySelector('#inputModel');
inputModel.addEventListener('change', function () {
    logger.info('Event: inputModel change');
    const file = inputModel.files[0];
    const inputModelPath = URL.createObjectURL(file);
    const extension = '.' + file.name.split('.').pop();

    canvasController.changeModel(inputModelPath, extension);
});
logger.info('setUpInputModel complete');

logger.info('setUpInputSong start');
const inputSong = document.querySelector('#inputSong');
inputSong.addEventListener('change', function () {
    logger.info('Event: inputSong change');
    const file = inputSong.files[0];
    const inputSongPath = URL.createObjectURL(file);

    canvasController.changeSong(inputSongPath);
});
logger.info('setUpInputSong complete');
