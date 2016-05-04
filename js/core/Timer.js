/*
	mesured in cycles, 60 = 1 second
*/
Land.Timer = function Timer (defaultTime, callback, once) {
	this.time = defaultTime;
	this.defaultTime = defaultTime;

	this.indexNumber = 0;

	this.callback = callback;
	this.once = (once) ? true : false;

	this.paused = true;

	// add to the timers update loop
	Land.timers.unshift(this);
	this.indexNumber = Land.timers.length - 1;	// so we don't use indexOf
};

Land.Timer.prototype.start = function start(newCallback) {
	this.paused = false;

	if (newCallback) {
		this.callback = newCallback;
	}
};
Land.Timer.prototype.pause = function pause() {
	this.paused = true;
};

Land.Timer.prototype.remove = function remove() {

	//Land.timers.splice(Land.timers.indexOf(this), 1);
	Land.timers.splice(this.indexNumber, 1);
};

Land.Timer.prototype.reset = function reset(newCallback) {
	this.time = this.defaultTime;

	if (newCallback) {
		this.callback = newCallback;
	}
};

Land.Timer.prototype.timeComplete = function timeComplete() {

		console.log(this.callback)
	this.callback();

	if (this.once === true) {
		this.remove();
	}
};