/*
 * @Author: hongbin
 * @Date: 2023-01-27 19:55:34
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-10 13:20:27
 * @Description: 根据three的助手函数修改
 */

import { Box3, Box3Helper, Triangle, Vector3 } from "three";

interface Info {
    /** 摩擦力 */
    friction?: number;
    /** 弹力 */
    restitution?: number;
    /** 阻力、衰减  linear damping, rotational damping */
    damping?: [number, number];
    /** 需要编程式移动物体 body.setActivationState(4) */
    needMove?: boolean;
}

/**
 * @params Ammo 可以传入Ammo函数或已经加载完毕的Ammo实例
 */
function AmmoPhysics(Ammo: any) {
    if (!Ammo) throw new Error("AmmoPhysics: Couldn't find Ammo.js");

    const AmmoLib = Ammo;

    const frameRate = 60;

    /**
     * Ammo 需要的变量
     */
    const collisionConfiguration =
        new AmmoLib.btDefaultCollisionConfiguration();
    const dispatcher = new AmmoLib.btCollisionDispatcher(
        collisionConfiguration
    );
    const broadphase = new AmmoLib.btDbvtBroadphase();
    const solver = new AmmoLib.btSequentialImpulseConstraintSolver();
    const world = new AmmoLib.btDiscreteDynamicsWorld(
        dispatcher,
        broadphase,
        solver,
        collisionConfiguration
    );
    world.setGravity(new AmmoLib.btVector3(0, -9.8, 0));

    const worldTransform = new AmmoLib.btTransform();

    //物体的形状 每个物理效果的物体都需要生成对应的形状
    function getShape(geometry: Mesh["geometry"]) {
        //@ts-ignore
        const parameters = geometry.parameters;

        // TODO change type to is*

        if (geometry.type === "BoxGeometry") {
            const sx =
                parameters.width !== undefined ? parameters.width / 2 : 0.5;
            const sy =
                parameters.height !== undefined ? parameters.height / 2 : 0.5;
            const sz =
                parameters.depth !== undefined ? parameters.depth / 2 : 0.5;

            const shape = new AmmoLib.btBoxShape(
                new AmmoLib.btVector3(sx, sy, sz)
            );
            shape.setMargin(0.05);

            return shape;
        } else if (
            geometry.type === "SphereGeometry" ||
            geometry.type === "IcosahedronGeometry"
        ) {
            const radius =
                parameters.radius !== undefined ? parameters.radius : 1;

            const shape = new AmmoLib.btSphereShape(radius);
            shape.setMargin(0.05);

            return shape;
        }

        return null;
    }

    const meshes = [] as Array<Mesh | THREE.InstancedMesh>;
    const meshMap = new WeakMap();

    function addMesh(
        mesh: Mesh,
        /**
         * 质量小于0 则不动适用地面/不动的物体
         * @default 0
         */
        mass = 0,
        info?: Info
    ) {
        const shape = getShape(mesh.geometry);

        if (shape !== null) {
            //@ts-ignore
            if (mesh.isInstancedMesh) {
                handleInstancedMesh(mesh, mass, shape);
            } else if (mesh.isMesh) {
                handleMesh(mesh, mass, shape, info);
            }
        }
    }

    function setInfo(body: any, info?: Info) {
        if (info) {
            const { friction, restitution, damping, needMove } = info;
            friction && body.setFriction(friction);
            restitution && body.setRestitution(restitution);
            damping && body.setDamping(...damping);
            needMove && body.setActivationState(4);
        }
    }

    function computeShape(mesh: Mesh) {
        const size = new Vector3();
        const box3 = new Box3().setFromObject(mesh);
        box3.getSize(size);

        const sx = size.x !== undefined ? size.x / 2 : 0.5;
        const sy = size.y !== undefined ? size.y / 2 : 0.5;
        const sz = size.z !== undefined ? size.z / 2 : 0.5;

        const shape = new AmmoLib.btBoxShape(new AmmoLib.btVector3(sx, sy, sz));
        shape.setMargin(0.05);

        return shape;
    }

    function addBox3Mesh(mesh: Mesh, mass: number, info?: Info) {
        //  计算形状
        const shape = computeShape(mesh);
        handleMesh(mesh, mass, shape, info);
    }

    const _vec3_1 = new AmmoLib.btVector3(0, 0, 0);
    const _vec3_2 = new AmmoLib.btVector3(0, 0, 0);
    const _vec3_3 = new AmmoLib.btVector3(0, 0, 0);

    /**
     * 便利几何的三角形面进行物理运算
     */
    function addMeshByTriangle(
        mesh: Mesh,
        mass: number,
        info?: Info,
        useBvh?: boolean
    ) {
        const triangleMesh = new Ammo.btTriangleMesh();
        const faces = getFaces(mesh);

        for (let i = 0; i < faces.length; i++) {
            const face = faces[i];
            _vec3_1.setX(face.a.x);
            _vec3_1.setY(face.a.y);
            _vec3_1.setZ(face.a.z);

            _vec3_2.setX(face.b.x);
            _vec3_2.setY(face.b.y);
            _vec3_2.setZ(face.b.z);

            _vec3_3.setX(face.c.x);
            _vec3_3.setY(face.c.y);
            _vec3_3.setZ(face.c.z);

            triangleMesh.addTriangle(_vec3_1, _vec3_2, _vec3_3, true);
        }

        const shape = useBvh
            ? new AmmoLib.btBvhTriangleMeshShape(triangleMesh, true, true)
            : new AmmoLib.btConvexTriangleMeshShape(triangleMesh, true);
        shape.setMargin(0.05);
        handleMesh(mesh, mass, shape, info);
    }

    function handleMesh(mesh: Mesh, mass: number, shape: any, info?: Info) {
        const position = mesh.position;
        const quaternion = mesh.quaternion;

        const transform = new AmmoLib.btTransform();
        transform.setIdentity();
        transform.setOrigin(
            new AmmoLib.btVector3(position.x, position.y, position.z)
        );
        transform.setRotation(
            new AmmoLib.btQuaternion(
                quaternion.x,
                quaternion.y,
                quaternion.z,
                quaternion.w
            )
        );

        const motionState = new AmmoLib.btDefaultMotionState(transform);

        const localInertia = new AmmoLib.btVector3(0, 0, 0);
        shape.calculateLocalInertia(mass, localInertia);

        const rbInfo = new AmmoLib.btRigidBodyConstructionInfo(
            mass,
            motionState,
            shape,
            localInertia
        );

        const body = new AmmoLib.btRigidBody(rbInfo);
        setInfo(body, info);
        world.addRigidBody(body);

        mesh.userData.body = body;

        //质量小于0 则静止 适用地面/不动的物体
        if (mass > 0) {
            meshes.push(mesh);
            meshMap.set(mesh, body);
        }
    }

    function handleInstancedMesh(
        mesh: Mesh | THREE.InstancedMesh,
        mass: number,
        shape: any,
        info?: Info
    ) {
        //@ts-ignore
        const array = mesh.instanceMatrix.array;

        const bodies = [];
        //@ts-ignore
        for (let i = 0; i < mesh.count; i++) {
            const index = i * 16;

            const transform = new AmmoLib.btTransform();
            transform.setFromOpenGLMatrix(array.slice(index, index + 16));

            const motionState = new AmmoLib.btDefaultMotionState(transform);

            const localInertia = new AmmoLib.btVector3(0, 0, 0);
            shape.calculateLocalInertia(mass, localInertia);

            const rbInfo = new AmmoLib.btRigidBodyConstructionInfo(
                mass,
                motionState,
                shape,
                localInertia
            );

            const body = new AmmoLib.btRigidBody(rbInfo);
            setInfo(body, info);
            world.addRigidBody(body);

            bodies.push(body);
        }

        if (mass > 0) {
            meshes.push(mesh);

            meshMap.set(mesh, bodies);
        }
    }

    /**
     * 设置物体的位置
     */
    function setMeshPosition(
        mesh: Mesh | THREE.InstancedMesh,
        position: THREE.Vector3,
        index = 0
    ) {
        //@ts-ignore
        if (mesh.isInstancedMesh) {
            const bodies = meshMap.get(mesh);
            const body = bodies[index];

            // body.setAngularVelocity(new AmmoLib.btVector3(0, 0, 0));
            // body.setLinearVelocity(new AmmoLib.btVector3(0, 0, 0));

            // worldTransform.setIdentity();
            worldTransform.setOrigin(
                new AmmoLib.btVector3(position.x, position.y, position.z)
            );
            body.setWorldTransform(worldTransform);
        } else if (mesh.isMesh) {
            const body = meshMap.get(mesh);
            // 获取当前每个向量的速度
            // const v = body.getLinearVelocity();
            // console.log(v.x(), v.y(), v.z());

            // 每次更新位置将速度归零 导致下落的时候前后移动 下坠速度被归零
            // body.setAngularVelocity(new AmmoLib.btVector3(0, 0, 0));
            // body.setLinearVelocity(new AmmoLib.btVector3(0, 0, 0));

            // setIdentity 初始状态 将旋转变换矩阵归一化，平移向量3个维度的分量归零
            // worldTransform.setIdentity();
            worldTransform.setOrigin(
                new AmmoLib.btVector3(position.x, position.y, position.z)
            );
            body.setWorldTransform(worldTransform);
        }
    }

    /**
     * 设置物体的旋转角度
     */
    function setMeshQuaternion(
        mesh: Mesh | THREE.InstancedMesh,
        quaternion: THREE.Quaternion,
        index = 0
    ) {
        //@ts-ignore
        if (mesh.isInstancedMesh) {
            const bodies = meshMap.get(mesh);
            const body = bodies[index];

            // body.setAngularVelocity(new AmmoLib.btVector3(0, 0, 0));
            // body.setLinearVelocity(new AmmoLib.btVector3(0, 0, 0));

            worldTransform.setIdentity();
            worldTransform.setOrigin(
                new AmmoLib.btQuaternion(
                    quaternion.x,
                    quaternion.y,
                    quaternion.z,
                    quaternion.w
                )
            );
            body.setWorldTransform(worldTransform);
        } else if (mesh.isMesh) {
            const body = meshMap.get(mesh);

            body.setAngularVelocity(new AmmoLib.btVector3(0, 0, 0));
            // body.setLinearVelocity(new AmmoLib.btVector3(0, 0, 0));

            // setIdentity 初始状态 将旋转变换矩阵归一化，平移向量3个维度的分量归零
            // worldTransform.setIdentity();
            worldTransform.setRotation(
                new AmmoLib.btQuaternion(
                    quaternion.x,
                    quaternion.y,
                    quaternion.z,
                    quaternion.w
                )
            );
            body.setWorldTransform(worldTransform);
        }
    }

    /**
     * 步骤模拟
     * delta 时间
     * precision int类型 计算的次数将一次变更拆分成多少分进行细腻的检测 开销随之变大
     * btScalar timeStep, int maxSubSteps=1, btScalar fixedTimeStep= btScalar (1.)/ btScalar (60.)
     * 如果 maxSubSteps > 0，它将在 fixedTimeStep 之间插入运动
     */
    function stepSimulation(delta: number, precision = 1) {
        world.stepSimulation(delta, precision);
        for (let i = 0, l = meshes.length; i < l; i++) {
            const mesh = meshes[i];
            //@ts-ignore
            if (mesh.isInstancedMesh) {
                //@ts-ignore
                const array = mesh.instanceMatrix.array;
                const bodies = meshMap.get(mesh);

                for (let j = 0; j < bodies.length; j++) {
                    const body = bodies[j];

                    const motionState = body.getMotionState();
                    motionState.getWorldTransform(worldTransform);

                    const position = worldTransform.getOrigin();
                    const quaternion = worldTransform.getRotation();

                    compose(position, quaternion, array, j * 16);
                }
                //@ts-ignore
                mesh.instanceMatrix.needsUpdate = true;
            } else if (mesh.isMesh) {
                const body = meshMap.get(mesh);

                const motionState = body.getMotionState();
                if (motionState) {
                    motionState.getWorldTransform(worldTransform);

                    const position = worldTransform.getOrigin();
                    const quaternion = worldTransform.getRotation();
                    mesh.position.set(position.x(), position.y(), position.z());
                    mesh.quaternion.set(
                        quaternion.x(),
                        quaternion.y(),
                        quaternion.z(),
                        quaternion.w()
                    );
                }
            }
        }
    }

    //

    let lastTime = 0;

    function step() {
        console.log(1);
        const time = performance.now();

        if (lastTime > 0) {
            const delta = (time - lastTime) / 1000;

            // console.time( 'world.step' );
            world.stepSimulation(delta, 10);
            // console.timeEnd( 'world.step' );
        }

        lastTime = time;

        //

        for (let i = 0, l = meshes.length; i < l; i++) {
            const mesh = meshes[i];
            //@ts-ignore
            if (mesh.isInstancedMesh) {
                //@ts-ignore
                const array = mesh.instanceMatrix.array;
                const bodies = meshMap.get(mesh);

                for (let j = 0; j < bodies.length; j++) {
                    const body = bodies[j];

                    const motionState = body.getMotionState();
                    motionState.getWorldTransform(worldTransform);

                    const position = worldTransform.getOrigin();
                    const quaternion = worldTransform.getRotation();

                    compose(position, quaternion, array, j * 16);
                }
                //@ts-ignore
                mesh.instanceMatrix.needsUpdate = true;
            } else if (mesh.isMesh) {
                const body = meshMap.get(mesh);

                const motionState = body.getMotionState();
                motionState.getWorldTransform(worldTransform);

                const position = worldTransform.getOrigin();
                const quaternion = worldTransform.getRotation();
                mesh.position.set(position.x(), position.y(), position.z());
                mesh.quaternion.set(
                    quaternion.x(),
                    quaternion.y(),
                    quaternion.z(),
                    quaternion.w()
                );
            }
        }
    }

    // animate

    // setInterval(step, 1000 / frameRate);

    return {
        /** 计算物体的box3形状进行物理运算 */
        addBox3Mesh,
        /** 通过计算物体的面进行物理运算 */
        addMeshByTriangle,
        addMesh,
        setMeshPosition,
        setMeshQuaternion,
        stepSimulation,
    };
}

function compose(position: any, quaternion: any, array: any[], index: number) {
    const x = quaternion.x(),
        y = quaternion.y(),
        z = quaternion.z(),
        w = quaternion.w();
    const x2 = x + x,
        y2 = y + y,
        z2 = z + z;
    const xx = x * x2,
        xy = x * y2,
        xz = x * z2;
    const yy = y * y2,
        yz = y * z2,
        zz = z * z2;
    const wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    array[index + 0] = 1 - (yy + zz);
    array[index + 1] = xy + wz;
    array[index + 2] = xz - wy;
    array[index + 3] = 0;

    array[index + 4] = xy - wz;
    array[index + 5] = 1 - (xx + zz);
    array[index + 6] = yz + wx;
    array[index + 7] = 0;

    array[index + 8] = xz + wy;
    array[index + 9] = yz - wx;
    array[index + 10] = 1 - (xx + yy);
    array[index + 11] = 0;

    array[index + 12] = position.x();
    array[index + 13] = position.y();
    array[index + 14] = position.z();
    array[index + 15] = 1;
}

export { AmmoPhysics };

interface VVector3 {
    x: number;
    y: number;
    z: number;
}
interface VTriangle {
    a: VVector3;
    b: VVector3;
    c: VVector3;
}

const tempA = new Vector3();
const tempB = new Vector3();
const tempC = new Vector3();

/**
 * 获取物体的每个面的数据
 */
function getFaces(mesh: Mesh) {
    // mesh.updateWorldMatrix(true, true);
    const faces = [] as VTriangle[];
    const positionAttribute = mesh.geometry.getAttribute("position");

    for (let i = 0; i < positionAttribute.count; i += 3) {
        const a = tempA.fromBufferAttribute(positionAttribute, i);
        const b = tempB.fromBufferAttribute(positionAttribute, i + 1);
        const c = tempC.fromBufferAttribute(positionAttribute, i + 2);

        // a.applyMatrix4(mesh.matrixWorld);
        // b.applyMatrix4(mesh.matrixWorld);
        // c.applyMatrix4(mesh.matrixWorld);

        // faces.push(new Triangle(x, y, z));
        // 只提供数据生成具有xyz数据即可
        faces.push({
            a: { x: a.x, y: a.y, z: a.z },
            b: { x: b.x, y: b.y, z: b.z },
            c: { x: c.x, y: c.y, z: c.z },
        });
    }
    return faces;
}
