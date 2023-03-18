/*
 * @Author: hongbin
 * @Date: 2023-03-15 17:04:16
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-15 18:20:34
 * @Description: 胶囊体
 */
import Layout from "@/src/components/Three/Layout";
import { ThreeHelper } from "@/src/ThreeHelper";
import { FC } from "react";

import * as THREE from "three";

interface IProps {}

const Physics: FC<IProps> = () => {
    return <Layout title={"自定义shader"} init={init} desc={""} />;
};

export default Physics;

function init(helper: ThreeHelper) {
    helper.addAxis();
    helper.addStats();
    helper.camera.position.set(0, 1, 2);
    helper.frameByFrame();
    helper.addGUI();
    helper.initLights();

    const capsule = new THREE.Mesh(
        new THREE.CapsuleGeometry(),
        new THREE.MeshStandardMaterial({
            color: "#4af",
        })
    );

    helper.add(capsule);
}
