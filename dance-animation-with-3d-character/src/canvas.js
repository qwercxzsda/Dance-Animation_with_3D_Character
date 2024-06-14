// @ts-check

import * as BABYLON from '@babylonjs/core'

/**
 *
 * @param {HTMLCanvasElement} canvas
 */
export function setUpCanvas(canvas) {
    const engine = new BABYLON.Engine(canvas, true);
    const scene = createScene(engine);

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

    const box = BABYLON.MeshBuilder.CreateBox("box", {bottomBaseAt:10}, scene);
    box.position.y = 0.5;
    createCameraAndLightAndEnvironment(scene);

    return scene;
}

/**
 * 
 * @param {BABYLON.Scene} scene 
 */
function createCameraAndLightAndEnvironment(scene) {
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0));
    camera.attachControl(0, true);

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);
    scene.createDefaultEnvironment();

    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width:10, height:10}, scene);
}
