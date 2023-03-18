/*
 * @Author: hongbin
 * @Date: 2023-01-28 10:31:05
 * @LastEditors: hongbin
 * @LastEditTime: 2023-01-29 15:15:49
 * @Description:使用three封装的Ammo助手实现physics.tsx效果
 */
import Layout from "@/src/components/Three/Layout";
import { ThreeHelper } from "@/src/ThreeHelper";
import { FC } from "react";
import * as THREE from "three";
import Ammo from "../../../src/ThreeHelper/physics/ammo.wasm";
import { AmmoPhysics } from "../../../src/ThreeHelper/physics/AmmoPhysics";

interface IProps {}

const Physics: FC<IProps> = () => {
    return (
        <Layout
            title={"物理引擎 Ammo"}
            init={init}
            desc="使用three的Ammo助手-客户端渲染"
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

    Ammo().then((Ammo: any) => {
        const ammoPhysics = AmmoPhysics(Ammo);

        for (let i = 0; i < 40; i++) {
            const box = createBox(0.3, 0.3, 0.3);
            box.position.set(0, i + 1, 0);
            helper.add(box);
            ammoPhysics.addMesh(box, 1);
        }
        const floor = createFloor();
        helper.add(floor);
        ammoPhysics.addMesh(floor, 0);

        controlledObject(ammoPhysics, helper);

        helper.animation(() => {
            const deltaTime = helper.clock.getDelta();
            ammoPhysics.stepSimulation(deltaTime);
        });
    });
};

/**
 * 创建受控物体
 */
function controlledObject(
    ammoPhysics: ReturnType<typeof AmmoPhysics>,
    helper: ThreeHelper
) {
    const box = createBox(
        0.5,
        0.5,
        0.5,
        new THREE.MeshPhysicalMaterial({
            color: new THREE.Color("#270152"),
        })
    );
    box.position.set(1, 1, 1);
    helper.add(box);
    ammoPhysics.addMesh(box, 1);

    const vector = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();

    helper.keyBoardListen();
    helper.listenKey("w", () => {
        vector.copy(box.position);
        vector.z -= 0.1;
        ammoPhysics.setMeshPosition(box, vector);
        quaternion.copy(box.quaternion);
        quaternion.z -= 0.1;
        ammoPhysics.setMeshQuaternion(box, quaternion);
    });
    helper.listenKey("s", () => {
        vector.copy(box.position);
        vector.z += 0.1;
        ammoPhysics.setMeshPosition(box, vector);
        quaternion.copy(box.quaternion);
        quaternion.z += 0.1;
        ammoPhysics.setMeshQuaternion(box, quaternion);
    });
    helper.listenKey("a", () => {
        vector.copy(box.position);
        vector.x -= 0.1;
        ammoPhysics.setMeshPosition(box, vector);
        quaternion.copy(box.quaternion);
        quaternion.x -= 0.1;
        ammoPhysics.setMeshQuaternion(box, quaternion);
    });
    helper.listenKey("d", () => {
        vector.copy(box.position);
        vector.x += 0.1;
        ammoPhysics.setMeshPosition(box, vector);
        quaternion.copy(box.quaternion);
        quaternion.x += 0.1;
        ammoPhysics.setMeshQuaternion(box, quaternion);
    });
}

function createBox(
    width = 0.3,
    height = 0.3,
    depth = 0.3,
    material?: THREE.Material
): Mesh {
    // const width = 0.3;
    // const height = 0.3;
    // const depth = 0.3;
    const box = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        material ||
            new THREE.MeshPhysicalMaterial({
                color: new THREE.Color("#55ff11"),
            })
    );
    return box;
}

function createFloor(): Mesh {
    const width = 10;
    const height = 10;
    const depth = 1;

    const mesh = new THREE.Mesh(
        // new THREE.PlaneGeometry(width, height),
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshPhysicalMaterial({
            color: new THREE.Color("#5511ff"),
        })
    );
    // ! 不能修改几何来更改属性 createRigidBody方法中使用 mesh.quaternion获取旋转信息
    // mesh.geometry.rotateX(Math.PI / -2);
    mesh.rotateX(Math.PI / -2);
    return mesh;
}
