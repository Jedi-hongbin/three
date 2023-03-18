/*
 * @Author: hongbin
 * @Date: 2023-03-17 22:17:04
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-18 18:19:09
 * @Description:
 */
import {
    NearestFilter,
    LinearMipMapLinearFilter,
    sRGBEncoding,
    EquirectangularReflectionMapping,
} from "three";

import GifLoader from "./gif-loader";
import GifTexture from "./gif-texture";

export class GIFTexture extends GifLoader {
    image;

    constructor(
        path: string,
        /**
         * 自动播放gif 定时器循环执行
         */
        autoDraw?: "autoDraw",
        onLoad?: (image: GifTexture) => void
    ) {
        super();

        let image = this.load(path, onLoad);
        autoDraw && image.autoDraw();

        // options
        image.mapping = EquirectangularReflectionMapping;
        image.encoding = sRGBEncoding;
        image.magFilter = NearestFilter;
        image.minFilter = LinearMipMapLinearFilter;
        this.image = image;
    }

    draw() {
        this.image.draw();
    }
}
