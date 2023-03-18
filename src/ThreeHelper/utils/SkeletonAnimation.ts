/*
 * @Author: hongbin
 * @Date: 2023-02-13 14:18:09
 * @LastEditors: hongbin
 * @LastEditTime: 2023-02-18 22:43:42
 * @Description: 骨骼动画
 */
import { ThreeHelper } from "@/src/ThreeHelper";
import { AnimationMixer, Clock } from "three";

/**
 * 动画播放完毕回调
 */
interface ActionFinished {
    type: "finished";
    action: THREE.AnimationAction;
    direction: number;
}
interface ActionLoop {
    type: "loop";
    action: THREE.AnimationAction;
    direction: number;
}

export class SkeletonAnimation {
    mixer?: AnimationMixer;
    animates = {} as Record<
        string,
        { action: THREE.AnimationAction; timeScale: number }
    >;
    private curr = "";
    private clock = new Clock();
    private isNeedConsole: ThreeHelper["gui"];
    private _listenAnimateFinished?: (e: ActionFinished) => void;
    private _animateLoop?: (e: ActionLoop) => void;

    constructor() {}

    /**
     * 初始化动画 计算所需数据
     */
    init(
        root: THREE.Object3D,
        animations: THREE.AnimationClip[],
        /**
         * 默认播放第一个动画
         * 输入动画名则播放这一动画
         */
        playAnimate?: string
    ) {
        const mixer = new AnimationMixer(root);
        this.mixer = mixer;

        animations.reduce((prev, curr) => {
            const action = mixer.clipAction(curr);
            prev[curr.name] = { action, timeScale: 1 };
            return prev;
        }, this.animates);

        //没指定 播放第一个
        if (!playAnimate) {
            const animate = Object.values(this.animates)[0];
            if (animate) this.play(animate.action);
        } else {
            const animate = this.animates[playAnimate];
            if (!animate) throw new Error("动画名 未找到");
            this.play(animate.action);
        }

        if (this.isNeedConsole) {
            this.console(this.isNeedConsole);
        }
        console.log(this.animates);

        this.animateFinished();
        this.animateLoop();
    }

    /**
     * 动画播放完毕回调 仅action.setLoop(LoopOnce)的动作会触发
     */
    private animateFinished() {
        if (this.mixer) {
            this.mixer.addEventListener("finished", (e) => {
                this._listenAnimateFinished &&
                    this._listenAnimateFinished(e as any);
            });
        }
    }

    /**
     * 动画播放一遍回调一次
     */
    private animateLoop() {
        if (this.mixer) {
            this.mixer.addEventListener("loop", (e) => {
                this._animateLoop && this._animateLoop(e as any);
            });
        }
    }

    /**
     * 动画播放完毕 触发回调 只有不循环播放的动画会触发
     */
    listenAnimateFinished(call: (e: ActionFinished) => void) {
        this._listenAnimateFinished = call;
    }

    /**
     * 动画播放完一次 触发一次回调
     */
    listenAnimateLoop(call: (e: ActionLoop) => void) {
        this._animateLoop = call;
    }

    update() {
        if (!this.mixer) return;
        const delta = this.clock.getDelta();
        this.mixer.update(delta);
    }

    /**
     * 提供dui调试
     */
    console(gui: ThreeHelper["gui"]) {
        if (!gui) return;
        if (!this.mixer) this.isNeedConsole = gui;

        for (const name of Object.keys(this.animates)) {
            const fn = () => {
                this.animates[name].action.play();
                this.prepareCrossFade(
                    this.animates[this.curr].action,
                    this.animates[name].action,
                    0.3
                );
                this.curr = name;
            };
            gui.add({ fn }, "fn").name(name);
        }
    }

    /**
     * 播放动画 而不是切换动作 切换过渡动画使用prepareCrossFade
     */
    play(action: THREE.AnimationAction) {
        this.setWeight(action, 1);
        action.time = 0;
        action.fadeIn(0.3);
        action.play();
        this.curr = action.getClip().name;
    }

    /**
     * 切换动画
     */
    toggle(targetName: string, duration = 0.2, timeScale?: number) {
        if (!this.animates[targetName])
            throw new Error(`没有 ${targetName} 这个动作`);
        if (targetName === this.curr) return;
        this.animates[targetName].action.play();
        if (timeScale) {
            this.animates[targetName].timeScale = timeScale;
        }
        this.prepareCrossFade(
            this.animates[this.curr].action,
            this.animates[targetName].action,
            duration
        );
        this.curr = targetName;
    }

    /**
     * 准备过渡
     */
    private prepareCrossFade(
        startAction: THREE.AnimationAction,
        endAction: THREE.AnimationAction,
        duration: number
    ) {
        // if (this.curr === "idle") {
        this.executeCrossFade(startAction, endAction, duration);
        // } else {
        // this.synchronizeCrossFade(startAction, endAction, duration);
        // }
    }

    /**
     * 等待当前动作播放完 再过渡下一个动作
     */
    private synchronizeCrossFade(
        startAction: THREE.AnimationAction,
        endAction: THREE.AnimationAction,
        duration: number
    ) {
        if (!this.mixer) return;

        const onLoopFinished = (event: any) => {
            if (event.action === startAction) {
                this.mixer!.removeEventListener("loop", onLoopFinished);

                this.executeCrossFade(startAction, endAction, duration);
            }
        };
        this.mixer.addEventListener("loop", onLoopFinished);
    }

    /**
     * 执行过渡
     */
    private executeCrossFade(
        startAction: THREE.AnimationAction,
        endAction: THREE.AnimationAction,
        duration: number
    ) {
        this.setWeight(endAction, 1);
        endAction.time = 0;
        startAction.crossFadeTo(endAction, duration, false);
    }

    /**
     * 设置动作权重
     */
    private setWeight(action: THREE.AnimationAction, weight: number) {
        action.enabled = true;
        // 时间缩放 决定播放速度 小于1 变慢
        const { timeScale } = this.animates[action.getClip().name];
        // action.setEffectiveTimeScale(1);
        action.setEffectiveWeight(weight);
        // 整个时间缩放 决定播放速度 小于1 变慢
        this.mixer!.timeScale = timeScale;
    }
}
