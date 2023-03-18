/*
 * @Author: hongbin
 * @Date: 2023-01-02 20:14:51
 * @LastEditors: hongbin
 * @LastEditTime: 2023-01-04 17:47:43
 * @Description:线性动画 LinearAnimation
 */

export class LinearAnimation<T extends Record<string, number>> {
    start: T;
    end?: T;
    total: number = 30;
    count: number = 0;
    callback?: (object: T) => void;

    /**
     * 线性插值运算动画
     */
    constructor(start: T) {
        this.start = start;
    }

    setStart(start: T) {
        this.start = start;
        return this;
    }

    to(
        /**
         * 终点对象
         */
        end: T,
        /**
         * 调用几次完成变换
         */
        num?: number
    ) {
        this.end = { ...end };
        num && (this.total = num);
        return this;
    }

    onUpdate(callback: (object: T) => void) {
        this.callback = callback;
        return this;
    }

    update(progress?: number) {
        if (!this.end) return;
        if (!progress && this.count >= this.total) return;
        const newData = {} as T;
        this.count++;
        const percent = progress
            ? progress > 1
                ? 1
                : progress
            : this.count / this.total;
        //计算当前进度对应的值
        Object.keys(this.start).forEach((key: keyof T) => {
            const val =
                this.start[key] + (this.end![key] - this.start[key]) * percent;
            newData[key] = val as T[keyof T];
        });

        this.callback && this.callback(newData);
    }
}
