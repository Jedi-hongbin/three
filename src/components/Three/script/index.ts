"use client";
/*
 * @Author: hongbin
 * @Date: 2023-01-15 17:51:05
 * @LastEditors: hongbin
 * @LastEditTime: 2023-01-30 10:19:06
 * @Description:创建three元素
 */
import * as THREE from "three";
import { ThreeHelper } from "@/src/ThreeHelper";
import { BaseParticle } from "@/src/ThreeHelper/particle/base/ParticleMaterial";
import { MoveParticle } from "@/src/ThreeHelper/particle/move/ParticleMaterial";

/**
 * 绘制一个粒子元素
 */
const drawParticle = () => {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(3, 32, 32));
    sphere.position.set(0, 0, 0);
    const particle = new BaseParticle(sphere, { size: 1 });
    return particle.particle;
};

/**
 * 绘制球形粒子区域
 */
const drawSphereParticle = (pointCount = 1000) => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(pointCount * 3);
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    for (let index = 0; index < pointCount; index++) {
        const r3 = index * 3;
        const position = new THREE.Vector3();
        const nearRadius = 0;
        const distance = nearRadius + Math.random() * 2;
        // position.setFromCylindricalCoords(
        position.setFromSphericalCoords(
            distance,
            Math.random() * Math.PI,
            // Math.log(Math.random()) * 2 - distance / 3
            // Math.log(Math.random())
            Math.random() * 360
        );

        positions[r3] = position.x;
        positions[r3 + 1] = position.y;
        positions[r3 + 2] = position.z;
    }

    // 更改几何 旋转中心仍为 0，0，0
    geometry.translate(-4, 3, 0);

    const mesh = new THREE.Mesh(geometry);
    // 不修改集合 旋转中心为自身中心
    // mesh.position.set(-4, 3, 0);

    const pm = new BaseParticle(mesh, { size: 1, additiveBlending: true });
    pm.particle.onAfterRender = () => {
        pm.particle.rotation.y += 0.01;
    };
    return pm.particle;
};

/**
 * 绘制移动的球形粒子区域
 */
const drawMoveSphereParticle = (pointCount = 1000) => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(pointCount * 3);
    const coords = new Float32Array(pointCount * 3);
    const scales = new Float32Array(pointCount * 1);
    // 粒子的坐标
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    // 传递生成点相关的参数 让点绕中心旋转计算使用
    geometry.setAttribute("coords", new THREE.BufferAttribute(coords, 3));
    // 大小
    geometry.setAttribute("scale", new THREE.BufferAttribute(scales, 1));
    const _position = new THREE.Vector3();

    for (let index = 0; index < pointCount; index++) {
        const r3 = index * 3;
        const nearRadius = 0;
        const radius = nearRadius + Math.random() * 2;
        const phi = Math.random() * Math.PI;
        const theta = Math.random() * 360;

        _position.setFromSphericalCoords(radius, phi, theta);

        coords[r3] = radius;
        coords[r3 + 1] = phi;
        coords[r3 + 2] = theta;

        positions[r3] = _position.x;
        positions[r3 + 1] = _position.y;
        positions[r3 + 2] = _position.z;

        scales[index] = Math.random();
    }

    // geometry.scale(1, 1, 0.65);
    geometry.translate(0, 3, 0);

    const mesh = new THREE.Mesh(geometry);

    const pm = new MoveParticle(mesh, { size: 1, additiveBlending: true });

    // 每次渲染物体的时候 更新时间
    pm.particle.onAfterRender = () => {
        pm.setTime();
    };

    return pm.particle;
};

export const init = (td: ThreeHelper) => {
    td.addAxis();
    td.frameByFrame();
    td.camera.position.set(10, 10, 10);
    // td.add(drawParticle());
    td.add(drawSphereParticle(5000));
    td.add(drawMoveSphereParticle(5000));
};
