/*
 * @Author: hongbin
 * @Date: 2022-12-10 11:07:41
 * @LastEditors: hongbin
 * @LastEditTime: 2022-12-11 13:02:08
 * @Description:
 */

export interface IBoxGeometry {
    width: number;
    height: number;
    depth: number;
    widthSegments?: number;
    heightSegments?: number;
    depthSegments?: number;
}

/**
 * blender 导出的glb/gltf格式模型 经手处理后的类型 制定材质
 */
export type GlbMesh = Omit<THREE.Mesh, "material"> & {
    material?: THREE.MeshStandardMaterial;
};

/**
 * 自定义向mesh 添加便捷设置纹理方法
 */
export interface IHandyBox extends THREE.Mesh {
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
    setBoxTexture: (right: string, left: string, upper: string, lower: string, front: string, after: string) => void;
}
