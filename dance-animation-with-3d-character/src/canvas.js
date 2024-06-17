// @ts-check

import * as Babylon from '@babylonjs/core';
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
     * @type {Babylon.Engine}
     */
    #engine;
    /**
     * @type {Babylon.Scene | null}
     */
    #scene;
    /**
     * @type {Babylon.Sound | null}
     */
    #sound;
    /**
     * @type {number}
     */
    #soundBpm;
    /**
     * @type {Babylon.AnimationGroup | null}
     */
    #animationGroup;

    /**
     * Constructor of CanvasController
     * Must call setUpCanvas() after creating an instance
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
     * Side effect: change this.#scene, this.#animationGroup
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

        // Dispose the current scene
        if (this.#scene !== undefined && this.#scene !== null) {
            this.#scene.dispose();
            // As createScene is asynchronous, this.#scene might be referenced after dispose
            // To avoid this, set this.#scene to null
            // Furthermore, we will set every variable to null after dispose (just to be safe)
            this.#scene = null;
            this.#sound = null;
            this.#animationGroup = null;
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
     * Side effect: change this.#sound, this.#soundBpm
     * @param {String} soundPath
     * @returns {Promise<number>}
     */
    async changeSong(soundPath) {
        logger.info(`changeSong: called {soundPath: ${soundPath}}`);
        if (this.#scene === undefined || this.#scene === null) {
            logger.warn('changeSong: this.#scene is undefined or null');
            return 0;
        }

        // Dispose the current sound
        if (this.#sound !== undefined && this.#sound !== null) {
            this.#sound.dispose();
            this.#sound = null;
        }

        // Create a new sound and update this.#soundBpm
        this.#sound = new Babylon.Sound("sound", soundPath, this.#scene, null, {loop: true, autoplay: true});
        const soundBpm = await this.#getSongBPM(soundPath);
        this.#soundBpm = soundBpm;

        this.stop();
        this.play();

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
     * Asynchronously create a new Babylon.Engine using this.#canvas
     * @returns {Promise<Babylon.Engine>}
     */
    async #createEngine() {
        logger.info('createEngine: called {}');
        const engine = new Babylon.Engine(this.#canvas, true);
        logger.info(`createEngine: returned {engine: ${engine}}`);
        return engine;
    }

    /**
     * Asynchronously create a new Babylon.Scene using the model from the modelPath
     * @param {String} modelPath
     * @param {String} extension
     * @returns {Promise<{scene: Babylon.Scene, skeleton: Babylon.Skeleton}>}
     */
    async #createScene(modelPath, extension) {
        logger.info(`createScene: called {modelPath: ${modelPath}, extension: ${extension}}`);
        console.assert(this.#engine !== undefined && this.#engine !== null);
        const scene = new Babylon.Scene(this.#engine);
        const result = await Babylon.SceneLoader.ImportMeshAsync("", modelPath, "", scene, null, extension);
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
     * @param {Babylon.Skeleton[]} skeletons
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
     * @param {Babylon.Scene} scene
     * @returns {void}
     */
    #createCameraAndLightAndEnvironment(scene) {
        scene.createDefaultCamera(true, true, true);
        scene.createDefaultLight(true);
        scene.createDefaultEnvironment({groundColor: Babylon.Color3.White()});
    }

    /**
     * @returns {void}
     */
    play() {
        if (this.#animationGroup === undefined || this.#animationGroup === null) {
            logger.warn('play: this.#animationGroup is undefined or null');
            return;
        }

        // this.#animationGroup has one key frame per second (60 key frames per minute)
        // Thus, setting the speed ratio as (bpm / 60) syncs the animation with the sound bpm
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
        if (this.#animationGroup === undefined || this.#animationGroup === null) {
            logger.warn('pause: this.#animationGroup is undefined or null');
            return;
        }
        this.#animationGroup.pause();

        if (this.#sound !== undefined && this.#sound !== null) {
            this.#sound.pause();
        }
    }

    /**
     * @returns {void}
     */
    stop() {
        if (this.#animationGroup === undefined || this.#animationGroup === null) {
            logger.warn('stop: this.#animationGroup is undefined or null');
            return;
        }
        this.#animationGroup.reset();
        this.#animationGroup.stop();

        if (this.#sound !== undefined && this.#sound !== null) {
            this.#sound.stop();
        }
    }
}
