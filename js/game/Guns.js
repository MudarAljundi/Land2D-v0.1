Land.guns = {};

Land.guns.Gatling = function Gatling() {

	this.gatlingSND = new Howl({
		urls: ["assets/snd/104401__kantouth__gatling-gun.mp3"]
	});
	this.firing = false;

	//this.shootDelay = new Land.Timer(10, function(){});
	//this.shootDelay = setTimeout(function(){}, 100);
	//this.reloadDelay = setTimeout(function(){}, 2000);

	this._repeateFire = function _repeateFire(burstAmmo, parent, target) {

		var i, angleOffset;
		var parentPos = parent.position;
		
		for (i = 0; i < 2; i++) {
			angleOffset = (Math.random() / 2) - 0.25;

			Land.objs.bulletPool.shoot(Math.atan2(target.position.y - parentPos.y, target.position.x - parentPos.x) + angleOffset, parentPos);
		}

		if (burstAmmo > 0) {
			// repeate
			this.shootDelay = setTimeout(this._repeateFire.bind(this, burstAmmo - 1, parent, target), 100);
		}

		if (burstAmmo <= 0) {

			if (parent.turnState) {
				parent.turnState = "over";
			}
			// TESTING TESTING TESTING
			//this.reloadDelay = setTimeout(this.fire.bind(this, 40, fromPos, target), 2000);
		}
	};
};

Land.guns.Gatling.prototype.fire = function fire(burstAmmo, parent, target) {

	this.gatlingSND.play();
	this._repeateFire(burstAmmo, parent, target);
};
/*
Land.guns.Gatling.prototype.repeateFire = function repeateFire(burstAmmo, fromPos, target) {

	var i, angleOffset;
	for (i = 0; i < 2; i++) {
		angleOffset = (Math.random() / 2) - 0.25;
		Land.objs.bulletPool.shoot(Math.atan2(target.position.y - fromPos.y, target.position.x - fromPos.x) + angleOffset, fromPos);
	}

	if (burstAmmo > 0) {
		this.shootDelay = setTimeout(this.repeateFire.bind(this, burstAmmo - 1, fromPos, target), 100);
	}
	if (burstAmmo <= 0) {
		// TESTING TESTING TESTING
		this.reloadDelay = setTimeout(this.fire.bind(this, 40, fromPos, target), 2000);
	}
};
*/