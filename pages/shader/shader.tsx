/*
 * @Author: hongbin
 * @Date: 2023-03-02 13:50:36
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-11 10:20:55
 * @Description: shaderToy 上的shader
 */
import Layout from "@/src/components/Three/Layout";
import { ThreeHelper } from "@/src/ThreeHelper";
import { CloudsShader } from "@/src/ThreeHelper/shader/clouds/CloudsShader";
import { FireShader } from "@/src/ThreeHelper/shader/fire/FireShader";
import { NightCityShader } from "@/src/ThreeHelper/shader/nightCity/NightCityShader";
import { WaterShaderMaterial } from "@/src/ThreeHelper/shader/water/WaterMaterial";
import { FC } from "react";
import * as THREE from "three";

interface IProps {}

const Physics: FC<IProps> = () => {
    return (
        <Layout
            title={"自定义shader"}
            init={init}
            desc={
                <a
                    target={"_blank"}
                    rel="noreferrer"
                    href="http://www.shaderToy.com"
                >
                    shader来自shaderToy
                </a>
            }
        />
    );
};

export default Physics;

function init(helper: ThreeHelper) {
    // helper.addAxis();
    helper.addStats();
    helper.camera.position.set(0, 0, 1);
    helper.frameByFrame();
    helper.addGUI();
    helper.setBackground("#fffae5");

    const shaders = {
        FireShader,
        CloudsShader,
        NightCityShader,
        WaterShaderMaterial,
    };

    const box = helper.generateRect(
        {
            width: 1,
            height: 1,
            depth: 1,
        },
        { color: "#faa" }
    );

    helper.add(box);

    box.position.set(0, 0, -1);

    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1, 10, 10),
        // new THREE.SphereGeometry(1, 12, 12),
        shaders.WaterShaderMaterial
    );

    for (const [key, shader] of Object.entries(shaders)) {
        helper.gui?.add(
            {
                [key]: () => {
                    plane.material = shader;
                },
            },
            key
        );
    }

    helper.add(plane);

    helper.animation(() => {
        const time = helper.clock.getElapsedTime();
        // NightCityShader.updateUniforms("iTime", time);
        plane.material &&
            //@ts-ignore
            plane.material.updateUniforms &&
            //@ts-ignore
            plane.material.updateUniforms("iTime", time);
    });
}
