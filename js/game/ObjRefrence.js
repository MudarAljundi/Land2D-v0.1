Land.objs = (function() {
	"use strict";

	var bulletPool = new Land.Pool();

	var createEntity = function createEntity(obj, texture) {
		obj.texture = texture;
		//player.texture = Land.asset.resources.actor_player.texture;
    	//player.position = new PIXI.Point(Land.map.objPos.player.x * 32, Land.map.objPos.player.y * 32);
	};

	var createBulletPool = function createBulletPool() {
		var x, _bullet;
		
		for (x = 0; x < 100; x++) {
	        _bullet = new Land.objs.Bullet(Land.asset.resources.object_bullet.texture);
	        bulletPool.addChild(_bullet);
	    }
	};

    bulletPool.shoot = function shoot(angle, pos) {
        var _bullet = this.getFirstInPool();

        if (_bullet) {
            _bullet.shoot(angle, pos);
        }
    }


    return {
    	bulletPool: bulletPool,
    	createBulletPool: createBulletPool,

    	createEntity: createEntity
    };

}());

/*
Land.Actor = function Actor(texture) {
    this.velocity = {x:0, y:0};
    this.visible = false;
	PIXI.Sprite.call(this, texture);
    Land.updateObjects.push(this);
};
*/
Land.objs.Bullet = function Bullet(texture) {
    "use strict";
	PIXI.Sprite.call(this, texture);
    this.velocity = {x:0, y:0};
    this.visible = false;
    Land.updateObjects.push(this);
    Land.objs.bulletPool.objectPool.push(this);

    this.update = function update() {
		this.position.x += this.velocity.x * Land.timeStep;
		this.position.y += this.velocity.y * Land.timeStep;

		var gridPos = {x:0, y:0};
		gridPos.y = Math.floor(this.position.y / 32);
		gridPos.x = Math.floor(this.position.x / 32);

		if (!Land.map.tileBoard[gridPos.y] || !Land.map.tileBoard[gridPos.y][gridPos.x]
			|| !Land.map.tileBoard[gridPos.y][gridPos.x].passable) {
		    this.release();
		}
    };

    this.release = function release() {
    	Land.objs.bulletPool.objectPool.push(this);
		this.visible = false;
    };
    this.shoot = function shoot(angle, pos) {

        this.visible = true;
        this.anchor.set(0.5, 0.5);
        this.position = new PIXI.Point(pos.x + 16, pos.y + 16);
        this.rotation = angle;

        this.velocity.x = Math.cos(angle) * 350;
        this.velocity.y = Math.sin(angle) * 350;
    }
};

Land.objs.Bullet.prototype = PIXI.Sprite.prototype;