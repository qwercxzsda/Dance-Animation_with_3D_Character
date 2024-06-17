// @ts-check

import * as Babylon from '@babylonjs/core';
import {logger} from './logger';
import * as CONFIG from './config';

/**
 * Movement range for important bones (XYZ euler, radians)
 * @typedef {{x: {min: number, max: number}, y: {min: number, max: number}, z: {min: number, max: number}}} MovementRange
 * @type {Object.<String, MovementRange>}
 */
const importantBonesMovementRange =
    {
        Spine: {
            x: {min: degreesToRadians(-15), max: degreesToRadians(40)},
            y: {min: degreesToRadians(-30), max: degreesToRadians(30)},
            z: {min: degreesToRadians(-15), max: degreesToRadians(15)}
        },
        Head: {
            x: {min: degreesToRadians(-15), max: degreesToRadians(15)},
            y: {min: degreesToRadians(-15), max: degreesToRadians(15)},
            z: {min: degreesToRadians(-15), max: degreesToRadians(15)}
        },
        LeftArm: {
            x: {min: degreesToRadians(0), max: degreesToRadians(51)},
            y: {min: degreesToRadians(-21), max: degreesToRadians(41)},
            z: {min: degreesToRadians(-34), max: degreesToRadians(51)}
        },
        LeftForeArm: {
            x: {min: degreesToRadians(0), max: degreesToRadians(8)},
            y: {min: degreesToRadians(-15), max: degreesToRadians(0)},
            z: {min: degreesToRadians(0), max: degreesToRadians(110)}
        },
        RightArm: {
            x: {min: degreesToRadians(0), max: degreesToRadians(47)},
            y: {min: degreesToRadians(-6), max: degreesToRadians(35)},
            z: {min: degreesToRadians(-54), max: degreesToRadians(35)}
        },
        RightForeArm: {
            x: {min: degreesToRadians(0), max: degreesToRadians(9)},
            y: {min: degreesToRadians(0), max: degreesToRadians(13)},
            z: {min: degreesToRadians(-92), max: degreesToRadians(0)}
        },
        LeftLeg: {
            x: {min: degreesToRadians(-10), max: degreesToRadians(10)},
            y: {min: degreesToRadians(-10), max: degreesToRadians(10)},
            z: {min: degreesToRadians(-10), max: degreesToRadians(10)}
        },
        RightLeg: {
            x: {min: degreesToRadians(-10), max: degreesToRadians(10)},
            y: {min: degreesToRadians(-10), max: degreesToRadians(10)},
            z: {min: degreesToRadians(-10), max: degreesToRadians(10)}
        },
    };

/**
 * @param {number} degree
 * @returns {number}
 */
function degreesToRadians(degree) {
    return degree * Math.PI / 180;
}

/**
 * True iff the boneList contains all the important bones (as defined in importantBonesMovementRange)
 * @param {Babylon.Bone[]} boneList
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
 * @param {Babylon.Bone[]} boneList
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
 * @param {Babylon.Scene} scene
 * @param {Babylon.Bone[]} boneList
 * @returns {Babylon.AnimationGroup} - Has one key frame per second
 */
export function createAnimationGroup(scene, boneList) {
    console.assert(isValidBones(boneList));
    const bones = boneListToDict(boneList);
    const animationGroup = new Babylon.AnimationGroup('danceAnimationGroup', scene);

    // Create animations for each bone and add them to the animation group
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

    animationGroup.normalize(0, CONFIG.fps * (CONFIG.keyFramesNum - 1));
    return animationGroup;
}

/**
 * Create an animation for a given bone
 * boneName, range, and transformNode all are properties of a single bone
 * @param {String} boneName
 * @param {MovementRange} range
 * @param {Babylon.TransformNode} transformNode
 * @returns {Babylon.Animation}
 */
function createAnimation(boneName, range, transformNode) {
    const animation = new Babylon.Animation(
        `danceAnimation_${boneName}`, 'rotationQuaternion', CONFIG.fps,
        Babylon.Animation.ANIMATIONTYPE_QUATERNION, Babylon.Animation.ANIMATIONLOOPMODE_CYCLE);

    // Make keyframes
    const keyFrames = [...Array(CONFIG.keyFramesNum).keys()].map(i => {
        return {
            frame: i * CONFIG.fps,
            value: getRandomPose(range)
        }
    });

    // Set 0th and last keyframes to the initial pose
    const initialPose = transformNode.rotationQuaternion;
    if (initialPose === null) {
        logger.warn(`createAnimation: initialPose is null for bone ${boneName}`);
    } else {
        keyFrames[0].value = initialPose;
        keyFrames[CONFIG.keyFramesNum - 1].value = initialPose;
    }

    // Set keyframes
    animation.setKeys(keyFrames);
    
    // Set easing function
    const easingFunction = new Babylon.BezierCurveEase();
    easingFunction.setEasingMode(Babylon.EasingFunction.EASINGMODE_EASEINOUT);
    animation.setEasingFunction(easingFunction);
    return animation;
}

/**
 * @param {MovementRange} range
 * @returns {Babylon.Quaternion}
 */
function getRandomPose(range) {
    const x = getRandomArbitrary(range.x.min, range.x.max);
    const y = getRandomArbitrary(range.y.min, range.y.max);
    const z = getRandomArbitrary(range.z.min, range.z.max);
    return Babylon.Quaternion.FromEulerAngles(x, y, z);
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
