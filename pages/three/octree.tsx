/*
 * @Author: hongbin
 * @Date: 2023-03-15 20:31:29
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-16 13:37:15
 * @Description: 使用八叉树返回碰撞物体
 */
import Layout from "@/src/components/Three/Layout";
import { ThreeHelper } from "@/src/ThreeHelper";
import { RandomColor } from "@/src/ThreeHelper/utils";
import { OctreeControls } from "@/src/ThreeHelper/utils/OctreeControls";
import { FC } from "react";
import { Box3, Group, Object3D, Vector3 } from "three";

interface IProps {}

const Index: FC<IProps> = () => {
    return (
        <Layout
            title={"八叉树返回碰撞物体"}
            init={init}
            desc="修改八叉树源码让每个三角面绑定所属物体"
        />
    );
};

export default Index;

function init(helper: ThreeHelper) {
    helper.addAxis();
    helper.addGUI();
    helper.addStats();
    helper.camera.position.set(0, 1, 2);
    helper.frameByFrame();
    helper.initLights();

    const group = new Group();

    for (let i = 0; i < 20; i++) {
        const box = helper.generateRect(
            { width: 1, height: 1, depth: 1 },
            { color: new RandomColor() }
        );
        box.position.x = (0.5 - Math.random()) * 10;
        box.position.z = (0.5 - Math.random()) * 10;
        box.position.y = (0.5 - Math.random()) * 2;
        group.add(box);
        box.name = i + "";
    }
    helper.add(group);
    console.log(group);

    const observer = helper.generateRect(
        { width: 0.3, height: 0.3, depth: 0.3 },
        { color: "#f00" }
    );
    helper.add(observer);

    helper.keyBoardListen();
    let w = false;
    helper.listenKey(
        "KeyW",
        () => {
            w = true;
        },
        () => {
            w = false;
        }
    );
    let s = false;
    helper.listenKey(
        "KeyS",
        () => {
            s = true;
        },
        () => {
            s = false;
        }
    );
    let a = false;
    helper.listenKey(
        "KeyA",
        () => {
            a = true;
        },
        () => {
            a = false;
        }
    );
    let d = false;
    helper.listenKey(
        "KeyD",
        () => {
            d = true;
        },
        () => {
            d = false;
        }
    );

    const octree = new OctreeControls();
    const size = new Box3().setFromObject(observer).getSize(new Vector3());
    observer.userData._size = size;
    octree.player(observer);
    octree.fromGraphNode(group);
    octree.console(helper.gui);
    octree.collide((res) => {
        if (res) {
            console.log(res);
            const v = res.normal.multiplyScalar(res.depth);
            octree.translatePlayerCollider(v);
            observer.position.add(v);
            helper.camera.position.add(v);
            helper.controls.target.add(v);
            if (res.meshuuid) {
                const mesh = helper.scene.getObjectByProperty(
                    "uuid",
                    res.meshuuid + ""
                ) as Mesh;
                console.log(mesh);
                if (mesh) {
                    //@ts-ignore
                    mesh.material.color = new RandomColor();
                }
            }
        }
    });

    const diff = new Vector3();

    helper.animation(() => {
        diff.copy(observer.position);
        const angle = helper.controls.getAzimuthalAngle();
        const v = new Vector3();
        if (w) {
            v.z -= 0.04;
        }
        if (a) {
            v.x -= 0.04;
        }
        if (s) {
            v.z += 0.04;
        }
        if (d) {
            v.x += 0.04;
        }

        v.applyAxisAngle(Object3D.DefaultUp, angle);
        octree.translatePlayerCollider(v);
        octree.playerCollisions();

        observer.position.add(v);
        diff.sub(observer.position);
        helper.camera.position.sub(diff);
        helper.controls.target.sub(diff);
    });
}
