/*
 * @Author: hongbin
 * @Date: 2023-01-25 10:53:36
 * @LastEditors: hongbin
 * @LastEditTime: 2023-01-26 14:00:09
 * @Description: 粒子效果
 */
import Layout from "@/src/components/Three/Layout";
import { ThreeHelper } from "@/src/ThreeHelper";
import { RegionParticle } from "@/src/ThreeHelper/particle/region/ParticleMaterial";
import { NoiseShaderMaterial } from "@/src/ThreeHelper/shader/noise/NoiseMaterial";
import { FC } from "react";
import * as THREE from "three";

interface IProps {}

const Particle: FC<IProps> = () => {
    return <Layout title={"THREE TEMPLATE"} init={init} desc="客户端渲染" />;
};

export default Particle;

const init = (helper: ThreeHelper) => {
    // helper.addAxis();

    helper.addStats();
    helper.camera.position.set(0, 1, 10);
    helper.setBackground("#fffae5");

    helper.addGUI();

    // const sphereGeometry = new THREE.SphereGeometry(2, 220, 220);
    // const points = new THREE.Points(sphereGeometry);
    // const particles = new RegionParticle(points, {
    //     size: 3,
    //     color: "#215cb5",
    // });
    // particles.particle.position.set(3, -1, 5);
    // helper.add(particles.particle);
    // particles.particle.rotateY(Math.PI / 8);

    helper
        .loadGltf(
            new URL("../../src/static/models/sphere.glb", import.meta.url)
        )
        .then((g) => {
            helper.frameByFrame();

            const sphere = g.scene.getObjectByName("球体") as Mesh;
            if (!sphere) throw new Error("not find model");
            {
                const particle = meshToParticle(sphere, helper, 0.01, -1);
                particle.position.set(2.5, 0, 6);
                particle.rotateY(Math.PI / -5);
            }
        });
    // helper
    //     .loadGltf(
    //         new URL("../../src/static/models/half-sphere.glb", import.meta.url)
    //     )
    //     .then((g) => {
    //         helper.frameByFrame();

    //         const sphere = g.scene.getObjectByName("球体") as Mesh;
    //         if (!sphere) throw new Error("not find model");
    //         {
    //             const particle = meshToParticle(sphere, helper, 0.01, -1);
    //             particle.position.set(0.5, 0, 6);
    //             particle.rotateY(Math.PI / -5);
    //         }
    //     });

    // helper.gui?.add(
    //     particles.particle.material.uniforms.uLimitZ,
    //     "value",
    //     -particles.limitZ,
    //     particles.limitZ
    // );

    helper.add(noiseBg());
};

function meshToParticle(
    mesh: Mesh,
    helper: ThreeHelper,
    speed = 0.03,
    _dir = 1
) {
    const particles = new RegionParticle(mesh, {
        size: 1,
        color: "#215cb5",
    });
    helper.add(particles.particle);

    let uLimitZ = particles.limitZ * _dir;
    let dir = _dir;
    particles.particle.onAfterRender = () => {
        uLimitZ -= speed * dir;
        if (uLimitZ < -particles.limitZ || uLimitZ > particles.limitZ) {
            dir *= -1;
        }
        particles.particle.material.updateUniforms("uLimitZ", uLimitZ);
    };
    return particles.particle;
}

/**
 * 噪音背景
 */
function noiseBg() {
    const clock = new THREE.Clock();
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 30),
        NoiseShaderMaterial
    );
    plane.onAfterRender = () => {
        plane.material.updateUniforms &&
            plane.material.updateUniforms("vTime", clock.getElapsedTime());
    };
    return plane;
}
