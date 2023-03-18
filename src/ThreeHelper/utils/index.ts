/*
 * @Author: hongbin
 * @Date: 2023-01-07 10:12:47
 * @LastEditors: hongbin
 * @LastEditTime: 2023-02-04 15:58:14
 * @Description:
 */
import * as THREE from "three";

/**
 * 继承自THREE.Color的随机颜色
 */
export class RandomColor extends THREE.Color {
    constructor() {
        super();
        this.r = Math.random();
        this.g = Math.random();
        this.b = Math.random();
    }
}

export function distance(x1: number, x2: number) {
    //都是负数  -3 => -5 = -2
    if (x1 < 0 && x2 < 0) {
        return (x2 * -1 - x1 * -1) * -1;
    }
    return x2 - x1;
}

/**
 * subQuaternion的减法
 */
export function subQuaternion(old: THREE.Quaternion, ter: THREE.Quaternion) {
    const x = distance(old.x, ter.x);
    const y = distance(old.y, ter.y);
    const z = distance(old.z, ter.z);
    const w = distance(old.w, ter.w);
    return new THREE.Quaternion(x, y, z, w);
}

function quaternionToEuler(q: THREE.Quaternion) {
    return new THREE.Euler().setFromQuaternion(q);
}

/**
 * 计算两个旋转的差值 返回需要旋转角度小的那个Quaternion
 * 旋转90度和-270度都在一个位置 但是旋转-270度看起来就会转一圈再到角度 效果不好
 */
export function compareQuaternion(q1: THREE.Quaternion, q2: THREE.Quaternion) {
    const subQ1 = subQuaternion(q1, q2);
    const subQ2 = subQuaternion(q2, q1);
    console.log(subQ1, subQ2);
    const subE1 = quaternionToEuler(subQ1);
    const subE2 = quaternionToEuler(subQ2);
    console.log(subE1, subE2);
}
