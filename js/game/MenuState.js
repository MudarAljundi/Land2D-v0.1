Land.menu = (function() {
	"use strict";
	
	var _cog_sprtSheet;
	var _esc_sprtSheet;

	var _fullscreen_Stretch;
	var _fullscreen_StretchText;
	var _fullscreen_Black;
	var _fullscreen_BlackText;
	var _editor;
	var _editorText;

	var _save;
	var _saveText;

	var init = function init() {

		var _mainHUD = new PIXI.Container();

		_cog_sprtSheet = Land.asset.resources.option_cog.texture;
		_cog_sprtSheet.frame = new PIXI.Rectangle(0, 0, 13, 15);

		_esc_sprtSheet = Land.asset.resources.option_esc.texture;
		_esc_sprtSheet.frame = new PIXI.Rectangle(0, 0, 25, 16);

		var _showOptions = new Land.Button(function () {
			on_showOptions();
		}, { texture: _esc_sprtSheet, width: 25, height: 16, x: 4, y: 4 });


		_fullscreen_Stretch = new Land.Button(function() {
			Land.events.launchIntoFullscreen(document.getElementById("gameCanvas"), "stretch");
		}, { x: 400, y: 250 });
		_fullscreen_Stretch.visible = false;
	    _fullscreen_StretchText = new PIXI.extras.BitmapText("Fullscreen 1", { font: "24px home", tint: "0xffFFff" });
	    _fullscreen_StretchText.position = new PIXI.Point(_fullscreen_Stretch.position.x + 10, _fullscreen_Stretch.position.y);
		_fullscreen_StretchText.visible = false;

		_fullscreen_Black = new Land.Button(function() {
			Land.events.launchIntoFullscreen(document.getElementById("gameCanvas"), "blackBar");
		}, { x: 400, y: 300 });
		_fullscreen_Black.visible = false;
	    _fullscreen_BlackText = new PIXI.extras.BitmapText("Fullscreen 2", { font: "24px home", tint: "0xffFFff" });
	    _fullscreen_BlackText.position = new PIXI.Point(_fullscreen_Black.position.x + 10, _fullscreen_Black.position.y);
		_fullscreen_BlackText.visible = false;

		_editor = new Land.Button(function() {
			on_showOptions();
			landEditor.switch_MapEditText();
			Land.mouse.hudMode = false;
		}, { x: 400, y: 350 });
		_editor.visible = false;
	    _editorText = new PIXI.extras.BitmapText("Map Editor", { font: "24px home", tint: "0xffFFff" });
	    _editorText.position = new PIXI.Point(_editor.position.x + 10, _editor.position.y + 2);
		_editorText.visible = false;

		_showOptions.scale.set(2, 2);
		_mainHUD.addChild(_showOptions);

		_mainHUD.addChild(_fullscreen_Stretch);
		_mainHUD.addChild(_fullscreen_StretchText);
		_mainHUD.addChild(_fullscreen_Black);
		_mainHUD.addChild(_fullscreen_BlackText);
		_mainHUD.addChild(_editor);
		_mainHUD.addChild(_editorText);

		Land.stage.addChildAt(_mainHUD, 2);
	};

	var on_showOptions = function on_showOptions() {
		Land.options.paused = !Land.options.paused;

		_fullscreen_Black.visible = !_fullscreen_Black.visible;
		_fullscreen_BlackText.visible = !_fullscreen_BlackText.visible;

		_fullscreen_Stretch.visible = !_fullscreen_Stretch.visible;
		_fullscreen_StretchText.visible = !_fullscreen_StretchText.visible;

		_editor.visible = !_editor.visible;
		_editorText.visible = !_editorText.visible;
	};
	return {
		init: init,
		on_showOptions: on_showOptions
	};

}());