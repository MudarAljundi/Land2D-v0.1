Land.objs.Enemy1 = function Enemy1() {

	PIXI.Sprite.call(this, Land.asset.resources.actor_enemy.texture);
	this.name = "enemy1";

	// later maybe an inv object?
	this.ammo = 20;
	this.gun = new Land.guns.Gatling();
	this.turnState = "over";

	this.playTurn = function playTurn() {
		this.turnState = "playing";

		var playPos = Land.play.player.position;
		var distance = Math.abs(playPos.x - this.position.x) + Math.abs(playPos.y - this.position.y);

		if (distance <= 272) {

			if (this.ammo > 0) {
				this.ammo -= 1;

				this.gun.fire(40, this, Land.play.player);
			}
		} else {
			this.turnState = "over";
		}
	};

	//Land.updateObjects.push(this);
	/*
	this.update = function update() {
	
		var playPos = Land.play.player.position;
		var distance = Math.abs(playPos.x - this.position.x) + Math.abs(playPos.y - this.position.y);

		if (distance <= 272) {

			if (this.ammo > 0) {
				this.ammo -= 1;
				console.log(this.playedTurn)
				if (this.playedTurn === false) {
					this.playedTurn = true;
					this.gun.fire(40, this.position, Land.play.player);
				}
			}
		}
	};
	*/
};
Land.objs.Enemy1.prototype = PIXI.Sprite.prototype;