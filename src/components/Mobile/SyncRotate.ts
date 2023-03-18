/*
 * @Author: hongbin
 * @Date: 2023-02-04 20:27:08
 * @LastEditors: hongbin
 * @LastEditTime: 2023-02-04 22:12:02
 * @Description:
 */

import { Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export class SyncRotate {
    controls: OrbitControls;
    observer: Object3D;
    leave: number;
    /**
     * 处理中
     */
    handling = false;
    upVector = new Vector3(0, 1, 0);
    animationFrameId = 0;
    count = 0;
    total = 10;
    angle: number;
    needUpdate = false;

    /**
     * 停止移动后 转换视角 人物同步跟随旋转
     */
    constructor(controls: OrbitControls, observer: Object3D) {
        this.controls = controls;
        this.observer = observer;
        this.leave = controls.getAzimuthalAngle();
        this.angle = this.leave;
    }

    /**
     * 用户停止移动
     */
    observerStopMove() {
        //还在上次同步旋转中
        if (this.handling) {
            // console.log("handling ...");
            // this.syncRotate();
        } else {
            //记录当前旋转的角度
            this.leave = this.controls.getAzimuthalAngle();
        }
    }

    /**
     * 开启同步旋转 计算最短旋转角度
     */
    syncRotate() {
        const currAngle = this.controls.getAzimuthalAngle();
        // 计算需要旋转多少度 达到目前视线方向
        let angle = currAngle - this.leave;
        //相同不处理
        this.handling = angle !== 0;
        if (!this.handling) return;
        // 如果需要旋转超过一周的长度 则取相反方向的角度
        if (Math.abs(angle) > Math.PI) {
            const dir = currAngle > 0 ? 1 : -1;
            const restAngle = (Math.PI * 2 * dir - currAngle) * -1;
            console.log("计算短旋转路线：", angle, restAngle - this.leave);
            angle = restAngle - this.leave;
        }
        this.angle = angle;
        this.count = 0;
    }

    update() {
        if (!this.handling) return;
        if (this.count >= this.total) {
            this.handling = false;
        } else {
            this.leave += this.angle / this.total;
            this.observer.quaternion.setFromAxisAngle(
                this.upVector,
                this.leave
            );
            this.count++;
        }
    }
}
