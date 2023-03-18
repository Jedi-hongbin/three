/*
 * @Author: hongbin
 * @Date: 2023-03-17 22:24:58
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-18 21:34:38
 * @Description:gif作为纹理
 */
import Layout from "@/src/components/Three/Layout";
import { ThreeHelper } from "@/src/ThreeHelper";
import { GIFTexture } from "three-gif-texture";
import { FC } from "react";
import * as THREE from "three";

interface IProps {}

const Physics: FC<IProps> = () => {
    return <Layout title={"gif作为纹理"} init={init} desc={"omggif"} />;
};

export default Physics;

function init(helper: ThreeHelper) {
    helper.addAxis();
    helper.addStats();
    helper.camera.position.set(0, 1, 2);
    helper.frameByFrame();
    helper.addGUI();
    helper.useSkyEnvironment();
    helper.initLights();

    {
        const gifTexture = new GIFTexture(
            "/textures/bomb.gif",
            undefined,
            (map) => {
                const mesh = new THREE.Mesh(
                    new THREE.PlaneGeometry(1, 1),
                    new THREE.MeshStandardMaterial({ map })
                );

                helper.add(mesh);
                mesh.position.x += 1;

                helper.animation(() => {
                    gifTexture.draw();
                });
            }
        );
    }
    {
        const gifTexture = new GIFTexture(
            "/textures/bomb.gif",
            undefined,
            (map) => {
                const mesh = new THREE.Mesh(
                    new THREE.PlaneGeometry(1, 1),
                    new THREE.MeshStandardMaterial({ map })
                );

                mesh.onAfterRender = () => {
                    gifTexture.draw();
                };

                helper.add(mesh);
            }
        );
    }
    {
        new GIFTexture("/textures/bomb.gif", "autoDraw", (map) => {
            const mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(1, 1),
                new THREE.MeshStandardMaterial({ map })
            );
            mesh.position.x -= 1;
            helper.add(mesh);
        });
    }
}
