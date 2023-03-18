/*
 * @Author: hongbin
 * @Date: 2023-02-26 11:09:40
 * @LastEditors: hongbin
 * @LastEditTime: 2023-02-26 12:51:48
 * @Description: 修改THREE的八叉树 与webWorker传递的没有方法的八叉树结构进行检测 - 使用胶囊体检测
 */

import { Box3, Line3, Plane, Triangle, Vector3 } from "three";
import { Capsule } from "./Capsule";

const _v1 = new Vector3();
const _plane = new Plane();
const _line1 = new Line3();
const _line2 = new Line3();
const _capsule = new Capsule();

type TResult = { normal: Vector3; depth: number } | boolean;

interface VVector3 {
    x: number;
    y: number;
    z: number;
}

interface IWorkerSubTree {
    box: {
        isBox3: true;
        max: VVector3;
        min: VVector3;
    };
    triangles: { a: VVector3; b: VVector3; c: VVector3 }[];
    subTrees: IWorkerSubTree[];
}

class Octree {
    triangles: Triangle[];
    box = new Box3();
    tempBox = new Box3();
    tempTriangle = new Triangle();
    subTrees: IWorkerSubTree[];
    root: IWorkerSubTree;

    constructor(tree: IWorkerSubTree) {
        this.root = tree;
        this.copyBox(tree.box, this.box);
        this.triangles = [];
        this.subTrees = tree.subTrees;
    }

    copyBox(treeBox: IWorkerSubTree["box"], box: Box3) {
        const min = new Vector3().copy(treeBox.min as Vector3);
        const max = new Vector3().copy(treeBox.max as Vector3);
        box.set(min, max);
        return box;
    }

    setTempTriangle(triangle: IWorkerSubTree["triangles"][number]) {
        const a = new Vector3().copy(triangle.a as Vector3);
        const b = new Vector3().copy(triangle.b as Vector3);
        const c = new Vector3().copy(triangle.c as Vector3);
        this.tempTriangle.set(a, b, c);
    }

    triangleCapsuleIntersect(
        capsule: Capsule,
        triangle: IWorkerSubTree["triangles"][number]
    ) {
        this.setTempTriangle(triangle);
        this.tempTriangle.getPlane(_plane);

        const d1 = _plane.distanceToPoint(capsule.start) - capsule.radius;
        const d2 = _plane.distanceToPoint(capsule.end) - capsule.radius;

        if (
            (d1 > 0 && d2 > 0) ||
            (d1 < -capsule.radius && d2 < -capsule.radius)
        ) {
            return false;
        }

        const delta = Math.abs(d1 / (Math.abs(d1) + Math.abs(d2)));
        const intersectPoint = _v1.copy(capsule.start).lerp(capsule.end, delta);

        if (this.tempTriangle.containsPoint(intersectPoint)) {
            return {
                normal: _plane.normal.clone(),
                point: intersectPoint.clone(),
                depth: Math.abs(Math.min(d1, d2)),
            };
        }
        return false;
    }

    getCapsuleTriangles(
        capsule: Capsule,
        triangles: IWorkerSubTree["triangles"],
        root: IWorkerSubTree
    ) {
        for (let i = 0; i < root.subTrees.length; i++) {
            const subTree = root.subTrees[i];
            this.copyBox(subTree.box, this.tempBox);
            if (!capsule.intersectsBox(this.tempBox)) continue;

            if (subTree.triangles.length > 0) {
                for (let j = 0; j < subTree.triangles.length; j++) {
                    // this.setTempTriangle(subTree.triangles[j]);
                    if (triangles.indexOf(subTree.triangles[j]) === -1)
                        triangles.push(subTree.triangles[j]);
                }
            } else {
                this.getCapsuleTriangles(capsule, triangles, subTree);
            }
        }
    }

    capsuleIntersect(capsule: Capsule) {
        _capsule.copy(capsule);

        const triangles: IWorkerSubTree["triangles"] = [];
        let result: TResult,
            hit = false;

        this.getCapsuleTriangles(_capsule, triangles, this.root);

        for (let i = 0; i < triangles.length; i++) {
            if (
                (result = this.triangleCapsuleIntersect(_capsule, triangles[i]))
            ) {
                hit = true;

                _capsule.translate(result.normal.multiplyScalar(result.depth));
            }
        }

        if (hit) {
            const collisionVector = _capsule
                .getCenter(new Vector3())
                .sub(capsule.getCenter(_v1));
            const depth = collisionVector.length();

            return { normal: collisionVector.normalize(), depth: depth };
        }

        return false;
    }
}

export { Octree };
