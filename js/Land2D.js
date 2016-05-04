/*
	Astrick "*" means fixed, plus "+" means somewhat okay solution
	Bugs:
	  http://ariya.ofilabs.com/2012/12/javascript-performance-analysis-sampling-tracing-and-timing.html
	  cant use ParticleContainer with interactive childern (tiles). No interaction
	  calling window a lot. Any side effects? Should I roll a webworker or Browserfy?
	  Camera is a bitch. all positons are reversed.
	+ function(y, x) instead of function(x, y) because of Land.map.data entering
	  extra node on player when clicking near player.... Solve without stupid hack
	  wats up "console.log(Land.mainCamera.width)" fucking up all local positions ? It just outputs a number!
	  keys may sometimes hang when pressed, solution http://stackoverflow.com/questions/10949369/javascript-stuck-keys-unregistered-keyup-event
	* cant reset node values
	* Throws errors when painting outside tilesContainer
	* cant use this.on_cell
	* onkeydown="keyEvent(event)" sounds iffy
	* cant use prototype in listener
	* remove damn requestAnimationFrame
*/
/*
	Benchmarks:
    - var _fileInput; --vs-- Land.input.fileInput --vs-- var _fileInput = document.createElement("INPUT");
	- Test alpha of large number of objects (alpha property vs image texture alpha for whole picture)
	+ Test (Land.highlight_tile.texture.baseTexture.imageUrl === "assets/outlineRed.png") vs (Land.highlight_tile.texture === Land.asset.outline_red)
	- Test if (this.arst.arst.arst[x][y]) {
			var object = this.arst.arst.arst[x][y]
			object.change stuff
		}
	- check value before setting OR simply set it? (if(texture1 !== texture2) texture 1 = texture 2)
	- Benchmark JS. Pref JS
	- Land.map.data vs Land.map.tileBoard
	- Does "delete" speed up garbage collection? (in the long run)
	- String vs Array lookup
	- test PIXI.Point
	- new vs object.create
	- cache for loop .length
*/
/*
	~~~~~To Do~~~~:
	  Utilize mouse scrollwheel
	  highlight path before clicking
	* player movement
	+ cell click failsafe
	  jshint check
	  Preload & put on Newgrounds
	  scroll by holding left mouse
	* highlight stack manager. addChild to a container
	+ better tile support: 1= block,  56= effect(water)
	* shorten update & maybe implement for state[i].update/render
	* close Keyboard file
	  chang keyboard controls in options
	  fullscream
	  remove cell & map from root
	  polyfill()
	  Update libararies
	  Camera flash, fadein, shake
	  compile with googleclosure? or grunt?
	  make camera panning work when clicking non tiles
	* close files (sub-modules for now, may try more advanced patterns later)
	* Camera
*/
/*
	Saving:
	Loadmap
		var restoredSession = JSON.parse(localStorage.getItem("GameSave1"));
*/
/*
	_DEBUG TOOLS:
	* debug mode :O
	+ rendering FPS meter
	+ console.log(renderer.drawCount)
	  cheats
*/



var Land = (function() {
	"use strict";
	
	var version = "21/11/2015";  // Versions by date

	var asset = {};	// Asset manager refrence

	var stateUpdate = [], updateObjects = [], timers = [];

	var _deltaTime = 0;
	var timeStep = 1/60;

	var mouse = {
		anyDown: false,
		clickPos: {x:0, y:0},
		beenDragged: false,
		hudMode: false
	};
	var pixiMouse;

	var renderer;
	var options;

	var stage, mainCamera, mainHud;

// http://codeincomplete.com/posts/2013/12/4/javascript_game_foundations_the_game_loop/
// http://gafferongames.com/game-physics/fix-your-timestep/
	var _currentTime = performance.now();
	var frame = function frame() {
		var newTime = performance.now();
		_deltaTime += Math.min(1, (newTime - _currentTime) / 1000)  //gets dt in miliseconds. Reverts to 1 second if dt is too large.
		
		while (_deltaTime > Land.timeStep) {
			_deltaTime -= Land.timeStep;

			if (Land.options.paused === false) {
				_updateGame();
			}
			_updateKeys();
		}
		_render();
		

		_currentTime = newTime;

		window.requestAnimationFrame(Land.frame);
	};

	var _updateKeys = function _updateKeys() {

		if (Land.keyboard.callMenu.state.justPressed) { // esc
           Land.menu.on_showOptions();
        }

		// difrent solution: set time delay for removing justPressed states (like in phaser)
		// justErase = [Land.keyboard.attack.state]
        var i;

		for (i = 0; i < Land.keyboard.justErase.length; i++) {

			if (Land.keyboard.justErase[i].pressed) {
				Land.keyboard.justErase[i].justPressed = false;
				Land.keyboard.justErase.splice(i, 1);
			}
			else if (Land.keyboard.justErase[i].released) {
				Land.keyboard.justErase[i].justReleased = false;
				Land.keyboard.justErase.splice(i, 1);
			}
		}
	};

	var _updateGame = function _updateGame() {
		var i;

		for (i = 0; i < Land.stateUpdate.length; i++) {
			Land.stateUpdate[i]();
		}
		for (i = 0; i < Land.updateObjects.length; i++) {
			if (Land.updateObjects[i].visible) {
				Land.updateObjects[i].update();
			}
		}
		for (i = 0; i < Land.timers.length; i++) {
			if (Land.timers[i].paused === true) {
				continue;
			}
			
			Land.timers[i].time -= 1;

			if (Land.timers[i].time <= 0) {
				Land.timers[i].timeComplete();
			}
		}

		
	};
	var _render = function _render() {
		Land.renderer.render(Land.stage);
		// position interpolation
	};

	/*
		init() creates new renderer. Default options. New global containers (stage, mainCamera, tilesContainer, hud)
		and a keyboard listeners
	*/
	var init = function init() {

    	PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;    //Texture quality

    	Land.screenWidth = 960;
    	Land.screenHeight = 640;

		Land.renderer = new PIXI.autoDetectRenderer(Land.screenWidth, Land.screenHeight, { backgroundColor : 0x000, antialias: false });
        Land.renderer.view.id = "gameCanvas";

        Land.pixiMouse = Land.renderer.plugins.interaction.mouse;
        
		Land.renderer.view.style.position = "fixed";
		Land.renderer.view.style.top = "0px";
		Land.renderer.view.style.left = "0px";
		//Land.renderer = new PIXI.WebGLRenderer(960, 640, { backgroundColor : 0x000, antialias: false });
		//Land.renderer = new PIXI.CanvasRenderer(960, 640, { backgroundColor : 0x000, antialias: false });

		Land.options = {
			inputState: "move",
			panning_tutorial: true,
			paused: false
		};

        
		Land.stage = new PIXI.Container();
		//Land.stage.scale.x = Land.stage.scale.y = 2;

		window.focus();
		document.body.addEventListener("keydown", Land.keyboard.keyDownEvent, false); // useCapture
		document.body.addEventListener("keyup", Land.keyboard.keyUpEvent, false);
		
        document.body.appendChild(Land.renderer.view);
        window.requestAnimationFrame(Land.frame);
	};

	return {
		init: init,
		frame: frame,

		asset: asset,

		updateObjects: updateObjects,
		stateUpdate: stateUpdate,
		timers: timers,

		timeStep: timeStep,
		mouse: mouse,
		pixiMouse: pixiMouse,
		renderer: renderer,
		options: options,
		stage: stage,
		
		version: version
	};
}());

Land.map = {
	bounds: {
		right: 20 * 32, // "width * 32px" hardcoded for now
		bottom: 10 * 32 // "height * 32px"
	},
	tileBoard: [],
};