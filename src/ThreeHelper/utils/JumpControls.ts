/*
 * @Author: hongbin
 * @Date: 2023-02-05 20:58:59
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-19 12:23:01
 * @Description:跳跃控制
 */

import { Vector3 } from "three";

export class JumpControls {
    jumpHeight = 0.04;
    private jumpSpeed = Infinity;
    range = Math.PI / 40;
    //一上一下 对应cos函数0-PI的区间 使用cos函数模拟跳跃行为
    max = Math.PI / 2;
    private _update = (increment: number) => {};
    private _startJump = () => {};
    private _endJump = () => {};
    jumping = false;
    private _allow = () => true;

    isJumping() {
        return this.jumping;
    }

    constructor() {}

    allow(call: () => boolean) {
        this._allow = call;
    }

    /**
     * 头部遇到撞击
     */
    bumpHead() {
        this.jumpSpeed = this.max;
        this.jumping = false;
        this._endJump();
        console.log("bump");
    }

    /**
     * 开始跳跃
     */
    jump = () => {
        if (!this._allow()) return;
        if (this.jumping) {
            console.log("跳跃中");
        } else {
            this._startJump();
            // setTimeout(() => {
            this.jumpSpeed = 0;
            this.jumping = true;
            // }, 300);
        }
    };

    onStartJump(call: JumpControls["_startJump"]) {
        this._startJump = call;
    }

    onEndJump(call: JumpControls["_endJump"]) {
        this._endJump = call;
    }

    // setAxisYListen(objs: Vector3[]) {
    //     this.listenObjects = objs;
    // }

    onUpdate(call: (increment: number) => void) {
        this._update = call;
    }

    update() {
        if (!this.jumping) return false;
        if (this.jumpSpeed === this.max) this._endJump();
        this.jumping = this.jumpSpeed <= this.max;
        const speed = Math.cos(this.jumpSpeed) * this.jumpHeight;
        const increment = speed;
        this._update(increment);
        // this.listenObjects.forEach((v) => {
        //     v.y += increment;
        // });
        this.jumpSpeed += this.range;
        return true;
    }
}
