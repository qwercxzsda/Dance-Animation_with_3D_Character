import './style.css';
import {CanvasController} from './src/canvas.js';

const canvasController = new CanvasController(document.querySelector('#renderCanvas'));
canvasController.setUpCanvas('/Kachujin.glb', '.glb');

const inputModel = document.querySelector('#inputModel');
inputModel.addEventListener('change', function () {
    const file = inputModel.files[0];
    const inputModelPath = URL.createObjectURL(file);
    const extension = '.' + file.name.split('.').pop();

    canvasController.changeModel(inputModelPath, extension);
});
