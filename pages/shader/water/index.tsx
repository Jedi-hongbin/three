/*
 * @Author: hongbin
 * @Date: 2023-03-02 13:50:36
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-13 13:55:00
 * @Description: shaderToy 上的shader
 */
import Layout from "@/src/components/Three/Layout";
import { ThreeHelper } from "@/src/ThreeHelper";
import { Water } from "three/examples/jsm/objects/Water";

import { FC } from "react";
import * as THREE from "three";

interface IProps {}

const Physics: FC<IProps> = () => {
    return (
        <Layout
            title={"Water"}
            init={init}
            desc={"three/examples/jsm/objects/Water"}
        />
    );
};

export default Physics;

function init(helper: ThreeHelper) {
    helper.addAxis();
    helper.addStats();
    helper.camera.position.set(0, 4, 4);
    helper.frameByFrame();
    helper.addGUI();
    helper.initLights();
    helper.useSkyEnvironment();

    helper.addRect({ width: 1, height: 1, depth: 1 });

    const waterGeometry = new THREE.PlaneGeometry(10, 10);

    const water = new Water(waterGeometry, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load(
            "/textures/waternormals.jpg",
            function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }
        ),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: "#0084f0",
        fog: helper.scene.fog !== undefined,
    });
    water.material.uniforms["sunDirection"].value.set(0, 1, 1);
    water.material.uniforms["size"].value = 3;
    water.rotation.x = -Math.PI / 2;

    water.onAfterRender = () => {
        water.material.uniforms["time"].value += 0.0016;
    };

    helper.add(water);

    helper.animation(() => {
        const time = helper.clock.getElapsedTime();
    });
}
