"use client";
/*
 * @Author: hongbin
 * @Date: 2023-01-30 12:47:10
 * @LastEditors: hongbin
 * @LastEditTime: 2023-01-31 14:50:38
 * @Description: 移动端控制手柄使用
 */
import Layout from "@/src/components/Three/Layout";
import { ThreeHelper } from "@/src/ThreeHelper";
import { FC, Fragment, useEffect, useRef } from "react";
import styled from "styled-components";
import { Vector2, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

interface IProps {}

const Index: FC<IProps> = () => {
    return (
        <Fragment>
            <Layout
                title={"THREE TEMPLATE"}
                seoTitle="移动端遥感使用"
                init={init}
                desc="客户端渲染"
            />
            <JoystickWrapper id="joystickWrapper"></JoystickWrapper>
            <JoystickWrapper
                style={{ right: "7vw", left: "auto" }}
                id="joystickWrapperRight"
            ></JoystickWrapper>
        </Fragment>
    );
};

export default Index;

/**
 * 创建遥感
 */
function createJoystick(
    joystickWrapper: Element,
    call: (x: number, y: number) => void,
    end: VoidFunction
) {
    if (joystickWrapper.innerHTML) return;
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

    return {
        remove: () => {
            manager.destroy();
            console.log(manager.destroy, manager);
        },
    };
}

function init(helper: ThreeHelper) {
    helper.frameByFrame();
    helper.addAxis();
    helper.addStats();
    helper.camera.position.set(0, 1, 10);

    const box = helper.generateRect({
        width: 1,
        height: 1,
        depth: 1,
    });
    helper.add(box);
    // box.position.set(0, 0, -12);

    // helper.camera.add(box);
    // helper.add(helper.camera);

    const joystick = new Joystick();

    helper.animation(() => {
        joystick.update(helper.controls, helper.camera);
    });
}

class Joystick {
    _vector = new Vector3();
    moveVector2 = new Vector2();
    _r_vector = new Vector3();
    rotateVector2 = new Vector2();
    /**
     * 向上的向量 绕y轴旋转以设置正确前进方向
     */
    upVector = new Vector3(0, 1, 0);

    constructor() {
        this.init();
    }

    init() {
        /**
         * 左侧 控制方向
         */
        const joystickWrapper = document.querySelector("#joystickWrapper");
        if (!joystickWrapper) throw new Error("not find wrapper dom");
        createJoystick(
            joystickWrapper,
            (x, y) => this.moveVector2.set(x, y),
            () => this.moveVector2.set(0, 0)
        );
        /**
         * 右侧 控制角度
         */
        const joystickWrapperRight = document.querySelector(
            "#joystickWrapperRight"
        );
        if (!joystickWrapperRight) throw new Error("not find wrapper dom");
        createJoystick(
            joystickWrapperRight,
            (x, y) => this.rotateVector2.set(x, y),
            () => this.rotateVector2.set(0, 0)
        );
    }

    update(controls: OrbitControls, camera: THREE.Camera) {
        const angle = controls.getAzimuthalAngle();
        //位移
        this._vector
            .set(this.moveVector2.x, 0, -this.moveVector2.y)
            .applyAxisAngle(this.upVector, angle);
        controls.target.addScaledVector(this._vector, 0.1);
        camera.position.addScaledVector(this._vector, 0.1);
        //旋转
        this._r_vector
            .set(-this.rotateVector2.x, -this.rotateVector2.y, 0)
            .applyAxisAngle(this.upVector, angle);
        camera.position.addScaledVector(this._r_vector, 0.1);
    }
}

const JoystickWrapper = styled.div`
    position: fixed;
    bottom: 14vw;
    left: 17vw;
    width: 10vw;
`;
