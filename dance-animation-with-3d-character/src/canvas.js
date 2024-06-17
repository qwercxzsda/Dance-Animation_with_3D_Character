// @ts-check

import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import {logger} from "./logger.js";
import {guess} from 'web-audio-beat-detector';
import * as Config from './config.js';
import * as Dance from './dance.js';

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
     * @type {BABYLON.Scene | null}
     */
    #scene;
    /**
     * @type {BABYLON.Sound | null}
     */
    #sound;
    /**
     * @type {number}
     */
    #soundBpm;
    /**
     * @type {BABYLON.AnimationGroup}
     */
    #animationGroup;

    /**
     * Constructor of CanvasController
     * Must call setUpCanvas() after creating an instance
     * Side effect: change this.#canvas
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        this.#canvas = canvas;
        this.#soundBpm = Config.defaultBpm;
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
        if (this.#engine === undefined || this.#engine === null) {
            logger.warn('changeModel: this.#engine is undefined or null');
            return;
        }
        this.#engine.stopRenderLoop();

        if (this.#scene !== undefined && this.#scene !== null) {
            this.#scene.dispose();
            // As createScene is asynchronous, this.#scene might be referenced after dispose
            // To avoid this, set this.#scene to null
            // Furthermore, we will set every variable to null after dispose (just to be safe)
            this.#scene = null;
        }
        const {scene, skeleton} = await this.#createScene(modelPath, extension);
        this.#scene = scene;

        this.#animationGroup = Dance.createAnimationGroup(scene, skeleton.bones);

        this.play();

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
        this.#sound = new BABYLON.Sound("sound", soundPath, this.#scene, null, {loop: true, autoplay: true});
        const soundBpm = await this.#getSongBPM(soundPath);
        this.#soundBpm = soundBpm;

        this.stop();

        logger.info(`changeSong: returned {soundBPM: ${soundBpm}`);
        return soundBpm;
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
     * @returns {Promise<{scene: BABYLON.Scene, skeleton: BABYLON.Skeleton}>}
     */
    async #createScene(modelPath, extension) {
        logger.info(`createScene: called {modelPath: ${modelPath}, extension: ${extension}}`);
        // const scene = await BABYLON.SceneLoader.LoadAsync(modelPath, "", this.#engine, null, extension);
        const scene = new BABYLON.Scene(this.#engine);
        const result = await BABYLON.SceneLoader.ImportMeshAsync("", modelPath, "", scene, null, extension);
        this.#createCameraAndLightAndEnvironment(scene);

        logger.info(`createScene: {result.meshes: ${result.meshes}}`);
        logger.info(`createScene: {result.skeletons: ${result.skeletons}}`);

        if (!this.#isValidSkeletons(result.skeletons)) {
            logger.warn('createScene: this.#skeleton is not valid, using default model instead');
            scene.dispose();
            return await this.#createScene(Config.defaultModelPath, Config.defaultModelExtension);
        }
        scene.animatables.forEach(animatable => animatable.stop());

        logger.info(`createScene: returned {{scene, skeleton}: ${{scene: scene, skeleton: result.skeletons[0]}}}`);
        return {scene: scene, skeleton: result.skeletons[0]};
    }

    /**
     *
     * @param {BABYLON.Skeleton[]} skeletons
     * @returns {boolean}
     */
    #isValidSkeletons(skeletons) {
        if (skeletons.length !== 1) {
            logger.warn(`isValidSkeletons: skeletons.length expected: 1, actual: ${skeletons.length}`);
            return false;
        } else if (!Dance.isValidBones(skeletons[0].bones)) {
            logger.warn(`isValidSkeletons: skeletons[0].bones is not valid`);
            return false;
        }
        return true;
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

    /**
     * this.#animationGroup has one key frame per second
     * Thus, setting the speed ratio as (bpm / 60) syncs the animation with the sound bpm
     * @returns {void}
     */
    play() {
        this.#animationGroup.speedRatio = this.#soundBpm / 60;
        logger.info(`play: this.#animationGroup.speedRatio: ${this.#animationGroup.speedRatio}=${this.#soundBpm}/60`);
        this.#animationGroup.play(true);

        if (this.#sound !== undefined && this.#sound !== null) {
            // Playing the sound multiple times without pause will cause multiple sounds to play simultaneously
            this.#sound.pause();
            this.#sound.play();
        }
    }

    /**
     * @returns {void}
     */
    pause() {
        this.#animationGroup.pause();

        if (this.#sound !== undefined && this.#sound !== null) {
            this.#sound.pause();
        }
    }

    /**
     * @returns {void}
     */
    stop() {
        this.#animationGroup.reset();
        this.#animationGroup.stop();

        if (this.#sound !== undefined && this.#sound !== null) {
            this.#sound.stop();
        }
    }
}
