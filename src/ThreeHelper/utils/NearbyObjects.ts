/*
 * @Author: hongbin
 * @Date: 2023-02-07 11:28:21
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-01 19:06:13
 * @Description:附近物体检测
 */
import { Box3, Vector3 } from "three";

export class NearbyObjects {
    private _vec = new Vector3();
    private _box3 = new Box3();
    private _object?: Object3D;

    setObjects(object: Object3D) {
        this._object = object;
        object.traverse((obj) => {
            //@ts-ignore
            if (obj.isMesh) {
                this._box3.setFromObject(obj);
                obj.userData._box3 = this._box3.clone();
                // if (obj.userData.filter) {
                //     console.log(obj);
                // }
            }
        });
    }

    /**
     * 过滤物体
     */
    filterObject(...args: Object3D[]) {
        args.forEach((obj) => {
            obj.traverse((item) => {
                item.userData.filter = true;
            });
        });
    }

    /**
     * 查询附近Mesh
     */
    nearbyMesh(position: Vector3, distance: number) {
        const arr = [] as Mesh[];
        if (!this._object) return arr;
        this._object.traverse((obj) => {
            if (!obj.userData._box3 || obj.userData.filter) return;

            // const dis = position.distanceTo(obj.position);

            if (
                // dis < distance ||
                Math.abs(obj.position.x - position.x) < distance ||
                Math.abs(obj.position.z - position.z) < distance
            ) {
                arr.push(obj as Mesh);
            }
        });
        return arr;
    }

    /**
     * TODO 通过一个矩形来判断附近物体间小球形检测范围两侧的无效
     */

    /**
     * 从提供的对象中查找 附近的物体和目标的box3是否碰撞
     */
    isCollider(target: Object3D, targetBox3: Box3, distance: number) {
        if (!this._object) return false;
        let hit = false as boolean | Vector3;

        this._object.traverse((obj) => {
            if (hit) return;
            if (!obj.userData._box3) return;

            const dis = target.position.distanceTo(obj.position);

            if (
                dis < distance &&
                obj.userData._box3.intersectsBox(targetBox3)
            ) {
                // 计算碰撞方向
                this._vec.subVectors(obj.position, target.position).normalize();
                hit = this._vec.clone();
            }
        });

        return hit;
    }
}
