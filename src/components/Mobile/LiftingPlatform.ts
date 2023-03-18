/*
 * @Author: hongbin
 * @Date: 2023-03-04 16:45:17
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-05 21:05:13
 * @Description: 升降台
 */
import { ThreeHelper } from "@/src/ThreeHelper";
import { Box3, Vector3 } from "three";
import { usePrompt } from "./dom/Prompt";

interface IParams {
    obj: Object3D;
    box3: THREE.Box3;
    move: (v: Vector3) => void;
    helper?: Object3D;
}

export class LiftingPlatform {
    private initPosition = new Vector3();
    private box3 = new Box3();
    private helperBox3?: Box3;
    private upSpeed = new Vector3(0, -0.03, 0);
    /** 人和电梯都在上升 */
    rising = false;
    /** 只有平台在上升这人不在平台上 */
    onlyPlatformRising = false;
    private moveCount = 0;
    private moveTotal = 260;
    private params?: IParams;
    private start = false;
    private allowReset = false;
    private prevRenderTime = performance.now();
    /** 按需计算 */
    private needCompute = false;

    constructor(params: IParams) {
        if (!params.obj || !params.box3) console.error("no obj or no box3!");
        else {
            this.params = params;
            this.box3.setFromObject(params.obj);
            if (params.helper) {
                this.helperBox3 = new Box3().setFromObject(params.helper);
                this.helperBox3.min.y += 0.01;
                this.helperBox3.max.y += 0.01;
                params.helper.onAfterRender = () => {
                    this.needCompute = true;
                    this.prevRenderTime = performance.now();
                };
            }
            this.initPosition.copy(params.obj.position);
            ThreeHelper.instance.listenKey("KeyF", () => {
                if (!this.needCompute) return;
                if (this.rising && !this.start) {
                    usePrompt.current?.hide();
                    this.start = true;
                    this.moveCount = 0;
                    this.upSpeed.y *= -1;
                } else if (this.allowReset && !this.start) {
                    this.moveCount = 0;
                    const diff = new Vector3().subVectors(
                        this.params!.obj.position,
                        this.initPosition
                    );
                    this.upSpeed.y *= -1;
                    this.params!.obj.position.sub(diff);
                    this.box3.max.sub(diff);
                    this.box3.min.sub(diff);
                }
            });
            this.params.obj.onAfterRender = () => {
                this.needCompute = true;
                this.prevRenderTime = performance.now();
            };
        }
    }

    update() {
        if (!this.needCompute) return;
        if (!this.params) return;
        /** 如果距离上次渲染超过了1秒认为不需要进行计算了 已经离开升降台了 */
        if (performance.now() - this.prevRenderTime > 1000) {
            this.needCompute = false;
        }

        const isStandOnTop = this.params.box3.intersectsBox(this.box3);
        this.rising = isStandOnTop;

        if (isStandOnTop && !this.start) {
            const dir = this.upSpeed.y < 0 ? "上升" : "下降";
            usePrompt.current?.show(dir);
        }

        if (!this.rising) {
            if (
                !this.start &&
                this.moveCount > this.moveTotal &&
                this.helperBox3 &&
                this.helperBox3.intersectsBox(this.params.box3)
            ) {
                usePrompt.current?.show("重置");
                this.allowReset = true;
            } else {
                usePrompt.current?.hide();
                this.allowReset = false;
            }
        }

        // 开始移动升降体自动上升下降 不管人是否在上面
        if (this.start) {
            if (this.moveCount++ < this.moveTotal) {
                this.params.obj.position.add(this.upSpeed);
                this.box3.max.add(this.upSpeed);
                this.box3.min.add(this.upSpeed);
                // 人在上面 同步移动
                if (isStandOnTop) {
                    this.params.move(this.upSpeed);
                }
                this.onlyPlatformRising = !isStandOnTop;
            } else {
                this.start = false;
                // 结束运动 人不在平台上 平台落回下面
                if (this.onlyPlatformRising && this.upSpeed.y > 0) {
                    this.moveCount = 0;
                    this.upSpeed.y *= -1;
                    this.start = true;
                }
            }
        }
    }
}
