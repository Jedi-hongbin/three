/*
 * @Author: hongbin
 * @Date: 2023-03-06 12:34:17
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-06 14:46:05
 * @Description: cannon.js
 */
import Layout from "@/src/components/Three/Layout";
import { ThreeHelper } from "@/src/ThreeHelper";
import { FC } from "react";
import * as THREE from "three";
import CANNON from "cannon";
import { BoxGeometry, PlaneGeometry, SphereGeometry } from "three";

interface IProps {}

const Physics: FC<IProps> = () => {
    return (
        <Layout
            title={"物理引擎 cannon.js"}
            init={init}
            desc="yarn add cannon-客户端渲染"
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

    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    const cannonDefaultMaterial = new CANNON.Material("");
    const cannonDefaultCantactMaterial = new CANNON.ContactMaterial(
        cannonDefaultMaterial,
        cannonDefaultMaterial,
        {
            friction: 0.5,
            restitution: 0.7,
        }
    );
    world.addContactMaterial(cannonDefaultCantactMaterial);

    //平面
    // const plane = new THREE.Mesh(
    //     new PlaneGeometry(5, 5),
    //     new THREE.MeshStandardMaterial({ color: 0x5511ff })
    // );
    // plane.rotateX(Math.PI / -2);
    // const groundBody = new CANNON.Body({
    //     mass: 0, // mass == 0 makes the body static
    //     position: new CANNON.Vec3(
    //         plane.position.x,
    //         plane.position.y,
    //         plane.position.z
    //     ),
    //     quaternion: new CANNON.Quaternion(
    //         plane.quaternion.x,
    //         plane.quaternion.y,
    //         plane.quaternion.z,
    //         plane.quaternion.w
    //     ),
    //     shape: new CANNON.Plane(),
    // });
    // world.addBody(groundBody);
    // helper.add(plane);
    // 平台
    const plane = new THREE.Mesh(
        new BoxGeometry(3, 0.5, 3),
        new THREE.MeshStandardMaterial({ color: 0x5511ff })
    );
    const groundBody = new CANNON.Body({
        mass: 0, // mass == 0 makes the body static
        position: new CANNON.Vec3(
            plane.position.x,
            plane.position.y,
            plane.position.z
        ),
        quaternion: new CANNON.Quaternion(
            plane.quaternion.x,
            plane.quaternion.y,
            plane.quaternion.z,
            plane.quaternion.w
        ),
        shape: new CANNON.Box(new CANNON.Vec3(3, 0.5, 3)),
    });
    world.addBody(groundBody);
    helper.add(plane);
    //球
    const sphere = new THREE.Mesh(
        new SphereGeometry(0.5, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0x55ff11 })
    );
    helper.add(sphere);
    sphere.position.set(0, 3, 0);
    const sphereBody = new CANNON.Body({
        material: cannonDefaultMaterial,
        mass: 4,
        position: new CANNON.Vec3(
            sphere.position.x,
            sphere.position.y,
            sphere.position.z
        ),
        shape: new CANNON.Sphere(0.5),
    });
    world.addBody(sphereBody);

    const fixedTimeStep = 1.0 / 60.0; // seconds
    const maxSubSteps = 3;

    helper.animation(() => {
        const delta = helper.clock.getDelta();
        world.step(fixedTimeStep, delta, maxSubSteps);
        //@ts-ignore
        sphere.position.copy(sphereBody.position);
    });
};
