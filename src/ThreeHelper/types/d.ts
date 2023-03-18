/*
 * @Author: hongbin
 * @Date: 2022-12-11 21:36:03
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-15 20:06:32
 * @Description:
 */

/**
 * 拓充类型
 */
declare module "three/src/objects/Mesh" {
    interface Mesh {
        me: "hongbin";
        /**
         * @description: 传递纹理 六张图片 顺序固定 (右 左 上 下 前 后)
         * @param {string} 右 right
         * @param {string} 左 left
         * @param {string} 上 upper
         * @param {string} 下 lower
         * @param {string} 前 front
         * @param {string} 后 after
         * @return {*} *
         */
        setBoxTexture?: (
            right: string,
            left: string,
            upper: string,
            lower: string,
            front: string,
            after: string
        ) => void;
    }
}
declare module "three/src/materials/ShaderMaterial" {
    interface ShaderMaterial {
        me: "hongbin";
        /**
         * @description 更改uniforms
         * - 默认更改太繁琐
         * - material.uniforms[key].value = value
         */
        updateUniforms: (key: string, val: any) => void;
        // updateUniforms?: (key: string, val: any) => void;
    }
}

declare module "three/src/math/Triangle" {
    interface Triangle {
        me: "hongbin";
        /**
         * @description 用于八叉树检测时返回碰撞物体所属哪个物体
         * 单独使用没有这个属性
         */
        mesh: Mesh;
    }
}

export {};
