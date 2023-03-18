/*
 * @Author: hongbin
 * @Date: 2022-12-10 11:15:38
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-07 09:27:55
 * @Description:加载模型
 */
import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { KeyBoardListener } from "./KeyBoardListener";

export class ModelsLoad extends KeyBoardListener {
    manager = new THREE.LoadingManager();
    textureLoader = new THREE.TextureLoader();
    gltfLoader?: GLTFLoader;
    _onLoad = () => {
        console.log("加载完成");
    };
    _modelProgress = (p: number, url: string) => {
        console.log("加载进度:" + p, url);
    };

    constructor() {
        super();
        this.setManager();
        const dracoLoader = new DRACOLoader(this.manager);
        dracoLoader.setDecoderConfig({ type: "js" });
        //next中直接引用public下的目录
        //TODO webpack打包需要另处理
        dracoLoader.setDecoderPath("/draco/");
        // dracoLoader.setDecoderPath("./draco/");
        // dracoLoader.setDecoderPath("https://api.hongbin.xyz:3002/kmyc/");
        this.gltfLoader = new GLTFLoader(this.manager);
        this.gltfLoader.setDRACOLoader(dracoLoader);
        // this.gltfLoader.setPath("model/");
        // console.log(path.resolve(__dirname, "../../public/model", "camera.glb"));

        // this.loadGltf("camera.glb").then((g) => {
        // this.loadGltf(new URL(`../../public/model/camera.glb`, import.meta.url)).then((g) => {
        //     console.log(g);
        // });
    }

    /**
     * 加载glb/gltf模型
     */
    async loadGltf(url: URL | string): Promise<GLTF> {
        return new Promise((res, rej) =>
            this.gltfLoader!.load(
                url.toString(),
                (g) => {
                    res(g);
                },
                undefined,
                (err) => {
                    console.error("加载出错：", err);
                    rej(err);
                }
            )
        );
    }

    /**
     * 加载纹理
     */
    async asyncLoadTexture(url: string): Promise<THREE.Texture> {
        return new Promise((res, rej) => {
            this.textureLoader.load(
                url,
                (texture) => {
                    // texture.flipY = false;
                    // texture.encoding = THREE.sRGBEncoding;
                    return res(texture);
                },
                undefined,
                (err) => {
                    rej(err);
                }
            );
        });
    }

    /**
     * 加载纹理
     */
    loadTexture(url: string, loaded?: (texture: THREE.Texture) => void) {
        return this.textureLoader.load(url, loaded);
    }

    /**
     * 模型加载完回调
     */
    onLoaded(call: VoidFunction) {
        this._onLoad = call;
    }

    /**
     * 模型加载进度回调
     */
    onModelProgress(call: ModelsLoad["_modelProgress"]) {
        this._modelProgress = call;
    }

    setManager() {
        //完成加载
        this.manager.onLoad = () => {
            this._onLoad();
        };
        //开始加载
        this.manager.onStart = (url) => {
            // console.log("start", url);
        };
        const loadedModel: Record<string, number> = {};
        //加载进度回调 开始和完成都执行
        this.manager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const p = Math.floor((itemsLoaded / itemsTotal) * 100);
            // console.log(p);
            //模型加载完成的回调执行
            if (loadedModel[url]) this._modelProgress(p, url);
            //第一次是开始加载 不执行
            else loadedModel[url] = 1;
        };
    }
}
