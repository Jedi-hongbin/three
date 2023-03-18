/*
 * @Author: hongbin
 * @Date: 2023-02-25 13:11:07
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-16 13:36:41
 * @Description: 模型在web worker 和主线程之间转换
 */
import * as THREE from "three";
import {
    IBaseProps,
    IGroupParams,
    THREEMaterialType,
    IMeshParams,
    IParams,
} from "../types/worker";

/**
 ******* 解析结构生成模型 代码*******
 */

/**
 * 通过设置attributes index来复刻一个集合体
 */
const genGeometry = (geometry: IParams["geometry"]) => {
    const geom = new THREE.BufferGeometry();
    const {
        attributes: { position, uv, normal },
        index,
    } = geometry;

    //处理几何坐标
    const attributes = {
        position: new THREE.BufferAttribute(
            position.array,
            position.itemSize,
            position.normalized
        ),
    } as THREE.BufferGeometry["attributes"];

    // 导出模型可能不带uv或法线
    if (uv) {
        attributes["uv"] = new THREE.BufferAttribute(
            uv.array,
            uv.itemSize,
            uv.normalized
        );
    }
    if (normal) {
        attributes["normal"] = new THREE.BufferAttribute(
            normal.array,
            normal.itemSize,
            normal.normalized
        );
    }

    geom.attributes = attributes;
    geom.index = index
        ? new THREE.BufferAttribute(
              index.array,
              index.itemSize,
              index.normalized
          )
        : null;
    return geom;
};

/**
 * 根据传入纹理的参数生成真正有效的Material类型数据
 */
const genMaterial = (mate: IParams["material"]) => {
    if (!mate) return undefined;
    const multipleMaterial = Array.isArray(mate);
    const material = multipleMaterial
        ? ([] as THREE.Material[])
        : new THREE[mate.type as THREEMaterialType]();
    //处理材质
    //多个材质
    if (multipleMaterial && Array.isArray(material)) {
        for (const m of mate) {
            const im = new THREE[m.type as THREEMaterialType]();
            material.push(im);
        }
    } else if (mate) {
        //单个材质
        Object.assign(material, mate);
    }
    // console.log(mate, material);
    return material;
};

/**
 * 处理变换 matrix scale rotate translate position
 */
const setTransform = (params: IBaseProps, object: THREE.Object3D) => {
    const matrix = new THREE.Matrix4();
    matrix.elements = params.matrix.elements;
    object.uuid = params.uuid;
    object.name = params.name;
    object.matrix = matrix;
    object.rotation.set(...params.rotation);
    object.position.set(...params.position);
    object.scale.set(...params.scale);
    object.quaternion.set(...params.quaternion);
    object.up.set(...params.up);
    object.userData = params.userData;
    object.visible = params.visible;
};

const pressMesh = (meshParams: IMeshParams) => {
    const geometry = genGeometry(meshParams.geometry);
    const material = genMaterial(meshParams.material);

    const mesh = new THREE.Mesh(geometry, material);
    setTransform(meshParams, mesh);
    meshParams.children.length &&
        mesh.add(...pressChildren(meshParams.children));
    meshParams.animations.length &&
        (mesh.animations = genAnimations(meshParams.animations));
    return mesh;
};

const pressGroup = (groupParams: IGroupParams) => {
    const group = new THREE.Group();
    setTransform(groupParams, group);
    groupParams.children.length &&
        group.add(...pressChildren(groupParams.children));
    groupParams.animations.length &&
        (group.animations = genAnimations(groupParams.animations));
    return group;
};

const pressChildren = (children: (IGroupParams | IMeshParams)[]) => {
    const objectList: THREE.Object3D[] = [];
    for (const child of children) {
        if (child.hasOwnProperty("geometry")) {
            objectList.push(pressMesh(child as IMeshParams));
        } else {
            objectList.push(pressGroup(child));
        }
    }
    return objectList;
};

/**
 * 生成动画
 */
const genAnimations = (sceneAnimations: IGroupParams["sceneAnimations"]) => {
    const animations: THREE.AnimationClip[] = [];

    for (const animation of sceneAnimations!) {
        const clip = new THREE.AnimationClip(
            animation.name,
            animation.duration,
            [],
            animation.blendMode
        );

        for (const { name, times, values } of animation.tracks) {
            const nreTrack = new THREE.QuaternionKeyframeTrack(
                name,
                times as any,
                values as any
            );
            clip.tracks.push(nreTrack);
        }

        animations.push(clip);
    }

    return animations;
};

/**
 * 解析传入的模型参数生成有效的three.js物体
 */
export const pressModel = (params: IGroupParams) => {
    const model = pressGroup(params);
    params.sceneAnimations &&
        (model.animations = genAnimations(params.sceneAnimations));
    return model;
};

/**
 ******* 解析模型 代码 *******
 */

/**
 * 生成动画结构
 */
const genAnimationsStruct = (animations: THREE.AnimationClip[]) =>
    animations.map((animation) => {
        //删除这个方法就可以传递过去了
        //@ts-ignore
        animation["tracks"].forEach((t) => delete t["createInterpolant"]);
        return animation;
    });

/**
 * 生成基本参数 旋转 位移 缩放等属性
 */
const genBaseStruct = (obj: THREE.Object3D): IBaseProps => {
    const {
        type,
        name,
        quaternion: q,
        position: p,
        rotation: r,
        scale: s,
        up: u,
        userData,
        visible,
        matrix,
    } = obj;
    const quaternion: IBaseProps["quaternion"] = [q.x, q.y, q.z, q.w];
    const position: IBaseProps["position"] = [p.x, p.y, p.z];
    const rotation: IBaseProps["rotation"] = [r.x, r.y, r.z, r.order];
    const scale: IBaseProps["scale"] = [s.x, s.y, s.z];
    const up: IBaseProps["up"] = [u.x, u.y, u.z];

    return {
        type,
        name,
        uuid: obj.uuid,
        quaternion,
        position,
        rotation,
        scale,
        up,
        matrix,
        userData,
        visible,
        children: genObject3DChildren(obj.children),
        animations: genAnimationsStruct(obj.animations),
    };
};

/**
 * 生成物体参数
 */
const genMeshStruct = (mesh: THREE.Mesh) => {
    const { geometry, material } = mesh;

    return {
        geometry,
        material,
        ...genBaseStruct(mesh),
    };
};

/**
 * 生成子元素结构
 */
const genObject3DChildren = (children: THREE.Object3D[]) => {
    const childStruct: IGroupParams["children"] = [];
    for (const child of children) {
        if (child.type === "Mesh") {
            childStruct.push(genMeshStruct(child as THREE.Mesh));
        } else if (child.type === "Group") {
            childStruct.push(genGroupStruct(child as THREE.Group));
        }
    }
    return childStruct;
};

/**
 * 生成物体组结构
 */
const genGroupStruct = (group: THREE.Object3D) => {
    const struct: IGroupParams = { ...genBaseStruct(group) };
    return struct;
};

/**
 * 模型转换
 * 模型 -> web worker
 * web worker -> 模型
 */
export class ModelTranslate {
    /**
     * 将模型解析成能传进 web worker的结构
     * 最后返回一个对应模型结构的对象
     */
    static generateWorkerStruct(group: THREE.Object3D) {
        return genGroupStruct(group);
    }

    /**
     * 暴漏出去给gltf.animations使用
     */
    static genAnimationsStruct(animations: THREE.AnimationClip[]) {
        return genAnimationsStruct(animations);
    }

    /**
     * 解析模型结构 生成有效的3D模型返回一个Group
     */
    static parseWorkerStruct(params: IGroupParams) {
        return pressModel(params);
    }
}
