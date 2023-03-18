/*
 * @Author: hongbin
 * @Date: 2023-01-07 12:59:50
 * @LastEditors: hongbin
 * @LastEditTime: 2023-01-07 13:06:48
 * @Description:性能指示器
 */
import Stats from "stats.js";

/**
 * 性能状态显示
 */
export const stats = {
    stats: undefined as unknown as Stats,
    init: function () {
        //防止热重载初始化多个
        if (this.stats) return;
        const stats = new Stats();
        this.stats = stats;
        document.body.appendChild(stats.dom);
        stats.dom.style.top = "auto";
        stats.dom.style.bottom = "0";
    },
    update: function () {
        this.stats && this.stats.update();
    },
};
