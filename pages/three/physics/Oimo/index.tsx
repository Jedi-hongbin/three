/*
 * @Author: hongbin
 * @Date: 2023-03-06 14:46:48
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-06 19:46:38
 * @Description: Oimo.js
 */
import Layout from "@/src/components/Three/Layout";
import { ThreeHelper } from "@/src/ThreeHelper";
import { FC } from "react";
import * as THREE from "three";
//@ts-ignore
import * as Oimo from "oimo";

// import { OimoPhysics } from 'three/addons/physics/OimoPhysics.js';

import { BoxGeometry, SphereGeometry } from "three";

interface IProps {}

const Physics: FC<IProps> = () => {
    return (
        <Layout
            title={"物理引擎 Oimo.js 不好用"}
            init={init}
            desc="yarn add Oimo-客户端渲染"
        />
    );
};

export default Physics;

const init = (helper: ThreeHelper) => {
    helper.addAxis();
    helper.addStats();
    helper.camera.position.set(0, 7, 10);
    helper.frameByFrame();

    helper.addGUI();

    // const a = new OimoPhysics();

    const plane = new THREE.Mesh(
        new BoxGeometry(3, 0.5, 3),
        new THREE.MeshStandardMaterial({ color: 0x5511ff })
    );
    helper.add(plane);
    //球
    const sphere = new THREE.Mesh(
        new SphereGeometry(0.5, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0x55ff11 })
    );
    helper.add(sphere);
    sphere.position.set(0, 3, 0);

    helper.animation(() => {
        const delta = helper.clock.getDelta();
    });
};
