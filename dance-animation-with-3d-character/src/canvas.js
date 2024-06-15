// @ts-check

import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

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
        const engine = await this.#createEngine();
        this.#engine = engine;
        await this.changeModel(modelPath, extension);

        window.addEventListener('resize', function () {
            engine.resize();
        });
    }

    /**
     * Asynchronously change the model of the canvas to the model from the modelPath
     * Side effect: change this.#engine
     * @param {String} modelPath
     * @param {String} extension
     * @returns {Promise<void>}
     */
    async changeModel(modelPath, extension) {
        this.#engine.stopRenderLoop();
        const scene = await this.#createScene(modelPath, extension);

        this.#engine.runRenderLoop(function () {
            scene.render();
        });
    }

    /**
     * Asynchronously create a new BABYLON.Engine using this.#canvas
     * @returns {Promise<BABYLON.Engine>}
     */
    async #createEngine() {
        const engine = new BABYLON.Engine(this.#canvas, true);
        return engine;
    }

    /**
     * Asynchronously create a new BABYLON.Scene using the model from the modelPath
     * @param {String} modelPath
     * @param {String} extension
     * @returns {Promise<BABYLON.Scene>}
     */
    async #createScene(modelPath, extension) {
        const scene = await BABYLON.SceneLoader.LoadAsync(modelPath, "", this.#engine, null, extension);
        this.#createCameraAndLightAndEnvironment(scene);
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
