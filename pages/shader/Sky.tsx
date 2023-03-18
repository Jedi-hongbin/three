/*
 * @Author: hongbin
 * @Date: 2023-03-02 13:50:36
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-11 18:34:31
 * @Description: 天空shader
 */
import Layout from "@/src/components/Three/Layout";
import { ThreeHelper } from "@/src/ThreeHelper";
import { FC } from "react";
import { Sky } from "three/examples/jsm/objects/Sky";

import * as THREE from "three";

interface IProps {}

const Physics: FC<IProps> = () => {
    return <Layout title={"自定义shader"} init={init} desc={""} />;
};

export default Physics;

function init(helper: ThreeHelper) {
    helper.addAxis();
    helper.addStats();
    helper.camera.position.set(0, 0, 1);
    helper.frameByFrame();
    helper.addGUI();

    const material = helper.useSkyEnvironment();

    const sunPosition = new THREE.Vector3(0, 0, -1);
    material.uniforms["rayleigh"].value = 1;
    material.uniforms["sunPosition"].value.copy(sunPosition);
    helper.gui?.add({ a: sunPosition.y }, "a", 0, 1).onChange((v) => {
        sunPosition.y = v;
        sunPosition.z = -(1 - v);
        material.uniforms["sunPosition"].value.copy(sunPosition);
        material.uniforms["rayleigh"].value = 1 - v * 0.9;
        // material.uniforms["rayleigh"].value = v;
    });

    // const sky = new Sky();
    // sky.scale.setScalar(10);
    // helper.add(sky);
    // const skyUniforms = sky.material.uniforms;

    // skyUniforms["turbidity"].value = 1;
    // skyUniforms["rayleigh"].value = 1;
    // skyUniforms["mieCoefficient"].value = 0.005;
    // skyUniforms["mieDirectionalG"].value = 0.7;

    // const sun = new THREE.Vector3();

    // const parameters = {
    //     elevation: 1,
    //     azimuth: 180,
    // };
    // const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    // const theta = THREE.MathUtils.degToRad(parameters.azimuth);

    // sun.setFromSphericalCoords(1, phi, theta);
    // // sun.set(1, 0.01, -1);
    // sky.material.uniforms["sunPosition"].value.copy(sun);

    // const pmremGenerator = new THREE.PMREMGenerator(helper.renderer);
    // helper.scene.environment?.dispose();
    // helper.scene.environment = pmremGenerator.fromScene(sky as any).texture;

    helper.animation(() => {
        const time = helper.clock.getElapsedTime();
        // NightCityShader.updateUniforms("iTime", time);
    });
}
