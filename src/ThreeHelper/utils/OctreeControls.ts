/*
 * @Author: hongbin
 * @Date: 2023-02-02 13:37:11
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-16 13:21:50
 * @Description: 八叉树控制器
 */
import * as THREE from "three";
import { Sphere, Vector3 } from "three";
import { Capsule } from "../expand/Capsule";
import { Octree } from "../expand/Octree";
import { Octree as WorkerOctree } from "../expand/WorkerOctree";
import { ThreeHelper } from "@/src/ThreeHelper";
import { OctreeHelper } from "three/examples/jsm/helpers/OctreeHelper";
import { ModelTranslate } from "../worker/ModelTranslate";

interface VVector3 {
    x: number;
    y: number;
    z: number;
}

interface IWorkerSubTree {
    box: {
        isBox3: true;
        max: VVector3;
        min: VVector3;
    };
    triangles: { a: VVector3; b: VVector3; c: VVector3 }[];
    subTrees: IWorkerSubTree[];
}

export class OctreeControls {
    private worldOctree: Octree;
    private worldWorldOctree?: WorkerOctree;
    playerCollider: Capsule;
    playerOnFloor = false;
    /** 构建八叉树完成 **/
    buildComplete = false;
    private _collide = (result: any) => {};
    private _player?: Object3D;
    private _box = new THREE.Box3();
    private worker?: Worker;
    private _normal = new Vector3();
    // octreeHelper: OctreeHelper;

    constructor() {
        this.useWebWorker();
        this.worldOctree = new Octree();
        this.playerCollider = new Capsule();
        //@ts-ignore
        // this.octreeHelper = new OctreeHelper(this.worldOctree, 0xff0);
    }

    /**
     * 碰撞回调
     */
    collide(
        _collide: (result?: {
            normal: Vector3;
            depth: number;
            meshuuid?: string;
            meshName?: string;
        }) => void
    ) {
        this._collide = _collide;
    }

    /**
     * 与球体进行碰撞
     */
    sphereCollider(sphere: Sphere) {
        const result = this.worldOctree.sphereIntersect(sphere);
        return result;
    }

    private handleCollider(
        result: Partial<ReturnType<typeof this.worldOctree["capsuleIntersect"]>>
    ) {
        this.playerOnFloor = false;
        if (result && result.normal) {
            this.playerOnFloor = result.normal.y > 0;
        }
        if (this.isLog) {
            console.log(result, this.playerOnFloor);
        }
        this._collide(result);
    }

    /**
     * 碰撞检测
     */
    playerCollisions() {
        if (!this.buildComplete) return (this.playerOnFloor = true);
        // 如果启用了webworker 交给worker处理
        if (this.worker) {
            this.worker.postMessage({
                type: "collider",
                collider: this.playerCollider,
            });
            return;
        }

        const world = this.worldWorldOctree
            ? this.worldWorldOctree
            : this.worldOctree;
        const result = world.capsuleIntersect(this.playerCollider);
        this.handleCollider(result);
    }

    private isLog = false;
    console(gui: ThreeHelper["gui"]) {
        const plane = {
            log: () => {
                this.isLog = !this.isLog;
            },
            helper: () => {
                this.helper();
            },
        };
        gui?.add(plane, "log").name("打印八叉树检测结果");
        gui?.add(plane, "helper").name("查看八叉树碰撞体");
    }

    private _translate = (v: Vector3) => {};

    onTranslate(call: typeof this._translate) {
        this._translate = call;
    }

    /**
     * 增量更新胶囊体的位置
     * 应同步人物的移动
     */
    translatePlayerCollider(v: Vector3) {
        this.playerCollider.translate(v);
        this._translate(v);
    }

    playerBox3() {
        return this._box;
    }

    helper() {
        if (!this._player) return;
        const radius = this.playerCollider.radius;
        const start = this.playerCollider.start;
        const end = this.playerCollider.end;
        {
            const mesh = ThreeHelper.instance.generateRect(
                {
                    width: 0.1,
                    height: 0.01,
                    depth: 0.01,
                },
                { color: 0x00ffa0 }
            );
            mesh.position.copy(this.playerCollider.start);
            // mesh.position.y -= radius;
            ThreeHelper.instance.add(mesh);
        }
        {
            const mesh = ThreeHelper.instance.generateRect(
                {
                    width: 0.1,
                    height: 0.01,
                    depth: 0.01,
                },
                { color: 0xff3a00 }
            );
            mesh.position.copy(this.playerCollider.end);
            // mesh.position.y += radius;
            ThreeHelper.instance.add(mesh);
        }
        {
            this._player.updateWorldMatrix(false, false);

            const Capsule = new THREE.Group();
            Capsule.applyMatrix4(this._player.matrixWorld);

            const length = start.clone().sub(end).length();
            const geometry = new THREE.CapsuleGeometry(radius, length, 4, 8);
            const material = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                wireframe: true,
            });
            const capsule = new THREE.Mesh(geometry, material);
            Capsule.add(capsule);
            Capsule.position.y += length / 2 + radius;
            // this._player.add(Capsule);
            ThreeHelper.instance.add(Capsule);
        }
    }

    /**
     * 计算碰撞体的胶囊体(碰撞范围 胶囊的高度 和半径)
     */
    private computeCollider() {
        if (!this._player) throw new Error("未执行 player() 方法");
        const size = this._player.userData._size;
        // 半径取 宽和长 大的一侧
        const radius = Math.max(size.x, size.z) / 2;
        const { x, y, z } = this._player.position;

        const collider = {
            // 头
            start: new THREE.Vector3(x, y + size.y - radius, z),
            // 脚
            end: new THREE.Vector3(x, y + radius - 0.01, z),
            radius,
        };

        return collider;
    }

    /**
     * 传入玩家对象 计算玩家胶囊体的数据
     */
    player(obj: Object3D) {
        this._player = obj;
        const defaultCollider = this.computeCollider();

        this.playerCollider.start.copy(defaultCollider.start);
        this.playerCollider.end.copy(defaultCollider.end);
        this.playerCollider.radius = defaultCollider.radius;
    }

    /**
     * 根据传入对象构建该对象的八叉树结构
     * 模型越大越耗时
     */
    fromGraphNode(obj: Object3D, call?: VoidFunction) {
        if (this.worker) {
            const modelStruct = ModelTranslate.generateWorkerStruct(obj);
            this.worker.postMessage({ type: "build", modelStruct });
        } else {
            this.worldOctree.fromGraphNode(obj);
            console.log(this.worldOctree);
            // this.octreeHelper.update();
            this.buildComplete = true;
            call && call();
        }
    }

    /**
     * 格式化从web worker中拿到的八叉树结构
     * 开销也非常大虽然只是格式转变但要便利的次数依然十分庞大还是会对线程造成堵塞
     */
    private formatSubTrees(subTree: IWorkerSubTree) {
        const octree = new Octree();
        const min = new THREE.Vector3().copy(subTree.box.min as Vector3);
        const max = new THREE.Vector3().copy(subTree.box.max as Vector3);
        octree["box"] = new THREE.Box3(min, max);
        octree["triangles"] = subTree.triangles.map((triangle) => {
            const a = new THREE.Vector3().copy(triangle.a as Vector3);
            const b = new THREE.Vector3().copy(triangle.b as Vector3);
            const c = new THREE.Vector3().copy(triangle.c as Vector3);
            return new THREE.Triangle(a, b, c);
        });
        octree.subTrees = subTree.subTrees.map((subTree) =>
            this.formatSubTrees(subTree)
        );
        return octree;
    }

    /**
     * 使用从web worker 构建的八叉树结构
     */
    private updateGraphNode(subTree: IWorkerSubTree, call?: VoidFunction) {
        // const Octree = this.formatSubTrees(subTrees);
        this.worldWorldOctree = new WorkerOctree(subTree);
        this.buildComplete = true;
        call && call();
    }

    /**
     * 使用webWorker进行八叉树构建、检测
     */
    useWebWorker() {
        /** 构建八叉树的web worker */
        const worker = new Worker(
            new URL("../worker/OctreeBuild.ts", import.meta.url)
        );
        this.worker = worker;
        worker.onmessage = (e) => {
            if (e.data.type === "graphNodeBuildComplete") {
                console.log("八叉树构建完成", e.data);
                this.buildComplete = true;
            } else if (e.data.type == "colliderResult") {
                if (e.data.result) {
                    const { normal } = e.data.result;
                    this._normal.copy(normal);
                    e.data.result.normal = this._normal;
                }
                this.handleCollider(e.data.result);
                if (this.isLog) {
                    console.log(e.data);
                }
            }
        };
        worker.postMessage({ type: "connect" });

        worker.onerror = (err) => {
            console.error("work出错:", err, err.message);
        };
    }
}
