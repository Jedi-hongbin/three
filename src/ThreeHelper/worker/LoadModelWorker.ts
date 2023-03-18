/*
 * @Author: hongbin
 * @Date: 2023-02-28 18:24:04
 * @LastEditors: hongbin
 * @LastEditTime: 2023-02-28 20:30:53
 * @Description: 负责加载模型的web worker
 */

import { ModelsLoad } from "../utils/ModelLoad";
import { ModelTranslate } from "./ModelTranslate";

class LoadGLTF {
    loader?: ModelsLoad;

    init() {
        this.loader = new ModelsLoad();
    }

    async load(url: string) {
        if (!url) {
            return postMessage({ type: "error", msg: "url 无效" });
        }

        const start = performance.now();
        const gltf = await this.loader!.loadGltf(url);
        postMessage({
            type: "loaded",
            gltf: {
                ...ModelTranslate.generateWorkerStruct(gltf.scene),
                animations: ModelTranslate.genAnimationsStruct(gltf.animations),
            },
            msg: `加载完成耗时 ${performance.now() - start}`,
        });
    }
}

const loadGLTF = new LoadGLTF();

/**
 * 监听主线程发来的数信息
 */
onmessage = function (e) {
    switch (e.data.type) {
        case "init":
            loadGLTF.init();
            postMessage({
                msg: "初始化成功",
            });
            break;
        case "load":
            loadGLTF.load(e.data.url);
            break;
    }
};

export {};
