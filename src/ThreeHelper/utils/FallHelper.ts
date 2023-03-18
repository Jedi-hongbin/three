/*
 * @Author: hongbin
 * @Date: 2023-02-08 11:59:46
 * @LastEditors: hongbin
 * @LastEditTime: 2023-02-17 13:30:07
 * @Description:下降 落下
 */

export class FallHelper {
    time = 0;

    compute() {
        // exp(0) === 1
        return Math.exp(this.time) - 1;
    }

    computeDistance(time: number) {
        this.time += time;
        return this.compute();
    }

    resetTime() {
        this.time = 0;
    }
}
