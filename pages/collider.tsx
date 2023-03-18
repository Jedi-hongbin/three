/*
 * @Author: hongbin
 * @Date: 2023-02-20 13:15:08
 * @LastEditors: hongbin
 * @LastEditTime: 2023-02-20 19:36:05
 * @Description: 碰撞检测demo
 */
import Layout from "@/src/components/Three/Layout";
import { ThreeHelper } from "@/src/ThreeHelper";
import { IBoxGeometry } from "@/src/ThreeHelper/types/types";
import { RandomColor } from "@/src/ThreeHelper/utils";
import { FallHelper } from "@/src/ThreeHelper/utils/FallHelper";
import { JumpControls } from "@/src/ThreeHelper/utils/JumpControls";
import { KeyBoardControls } from "@/src/ThreeHelper/utils/KeyBoardControls";
import { OctreeControls } from "@/src/ThreeHelper/utils/OctreeControls";
import { FC } from "react";
import * as THREE from "three";

interface IProps {}

const Physics: FC<IProps> = () => {
    return <Layout title={"八叉树碰撞检测"} init={init} desc="客户端渲染" />;
};

export default Physics;

const init = (helper: ThreeHelper) => {
    helper.addAxis();
    helper.addStats();
    helper.camera.position.set(0, 1, 1);
    helper.frameByFrame();
    helper.addGUI();

    const octreeWorldGroup = new THREE.Group();
    helper.add(octreeWorldGroup);
    // 建筑
    const boxes = new Boxes(20, new THREE.Vector3(3, 0, 3), 2);
    octreeWorldGroup.add(boxes.group);
    // 地面
    const floor = new Floor();
    octreeWorldGroup.add(floor.floor);
    // 玩家
    const player = new Player();
    player.player.position.copy(helper.controls.target);
    helper.add(player.player);
    // 生成八叉树世界
    const octree = new OctreeControls();
    octree.fromGraphNode(octreeWorldGroup);
    octree.player(player.player);
    octree.console(helper.gui);
    //键盘控制
    const keyBoardControls = new KeyBoardControls(helper.controls);
    keyBoardControls.move((vector, angle) => {
        // 跟随相机旋转
        player.player.quaternion.setFromAxisAngle(
            keyBoardControls.upVector,
            angle
        );
        octree.translatePlayerCollider(vector);
    });
    const jumpControl = new JumpControls();
    keyBoardControls.jump(jumpControl.jump);
    jumpControl.onUpdate((increment) => {
        octree.translatePlayerCollider({
            x: 0,
            y: increment,
            z: 0,
        } as Vector3);
    });

    octree.collide((r) => {
        // console.log(r);
        if (r) {
            // let damping = Math.exp(-4 * 0.0016) - 1;
            const v = r.normal.multiplyScalar(r.depth);
            // 只要 下降一点就可以用来判断是否在地面上了
            v.y -= 0.00001;
            octree.translatePlayerCollider(v);
        }
    });

    octree.onTranslate((v) => {
        player.translate(v);
    });

    const fallHelper = new FallHelper();
    const preFall = new THREE.Vector3();

    helper.animation(() => {
        const delta = helper.clock.getDelta();

        keyBoardControls.update();
        jumpControl.update();
        if (!octree.playerOnFloor && !jumpControl.jumping) {
            const fallDistance = fallHelper.computeDistance(delta) / 5;
            preFall.set(0, -fallDistance, 0);
            octree.translatePlayerCollider(preFall);
        } else fallHelper.resetTime();
        octree.playerCollisions();
    });
};

class Boxes {
    group = new THREE.Group();

    constructor(count: number, range: Vector3, density = 3) {
        const { random } = Math;
        for (let index = 0; index < count; index++) {
            const mesh = this.create(
                {
                    width: random(),
                    height: random() * 2,
                    depth: random(),
                },
                density
            );
            this.group.add(mesh);
            const x = (0.5 - random()) * range.x;
            const y = (0.5 - random()) * range.y;
            const z = (0.5 - random()) * range.z;
            mesh.position.set(x, y, z);
        }
    }

    create(
        geometryParams: { width: number; height: number; depth: number },
        density: number
    ) {
        const group = new THREE.Group();
        const { random } = Math;

        for (let i = 0; i < density; i++) {
            const height = random() * geometryParams.height;
            const box = ThreeHelper.generateRect(
                {
                    width: random() * geometryParams.width,
                    height,
                    depth: random() * geometryParams.depth,
                },
                {
                    color: new RandomColor(),
                }
            );
            box.position.y += height / 2 + 0.0001 * i;
            group.add(box);
        }

        return group;
    }
}

class Floor {
    floor: Mesh;

    constructor() {
        const floor = ThreeHelper.generateRect(
            {
                width: 4,
                height: 0.1,
                depth: 4,
            },
            {
                color: new THREE.Color("#333"),
            }
        );
        this.floor = floor;
    }
}

class Player {
    player: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;

    constructor() {
        const height = 0.1;
        const mesh = ThreeHelper.generateRect({
            width: 0.05,
            height,
            depth: 0.05,
        });
        mesh.userData._size = new THREE.Vector3();
        new THREE.Box3().setFromObject(mesh).getSize(mesh.userData._size);
        this.player = mesh;
    }

    translate(v: Vector3) {
        this.player.position.add(v);
        ThreeHelper.instance.camera.position.add(v);
        ThreeHelper.instance.controls.target.add(v);
    }
}
