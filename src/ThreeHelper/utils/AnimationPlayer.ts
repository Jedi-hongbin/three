/*
 * @Author: hongbin
 * @Date: 2023-01-01 19:37:53
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-01 22:08:17
 * @Description: 动画控制器
 */
import { AnimationMixer, Clock, LoopOnce } from "three";

/**
 * 动画第一帧数据的类型
 */
interface IFirstKeyframes {
    [animationClipName: string]: {
        [valueTypeName: string]: {
            x: number;
            y: number;
            z: number;
            w?: number;
        };
    };
}

/**
 * 每个带动画的模型创建一个对应的播放器 用来控制该模型的动画进度
 */
export class AnimationPlayer {
    timer = 0;
    clock = new Clock();
    animationActions: THREE.AnimationAction[] = [];
    maxDuration = 0;
    mixer?: AnimationMixer;
    /**
     * 每个动画的每个变化属性的第一帧数据
     */
    firstKeyframes: IFirstKeyframes = {};
    lastKeyframes: IFirstKeyframes = {};

    constructor(params?: {
        root: THREE.Object3D;
        animations: THREE.AnimationClip[];
    }) {
        params && this.init(params.root, params.animations);
    }

    /**
     * 初始化动画 计算所需数据
     */
    init(root: THREE.Object3D, animations: THREE.AnimationClip[]) {
        const mixer = new AnimationMixer(root);
        this.mixer = mixer;
        // console.log(animations);

        animations.forEach((animate) => {
            // const animationAction = mixer.clipAction(animate).play();
            const animationAction = mixer
                .clipAction(animate)
                .play()
                .setLoop(LoopOnce, 1);
            //获取时间 _clip.duration 也可 不过three没报漏出来那就不用"_"开头的变量一般内部使用
            if (animate.duration > this.maxDuration)
                this.maxDuration = animate.duration;

            // console.log("绑定动画", animationAction);
            this.animationActions.push(animationAction);
            // this.handleKeyframe(animate);
        });
        // console.log(this.firstKeyframes);
        // console.log(this.lastKeyframes);
    }

    /**
     * 计算动画第一帧数据和最后一帧数据
     */
    handleKeyframe(animate: THREE.AnimationClip) {
        const firstKeyframe: IFirstKeyframes["key"] = {};
        const lastKeyframe: IFirstKeyframes["key"] = {};

        animate.tracks.forEach((track) => {
            if (!["quaternion", "vector"].includes(track.ValueTypeName))
                throw new Error("未处理类型" + track.ValueTypeName);
            firstKeyframe[track.ValueTypeName] = {
                x: track.values[0],
                y: track.values[1],
                z: track.values[2],
            };
            const { length } = track.values;
            lastKeyframe[track.ValueTypeName] = {
                x: track.values[length - 3],
                y: track.values[length - 2],
                z: track.values[length - 1],
            };
            // 旋转使用 四元数表示
            if (track.ValueTypeName == "quaternion") {
                firstKeyframe[track.ValueTypeName].w = track.values[3];
                lastKeyframe[track.ValueTypeName].w = track.values[length - 4];
            }
        });
        this.firstKeyframes[animate.name] = firstKeyframe;
        this.lastKeyframes[animate.name] = lastKeyframe;
    }

    /**
     * 开始播放,模型动画传入进度百分比
     */
    play(percent: number) {
        // if (!this.mixer) throw new Error("未初始化mixer");
        if (!this.mixer) return;
        percent > 0.99 && (percent = 0.99);

        const t = this.maxDuration * percent;
        /**
         * 模型中多个物体每个物体动画时常不同 以下处理超出时常的不播放
         * 待确认是否 setLoop(LoopOnce, 1) 作用
         * 确认后删除多余的注释部分
         */
        this.animationActions.forEach((action) => {
            action.stop();
            action.play();
        });
        this.mixer.setTime(t);
    }

    update() {
        if (!this.mixer) return;
        const delta = this.clock.getDelta();
        this.mixer.update(delta);
    }
}

/**
 * 循环播放的动画
 */
export class LoopAnimationPlayer {
    timer = 0;
    clock = new Clock();
    animationActions: THREE.AnimationAction[] = [];
    mixer?: AnimationMixer;

    constructor(params?: {
        root: THREE.Object3D;
        animations: THREE.AnimationClip[];
    }) {
        params && this.init(params.root, params.animations);
    }

    /**
     * 初始化动画 计算所需数据
     */
    init(root: THREE.Object3D, animations: THREE.AnimationClip[]) {
        const mixer = new AnimationMixer(root);
        this.mixer = mixer;

        animations.forEach((animate) => {
            const animationAction = mixer.clipAction(animate).play();
            this.animationActions.push(animationAction);
        });
    }

    update() {
        if (!this.mixer) return;
        const delta = this.clock.getDelta();
        this.mixer.update(delta);
    }
}
