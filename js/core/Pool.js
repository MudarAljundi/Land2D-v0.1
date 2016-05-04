Land.Pool = function() {
    PIXI.Container.call(this);
    this.objectPool = [];
}
Land.Pool.prototype = PIXI.Container.prototype;

Land.Pool.prototype.getRandom = function () {
    "use strict";
    var i;

    for (i = 0; i < this.objectPool.length; i++) {
        return this.objectPool[Math.floor(Math.random() * this.objectPool.length)];
    }
};

Land.Pool.prototype.getFirstInPool = function () {
    "use strict";
    var i, object;

    if (this.objectPool.length > 0) {
        object = this.objectPool.pop();
        object.visible = true;
        return object;
    }
};


PIXI.Sprite.prototype.PushInPool = function PushInPool(pool) {
    pool.objectPool.push(this);
    this.visible = false;
};