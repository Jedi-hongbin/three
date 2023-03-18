/*
 * @Author: hongbin
 * @Date: 2023-02-08 18:52:47
 * @LastEditors: hongbin
 * @LastEditTime: 2023-02-09 16:18:20
 * @Description:
 */
import { ThreeHelper } from "@/src/ThreeHelper";
import { RandomColor } from "@/src/ThreeHelper/utils";
import { Group, Color, Sphere, Vector3 } from "three";

interface sphereUserData {
    sphere: Sphere;
    speed: number;
    accelerated: number;
    dir: Vector3;
    lastCollider: number;
}

export class ColliderSpheres {
    group = new Group();
    spheres = [] as Mesh[];
    _vector3 = new Vector3();
    _otherCollider = ((sphere: Sphere) => true) as (
        sphere: Sphere
    ) => boolean | Vector3;

    constructor() {}

    otherCollider(call: (sphere: Sphere) => boolean | Vector3) {
        this._otherCollider = call;
    }

    setPosition(sphere: Mesh, radius: number) {
        sphere.position.x = (0.5 - Math.random()) * 5;
        sphere.position.z = (0.5 - Math.random()) * 5;
        sphere.position.y = 2 + Math.random() * 3;
        this.setUserData(sphere, radius);
    }

    createBoxes(count: number, _sizeScale?: number) {
        const sizeScale = _sizeScale || 30 / count;
        for (let i = 0; i < count; i++) {
            const radius = Math.max(0.1, Math.random()) * sizeScale;
            const sphere = ThreeHelper.createSphere(
                { radius },
                { color: new RandomColor() }
            );
            this.group.add(sphere);
            sphere.name = "sphere" + i;
            this.setPosition(sphere, radius);

            let error_count = 0;
            //检测是否与其他盒子重合 或与外界物体重合 重合 则随机再分配一个位置
            while (
                this.computeCollider(sphere) ||
                this._otherCollider(sphere.userData.sphere)
            ) {
                error_count++;
                this.setPosition(sphere, radius);
                if (error_count > 5) {
                    break;
                }
            }
            error_count && console.log(error_count);

            this.spheres.push(sphere);

            this.renderAnimate(sphere);
        }
    }

    setUserData(sphere: Mesh, radius: number) {
        const userData = {
            sphere: new Sphere(sphere.position, radius),
            speed: Math.random() * 0.01,
            accelerated: 0,
            dir: new Vector3(
                0.5 - Math.random(),
                0.5 - Math.random(),
                0.5 - Math.random()
            ),
            lastCollider: 0,
        } as sphereUserData;
        sphere.userData = userData;
    }

    /**
     * 砖块和砖块之间的碰撞
     */
    computeCollider(sphere: Mesh) {
        for (let i = 0; i < this.spheres.length; i++) {
            const target = this.spheres[i];
            if (sphere.id == target.id) continue;

            if (target.userData.sphere.intersectsBox(sphere.userData.sphere)) {
                return true;
            }
        }
        return false;
    }

    renderAnimate(sphereGeometry: Mesh) {
        sphereGeometry.onAfterRender = () => {
            const { sphere, speed, accelerated, dir, lastCollider } =
                sphereGeometry.userData as sphereUserData;
            const realSpeed = accelerated + speed;
            const { position } = sphereGeometry;

            position.addScaledVector(dir, realSpeed);
            sphere.center.copy(position);

            if (accelerated > 0) {
                sphereGeometry.userData.accelerated -= Math.min(
                    0.001,
                    accelerated
                );
            }

            const hitSphere =
                this.computeCollider(sphereGeometry) ||
                this._otherCollider(sphere);
            // 避免频繁碰撞 原地闪烁
            if (hitSphere && performance.now() - lastCollider < 1000) return;
            if (hitSphere) {
                sphereGeometry.userData.lastCollider = performance.now();
            }

            const xHit = Math.abs(position.x) > 10;
            const yHit = position.y > 2 || position.y < 5;
            const zHit = Math.abs(position.z) > 10;
            this._vector3.set(xHit ? -1 : 1, yHit ? -1 : 1, zHit ? -1 : 1);
            sphereGeometry.userData.dir.multiply(this._vector3);

            if (hitSphere) {
                if (typeof hitSphere != "boolean") {
                    position.add(hitSphere);
                    this._vector3.set(
                        hitSphere.x > 0 ? -1 : 1,
                        hitSphere.y > 0 ? -1 : 1,
                        hitSphere.z > 0 ? -1 : 1
                    );
                    sphereGeometry.userData.dir.multiply(this._vector3);

                    sphereGeometry.userData.accelerated = 0.1;
                } else {
                    //@ts-ignore
                    sphereGeometry.material.color = new RandomColor();
                    sphereGeometry.userData.dir.multiplyScalar(-1);
                }
            }
        };
    }
}
