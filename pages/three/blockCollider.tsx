/*
 * @Author: hongbin
 * @Date: 2023-02-07 13:50:45
 * @LastEditors: hongbin
 * @LastEditTime: 2023-02-08 18:49:00
 * @Description:盒子碰撞
 */
import Layout from "@/src/components/Three/Layout";
import { ThreeHelper } from "@/src/ThreeHelper";
import { RandomColor } from "@/src/ThreeHelper/utils";
import { NearbyObjects } from "@/src/ThreeHelper/utils/NearbyObjects";
import { FC } from "react";
import { Box3, Color, Group } from "three";

interface IProps {}

const Index: FC<IProps> = () => {
    return <Layout title={"box3碰撞检测"} init={init} desc="客户端渲染" />;
};

export default Index;

function init(helper: ThreeHelper) {
    helper.addStats();
    helper.camera.position.set(0, 6, 7);
    helper.setBackground("#fffae5");

    helper.addGUI();
    helper.addAxis();

    helper.frameByFrame();

    const blockCollider = new BlockCollider();
    helper.add(blockCollider.group);
    blockCollider.createBoxes(50);

    helper.addRect(
        { width: 10, height: 10, depth: 10 },
        { transparent: true, opacity: 0.2, color: 0x5511ff }
    ).position.y -= 5;

    helper.animation(() => {
        // blockCollider.update();
    });
}

interface BlockUserData {
    box3: Box3;
    speed: number;
    dirX: number;
    dirZ: number;
    dirY: number;
}

export class BlockCollider {
    group = new Group();
    blocks = [] as Mesh[];
    nearbyObjects: NearbyObjects;

    constructor() {
        this.nearbyObjects = new NearbyObjects();
    }

    setPosition(block: Mesh) {
        block.position.x = (0.5 - Math.random()) * 5;
        block.position.z = (0.5 - Math.random()) * 5;
        block.position.y = 2 + Math.random() * 3;
        this.setUserData(block);
    }

    createBoxes(count: number, _sizeScale?: number) {
        const sizeScale = _sizeScale || 30 / count;
        for (let i = 0; i < count; i++) {
            // const block = ThreeHelper.generateRect(
            //     {
            //         width: Math.random() * sizeScale,
            //         height: Math.random() * sizeScale,
            //         depth: Math.random() * sizeScale,
            //     },
            //     { color: new Color("#000") }
            // );
            const block = ThreeHelper.createSphere(
                {
                    radius: Math.random() * sizeScale,
                    // height: Math.random() * sizeScale,
                    // depth: Math.random() * sizeScale,
                },
                { color: new Color("#000") }
            );
            this.group.add(block);
            block.name = "block" + i;
            this.setPosition(block);

            let error_count = 0;
            //检测是否与其他盒子重合 或与外界物体重合 重合 则随机再分配一个位置
            while (
                this.computeCollider(block) ||
                this.nearbyObjects.isCollider(block, block.userData.box3, 10)
            ) {
                error_count++;
                this.setPosition(block);
                if (error_count > 5) {
                    break;
                }
            }
            error_count && console.log(error_count);

            this.blocks.push(block);

            this.renderAnimate(block);
        }
    }

    setUserData(block: Mesh) {
        const userData = {
            box3: new Box3().setFromObject(block),
            speed: Math.random() * 0.01,
            dirX: 0.5 - Math.random() > 0 ? 1 : -1,
            dirZ: 0.5 - Math.random() > 0 ? 1 : -1,
            dirY: 0.5 - Math.random() > 0 ? 1 : -1,
        } as BlockUserData;
        block.userData = userData;
    }

    /**
     * 砖块和砖块之间的碰撞
     */
    computeCollider(block: Mesh) {
        for (let i = 0; i < this.blocks.length; i++) {
            const target = this.blocks[i];
            if (block.id == target.id) continue;

            if (target.userData.box3.intersectsBox(block.userData.box3)) {
                return target.userData;
            }
        }
        return false;
    }

    renderAnimate(block: Mesh) {
        block.onAfterRender = () => {
            const { box3, speed, dirX, dirZ, dirY } =
                block.userData as BlockUserData;

            block.position.x += speed * dirX;
            block.position.z += speed * dirZ;
            block.position.y += speed * dirY;
            //! 先移动完再检测 检测移动后是否会碰撞
            box3.setFromObject(block);

            const hit =
                this.computeCollider(block) ||
                this.nearbyObjects.isCollider(block, box3, 10);

            if (Math.abs(block.position.x) > 5) {
                block.userData.dirX *= -1;
            }
            if (Math.abs(block.position.z) > 5) {
                block.userData.dirZ *= -1;
            }
            if (block.position.y > 5 || block.position.y < 2) {
                block.userData.dirY *= -1;
            }

            if (hit) {
                //@ts-ignore
                block.material.color = new RandomColor();
                block.userData.dirX *= -1;
                block.userData.dirZ *= -1;
                block.userData.dirY *= -1;
            }
        };
    }
}
