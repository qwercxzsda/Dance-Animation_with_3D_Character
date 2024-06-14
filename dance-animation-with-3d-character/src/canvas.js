// @ts-check

import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

/**
 *
 * @param {HTMLCanvasElement} canvas
 */
export function setUpCanvas(canvas) {
    const engine = new BABYLON.Engine(canvas, true);
    const scene = createScene(engine);

    // TODO: need to wait until the SceneLoader in creatScene is complete
    // Otherwise, scene.render(); is called before the camera is created.
    // Temporarily fixed the issue creating camera twice.
    engine.runRenderLoop(function () {
        scene.render();
    })

    window.addEventListener('resize', function () {
        engine.resize();
    });
}

/**
 *
 * @param {BABYLON.Engine} engine
 * @returns {BABYLON.Scene}
 */
function createScene(engine) {
    const scene = new BABYLON.Scene(engine);

    scene.createDefaultCamera(true, true, true);
    BABYLON.SceneLoader.Append("/adamHead/", "adamHead.gltf",
        scene, createCameraAndLightAndEnvironment);

    return scene;
}

/**
 * 
 * @param {BABYLON.Scene} scene 
 */
function createCameraAndLightAndEnvironment(scene) {
    scene.createDefaultCamera(true, true, true);
    scene.createDefaultLight(true);
    scene.createDefaultEnvironment({ groundColor: BABYLON.Color3.White() });
}
