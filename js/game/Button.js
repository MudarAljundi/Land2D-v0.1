Land.Button = function Button(callback, options) {
	// font _& options object
	
	options = options || {};
	options.callback = callback;
	
	options.texture = options.texture || (Land.asset.resources.defaultButton.texture);

	PIXI.Sprite.call(this, options.texture);

	options.x = options.x || 0;
	options.y = options.y || 0;
	options.width = options.width || 160;
	options.height = options.height || 40;
	this.position = new PIXI.Point(options.x, options.y);

	this.texture.frame = new PIXI.Rectangle(0, 0, options.width, options.height);

	this.options = options;	// Save options argument for later use

	this.interactive = true;
	this.buttonMode = true;
	this
		.on("mousedown", this._on_down)
		.on("mouseover", this._on_over)
		.on("mouseout", this._on_out)
		.on("mouseup", this._on_up);
};
Land.Button.prototype = PIXI.Sprite.prototype;

Land.Button.prototype._on_down = function _on_down() {

	this.beingClicked = true;
	this.texture.frame = new PIXI.Rectangle(0, this.options.height * 2, this.options.width, this.options.height);
};
Land.Button.prototype._on_over = function _on_over() {
	Land.mouse.hudMode = true;

	this.texture.frame = new PIXI.Rectangle(0, this.options.height, this.options.width, this.options.height);
	if (this.options.toggle) {
		if (this.toggleOn === true) {
			this.texture.frame = new PIXI.Rectangle(0, this.options.height, this.options.width, this.options.height);
		} else {
			this.texture.frame = new PIXI.Rectangle(0, 0, this.options.width, this.options.height);
		}
	}
};
Land.Button.prototype._on_out = function _on_out() {
	
	Land.mouse.hudMode = false;
	this.beingClicked = false;
	this.texture.frame = new PIXI.Rectangle(0, 0, this.options.width, this.options.height);

	if (this.options.toggle) {
		if (this.toggleOn === true) {
			this.texture.frame = new PIXI.Rectangle(0, this.options.height * 2, this.options.width, this.options.height);
		} else {
			this.texture.frame = new PIXI.Rectangle(0, 0, this.options.width, this.options.height);
		}
	}
};
Land.Button.prototype._on_up = function _on_up() {
	if (this.beingClicked === true) {	// sort of makes sure we started the click ON the button and released there
		this.beingClicked = false;

		this.toggleOn = !this.toggleOn;
		this.options.callback();
		this.texture.frame = new PIXI.Rectangle(0, 0, this.options.width, this.options.height);
	}
};