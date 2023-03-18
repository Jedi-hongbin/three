/*
 * @Author: hongbin
 * @Date: 2022-10-21 08:49:42
 * @LastEditors: hongbin
 * @LastEditTime: 2023-02-12 12:48:19
 * @Description:全局类型 需要
 */

declare var Hong;

declare type ignore = any;

declare type Object3D = THREE.Object3D;
declare type Vector3 = THREE.Vector3;
declare type Box3 = THREE.Box3;
declare type Mesh<
    TGeometry extends THREE.BufferGeometry = THREE.BufferGeometry,
    TMaterial extends THREE.Material | THREE.Material[] =
        | THREE.Material
        | THREE.Material[]
> = THREE.Mesh;

/**
 * 全局定义花式打印类型 需要定义全局变量
 */
// declare interface PatternLog {
//     Warn: (msg: string | Number, style?: Record<string, string>) => void;
//     Log: (msg: string | Number, style?: Record<string, string>) => void;
//     Error: (msg: string | Number, style?: Record<string, string>) => void;
// }

declare const PatternLog: PatternLog;

/**
 * THREE默认Mesh不带children 但是实际上是Mesh可以有children
 * three返回的模型类型为Object3D 实际是Mesh时可用这个接口声明类型
 */
declare interface THREEMesh extends Mesh {
    children: any[];
}

declare interface MonitorArray<T> extends Array<T> {
    monitoringChanges?: (...items: T[]) => void;
    constructor: {
        prototype: {
            monitoringChanges?: (...items: T[]) => void;
        };
    };
}

//在window中定义 意在初始化全局变量时挂载到window上不报错
interface Window {
    THREE: typeof THREE;
    PatternLog: PatternLog;
    render: (v?: number) => void;
    renderer: THREE.WebGLRenderer;
    gui: dat.GUI;
    onmousewheel: ((e: { wheelDelta: number }) => void) | null;
    /**
     * 临时获取向量使用
     */
    _vector3: THREE.Vector3;
    acterWrap: THREE.Object3D;
    objects: THREE.Object3D[];
}

interface Document {
    onmousewheel: ((e: { wheelDelta: number }) => void) | null;
}
