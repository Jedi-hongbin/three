"use client";
/*
 * @Author: hongbin
 * @Date: 2023-01-31 14:58:51
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-19 12:27:00
 * @Description: 物体跟随 + 碰撞检测
 */
import Layout from "@/src/components/Three/Layout";
import { ThreeHelper } from "@/src/ThreeHelper";
import { RandomColor } from "@/src/ThreeHelper/utils";
import { KeyBoardControls } from "@/src/ThreeHelper/utils/KeyBoardControls";
import { OctreeControls } from "@/src/ThreeHelper/utils/OctreeControls";
import { FC, Fragment } from "react";
import {
    BoxGeometry,
    Group,
    Mesh,
    MeshStandardMaterial,
    Object3D,
    RepeatWrapping,
    TextureLoader,
    Vector3,
} from "three";
import { JumpIcon } from "@/src/assets/icons/jump";
import { JumpControls } from "@/src/ThreeHelper/utils/JumpControls";
import { FallHelper } from "@/src/ThreeHelper/utils/FallHelper";
import { VisualImpairment } from "@/src/components/Mobile/VisualImpairment";
import { Observer } from "../../src/components/Mobile/Observer";
import { LoopAnimationPlayer } from "@/src/ThreeHelper/utils/AnimationPlayer";
import { LiftingPlatform } from "@/src/components/Mobile/LiftingPlatform";
import Prompt from "@/src/components/Mobile/dom/Prompt";
import { Water } from "three/examples/jsm/objects/Water";

interface IProps {}

const jumpControl = new JumpControls();

const Index: FC<IProps> = () => {
    return (
        <Fragment>
            <Layout
                title={"遥感移动 + 碰撞检测"}
                seoTitle="遥感移动 + 碰撞检测"
                init={init}
                desc="客户端渲染"
                destroy={destroy}
            />
            <JumpIcon
                style={{
                    position: "fixed",
                    zIndex: "2",
                    right: "11vw",
                    bottom: "28vh",
                    width: "4vw",
                    height: "4vw",
                    background: "#fefefe80",
                    borderRadius: "4vw",
                    border: "1px solid #fff",
                    cursor: "pointer",
                }}
                onClick={jumpControl.jump}
            />
            <Prompt />
        </Fragment>
    );
};

export default Index;

const destroyEvents = [
    () => {
        console.log("destroy!");
    },
] as Array<VoidFunction>;

function destroy() {
    destroyEvents.forEach((f) => f());
}

async function init(helper: ThreeHelper) {
    helper.frameByFrame();
    // helper.addAxis();
    helper.addStats();
    helper.addGUI();
    helper.transparentBackGround();
    helper.initLights();
    // helper.useSkyEnvironment(true);
    helper.camera.position.set(0, 1, 2);
    // helper.camera.position.set(0, 10, 20);
    helper.controls.maxPolarAngle = Math.PI / 2;
    helper.controls.minZoom = 1;
    helper.renderer.domElement.style["background"] =
        "linear-gradient(45deg, #fc0000, #3e00fd)";
    const group = new Group();
    helper.add(group);
    const octreeControls = new OctreeControls({ useWebWorker: true });

    // 加载模型
    const gltf = await helper.loadGltf("/models/scene.glb");
    group.add(gltf.scene);
    // console.log(ModelTranslate.generateWorkerStruct(gltf.scene));
    console.log(gltf);
    const loopAnimationPlayer = new LoopAnimationPlayer({
        root: gltf.scene,
        animations: gltf.animations,
    });

    const ObserverControl = new Observer();
    const observer = ObserverControl.observer;

    // 升降台
    const liftingPlatform = new LiftingPlatform({
        obj: gltf.scene.getObjectByName("up")!,
        box3: observer.userData._box3,
        move: (v: Vector3) => {
            ObserverControl.translate(v);
        },
        helper: gltf.scene.getObjectByName("upHelper"),
    });

    ObserverControl.skeletonAnimation.console(helper.gui);

    ObserverControl.bracedToCrouchFinished(() => {
        console.log("翻跃结束");
        const v = {
            x: 0,
            y: observer.userData._size.y,
            z: 0,
        } as Vector3;
        ObserverControl.translateObserver(v);
        octreeControls.translatePlayerCollider(v);
        ObserverControl.flipJump = false;
        ObserverControl.climbing = false;
        ObserverControl.walk(0.15);
    });

    octreeControls.fromGraphNode(group);
    octreeControls.console(helper.gui);

    const waterMath = gltf.scene.getObjectByName("water") as Mesh;
    if (waterMath) {
        const water = new Water(waterMath.geometry, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new TextureLoader().load(
                "/textures/waternormals.jpg",
                function (texture) {
                    texture.wrapS = texture.wrapT = RepeatWrapping;
                }
            ),
            sunDirection: new Vector3(),
            sunColor: 0xffffff,
            waterColor: "#0084f0",
            fog: helper.scene.fog !== undefined,
        });
        water.material.uniforms["sunDirection"].value.set(0, 1, 1);
        water.material.uniforms["size"].value = 10;

        water.onAfterRender = () => {
            water.material.uniforms["time"].value += 0.0016;
        };

        waterMath.add(water);
        // water.updateMatrixWorld(true);
        // waterMath.applyMatrix4(water.matrixWorld);
    }

    ObserverControl.loaded(() => {
        octreeControls.player(observer);
    });

    ObserverControl.onTranslate((v) => {
        octreeControls.translatePlayerCollider(v);
    });

    /**
     * 视线障碍检测
     */
    const visualImpairment = new VisualImpairment(helper.camera, observer);
    visualImpairment.setDetectionRange(helper.scene);
    visualImpairment.NearbyObjects.filterObject(observer);

    /** 按下shift触发加速 **/
    const pressShift = () => {
        if (jumpControl.jumping) return;
        if (ObserverControl.climbing || ObserverControl.flipJump) return;
        if (keyBoardListener.isMoving) {
            ObserverControl.run(0.5);
        }
    };

    /**
     * 键盘控制移动
     */
    const move = (v: Vector3, angle: number) => {
        if (!ObserverControl.syncRotate.handling) {
            //移动时身体向移动方向旋转
            observer.quaternion.setFromAxisAngle(Object3D.DefaultUp, angle);
        }
        //攀爬时 y轴增加
        if (ObserverControl.climbing) {
            v.y = 0.01;
            //不能后退
            if (keyBoardListener.isPressBack()) {
                v.set(0, 0, 0);
            }
        }
        //翻跃时禁止x、z轴移动
        if (ObserverControl.flipJump) {
            v.set(0, 0, 0);
        }
        //位置跟踪
        ObserverControl.translate(v);
        if (keyBoardListener.accelerate) pressShift();
    };

    const keyBoardListener = new KeyBoardControls(helper.controls);
    keyBoardListener.jump(jumpControl.jump);

    jumpControl.onStartJump(() => {
        if (ObserverControl.climbing) return;
        if (keyBoardListener.accelerate) {
            ObserverControl.run_jump();
        } else ObserverControl.walk_jump();
    });

    jumpControl.onEndJump(() => {
        setTimeout(() => {
            if (ObserverControl.climbing) return;
            // 移动中
            if (keyBoardListener.isMoving) {
                if (keyBoardListener.accelerate) {
                    ObserverControl.run(0.5);
                } else ObserverControl.walk(0.5);
            } else ObserverControl.idle(1.5);
        }, 100);
    });

    // 翻跃的时候跳跃会造成视线偏离人物 设置不允许在翻跃的时候跳跃
    jumpControl.allow(ObserverControl.canJump);
    jumpControl.onUpdate((increment) => {
        ObserverControl.translate({ x: 0, y: increment, z: 0 } as Vector3);
    });

    keyBoardListener.move(move);

    keyBoardListener.listenShiftChange(pressShift, () => {
        if (ObserverControl.climbing) return;
        if (keyBoardListener.isMoving) {
            ObserverControl.walk();
        }
    });

    //热重载 避免多次监听
    destroyEvents.push(() => keyBoardListener.removeListen());

    keyBoardListener.startMove(() => {
        ObserverControl.syncRotate.syncRotate();
        if (!jumpControl.isJumping()) {
            ObserverControl.walk();
        }
    });

    keyBoardListener.stopMove(() => {
        ObserverControl.syncRotate.observerStopMove();
        ObserverControl.idle();
    });

    const fallHelper = new FallHelper();

    const isAllowClimb = (status: {
        isAllow: boolean;
        footerCanClimb: boolean;
        headCanClimb: boolean;
    }) => {
        const objects = visualImpairment.NearbyObjects.nearbyMesh(
            observer.position,
            3
        );
        const airIsland = helper.scene.getObjectByName("空岛");
        airIsland && objects.push(airIsland as Mesh);
        const footerCanClimb = ObserverControl.computeFooterCollider(objects);
        if (footerCanClimb && footerCanClimb.distance < 0.15) {
            status.footerCanClimb = true;
            const headCanClimb = ObserverControl.computeHeadCollider(objects);
            // console.log("headCanClimb:", headCanClimb);
            if (headCanClimb && headCanClimb.distance < 0.15) {
                status.headCanClimb = true;
                status.isAllow = true;
            }
        }
    };

    const climbDetection = () => {
        const status = {
            isAllow: false,
            footerCanClimb: false,
            headCanClimb: false,
        };
        if (keyBoardListener.isPressFront()) {
            isAllowClimb(status);
            if (status.isAllow && !ObserverControl.flipJump) {
                ObserverControl.climb_wall();
            } else if (ObserverControl.climbing) {
                ObserverControl.bracedToCrouch();
            }
            if (ObserverControl.flipJump) {
                //避免 跑 跳跃 到不够高的物体上时触发翻跃动作
                if (ObserverControl.running) {
                    status.footerCanClimb = false;
                } else ObserverControl.updateControlYAxis(1);
            }
        }

        if (
            !status.footerCanClimb &&
            (ObserverControl.flipJump || ObserverControl.climbing)
        ) {
            console.log("abort");
            // 翻跃中断 但是相机模拟高度移动已经产生 需降回来 让人物处于视线中央
            if (ObserverControl.flipJump) {
                ObserverControl.flipJumpAbort();
            }
            ObserverControl.walk();
        }
    };

    octreeControls.collide((result) => {
        ObserverControl.swimming = false;

        // 碰撞的方向 * 深度
        if (result) {
            // >0 < -1即位头上为斜面可顺斜面弹开
            if (result.normal.y == -1) {
                jumpControl.bumpHead();
            }
            const v = result.normal.multiplyScalar(result.depth);
            v.y -= 0.0001;
            ObserverControl.translate(v);
            // 脚下如果是水底则游泳状态
            ObserverControl.handleSwim(
                result.meshName?.includes("waterBottom")
            );

            // if (!octreeControls.playerOnFloor) {
            //     console.log("T");
            // }
        }
        climbDetection();
    });

    /**
     * 在空中时下落距离的向量
     */
    const preFall = new Vector3();

    helper.animation(() => {
        const delta = helper.clock.getDelta();
        keyBoardListener.update();
        jumpControl.update();
        // 跳跃过程中不进行下坠操作
        if (
            !octreeControls.playerOnFloor &&
            !jumpControl.jumping &&
            !ObserverControl.climbing &&
            !ObserverControl.flipJump &&
            !liftingPlatform.rising
        ) {
            const fallDistance = fallHelper.computeDistance(delta) / 20;
            preFall.set(0, -fallDistance, 0);
            ObserverControl.translate(preFall);
        } else fallHelper.resetTime();
        loopAnimationPlayer.update();
        //对移动后的位置进行碰撞检测
        octreeControls.playerCollisions();
        ObserverControl.syncRotate.update();
        visualImpairment.intersect();
        ObserverControl.fallDetection();
        ObserverControl.skeletonAnimation.update();
        liftingPlatform.update();
    });
}

function steps() {
    const group = new Group();
    const count = 10;

    for (let i = 0; i < count; i++) {
        const geometry = new BoxGeometry(
            count / (i + 1),
            0.05,
            (count - i) / 3
        );
        const material = new MeshStandardMaterial({ color: new RandomColor() });
        const mesh = new Mesh(geometry, material);
        mesh.position.y = i * 0.05;
        group.add(mesh);
    }
    return group;
}

function boxes() {
    const group = new Group();
    for (let i = 0; i < 50; i++) {
        const height = Math.random() * 5;
        const width = Math.random() * 2;
        const depth = Math.random() * 2;

        const box = ThreeHelper.generateRect(
            { width, height, depth },
            { color: new RandomColor() }
        );
        box.geometry.translate(0, Math.random() * 1.5, 0);
        // box.geometry.translate(0, height / 2, 0);
        group.add(box);
        let xP = (0.5 - Math.random()) * 25;
        let zP = (0.5 - Math.random()) * 25;

        //十字道路 3x3
        if (Math.abs(xP) < 3) {
            xP += 3 * xP > 0 ? 1 : -1;
        }
        if (Math.abs(zP) < 3) {
            zP += 3 * zP > 0 ? 1 : -1;
        }
        //限制中间5x5距离不放置物体
        if (Math.abs(xP) < 6 && Math.abs(zP) < 6) {
            xP += 6 * xP > 0 ? 1 : -1;
            zP += 6 * zP > 0 ? 1 : -1;
        }

        box.position.x = xP;
        box.position.z = zP;
        // box.position.y = height / 2;
    }

    return group;
}
