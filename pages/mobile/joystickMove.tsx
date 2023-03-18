"use client";
/*
 * @Author: hongbin
 * @Date: 2023-01-31 14:58:51
 * @LastEditors: hongbin
 * @LastEditTime: 2023-02-02 11:30:01
 * @Description: 遥感控制物体跟随
 */
import Layout from "@/src/components/Three/Layout";
import { ThreeHelper } from "@/src/ThreeHelper";
import { RandomColor } from "@/src/ThreeHelper/utils";
import { FC, Fragment } from "react";
import styled from "styled-components";
import { Group, Vector2, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

interface IProps {}

const Index: FC<IProps> = () => {
    return (
        <Fragment>
            <Layout
                title={"遥感控制物体跟随"}
                seoTitle="遥感控制物体跟随"
                init={init}
                desc="客户端渲染"
                destroy={destroy}
            />
            <JoystickWrapper
                style={{
                    height: "80vh",
                    top: "10vh",
                    width: "30vw",
                    left: "10vw",
                }}
                id="joystickWrapper"
            ></JoystickWrapper>
            <JoystickWrapper
                style={{
                    height: "80vh",
                    top: "10vh",
                    width: "30vw",
                    right: "7vw",
                    left: "auto",
                }}
                id="joystickWrapperRight"
            ></JoystickWrapper>
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

function init(helper: ThreeHelper) {
    helper.frameByFrame();
    helper.addAxis();
    helper.addStats();
    helper.addGUI();
    helper.camera.position.set(0, 8, 15);

    for (let i = 0; i < 30; i++) {
        const box = helper.generateRect(
            {
                width: Math.random(),
                height: Math.random(),
                depth: Math.random(),
            },
            { color: new RandomColor() }
        );
        helper.add(box);
        box.position.x = (0.5 - Math.random()) * 10;
        box.position.z = (0.5 - Math.random()) * 10;
    }
    // box.position.set(0, 0, -12);

    // helper.camera.add(box);
    // helper.add(helper.camera);

    const observer = new Group();
    observer.add(helper.generateRect({ width: 0.5, height: 0.5, depth: 0.5 }));
    const head = helper.generateRect({ width: 0.3, height: 0.3, depth: 0.3 });
    head.position.y += 0.5;
    observer.add(head);
    helper.add(observer);

    const joystick = new Joystick();
    destroyEvents.push(() => joystick.reload());

    joystick.moving((angle) => {
        //移动时身体向移动方向旋转
        observer.quaternion.setFromAxisAngle(joystick.upVector, angle);
        //移动时头部旋转复位
        head.quaternion.set(0, 0, 0, 1);
        //位置跟踪
        observer.position.addScaledVector(joystick._vector, joystick.scaled);
    });

    joystick.rotating((angle) => {
        //旋转跟踪
        if (!joystick.isMoving && joystick.isRotating) {
            head.quaternion.setFromAxisAngle(joystick.upVector, angle);
            if (head.quaternion.y > 0.1) {
                head.quaternion.y = 0.1;
            }
            if (head.quaternion.y < -0.1) {
                head.quaternion.y = -0.1;
            }
        }
    });

    helper.gui
        ?.add(
            {
                p: () => {
                    console.log(helper.camera.position);
                },
            },
            "p"
        )
        .name("控制器位置");

    helper.animation(() => {
        joystick.update(helper.controls, helper.camera);
    });
}

class Joystick {
    _vector = new Vector3();
    moveVector2 = new Vector2();
    _r_vector = new Vector3();
    rotateVector2 = new Vector2();
    private joyStickManagerLeft: any;
    private joyStickManagerRight: any;
    /**
     * 向上的向量 绕y轴旋转以设置正确前进方向
     */
    upVector = new Vector3(0, 1, 0);
    private _moving = (angle: number) => {};
    private _rotating = (angle: number) => {};
    isMoving = false;
    isRotating = false;
    scaled = 0.1;

    constructor() {
        this.init();
    }

    reload() {
        // if (this.joyStickManagerLeft) {
        //     // this.joyStickManagerLeft.destroy();
        //     this.joyStickManagerLeft.off();
        // }
        // if (this.joyStickManagerRight) {
        //     // this.joyStickManagerRight.destroy();
        //     this.joyStickManagerRight.off();
        // }
    }

    /**
     * 创建遥感
     */
    private createJoystick(
        joystickWrapper: Element,
        call: (x: number, y: number) => void,
        end: VoidFunction
    ) {
        const nipplejs = require("nipplejs");
        const [manager] = nipplejs.create({
            zone: joystickWrapper,
            size: 120,
            mode: "static",
            restJoystick: true,
            shape: "circle",
            dynamicPage: true,
            follow: false,
        });
        manager.on("move", (_: any, d: any) => {
            const { x, y } = d.vector;
            call(x, y);
        });
        manager.on("end", end);
        console.log(manager);

        return manager;
    }

    private init() {
        /**
         * 左侧 控制方向
         */
        const joystickWrapper = document.querySelector("#joystickWrapper");
        if (!joystickWrapper) throw new Error("not find wrapper dom");
        this.joyStickManagerLeft = this.createJoystick(
            joystickWrapper,
            (x, y) => {
                this.isMoving = x + y != 0;
                this.moveVector2.set(x, y);
            },
            () => {
                this.moveVector2.set(0, 0);
                this.isMoving = false;
            }
        );
        //左侧区域(不仅按钮本体)范围控制移动
        this.joyStickManagerLeft.el.style.bottom = "10vh";
        this.joyStickManagerLeft.el.style.left = "7vw";

        /**
         * 右侧 控制角度
         */
        const joystickWrapperRight = document.querySelector(
            "#joystickWrapperRight"
        );
        if (!joystickWrapperRight) throw new Error("not find wrapper dom");
        this.joyStickManagerRight = this.createJoystick(
            joystickWrapperRight,
            (x, y) => {
                this.isRotating = x + y != 0;
                this.rotateVector2.set(x, y / 2);
            },
            () => {
                this.isRotating = false;
                this.rotateVector2.set(0, 0);
            }
        );
        this.joyStickManagerRight.el.style.bottom = "10vh";
        this.joyStickManagerRight.el.style.right = "10vw";
    }

    moving(call: (angle: number) => void) {
        this._moving = call;
    }
    rotating(call: (angle: number) => void) {
        this._rotating = call;
    }

    update(controls: OrbitControls, camera: THREE.Camera) {
        const angle = controls.getAzimuthalAngle();
        const dis = controls.getDistance();
        const scaled = dis / 15 / 10;
        this.scaled = scaled;
        //位移
        if (this.isMoving) {
            this._vector
                .set(this.moveVector2.x, 0, -this.moveVector2.y)
                .applyAxisAngle(this.upVector, angle);
            controls.target.addScaledVector(this._vector, scaled);
            camera.position.addScaledVector(this._vector, scaled);
            this._moving(angle);
        }
        //旋转
        if (this.isRotating) {
            this._r_vector
                .set(-this.rotateVector2.x, -this.rotateVector2.y, 0)
                .applyAxisAngle(this.upVector, angle);
            camera.position.addScaledVector(this._r_vector, scaled);
            this._rotating(angle);
        }
    }
}

const JoystickWrapper = styled.div`
    position: fixed;
    bottom: 14vw;
    left: 17vw;
    width: 10vw;
`;
