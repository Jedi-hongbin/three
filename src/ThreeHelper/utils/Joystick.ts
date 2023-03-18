/*
 * @Author: hongbin
 * @Date: 2023-02-02 21:05:19
 * @LastEditors: hongbin
 * @LastEditTime: 2023-02-12 13:32:01
 * @Description:移动端摇杆
 */
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Vector3, Vector2 } from "three";

export class Joystick {
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
    private _moving = (v: Vector3, angle: number) => {};
    private _rotating = (angle: number) => {};
    private _rotateStart = () => {};
    private _moveStart = () => {};
    private _moveEnd = () => {};
    isMoving = false;
    isRotating = false;
    scaled = 0.05;

    /**
     * 移动端摇杆
     */
    constructor() {
        this.init();
        // if (Joystick.instance) {
        //     return Joystick.instance;
        // }
        // Joystick.instance = this;
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
        start: VoidFunction,
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
        manager.on("start", start);
        manager.on("move", (_: any, d: any) => {
            const { x, y } = d.vector;
            call(x, y);
        });
        manager.on("end", end);
        // console.log(manager);

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
            () => {
                this._moveStart();
            },
            (x, y) => {
                this.isMoving = x + y != 0;
                this.moveVector2.set(x, y);
            },
            () => {
                this.moveVector2.set(0, 0);
                this.isMoving = false;
                this._moveEnd();
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
            () => {
                this._rotateStart();
            },
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

    moving(call: Joystick["_moving"]) {
        this._moving = call;
    }

    rotating(call: (angle: number) => void) {
        this._rotating = call;
    }

    moveStart(call: () => void) {
        this._moveStart = call;
    }

    moveEnd(call: () => void) {
        this._moveEnd = call;
    }

    rotateStart(call: () => void) {
        this._rotateStart = call;
    }

    /**
     * 传入轨道控制器和相机 更新摇杆
     */
    update(controls: OrbitControls, camera: THREE.Camera) {
        let angle;
        // const dis = controls.getDistance();
        // const scaled = dis / 15 / 10;
        //位移
        if (this.isMoving) {
            angle = controls.getAzimuthalAngle();
            this._vector
                .set(this.moveVector2.x, 0, -this.moveVector2.y)
                .applyAxisAngle(this.upVector, angle)
                .multiplyScalar(this.scaled);
            // controls.target.addScaledVector(this._vector, this.scaled);
            // camera.position.addScaledVector(this._vector, this.scaled);
            this._moving(this._vector, angle);
        }
        //旋转
        if (this.isRotating) {
            angle = angle || controls.getAzimuthalAngle();
            this._r_vector
                .set(-this.rotateVector2.x, -this.rotateVector2.y, 0)
                .applyAxisAngle(this.upVector, angle);
            camera.position.addScaledVector(this._r_vector, this.scaled);
            this._rotating(angle);
        }
    }
}
