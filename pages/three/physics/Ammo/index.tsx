/*
 * @Author: hongbin
 * @Date: 2023-03-06 19:47:08
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-08 14:25:36
 * @Description:
 */
import Layout from "@/src/components/Three/Layout";
import { ThreeHelper } from "@/src/ThreeHelper";
import { RandomColor } from "@/src/ThreeHelper/utils";
import { KeyBoardListener } from "@/src/ThreeHelper/utils/KeyBoardListener";
import { FC } from "react";
import * as THREE from "three";
import { Object3D } from "three";
import Ammo from "../../../../src/ThreeHelper/physics/ammo.wasm";
import { AmmoPhysics } from "../../../../src/ThreeHelper/physics/AmmoPhysics";

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

    Ammo().then(async (Ammo: any) => {
        const ammoPhysics = AmmoPhysics(Ammo);

        const { random } = Math;

        for (let i = 0; i < 10; i++) {
            const box = createBox(random(), random(), random());
            box.position.set(0, i + 1, 0);
            helper.add(box);
            ammoPhysics.addMesh(box, 0.21);
        }
        const floor = createFloor();
        helper.add(floor);
        ammoPhysics.addMesh(floor, 0, { restitution: 0.5 });

        // const wall = createWall();
        const wall = createRandomWall(ammoPhysics);
        helper.add(...wall);
        const spheres = createRandomSphere(ammoPhysics);
        helper.add(...spheres);

        // const [keyBoardControl, box] = controlledObject(
        //     ammoPhysics,
        //     helper,
        //     Ammo
        // );
        const [keyBoardControl, box] = await controlledModel(
            ammoPhysics,
            helper,
            Ammo
        );
        ammoPhysics.addBox3Mesh(box, 30, { restitution: 0.5, needMove: true });
        const size = new THREE.Vector3();
        const box3 = new THREE.Box3().setFromObject(box);
        box3.getSize(size);
        const boxHelper = new THREE.Box3Helper(box3);
        box.add(boxHelper);
        // 控制器相机跟踪
        const disVec = new THREE.Vector3().sub(box.position);
        helper.controls.target.sub(disVec);
        helper.camera.position.sub(disVec);

        helper.animation(() => {
            const deltaTime = helper.clock.getDelta();
            disVec.copy(box.position);
            keyBoardControl.update();
            ammoPhysics.stepSimulation(deltaTime, 10);
            disVec.sub(box.position);
            helper.controls.target.sub(disVec);
            helper.camera.position.sub(disVec);
            // console.log(box.userData.body.getLinearVelocity().y());
        });
    });
};

class KeyBoardControl {
    private vector = new THREE.Vector3();
    private _call?: (v: Vector3) => void;
    private scaled = 0.1;
    private readonly moveCodeEvent = {
        KeyW: (vec: Vector3) => {
            vec.z = -this.scaled;
        },
        KeyS: (vec: Vector3) => {
            vec.z = this.scaled;
        },
        KeyA: (vec: Vector3) => {
            vec.x = -this.scaled;
        },
        KeyD: (vec: Vector3) => {
            vec.x = this.scaled;
        },
        Space: (vec: Vector3) => {
            vec.y = this.scaled;
        },
    };
    private moveCode = Object.keys(this.moveCodeEvent) as Array<
        keyof typeof this.moveCodeEvent
    >;
    private KeyBoardListener = new KeyBoardListener();

    call(back: (v: Vector3) => void) {
        this._call = back;
        this.moveCode.forEach((code) => {
            this.KeyBoardListener.listenKey(code, () => {});
        });
        this.KeyBoardListener.keyBoardListen();
    }

    update() {
        if (this._call) {
            this.vector.set(0, 0, 0);

            this.moveCode.forEach((code) => {
                if (this.KeyBoardListener.listenPool[code].isPress) {
                    this.moveCodeEvent[code](this.vector);
                }
            });
            // if (this.vector.x || this.vector.y || this.vector.z) {
            this._call(this.vector);
            // }
        }
    }
}

/**
 * 创建受控物体
 */
function controlledObject(
    ammoPhysics: ReturnType<typeof AmmoPhysics>,
    helper: ThreeHelper,
    AmmoLib: any
): [KeyBoardControl, Mesh] {
    const box = createBox(
        0.5,
        0.5,
        0.5,
        new THREE.MeshPhysicalMaterial({
            color: new THREE.Color("#270152"),
        })
    );
    box.position.set(1, 2, 1);
    helper.add(box);
    ammoPhysics.addMesh(box, 20, { restitution: 0.5, needMove: true });

    const vector = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();

    const keyBoardControl = new KeyBoardControl();
    keyBoardControl.call((v) => {
        if (v.x || v.y || v.z) {
            vector.copy(box.position);
            const angle = helper.controls.getAzimuthalAngle();
            vector.add(v.applyAxisAngle(Object3D.DefaultUp, angle));
            ammoPhysics.setMeshPosition(box, vector);
            quaternion.setFromAxisAngle(Object3D.DefaultUp, angle);
            ammoPhysics.setMeshQuaternion(box, quaternion);

            //上升时重置速度防止下坠速度不减无法自由上升
            if (v.y) {
                box.userData.body.setLinearVelocity(
                    new AmmoLib.btVector3(0, -3, 0)
                );
            }
            // quaternion.copy(box.quaternion);
            // quaternion.x += 0.01;
            // ammoPhysics.setMeshQuaternion(box, quaternion);
            // helper.controls.target.add(v);
            // helper.camera.position.add(v);
        }
    });

    return [keyBoardControl, box];
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
                // color: new THREE.Color("#55ff11"),
                color: new RandomColor(),
            })
    );
    return box;
}

function createFloor(): Mesh {
    const width = 50;
    const height = 0.2;
    const depth = 50;

    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshPhysicalMaterial({
            color: new THREE.Color("#5511ff"),
        })
    );
    return mesh;
}

function createWall() {
    const width = 10;
    const height = 3;
    const depth = 0.1;

    const meshArr = [] as Mesh[];
    const v = 0.1 + height / 2;
    const h = 5 - depth / 2;
    const position = [
        [h, v, 0],
        [0, v, h],
        [-h, v, 0],
        [0, v, -h],
    ] as [number, number, number][];

    for (let i = 0; i < 4; i++) {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            new THREE.MeshPhysicalMaterial({
                color: new THREE.Color("#3d07c5"),
            })
        );
        meshArr.push(mesh);

        mesh.position.set(...position[i]);

        mesh.setRotationFromAxisAngle(
            Object3D.DefaultUp,
            (Math.PI / 180) * 90 * (i + 1)
        );
    }
    return meshArr;
}

function createRandomWall(ammoPhysics: ReturnType<typeof AmmoPhysics>) {
    const meshArr = [] as Mesh[];

    const { random } = Math;

    for (let i = 0; i < 30; i++) {
        const mass = random() < 0.5 ? random() : 0;

        const height = mass === 0 ? 4 : random();
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(10 * random(), height, random()),
            new THREE.MeshPhysicalMaterial({
                color:
                    mass === 0 ? new THREE.Color("#2b0390") : new RandomColor(),
            })
        );
        meshArr.push(mesh);

        mesh.position.set(
            25 * (0.5 - random()),
            0.1 + height / 2,
            25 * (0.5 - random())
        );

        mesh.setRotationFromAxisAngle(
            Object3D.DefaultUp,
            (Math.PI / 180) * 30 * (i + 1)
        );

        ammoPhysics.addMesh(mesh, mass);
    }
    return meshArr;
}

function createRandomSphere(ammoPhysics: ReturnType<typeof AmmoPhysics>) {
    const meshArr = [] as Mesh[];

    const { random } = Math;

    for (let i = 0; i < 10; i++) {
        const mass = random() < 0.7 ? 2 * random() : 0;

        const radius = random();
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 24, 24),
            new THREE.MeshPhysicalMaterial({
                color:
                    mass === 0 ? new THREE.Color("#1f0390") : new RandomColor(),
            })
        );
        meshArr.push(mesh);

        mesh.position.set(
            30 * (0.5 - random()),
            0.1 + radius / 2 + (mass === 0 ? 0 : random()),
            30 * (0.5 - random())
        );

        mesh.setRotationFromAxisAngle(
            Object3D.DefaultUp,
            (Math.PI / 180) * 30 * (i + 1)
        );

        ammoPhysics.addMesh(mesh, mass, { friction: 0.5, restitution: 0.5 });
    }
    return meshArr;
}

/**
 * 创建受控模型
 */
async function controlledModel(
    ammoPhysics: ReturnType<typeof AmmoPhysics>,
    helper: ThreeHelper,
    AmmoLib: any
): Promise<[KeyBoardControl, Mesh]> {
    const gltf = await helper.loadGltf("/models/car.glb");
    const mesh = gltf.scene.children[0] as Mesh;
    if (!mesh) throw new Error("no children!");

    mesh.position.set(0, 0, 0);
    // mesh.scale.set(4, 4, 4);
    helper.add(mesh);

    const vector = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();

    const keyBoardControl = new KeyBoardControl();

    keyBoardControl.call((v) => {
        if (v.x || v.y || v.z) {
            vector.copy(mesh.position);
            const angle = helper.controls.getAzimuthalAngle();
            vector.add(v.applyAxisAngle(Object3D.DefaultUp, angle));
            ammoPhysics.setMeshPosition(mesh, vector);
            // 旋转跟随
            quaternion.setFromAxisAngle(Object3D.DefaultUp, angle);
            ammoPhysics.setMeshQuaternion(mesh, quaternion);

            //上升时重置速度防止下坠速度不减无法自由上升
            if (v.y) {
                mesh.userData.body.setLinearVelocity(
                    new AmmoLib.btVector3(0, -3, 0)
                );
            }
        }
    });

    return [keyBoardControl, mesh];
}
