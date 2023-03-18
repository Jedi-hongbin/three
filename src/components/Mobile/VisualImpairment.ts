/*
 * @Author: hongbin
 * @Date: 2023-02-09 13:41:45
 * @LastEditors: hongbin
 * @LastEditTime: 2023-02-28 13:18:19
 * @Description:视线障碍 是否物体遮挡视线
 */
import { Mesh, MeshBasicMaterial, SphereGeometry, Vector3 } from "three";
import { NearbyObjects } from "@/src/ThreeHelper/utils/NearbyObjects";
import { PerspectiveCamera, Raycaster } from "three";

export class VisualImpairment {
    rayCaster: Raycaster;
    camera: PerspectiveCamera;
    _player?: Object3D;
    NearbyObjects = new NearbyObjects();
    _detectionRange?: Object3D;
    centerPoint = new Vector3();
    radius = 0;
    intersectMesh = [] as Mesh[];
    _playerPosition = new Vector3();
    cameraWorldDirection = new Vector3();
    nextFrameCameraMove = new Vector3();

    constructor(camera: PerspectiveCamera, player?: Object3D) {
        this.camera = camera;
        this._player = player;
        /**
         * 射线检测
         * 检测方法 将传入列表遍历逐个计算box3、三角形 最后比较距离是否在far和near中，额外造成开销
         * 在传入前仅将位置附近物体传入 减少计算
         */
        this.rayCaster = new Raycaster();

        // 起点
        // new Vector3(),
        // 方向
        // new Vector3(0, -1, 0),
        /**
         * near 和 far
         */
        // 近距离
        //  0,
        // 远距离
        //  10;
    }

    /**
     * 设置查找范围 可以设定为scene或某group 内部优化 查找附近的物体进行射线穿透 以节省开销
     */
    setDetectionRange(scene: Object3D) {
        this._detectionRange = scene;
        this.NearbyObjects.setObjects(scene);
    }

    /**
     * 目标物体 用于确定射线原点
     */
    appendTarget(player: Object3D) {
        this._player = player;
    }

    /**
     * 更新射线
     */
    update() {
        if (!this._player) throw new Error("NO ORIGIN no set player");
        this._playerPosition.copy(this._player.position);
        // 以身体中心测算
        this._playerPosition.y += this._player.userData._size.y / 2;
        const direction = this.camera.position
            .clone()
            .sub(this._playerPosition);
        this.rayCaster.set(this._playerPosition, direction.clone().normalize());
        this.rayCaster.near = 0;
        const far = this.camera.position.distanceTo(this._playerPosition);
        this.rayCaster.far = far;
        // 以相机和人物中间点为圆心 距离为半径查找可能遮挡的物体
        this.centerPoint.copy(
            direction.divideScalar(2).add(this._playerPosition)
        );
        // 如果人物和相机距离太近 以此圆心的范围也无法检测到身边较大的物体
        this.radius = Math.max(2, far) / 2;
    }

    /**
     * 辅助球 查看筛选的需要被检测的球形范围
     */
    helper() {
        const g = new SphereGeometry(this.radius);
        const m = new MeshBasicMaterial({ wireframe: true });
        const sphere = new Mesh(g, m);
        sphere.position.copy(this.centerPoint);
        return sphere;
    }

    intersect() {
        this.update();
        const detectionTargets = this.NearbyObjects.nearbyMesh(
            this.centerPoint,
            this.radius
        );

        const intersections = this.rayCaster.intersectObjects<Mesh>(
            detectionTargets,
            false
        );
        this.cameraZoomIn(intersections);
        // this.opacityMesh(intersections);
    }

    /**
     * 记录连续自动增加距离次数
     * 当检测到障碍后距离缩近 当检测到没有障碍并且距离人较近时自动增加距离 当镜头后就是障碍时 距离一加一减产生闪烁
     * 每次减 将值置0 每次加值加一 没有障碍的时候连续加就可以使用触发 并将加的值设置正确的大小
     * 当镜头后就是障碍时将加的值copy减的值 这样加减低消不产生闪烁
     */
    autoAdjustCount = 0;

    /**
     * 镜头拉近
     */
    cameraZoomIn(intersections: THREE.Intersection<Mesh>[]) {
        const intersection = intersections[0];
        const currCameraDistance = this.rayCaster.far;
        const opacity = (currCameraDistance - 0.1) / 0.13;

        this.camera.getWorldDirection(this.cameraWorldDirection);
        this.cameraWorldDirection.multiplyScalar(currCameraDistance / 20);

        //如果碰撞就向这个方向移动一点，直到检测不到障碍
        if (intersection) {
            this.autoAdjustCount = 0;
            this.camera.position.add(this.cameraWorldDirection);
            this.nextFrameCameraMove.copy(this.cameraWorldDirection);
        }
        // 没有障碍物并且距离较近 自动拉远
        else if (currCameraDistance < 1) {
            if (this.autoAdjustCount > 0) {
                this.nextFrameCameraMove.copy(this.cameraWorldDirection);
            }
            //下一帧去做 更丝滑
            requestAnimationFrame(() => {
                this.autoAdjustCount++;
                this.camera.position.sub(this.nextFrameCameraMove);
                // this.nextFrameCameraMove.copy(this.cameraWorldDirection);
            });
        }
        if (currCameraDistance >= 1) return;
        this._player!.traverse((obj) => {
            if (obj.type === "SkinnedMesh" || obj.type === "Mesh") {
                //@ts-ignore
                this.setMaterialOpacity(obj.material, opacity);
            }
        });
    }

    /**
     * 将遮挡的物体透明化处理
     */
    opacityMesh(intersections: THREE.Intersection<Mesh>[]) {
        //恢复之前的物体的透明度
        this.intersectMesh.forEach((mesh) => {
            this.setMaterialOpacity(mesh.material, 1);
        });

        if (intersections) {
            //本次穿透的物体设置透明度
            this.intersectMesh = intersections.map((intersection) => {
                this.setMaterialOpacity(intersection.object.material, 0.1);
                return intersection.object;
            });
        }
    }

    setMaterialOpacity(material: Mesh["material"], opacity: number) {
        // if (opacity > 1) throw new Error("opacity 不能大于1!");
        if (opacity > 1) opacity = 1;
        if (Array.isArray(material)) {
            material.forEach((m) => {
                this.setMaterialOpacity(m, opacity);
            });
        } else {
            // 保存物体原来的属性
            if (!material.userData.prevOpacity) {
                material.userData.prevOpacity = material.opacity;
                material.userData.prevAlphaTest = material.alphaTest;
                material.userData.prevTransparent = material.transparent;
            }

            // 复原原来的属性
            if (opacity === 1) {
                material.transparent = material.userData.prevTransparent;
                material.opacity = material.userData.prevOpacity;
                material.alphaTest = material.userData.prevAlphaTest;
                return;
            }

            material.transparent = true;
            material.opacity = opacity * material.userData.prevOpacity;
            // 只设置opacity 不生效 opacity > alphaTest 不显示
            material.alphaTest =
                (opacity - 0.01) * material.userData.prevOpacity;
            // https://threejs.org/manual/#en/materials 最下面有关于needsUpdate的开销
            // material.needsUpdate = true;
        }
    }
}
