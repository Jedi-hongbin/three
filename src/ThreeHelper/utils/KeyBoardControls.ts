/*
 * @Author: hongbin
 * @Date: 2023-02-03 14:35:24
 * @LastEditors: hongbin
 * @LastEditTime: 2023-02-28 18:20:00
 * @Description:KeyBoardControls 键盘控制器
 */

import { Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { KeyBoardListener } from "./KeyBoardListener";

export class KeyBoardControls {
    private keyBoardListen = new KeyBoardListener();
    private scaled = 0.12;
    private _vector = new Vector3();
    /**
     * 向上的向量 绕y轴旋转以设置正确前进方向
     * 同 Object3D.DefaultUp
     */
    upVector = new Vector3(0, 1, 0);
    private _moving = (vector: Vector3, angle: number) => {};
    isMoving = false;
    private isStartMove = false;
    private _stopMove = () => {};
    private _startMove = () => {};
    private controls: OrbitControls;
    readonly moveCodeEvent = {
        KeyW: (vec: number[]) => {
            vec[2] = -this.scaled;
        },
        KeyS: (vec: number[]) => {
            vec[2] = this.scaled;
        },
        KeyA: (vec: number[]) => {
            vec[0] = -this.scaled;
        },
        KeyD: (vec: number[]) => {
            vec[0] = this.scaled;
        },
    };
    private moveCode = Object.keys(this.moveCodeEvent) as Array<
        keyof typeof this.moveCodeEvent
    >;
    /**
     * 按shift加速
     */
    accelerate = false;
    private _pressShift?: VoidFunction;
    private _upShift?: VoidFunction;

    constructor(controls: OrbitControls) {
        this.keyBoardListen.keyBoardListen();
        this.controls = controls;
        this.init();
    }

    removeListen() {
        this.keyBoardListen.removeKeyBoardListen();
    }

    move(_moving: (vector: Vector3, angle: number) => void) {
        this._moving = _moving;
    }

    handleMove(vec: [number, number, number]) {
        const angle = this.controls.getAzimuthalAngle();
        this._vector
            .set(...vec)
            .applyAxisAngle(this.upVector, angle)
            .multiplyScalar(this.scaled);
        this._moving(this._vector, angle);
    }

    /**
     * 判断是否有按下任何被监听的影响位移的键
     */
    computeIsPress() {
        let isNoPress = false;

        for (let i = 0; i < this.moveCode.length; i++) {
            if (this.keyBoardListen.listenPool[this.moveCode[i]].isPress) {
                isNoPress = true;
                break;
            }
        }

        return isNoPress;
    }

    /**
     * 传递函数 则开始移动执行
     * 不传递函数 则主动执行函数
     */
    startMove(call?: VoidFunction) {
        if (call) {
            this._startMove = call;
        } else this._startMove();
    }

    stopMove(call: VoidFunction) {
        this.isStartMove = false;
        this._stopMove = call;
    }

    /**
     * 按下shift键 只会在抬起前执行一次
     *
     */
    listenShiftChange(press: VoidFunction, up: VoidFunction) {
        this._pressShift = press;
        this._upShift = up;
    }

    private listenShift() {
        this.keyBoardListen.listenKey(
            "ShiftLeft",
            () => {
                if (!this.accelerate) {
                    this._pressShift && this._pressShift();
                }
                this.accelerate = true;
            },
            () => {
                this._upShift && this._upShift();
                this.accelerate = false;
            }
        );
    }

    /**
     * 跳跃函数
     */
    jump(call: VoidFunction) {
        this.keyBoardListen.listenKey("Space", call);
    }

    init() {
        const downKey = () => {
            if (!this.isMoving && !this.isStartMove) {
                this._startMove();
            }
            this.isMoving = true;
        };
        const upKey = () => {
            this.isMoving = this.computeIsPress();
            // 没有按键按下 停止移动 触发回调
            if (!this.isMoving) {
                this._stopMove();
            }
        };

        // this.keyBoardListen.listenKey("KeyW", downKey, upKey);
        // this.keyBoardListen.listenKey("KeyS", downKey, upKey);
        // this.keyBoardListen.listenKey("KeyA", downKey, upKey);
        // this.keyBoardListen.listenKey("KeyD", downKey, upKey);
        this.moveCode.forEach((code) => {
            this.keyBoardListen.listenKey(code, downKey, upKey);
        });
        this.listenShift();
    }

    /**
     * 是否按下了后退键
     */
    isPressBack() {
        return this.keyBoardListen.listenPool["KeyS"].isPress;
    }

    /**
     * 是否按下了前进键
     */
    isPressFront() {
        return this.keyBoardListen.listenPool["KeyW"].isPress;
    }

    /**
     * 每一帧更新 不采用按键更新 提升流畅度
     */
    update() {
        if (!this.isMoving) return;
        const vec = [0, 0, 0] as [number, number, number];

        this.moveCode.forEach((code) => {
            if (this.keyBoardListen.listenPool[code].isPress) {
                this.moveCodeEvent[code](vec);
            }
        });
        if (this.accelerate) {
            vec[0] *= 2;
            vec[2] *= 2;
        }

        this.handleMove(vec);
    }
}
