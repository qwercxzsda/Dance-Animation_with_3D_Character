// @ts-check

import * as BABYLON from '@babylonjs/core';
import {logger} from './logger';
import * as CONFIG from './config';

/**
 * @typedef {{x: {min: number, max: number}, y: {min: number, max: number}, z: {min: number, max: number}}} MovementRange
 * @type {Object.<String, MovementRange>}
 */
const importantBonesMovementRange =
    {
        // TODO: Add more bones
        LeftArm: {
            x: {min: -Math.PI * 0.25, max: Math.PI * 0.25},
            y: {min: -Math.PI * 0.25, max: Math.PI * 0.25},
            z: {min: -Math.PI * 0.25, max: Math.PI * 0.25}
        },
    };

/**
 * @param {BABYLON.Bone[]} boneList
 * @returns
 */
export function isValidBones(boneList) {
    const bones = boneListToDict(boneList);
    return Object.keys(importantBonesMovementRange).reduce((acc, name) => {
        if (name in bones) {
            return acc && true;
        } else {
            logger.warn(`isValidBones: Bone ${name} not found`);
            return false;
        }
    }, true);
}

/**
 * @param {BABYLON.Bone[]} boneList
 * @returns {Object.<String, Bone>}
 */
function boneListToDict(boneList) {
    return boneList.reduce((acc, bone) => {
        const name = bone.name.split(':').pop();
        if (name !== undefined) {
            acc[name] = bone;
        }
        return acc;
    }, {});
}

/**
 * @param {BABYLON.Scene} scene
 * @param {BABYLON.Bone[]} boneList
 * @returns {BABYLON.AnimationGroup} - Has one key frame per second
 */
export function createAnimationGroup(scene, boneList) {
    console.assert(isValidBones(boneList));
    const bones = boneListToDict(boneList);
    const animationGroup = new BABYLON.AnimationGroup('danceAnimationGroup', scene);

    Object.entries(importantBonesMovementRange).forEach(([boneName, range]) => {
            const bone = bones[boneName];
            const transformNode = bone.getTransformNode();
            if (transformNode === null) {
                logger.warn(`createAnimationGroup: Bone ${bone.name} has no transform node`);
                return;
            }
            const animation = createAnimation(boneName, range, transformNode);
            animationGroup.addTargetedAnimation(animation, transformNode);
        }
    );

    animationGroup.normalize(0, CONFIG.framesNum);
    return animationGroup;
}

/**
 * @param {String} boneName
 * @param {MovementRange} range
 * @param {BABYLON.TransformNode} transformNode
 * @returns {BABYLON.Animation}
 */
function createAnimation(boneName, range, transformNode) {
    const animation = new BABYLON.Animation(
        `danceAnimation_${boneName}`, 'rotationQuaternion', CONFIG.fps,
        BABYLON.Animation.ANIMATIONTYPE_QUATERNION, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    // Make keyframes
    //[...Array(5).keys()]
    const keyFrames = [...Array(CONFIG.keyFramesNum).keys()].map(i => {
        return {
            frame: i * CONFIG.fps,
            value: getRandomPose(range)
        }
    });
    const initialPose = transformNode.rotationQuaternion;
    if (initialPose === null) {
        logger.warn(`createAnimation: initialPose is null for bone ${boneName}`);
    } else {
        keyFrames[0].value = initialPose;
        keyFrames[CONFIG.keyFramesNum - 1].value = initialPose;
    }

    animation.setKeys(keyFrames);
    // TODO: set easing function
    return animation;
}

/**
 * @param {MovementRange} range
 * @returns {BABYLON.Quaternion}
 */
function getRandomPose(range) {
    const x = getRandomArbitrary(range.x.min, range.x.max);
    const y = getRandomArbitrary(range.y.min, range.y.max);
    const z = getRandomArbitrary(range.z.min, range.z.max);
    return BABYLON.Quaternion.FromEulerAngles(x, y, z);
}

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

