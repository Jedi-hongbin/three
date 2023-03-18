/*
 * @Author: hongbin
 * @Date: 2023-01-26 15:16:09
 * @LastEditors: hongbin
 * @LastEditTime: 2023-01-28 10:31:53
 * @Description:物理引擎
 */
import Layout from "@/src/components/Three/Layout";
import { ThreeHelper } from "@/src/ThreeHelper";
import { FC } from "react";
import * as THREE from "three";
// import "three/examples/jsm/libs/ammo.wasm";
import Ammo from "../../../src/ThreeHelper/physics/ammo.wasm";

interface IProps {}

const Physics: FC<IProps> = () => {
    return <Layout title={"物理引擎 Ammo"} init={init} desc="客户端渲染" />;
};

export default Physics;

const margin = 0.05;
const rigidBodies = [] as Object3D[];
let physicsWorld: any;
let transformAux1: any;
let collisionConfiguration: any;
let dispatcher: any;
let broadphase: any;
let solver: any;
let gravityConstant = -9.8;

const init = (helper: ThreeHelper) => {
    helper.addAxis();
    helper.addStats();
    helper.camera.position.set(0, 7, 10);
    helper.frameByFrame();

    helper.addGUI();

    Ammo().then((Ammo: any) => {
        initPhysicsVariable(Ammo);
        initPhysics(Ammo, helper);
        controlledObject(Ammo, helper);

        helper.animation(() => {
            const deltaTime = helper.clock.getDelta();
            updatePhysics(deltaTime);
        });
    });

    // helper
    //     .loadGltf(
    //         new URL("../../src/static/models/sphere.glb", import.meta.url)
    //     )
    //     .then((g) => {});
};

function initPhysicsVariable(Ammo: any) {
    transformAux1 = new Ammo.btTransform();

    // bullet基本场景配置
    collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    broadphase = new Ammo.btDbvtBroadphase();
    solver = new Ammo.btSequentialImpulseConstraintSolver();
    physicsWorld = new Ammo.btDiscreteDynamicsWorld(
        dispatcher,
        broadphase,
        solver,
        collisionConfiguration
    );
    physicsWorld.setGravity(new Ammo.btVector3(0, gravityConstant, 0));
}

function initPhysics(Ammo: any, helper: ThreeHelper) {
    const [floor, shape] = createFloor(Ammo);
    createRigidBody(Ammo, floor, shape, 0);
    helper.add(floor);

    for (let i = 0; i < 100; i++) {
        // 创建物体
        const [box, shape] = createBox(Ammo);
        box.position.set(0, i + 1, 0);
        box.rotateY((Math.PI / 360) * i * 10);
        // 创建引擎中的物体数据
        createRigidBody(Ammo, box, shape, 1);
        helper.add(box);
    }
}

function rotationToQuaternion(euler: THREE.Euler) {
    const quat = new THREE.Quaternion();
    quat.setFromEuler(euler);
    return quat;
}

function updatePhysics(deltaTime: number) {
    physicsWorld.stepSimulation(deltaTime);

    const { length } = rigidBodies;
    // 更新物体位置
    for (var i = 0; i < length; i++) {
        var objThree = rigidBodies[i];
        var objPhys = objThree.userData.physicsBody;
        var ms = objPhys.getMotionState();
        if (ms) {
            ms.getWorldTransform(transformAux1);
            var p = transformAux1.getOrigin();
            var q = transformAux1.getRotation();
            objThree.position.set(p.x(), p.y(), p.z());
            objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
        }
    }
}

/**
 * 创建受控物体
 */
function controlledObject(Ammo: any, helper: ThreeHelper) {
    const [box, shape] = createBox(
        Ammo,
        new THREE.MeshPhysicalMaterial({
            color: new THREE.Color("#270152"),
        }),
        0.5,
        0.5,
        0.5
    );
    box.position.set(3, 1, 1);
    const body = createRigidBody(Ammo, box, shape, 1);
    helper.add(box);
    const vector = new THREE.Vector3();
    helper.keyBoardListen();
    helper.listenKey("w", () => {
        vector.copy(box.position);
        vector.z -= 0.1;
        updatePosition(Ammo, body, vector);
    });
    helper.listenKey("s", () => {
        vector.copy(box.position);
        vector.z += 0.1;
        updatePosition(Ammo, body, vector);
    });
    helper.listenKey("a", () => {
        vector.copy(box.position);
        vector.x -= 0.1;
        updatePosition(Ammo, body, vector);
    });
    helper.listenKey("d", () => {
        vector.copy(box.position);
        vector.x += 0.1;
        updatePosition(Ammo, body, vector);
    });
}

function updatePosition(Ammo: any, body: any, vector: THREE.Vector3) {
    body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
    body.setLinearVelocity(new Ammo.btVector3(0, 0, 0));

    transformAux1.setIdentity();
    transformAux1.setOrigin(new Ammo.btVector3(vector.x, vector.y, vector.z));
    body.setWorldTransform(transformAux1);
}

function createBox(
    Ammo: any,
    material?: THREE.Material,
    width = 0.3,
    height = 0.3,
    depth = 0.3
): [Mesh, any] {
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
    var shape = new Ammo.btBoxShape(
        new Ammo.btVector3(width * 0.5, height * 0.5, depth * 0.5)
    );
    shape.setMargin(margin);
    return [box, shape];
}

function createRigidBody(
    Ammo: any,
    mesh: Object3D,
    physicsShape: any,
    mass: number
) {
    const pos = mesh.position;
    const quat = mesh.quaternion;

    var transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(
        new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );
    var motionState = new Ammo.btDefaultMotionState(transform);

    var localInertia = new Ammo.btVector3(0, 0, 0);
    physicsShape.calculateLocalInertia(mass, localInertia);

    var rbInfo = new Ammo.btRigidBodyConstructionInfo(
        mass,
        motionState,
        physicsShape,
        localInertia
    );
    var body = new Ammo.btRigidBody(rbInfo);

    mesh.userData.physicsBody = body;

    if (mass > 0) {
        rigidBodies.push(mesh);

        // Disable deactivation
        // 防止物体弹力过快消失

        // Ammo.DISABLE_DEACTIVATION = 4
        body.setActivationState(4);
    }

    physicsWorld.addRigidBody(body);

    return body;
}

function createFloor(Ammo: any): [Object3D, any] {
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
    var shape = new Ammo.btBoxShape(
        new Ammo.btVector3(width * 0.5, height * 0.5, depth * 0.5)
    );
    shape.setMargin(margin);
    return [mesh, shape];
}
