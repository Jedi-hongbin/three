/*
 * @Author: hongbin
 * @Date: 2022-12-10 11:12:36
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-11 21:45:36
 * @Description:初始化环境
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { OrbitControls as MyOrbitControls } from "../addons/OrbitControls";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ModelsLoad } from "./ModelLoad";
import { Sky } from "three/examples/jsm/objects/Sky";

interface ICanvasLayout {
    width: number;
    height: number;
    /**
     * 像素比 越高越清晰 开销越大
     */
    pixelRatio: number;
}

interface ISetCamera {
    fov?: number;
    aspect?: number;
    near?: number;
    far?: number;
}

type IProps = THREE.WebGLRendererParameters & {
    /**
     * 是否限制渲染像素 过大开销容易卡顿
     * 默认限制最大为 2
     * 若不限制则采用设备的最大像素比
     */
    limitPixelRatio?: boolean;
};

/**
 * 初始化 scene camera renderer lights
 */
export class BaseEnvironment extends ModelsLoad {
    renderer!: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
    lights: THREE.Light[] = [];
    scene = new THREE.Scene();
    controls!: OrbitControls;
    canvas: IProps["canvas"];
    pmremGenerator;

    constructor(params: IProps) {
        super();
        this.canvas = params.canvas;
        this.initRenderer(params);
        this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.initScene();
    }

    /**
     * 初始化环境
     */
    // initEnv(
    //     parameters?: IProps,
    //     canvasLayout?: ICanvasLayout
    // ) {
    // this.initRenderer(parameters, canvasLayout);
    // this.initScene();
    // }

    setCamera = (params: Partial<ISetCamera>) => {
        Object.assign(this.camera, params);
    };

    /**
     * 添加灯光
     */
    // protected initLights() {
    //     const hemisphereLight = new THREE.HemisphereLight(
    //         0xdddddd,
    //         0xffffff,
    //         0.8
    //     );
    //     hemisphereLight.position.set(0, -2, 110);
    //     // 平行光 默认从上往下照 position =  Object3D.DEFAULT_UP
    //     const directionalLight = new THREE.DirectionalLight(0xffffff, 0.45);
    //     this.lights = [hemisphereLight, directionalLight];
    //     this.scene.add(...this.lights);
    // }

    initLights() {
        {
            const hemisphereLight = new THREE.HemisphereLight(
                0xffffff,
                0xeeeeee,
                0.4
            );
            this.lights.push(hemisphereLight);
        }

        {
            const light = new THREE.DirectionalLight(0xffffff, 0.5);
            this.lights.push(light);
            light.position.set(0, 1, -1);
        }
        {
            const light = new THREE.DirectionalLight(0xffffff, 0.5);
            this.lights.push(light);
            light.position.set(-1, 0, 0);
        }
        {
            const light = new THREE.DirectionalLight(0xffffff, 0.5);
            this.lights.push(light);
            light.position.set(1, 1, 1);
        }
        this.scene.add(...this.lights);

        //保留初始亮度
        this.lights.forEach((l) => {
            l.userData.intensity = l.intensity;
        });
    }

    setLightIntensity(intensity: number) {
        this.lights.forEach((l) => {
            l.intensity = l.userData.intensity * intensity;
        });
    }

    protected initScene() {
        // this.initLights();
        this.orbitControls();
        // this.useRoomEnvironment();
    }

    useSkyEnvironment(env?: boolean) {
        const sky = new Sky();
        this.scene.add(sky);
        sky.scale.setScalar(10000);
        this.scene.environment && (this.scene.environment.needsUpdate = true);
        const skyUniforms = sky.material.uniforms;
        skyUniforms["turbidity"].value = 1;
        skyUniforms["rayleigh"].value = 1;
        skyUniforms["mieCoefficient"].value = 0.005;
        skyUniforms["mieDirectionalG"].value = 0.8;

        const sun = new THREE.Vector3();

        sun.x = 0.1;
        sun.y = 0;
        sun.z = -1;
        sky.material.uniforms["sunPosition"].value.copy(sun);
        if (env) {
            this.scene.environment?.dispose();
            this.scene.environment = this.pmremGenerator.fromScene(
                sky as unknown as THREE.Scene
            ).texture;
        }
        return sky.material;
    }

    useRoomEnvironment() {
        this.scene.environment?.dispose();
        this.scene.environment = this.pmremGenerator.fromScene(
            new RoomEnvironment(),
            0.04
        ).texture;
    }

    /**
     * 设置背景 十六进制颜色
     */
    setBackground(color: string) {
        this.scene.background = new THREE.Color(color);
    }

    /**
     * 添加辅助坐标
     */
    addAxis(length?: number) {
        const axes = new THREE.AxesHelper(length || 1000);
        this.scene.add(axes);
    }

    /**
     * 添加控制器
     */
    orbitControls() {
        // const controls = new OrbitControls(
        //     this.camera,
        //     this.renderer.domElement
        // );
        const controls = new MyOrbitControls(
            this.camera,
            this.renderer.domElement
        );
        // controls.minDistance = -100;
        this.controls = controls as unknown as OrbitControls;
        controls.addEventListener("change", () => {
            this.render();
        });
    }

    /**
     * 控制镜头缩放等级
     */
    zoom(min: number, max: number) {
        this.controls.minZoom = min;
        this.controls.maxZoom = max;
    }

    /**
     * 镜头移动距离限制
     */
    distance(min: number, max: number) {
        this.controls.minDistance = min;
        this.controls.maxDistance = max;
    }

    /**
     * 镜头垂直方向旋转角度 默认 0-180 即 angle(0,Math.PI)
     */
    angle(min: number, max: number) {
        this.controls.minPolarAngle = min;
        this.controls.maxPolarAngle = max;
    }

    /**
     * 手动指定尺寸
     */
    appointSize(width: number, height: number) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.render();
    }

    /**
     * 根据新的父元素尺寸 重置相关参数
     */
    protected resetLayout() {
        const [w, h] = this.computeCanvasSize();
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.render();
    }

    /**
     * 保证this指向
     */
    protected selfResetLayout = () => this.resetLayout.call(this);

    /**
     * 添加resize监听
     */
    listenResize() {
        window.addEventListener("resize", this.selfResetLayout);
    }

    removeResizeListen() {
        window.removeEventListener("resize", this.selfResetLayout);
    }

    /**
     * 清除scene中的物体
     */
    protected clearChildren(obj: THREE.Scene | any) {
        while (obj.children.length > 0) {
            this.clearChildren(obj.children[0]);
            obj.remove(obj.children[0]);
        }
        if (obj.geometry) obj.geometry.dispose();

        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach((m: THREE.Material) => m.dispose());
            } else obj.material.dispose();
        }
    }

    /**
     * 清除画布中的元素 用于热更新后显示新画布元素
     */
    clearScene() {
        this.clearChildren(this.scene);
        // 清除背景纹理
        this.scene.environment?.dispose();
    }

    /**
     * 渲染画布
     */
    render() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * 计算画布的宽高 由其其父元素决定 填充父元素
     */
    computeCanvasSize() {
        const parent = this.renderer.domElement.parentElement;
        if (!parent) throw new Error("未获取canvas父元素");
        const { offsetWidth, offsetHeight } = parent;
        return [offsetWidth, offsetHeight];
    }

    protected initRenderer(parameters?: IProps) {
        this.renderer = new THREE.WebGLRenderer(parameters);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        // 像素比 分辨率
        // this.renderer.setPixelRatio(layout.pixelRatio);
        const windowPix = window.devicePixelRatio;
        const pixelRatio = parameters?.limitPixelRatio
            ? windowPix
            : Math.min(windowPix, 2);
        this.renderer.setPixelRatio(pixelRatio);
        this.resetLayout();
        return this.renderer;
    }

    /**
     * 将背景设置成透明
     */
    transparentBackGround() {
        //背景透明 主要是第二个参数 alpha
        this.renderer.setClearColor(0x000000, 0);
    }

    /**
     * @description: 设置背景颜色透明度
     * @param {number} alpha 0-透明 1-不透明
     */
    setBackGroundAlpha(alpha: number) {
        this.renderer.setClearColor(0x000000, alpha);
    }
}
