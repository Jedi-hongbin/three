/*
 * @Author: hongbin
 * @Date: 2023-02-12 09:43:47
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-19 14:22:47
 * @Description: 观察者 ｜ 玩家 ｜ 用户
 */
import { SyncRotate } from "@/src/components/Mobile/SyncRotate";
import { ThreeHelper } from "@/src/ThreeHelper";
import {
    AnimationMixer,
    Box3,
    Box3Helper,
    Clock,
    Group,
    Raycaster,
    Vector3,
} from "three";

export class Observer {
    observer = new Group();
    private helper = ThreeHelper.instance;
    /**
     * 记录最初的位置
     */
    private initialPosition: {
        controlsTarget: Vector3;
        cameraPosition: Vector3;
    };
    private _box3 = new Box3();
    private _size = new Vector3();
    _onTranslate = (v: Vector3) => {};
    mixer!: AnimationMixer;
    _loaded = () => {};
    skeletonAnimation = new ThreeHelper.instance.SkeletonAnimation();
    // 爬楼相关参数
    headPosition = new Vector3();
    headDirection = new Vector3();
    headRay = new Raycaster();
    /** 攀爬中 **/
    climbing = false;
    /** 翻跃中 **/
    flipJump = false;
    /** 翻跃中断 **/
    _flipJumpAbort = false;
    flipTotalDuration = 0;
    flipTime = 0;
    controlIncrement = new Vector3();
    controlIncremented = new Vector3();
    clock = new Clock();
    syncRotate = new SyncRotate(this.helper.controls, this.observer);
    running = false;
    /** 记录游泳停止状态 */
    stopSwim = true;
    swimming = false;

    constructor() {
        this.initialPosition = {
            controlsTarget: this.helper.controls.target.clone(),
            cameraPosition: this.helper.camera.position.clone(),
        };
        this.observer.userData._box3 = this._box3;
        this.observer.userData._size = this._size;
        this.init().then(() => {
            //设置人物的盒子模型和大小 放到人物身上 方便其他地方使用
            // this._box3.setFromObject(this.observer);
            this._box3.getSize(this._size);
            this.observer.position.copy(this.helper.controls.target);

            this.helper.controls.target.y += this._size.y / 2;
            this.initialPosition.controlsTarget.y += this._size.y / 2;
            // this.showBox3();
            this._loaded();
        });
    }

    /**
     * 限制在何时不能执行跳跃操作
     */
    canJump() {
        return !this.flipJump && !this.climbing && !this.swimming;
    }

    /**
     * 计算头部射线
     */
    computeHeadRayCaster() {
        this.headPosition.copy(this.observer.position);
        // this.headPosition.y += this._size.y;
        this.observer.getWorldDirection(this.headDirection);
        this.headDirection.multiplyScalar(-1);

        this.headRay.set(this.headPosition, this.headDirection);
        this.headRay.near = 0;
        this.headRay.far = 0.6;
    }

    /**
     * 判断头前面有没有障碍物
     */
    computeHeadCollider(objects: Object3D[]) {
        this.headRay.ray.origin.y += this._size.y;
        const intersection = this.headRay.intersectObjects(objects);
        if (intersection[0] && !intersection[0].object.userData.NotAllowClimb)
            return intersection[0];
    }

    /**
     * 判断脚前面有没有障碍物
     */
    computeFooterCollider(objects: Object3D[]) {
        this.computeHeadRayCaster();
        const intersection = this.headRay.intersectObjects(objects);
        if (intersection[0] && !intersection[0].object.userData.NotAllowClimb)
            return intersection[0];
    }

    /**
     * 显示盒子模型
     */
    showBox3() {
        const h = new Box3Helper(this._box3);
        this.helper.add(h);
    }

    loaded(call: VoidFunction) {
        this._loaded = call;
    }

    private init() {
        return new Promise<void>((res, rej) => {
            const observer = this.observer;

            ThreeHelper.instance
                .loadGltf("/models/observer2.glb")
                // .loadGltf("/models/xbot.glb")
                .then((gltf) => {
                    // console.log(gltf);

                    observer.add(gltf.scene);
                    gltf.scene.scale.set(0.3, 0.3, 0.3);
                    gltf.scene.updateWorldMatrix(false, false);
                    gltf.scene.traverse((node) => {
                        //@ts-ignore
                        if (node.isSkinnedMesh) {
                            // 人物不全身在相机内也显示 (可以只看到身体一部分) 默认身体不在相机内不显示物体
                            node.frustumCulled = false;
                            const mesh = node as Mesh;
                            mesh.geometry.computeBoundingBox();
                            // console.log(mesh.geometry.boundingBox);
                            this._box3.union(mesh.geometry.boundingBox!);
                        }
                    });
                    this.skeletonAnimation.init(
                        gltf.scene,
                        gltf.animations,
                        "idle"
                    );
                    this._box3.applyMatrix4(gltf.scene.matrixWorld);
                    // 人物默认盒子是张开双臂计算的
                    this._box3.min.x /= 3;
                    this._box3.max.x /= 3;
                    gltf.scene.rotateY(Math.PI);

                    res();
                });
            this.helper.add(observer);
        });
    }

    /**
     * 待机
     */
    idle(duration?: number, timeScale?: number) {
        if (this.swimming) return;
        this.climbing = false;
        this.flipJump = false;
        this.running = false;
        this.skeletonAnimation.toggle("idle", duration, timeScale);
    }

    /**
     * 走
     */
    walk(duration?: number, timeScale?: number) {
        if (this.swimming) return;
        this.climbing = false;
        this.flipJump = false;
        this.running = false;
        this.skeletonAnimation.toggle("walk", duration, timeScale);
    }

    /**
     * 走的时候跳
     */
    walk_jump(duration = 0.05) {
        if (this.swimming) return;
        this.skeletonAnimation.toggle("walk_jump", duration, 2);
    }

    /**
     * 跑的时候跳
     */
    run_jump() {
        if (this.swimming) return;
        this.skeletonAnimation.toggle("run_jump", 0.1);
    }

    /**
     * 跑
     */
    run(duration?: number) {
        if (this.swimming) return;
        this.running = true;
        this.skeletonAnimation.toggle("run", duration);
    }

    /**
     * 爬墙
     */
    climb_wall(duration?: number) {
        this.climbing = true;
        this.flipJump = false;
        this.running = false;
        this.skeletonAnimation.toggle("climb_wall", duration);
    }

    /**
     * 翻墙动作 支撑到蹲伏
     */
    bracedToCrouch(duration?: number) {
        if (!this.flipJump) {
            this.climbing = false;
            this.skeletonAnimation.toggle("bracedToCrouch", duration);
            this.readyComputeFlip();
            // this.skeletonAnimation.animates["bracedToCrouch"].action.setLoop(
            //     LoopOnce,
            //     1
            // );
            // this.skeletonAnimation.animates[
            //     "bracedToCrouch"
            // ].action.clampWhenFinished = true;
        }
        this.flipJump = true;
        this.running = false;
    }

    /**
     * 游泳
     */
    swim(duration?: number) {
        this.skeletonAnimation.toggle("swim", duration);
    }

    handleSwim(swimming?: boolean) {
        if (swimming) {
            this.swimming = true;
            this.swim();
            if (this.stopSwim) {
                console.log("开始游泳");
            }
            this.stopSwim = false;
        } else if (!this.stopSwim) {
            console.log("结束游泳");
            this.stopSwim = true;
            this.swimming = false;
            if (!this.climbing) {
                this.walk();
            }
        }
    }

    readyComputeFlip() {
        const { duration } =
            this.skeletonAnimation.animates["bracedToCrouch"].action.getClip();
        this.flipTotalDuration = duration;
        this.clock.getDelta();
        this.flipTime = 0;
        this.controlIncrement.y = 0;
        this.controlIncremented.y = 0;
    }

    /**
     * 翻跃中每帧轨道控制器上升一点y轴高度 高度由动画时间和人物高度决定
     * 翻跃中断则每帧降一点高度 传入-1
     */
    updateControlYAxis(dir: -1 | 1) {
        const percent = this.flipTime / this.flipTotalDuration;
        const currY = this._size.y * percent;
        this.controlIncrement.y = currY - this.controlIncremented.y;
        this.controlIncremented.y = currY;
        this.flipTime += this.clock.getDelta() * dir;
        // console.log(this.flipTime, this.flipTotalDuration);
        this.translateCamera(this.controlIncrement);
    }

    /**
     * 人物翻跃动作结束
     */
    bracedToCrouchFinished(call: () => void) {
        this.skeletonAnimation.listenAnimateLoop((e) => {
            if (e.action.getClip().name === "bracedToCrouch") {
                call();
                this._flipJumpAbort = false;
            }
        });
        // this.skeletonAnimation.listenAnimateFinished((e) => {
        //     if (e.action.getClip().name === "bracedToCrouch") {
        //         call();
        //     }
        // });
    }

    /**
     * 翻跃被中断 相机下降已上升高度
     */
    flipJumpAbort() {
        this._flipJumpAbort = true;
        // 已上升高度 this.controlIncremented.y
    }

    /**
     * 从蹲姿到站起来
     */
    stand(duration?: number) {
        this.skeletonAnimation.toggle("stand", duration);
    }

    /**
     * 返回人物的box3模型
     */
    box3() {
        return this._box3;
    }

    /**
     * 返回人物的box3模型
     */
    size() {
        return this._size;
    }

    /**
     * 盒子跟随位置
     */
    private updateBox3(v: Vector3) {
        this._box3.min.add(v);
        this._box3.max.add(v);

        // this.skeletonAnimation.update();
    }

    /**
     * 人物发生位移监听
     * 返回移动向量
     */
    onTranslate(call: Observer["_onTranslate"]) {
        this._onTranslate = call;
    }

    translateObserver(translate: Vector3) {
        this.observer.position.add(translate);
        this.updateBox3(translate);
    }

    translateCamera(translate: Vector3) {
        this.helper.controls.target.add(translate);
        this.helper.camera.position.add(translate);
    }

    /**
     * 人 相机 控制器 一起向一个方向移动
     */
    translate(translate: Vector3) {
        this.observer.position.add(translate);
        this.helper.controls.target.add(translate);
        this.helper.camera.position.add(translate);
        this.updateBox3(translate);
        this._onTranslate(translate);
    }

    /**
     * 人 相机 控制器 一起向Y轴移动
     */
    translateY(scalar: number) {
        this.observer.position.y += scalar;
        this.helper.controls.target.y += scalar;
        this.helper.camera.position.y += scalar;
        this.updateBox3({ x: 0, y: scalar, z: 0 } as Vector3);
    }

    /**
     * 掉落检测
     */
    fallDetection() {
        if (this.observer.position.y < -10) {
            // 当前位置 和 重置点的位置差距
            const dis = this.initialPosition.controlsTarget
                .clone()
                .sub(this.helper.controls.target);

            this.translate(dis);
        }
        // 额外处理翻跃中断已上升视线高度 逐渐归正
        else if (this._flipJumpAbort) {
            this.updateControlYAxis(-1);
            if (this.flipTime <= 0) {
                this._flipJumpAbort = false;
            }
        }
    }
}
