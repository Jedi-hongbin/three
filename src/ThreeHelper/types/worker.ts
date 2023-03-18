/*
 * @Author: hongbin
 * @Date: 2023-02-25 13:15:30
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-16 13:36:43
 * @Description: 与web worker使用时转换模型的数据类型
 */

export type Vector3Arr = [x: number, y: number, z: number];

export interface IParams {
    geometry: THREE.Mesh["geometry"];
    material: THREE.Mesh["material"];
    matrix: THREE.Mesh["matrix"];
    position: Vector3Arr;
    quaternion: [...Vector3Arr, number];
    rotation: [...Vector3Arr, THREE.Mesh["rotation"]["order"]];
    scale: Vector3Arr;
    up: Vector3Arr;
    userData: THREE.Mesh["userData"];
    visible: THREE.Mesh["visible"];
}

export interface IBaseProps {
    name: string;
    // id时只读属性无法赋值
    // id: number;
    uuid: string;
    type: string;
    matrix: THREE.Mesh["matrix"];
    position: Vector3Arr;
    quaternion: [...Vector3Arr, number];
    rotation: [...Vector3Arr, THREE.Mesh["rotation"]["order"]];
    scale: Vector3Arr;
    up: Vector3Arr;
    userData: THREE.Mesh["userData"];
    visible: THREE.Mesh["visible"];
    children: Array<IMeshParams | IGroupParams | IPointLight>;
    animations: THREE.AnimationClip[];
    /**
     * blender 制作的模型动画添载在scene上的animations上 这个参数导出scene上的动画
     */
    sceneAnimations?: THREE.AnimationClip[];
}

/**
 * 将整个模型解析完发送过去的数据结构 根据这个结构生成模型
 */
export interface IMeshParams extends IBaseProps {
    geometry: THREE.Mesh["geometry"];
    material: THREE.Mesh["material"];
}
export interface IGroupParams extends IBaseProps {}
export interface IPointLight extends IBaseProps {
    power: number;
    color: THREE.Color;
    decay: number;
    castShadow: boolean;
    distance: number;
    frustumCulled: boolean;
    intensity: number;
    layers?: any;
}

/**
 * Three.js 支持的所有材料类型
 */
export type THREEMaterialType =
    | "ShadowMaterial"
    | "SpriteMaterial"
    | "RawShaderMaterial"
    | "ShaderMaterial"
    | "PointsMaterial"
    | "MeshPhysicalMaterial"
    | "MeshStandardMaterial"
    | "MeshPhongMaterial"
    | "MeshToonMaterial"
    | "MeshNormalMaterial"
    | "MeshLambertMaterial"
    | "MeshDepthMaterial"
    | "MeshDistanceMaterial"
    | "MeshBasicMaterial"
    | "MeshMatcapMaterial"
    | "LineDashedMaterial"
    | "LineBasicMaterial"
    | "Material";

/**
 * 将整个模型解析完发送过去的数据结构 根据这个结构生成模型
 */
export interface IMeshParams extends IBaseProps {
    geometry: THREE.Mesh["geometry"];
    material: THREE.Mesh["material"];
}
export interface IGroupParams extends IBaseProps {}
export interface IPointLight extends IBaseProps {
    power: number;
    color: THREE.Color;
    decay: number;
    castShadow: boolean;
    distance: number;
    frustumCulled: boolean;
    intensity: number;
    layers?: any;
}
