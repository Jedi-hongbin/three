/*
 * @Author: hongbin
 * @Date: 2023-03-02 13:50:36
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-11 21:33:44
 * @Description: 方向光
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
    helper.camera.position.set(0, 0, 5);
    helper.frameByFrame();
    helper.addGUI();

    helper.addRect(
        { width: 1, height: 1, depth: 1 },
        {
            metalness: 0,
            color: 0xffffff,
            // emissive: 0x5511ff,
        }
    );

    // helper.useRoomEnvironment();

    // return;

    {
        const hemisphereLight = new THREE.HemisphereLight(
            0xffffff,
            0xeeeeee,
            0.4
        );
        helper.add(hemisphereLight);
    }

    {
        const light = new THREE.DirectionalLight(0xffffff, 0.5);
        helper.add(light);
        light.position.set(0, 1, -1);
    }
    {
        const light = new THREE.DirectionalLight(0xffffff, 0.5);
        helper.add(light);
        light.position.set(-1, 0, 0);
    }
    {
        const light = new THREE.DirectionalLight(0xffffff, 0.5);
        helper.add(light);
        light.position.set(1, 1, 1);
    }
    return;
    {
        const light = new THREE.DirectionalLight(0xffffff, 0.5);
        helper.add(light);
        light.position.set(0, -1, 0);
    }
    {
        const light = new THREE.DirectionalLight(0xffffff, 1);
        helper.add(light);
        light.position.set(0, 1, 0);
    }
    {
        const light = new THREE.DirectionalLight(0xffffff, 0.75);
        helper.add(light);
        light.position.set(-1, 0, 0);
    }
    {
        const light = new THREE.DirectionalLight(0xffffff, 0.6);
        helper.add(light);
        light.position.set(1, 0, 0);
    }
    {
        const light = new THREE.DirectionalLight(0xffffff, 0.7);
        helper.add(light);
        light.position.set(0, 0, 1);
    }
    {
        const light = new THREE.DirectionalLight(0xffffff, 0.8);
        helper.add(light);
        light.position.set(0, 0, -1);
    }
}
