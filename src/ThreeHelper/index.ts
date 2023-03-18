/*
 * @Author: hongbin
 * @Date: 2022-12-10 08:23:15
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-18 11:21:52
 * @Description:Three.js 包装类
 */
import * as THREE from "three";
import { AnimationPlayer } from "./utils/AnimationPlayer";
import { BaseEnvironment } from "./utils/BaseEnvironment";
import { initGUI } from "./helper/gui";
import { stats } from "./helper/stats";
import { LinearAnimation } from "./utils/LinearAnimation";
import { GlbMesh, IBoxGeometry } from "./types/types";
import { RandomColor } from "./utils";
import { Mesh } from "three";
import { SkeletonAnimation } from "./utils/SkeletonAnimation";
import { KeyBoardListener } from "./utils/KeyBoardListener";

/**
 * 继承的类构造函数参数类型[数组]
 */
type InheritClassParams = ConstructorParameters<typeof BaseEnvironment>;

export class ThreeHelper extends BaseEnvironment {
    frameHandle: number = 0;
    framing: boolean = false;
    protected _animation: VoidFunction = () => {};
    AnimationPlayer = AnimationPlayer;
    SkeletonAnimation = SkeletonAnimation;
    LinearAnimation = LinearAnimation;
    RandomColor = RandomColor;
    stats = stats;
    gui?: ReturnType<typeof initGUI>;
    clock = new THREE.Clock();
    static instance: ThreeHelper;
    runAnimate = true;

    constructor(params: InheritClassParams[0]) {
        super(params);
        if (ThreeHelper.instance) return ThreeHelper.instance;
        ThreeHelper.instance = this;
    }

    /**
     * 添加性能指示器
     */
    addStats() {
        this.stats.init();
    }

    /**
     * 添加gui调试工具
     */
    addGUI(guiName?: string) {
        this.gui = initGUI(guiName);
    }

    /**
     * 向环境中添加物体
     */
    add(...object: THREE.Object3D<THREE.Event>[]) {
        this.scene.add(...object);
    }

    /**
     * 生成矩形 Generate Rectangle
     */
    static generateRect(
        geometryParams: IBoxGeometry,
        parameters?: THREE.MeshPhysicalMaterialParameters
    ) {
        const geometry = new THREE.BoxGeometry(
            ...Object.values(geometryParams)
        );
        // const material = new THREE.MeshPhysicalMaterial(parameters);
        const material = new THREE.MeshStandardMaterial(parameters);
        const box = new THREE.Mesh(geometry, material);
        return box;
    }

    generateRect = ThreeHelper.generateRect;

    /**
     * 创建矩形
     */
    addRect(
        geometryParams: IBoxGeometry,
        parameters?: THREE.MeshPhysicalMaterialParameters
    ) {
        const box = ThreeHelper.generateRect(geometryParams, parameters);
        this.add(box);
        //默认物体中心在世界坐标轴上 调整到下方对齐世界坐标轴
        box.position.y += geometryParams.height / 2;
        this.expandBoxTexture(box);
        return box;
    }

    createSphere = ThreeHelper.createSphere;

    /**
     * 创建球形
     */
    static createSphere(
        {
            radius,
            widthSegments,
            heightSegments,
        }: {
            radius: number;
            widthSegments?: number;
            heightSegments?: number;
        },
        parameters?: THREE.MeshStandardMaterialParameters | undefined
    ) {
        const geometry = new THREE.SphereGeometry(
            radius,
            widthSegments,
            heightSegments
        );
        const material = new THREE.MeshStandardMaterial(parameters);
        const mesh = new Mesh(geometry, material);
        return mesh;
    }

    /**
     *拓展
     */
    expandBoxTexture(box: Mesh) {
        box.setBoxTexture = (...texts: string[]) => {
            const materials = texts.map(
                (t) =>
                    new THREE.MeshStandardMaterial({ map: this.loadTexture(t) })
            );
            box.material = materials;
            materials.forEach((m) => {
                if (m.map) {
                    m.map.encoding = THREE.sRGBEncoding;
                }
            });
        };
    }

    /**
     * 向物体上增加贴图
     */
    setMaterialMap(mesh: GlbMesh, map: string, onload?: VoidFunction) {
        if (mesh && !Array.isArray(mesh.material) && mesh.material) {
            mesh.material.map = this.loadTexture(map, (texture) => {
                texture.flipY = false;
                texture.encoding = THREE.sRGBEncoding;
                onload && onload();
            });
        } else {
            console.log(mesh);
        }
    }

    /**
     * @description: 向物体上增加贴图
     * @param {THREE} scene 模型组
     * @param {string} childName 要设置贴图的子集name
     * @param {string} map 贴图url
     * @param {VoidFunction} onload 纹理加载贴图完毕的回调
     * @return {*}
     */
    setMaterialMapOnChild(
        scene: THREE.Object3D,
        childName: string,
        map: string,
        onload?: VoidFunction
    ) {
        const bottle = scene.getObjectByName(childName) as GlbMesh;
        if (bottle) this.setMaterialMap(bottle, map, onload);
        else return new Error(`未获取到模型中有 ${childName} 子集`);
    }

    /**
     * 镜头自动旋转
     */
    autoRotate() {
        if (this.controls) {
            this.controls.autoRotate = true;
            this.controls.enableRotate = true;
        }
    }

    /**
     * 设置每帧渲染执行的操作
     */
    animation(call: VoidFunction) {
        this._animation = call;
    }

    /**
     * 逐帧渲染 frame(帧)
     */
    frameByFrame() {
        this.frameHandle = requestAnimationFrame(() => this.frameByFrame());
        this.controls?.update();
        this.runAnimate && this._animation();
        this.render();
        this.stats.update();
    }

    /**
     *  停止逐帧渲染
     */
    stopFrame() {
        cancelAnimationFrame(this.frameHandle);
        this.frameHandle = 0;
    }
}
