/*
 * @Author: hongbin
 * @Date: 2023-01-27 17:17:04
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-05 11:18:01
 * @Description:键盘监听器
 */

type TListenPool = Record<
    string,
    { press: VoidFunction; raise?: VoidFunction; isPress: boolean }
>;

export class KeyBoardListener {
    listenPool = {} as TListenPool;
    static instance: KeyBoardListener;

    constructor() {
        if (KeyBoardListener.instance) return KeyBoardListener.instance;
        else KeyBoardListener.instance = this;
    }

    /**
     * 设置监听键和回调
     */
    listenKey(key: string, press: VoidFunction, raise?: VoidFunction) {
        this.listenPool[key] = { press, raise, isPress: false };
        return this;
    }

    /**
     * 取消按键的监听
     */
    cancelListenKey(key: string) {
        delete this.listenPool[key];
        return this;
    }

    /**
     * 执行按键的抬起事件
     */
    protected _callbackUp(key: string) {
        const keyConfig = this.listenPool[key];
        if (keyConfig) {
            keyConfig.isPress = false;
            keyConfig["raise"] && keyConfig["raise"]();
        }
    }

    /**
     * 执行按下的所有键对应的回调
     */
    protected _callbackDown(key: string) {
        const keyConfig = this.listenPool[key];
        if (!keyConfig) return;
        keyConfig.isPress = true;
        //所有按下未抬起的键均执行
        Object.values(this.listenPool).forEach((config) => {
            if (config.isPress) config.press();
        });
    }

    protected _handleDown(e: KeyboardEvent) {
        this._callbackDown(e.code);
    }

    protected _handleUp(e: KeyboardEvent) {
        this._callbackUp(e.code);
    }

    protected handleDown = (e: KeyboardEvent) => this._handleDown.call(this, e);
    protected handleUp = (e: KeyboardEvent) => this._handleUp.call(this, e);

    /**
     * 开始监听键盘按键
     */
    keyBoardListen() {
        document.addEventListener("keydown", this.handleDown);
        document.addEventListener("keyup", this.handleUp);
        return this;
    }

    /**
     * 移除键盘按键监听
     */
    removeKeyBoardListen() {
        document.removeEventListener("keydown", this.handleDown);
        document.removeEventListener("keyup", this.handleUp);
    }
}
