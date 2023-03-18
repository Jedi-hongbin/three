/*
 * @Author: hongbin
 * @Date: 2023-03-15 10:43:32
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-15 19:37:04
 * @Description: Swim controller
 */

import { ThreeHelper } from "@/src/ThreeHelper";
import { Box3, Box3Helper } from "three";
import { Observer } from "./Observer";

export class SwimController {
    checkWaters: Object3D[] = [];
    observer: Observer;
    swimming = false;

    constructor(observer: Observer) {
        this.observer = observer;
    }

    init(scene: THREE.Scene) {
        const observerBox3 = this.observer.box3();
        scene.traverse((obj) => {
            if (obj.name.includes("check_water")) {
                this.checkWaters.push(obj);
                const box3 = new Box3().setFromObject(obj);
                // this.observer.observer.parent.add(box3Helper);
                // this.observer.observer.add(box3Helper);
                obj.onBeforeRender = () => {
                    if (this.observer.climbing || this.observer.flipJump)
                        return;
                    const inWater = box3.intersectsBox(observerBox3);
                    if (inWater) {
                        // console.log(obj.name);
                        this.observer.swim();
                        this.swimming = true;
                    }
                };
            }
        });
    }
}
