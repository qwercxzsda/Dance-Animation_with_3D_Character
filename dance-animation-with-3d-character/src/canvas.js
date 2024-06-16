// @ts-check

import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import {logger} from "./logger.js";
import {guess} from 'web-audio-beat-detector';

export class CanvasController {
    /**
     * @type {HTMLCanvasElement}
     */
    #canvas;
    /**
     * @type {BABYLON.Engine}
     */
    #engine;
    /**
     * @type {BABYLON.Scene}
     */
    #scene;
    /**
     * @type {BABYLON.Sound}
     */
    #sound;

    /**
     * Constructor of CanvasController
     * Must call setUpCanvas() after creating an instance
     * Side effect: change this.#canvas
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        this.#canvas = canvas;
    }

    /**
     * Asynchronously set up the canvas using the model from the modelPath
     * Side effect: change this.#engine
     * @param {String} modelPath
     * @param {String} extension
     * @returns {Promise<void>}
     */
    async setUpCanvas(modelPath, extension) {
        logger.info(`setUpCanvas: called {modelPath: ${modelPath}, extension: ${extension}}`);
        const engine = await this.#createEngine();
        this.#engine = engine;
        await this.changeModel(modelPath, extension);

        window.addEventListener('resize', () => engine.resize());
        logger.info('setUpCanvas: returned {}');
    }

    /**
     * Asynchronously change the model of the canvas to the model from the modelPath
     * Side effect: change this.#scenes
     * @param {String} modelPath
     * @param {String} extension
     * @returns {Promise<void>}
     */
    async changeModel(modelPath, extension) {
        logger.info(`changeModel: called {modelPath: ${modelPath}, extension: ${extension}}`);
        this.#engine.stopRenderLoop();

        if (this.#scene !== undefined && this.#scene !== null) {
            this.#scene.dispose();
            // As createScene is asynchronous, this.#scene might be referenced after dispose
            // To avoid this, set this.#scene to null
            // Furthermore, we will set every variable to null after dispose (just to be safe)
            this.#scene = null;
        }
        const scene = await this.#createScene(modelPath, extension);
        this.#scene = scene;

        this.#engine.runRenderLoop(() => scene.render());
        logger.info('changeModel: returned {}');
    }

    /**
     * Asynchronously change the sound of the canvas to the sound from the soundPath
     * @param {String} soundPath
     * @returns {Promise<number>}
     */
    async changeSong(soundPath) {
        logger.info(`changeSong: called {soundPath: ${soundPath}}`);
        if (this.#scene === undefined || this.#scene === null) {
            logger.warn('changeSong: this.#scene is undefined or null');
            return 0;
        }
        if (this.#sound !== undefined && this.#sound !== null) {
            this.#sound.dispose();
            this.#sound = null;
        }
        const sound = new BABYLON.Sound("sound", soundPath, this.#scene, null, {loop: true, autoplay: true});
        this.#sound = sound;
        const soundBPM = await this.#getSongBPM(soundPath);
        logger.info(`changeSong: returned {soundBPM: ${soundBPM}`);
        return soundBPM;
    }

    /**
     * Asynchronously get the BPM of the song from the soundPath
     * @param {String} soundPath
     * @returns {Promise<number>}
     */
    async #getSongBPM(soundPath) {
        logger.info(`getSongBPM: called {soundPath: ${soundPath}}`);
        const audioBuffer =
            await fetch(soundPath)
                .then(response => response.arrayBuffer())
                .then(buffer => new AudioContext().decodeAudioData(buffer));
        logger.info(`getSongBPM: {audioBuffer: ${audioBuffer}}`);
        const result = await guess(audioBuffer);
        logger.info(`getSongBPM: {result.bpm: ${result.bpm}, result.offset: ${result.offset}`);
        logger.info(`getSongBPM: returned {bpm: ${result.bpm}}`);
        return result.bpm;
    }

    /**
     * Asynchronously create a new BABYLON.Engine using this.#canvas
     * @returns {Promise<BABYLON.Engine>}
     */
    async #createEngine() {
        logger.info('createEngine: called {}');
        const engine = new BABYLON.Engine(this.#canvas, true);
        logger.info(`createEngine: returned {engine: ${engine}}`);
        return engine;
    }

    /**
     * Asynchronously create a new BABYLON.Scene using the model from the modelPath
     * @param {String} modelPath
     * @param {String} extension
     * @returns {Promise<BABYLON.Scene>}
     */
    async #createScene(modelPath, extension) {
        logger.info(`createScene: called {modelPath: ${modelPath}, extension: ${extension}}`);
        const scene = await BABYLON.SceneLoader.LoadAsync(modelPath, "", this.#engine, null, extension);
        this.#createCameraAndLightAndEnvironment(scene);
        logger.info(`createScene: returned {scene: ${scene}}`);
        return scene;
    }

    /**
     * @param {BABYLON.Scene} scene
     * @returns {void}
     */
    #createCameraAndLightAndEnvironment(scene) {
        scene.createDefaultCamera(true, true, true);
        scene.createDefaultLight(true);
        scene.createDefaultEnvironment({groundColor: BABYLON.Color3.White()});
    }
}
