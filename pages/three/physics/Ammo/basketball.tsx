/*
 * @Author: hongbin
 * @Date: 2023-03-08 10:59:25
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-10 20:00:30
 * @Description:篮球游戏
 */
import Layout from "@/src/components/Three/Layout";
import { ThreeHelper } from "@/src/ThreeHelper";
import { KeyBoardListener } from "@/src/ThreeHelper/utils/KeyBoardListener";
import { createRef, FC, Fragment, useImperativeHandle, useState } from "react";
import styled from "styled-components";
import * as THREE from "three";
import { Object3D } from "three";
import Ammo from "../../../../src/ThreeHelper/physics/ammo.wasm";
import { AmmoPhysics } from "../../../../src/ThreeHelper/physics/AmmoPhysics";

interface IProps {}

const percentRef = createRef<{ setPercent: (p: number) => void }>();

const Physics: FC<IProps> = () => {
    const [percent, setPercent] = useState(0);

    useImperativeHandle(
        percentRef,
        () => ({
            setPercent: (percent: number) => {
                setPercent(percent);
            },
        }),
        []
    );

    return (
        <Fragment>
            <Layout
                title={"篮球游戏 物理引擎 Ammo"}
                init={init}
                desc="使用three的Ammo助手-客户端渲染"
            />
            <Bar percent={percent} />
        </Fragment>
    );
};

export default Physics;

const Bar = styled.div<{ percent: number }>`
    width: 40vw;
    height: 1vw;
    position: fixed;
    top: 80vh;
    border: 1px solid ${(props) => (!!props.percent ? "#fff" : "transparent")};
    left: 30vw;
    transition: 0.3s;
    ::after {
        content: "";
        background: #df4b02;
        height: 100%;
        width: ${(props) => props.percent + "%"};
        position: absolute;
    }
`;

const init = (helper: ThreeHelper) => {
    helper.addAxis();
    helper.addStats();
    helper.camera.position.set(0, 1, 2);
    helper.controls.target.y += 1;
    helper.frameByFrame();

    helper.addGUI();

    Ammo().then(async (Ammo: any) => {
        const ammoPhysics = AmmoPhysics(Ammo);

        const floor = createFloor();
        helper.add(floor);
        ammoPhysics.addMesh(floor, 0, { restitution: 0.1 });

        await loadArea(helper, Ammo, ammoPhysics);

        const [keyBoardControl, person] = controlledCamera(helper, ammoPhysics);
        basketball(helper, Ammo, ammoPhysics);

        const diff = new THREE.Vector3();

        helper.animation(() => {
            diff.copy(person.position);
            const deltaTime = helper.clock.getDelta();
            keyBoardControl.update();
            ammoPhysics.stepSimulation(deltaTime, 10);
            diff.sub(person.position);
            helper.camera.position.sub(diff);
            helper.controls.target.sub(diff);
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

function createFloor(): Mesh {
    const width = 50;
    const height = 2;
    const depth = 50;

    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshPhysicalMaterial({
            color: new THREE.Color("#2f029f"),
            metalness: 0.5,
            roughness: 1,
            transparent: true,
            opacity: 0.4,
        })
    );
    mesh.position.y = -2;

    return mesh;
}

/**
 * 控制相机移动
 */
function controlledCamera(
    helper: ThreeHelper,
    ammoPhysics: ReturnType<typeof AmmoPhysics>
): [KeyBoardControl, Mesh] {
    helper.add(helper.camera);
    const keyBoardControl = new KeyBoardControl();

    const person = helper.generateRect({ width: 0.5, height: 1, depth: 0.2 });
    // helper.add(person);
    ammoPhysics.addMesh(person, 10, {
        needMove: true,
    });

    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();

    keyBoardControl.call((v) => {
        if (v.x || v.y || v.z) {
            position.copy(person.position);
            const angle = helper.controls.getAzimuthalAngle();
            v.applyAxisAngle(Object3D.DefaultUp, angle);
            position.add(v);

            ammoPhysics.setMeshPosition(person, position);
            ammoPhysics.setMeshQuaternion(person, quaternion);
        }
    });

    return [keyBoardControl, person];
}

/**
 * 加载场地
 */
async function loadArea(
    helper: ThreeHelper,
    ammo: any,
    ammoPhysics: ReturnType<typeof AmmoPhysics>
) {
    const gltf = await helper.loadGltf("/models/boll.glb");
    helper.add(gltf.scene);

    gltf.scene.traverse((obj) => {
        //@ts-ignore
        if (obj.isMesh) {
            ammoPhysics.addMeshByTriangle(
                obj as Mesh,
                0,
                {
                    restitution: 0.1,
                    friction: 1,
                },
                obj.name.includes("篮筐")
            );
        }
    });
}

/**
 * 篮球
 */
function basketball(
    helper: ThreeHelper,
    ammo: any,
    ammoPhysics: ReturnType<typeof AmmoPhysics>
) {
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 12, 12),
        new THREE.MeshPhysicalMaterial({ color: 0x4411ff })
    );
    sphere.position.copy(helper.camera.position);
    sphere.position.z -= 1;
    sphere.position.y += 1;

    ammoPhysics.addMesh(sphere, 1, { restitution: 1, needMove: true });

    const dir = new THREE.Vector3();

    let start = 0;
    let duration = 0;
    /**
     * 按下Q键 根据时间决定力度
     */
    const press = () => {
        start == 0 && (start = performance.now());
        duration = Math.min(100, (performance.now() - start) / 10);
        percentRef.current?.setPercent(duration);
    };

    /**
     * 抬起Q键
     */
    const up = () => {
        start = 0;
        percentRef.current?.setPercent(0);
        const p = helper.camera.position.clone();
        ammoPhysics.setMeshPosition(sphere, p);
        helper.camera.getWorldDirection(dir);
        const body = sphere.userData.body;
        dir.multiplyScalar(duration / 4);
        body.setLinearVelocity(new ammo.btVector3(dir.x, dir.y * 1.4, dir.z));
    };

    helper.listenKey("KeyQ", press, up);

    helper.add(sphere);

    return sphere;
}
