var landEditor = (function(my) {
	"use strict";
    /*
        this file uses loose augmentation pattern
        http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html

        !!!!////####$$$$----2Do----$$$$####\\\\!!!!

        * debug mode :O
        + rendering FPS meter
        + console.log(renderer.drawCount)
          x, y cell cordnations and properties. Displayed on request. (... in retrospect, WHY???)
          rectangle triggers (id system)
          actor-placement (by hand & event)
          foreground & layers
        * paintbucket (breadth first search)

        * undo redo ctrl-z  ctrl-y
        * square, single tile selection ctrl-x ctrl-c ctrl-v
          rotate/flip selection (fuck that)
    */

    var _mainHUD;
    var _tileHUD = new PIXI.Container();
    var _objHUD = new PIXI.Container();

    var _greenLines = new PIXI.Graphics();
    var _whiteBG = new PIXI.Graphics();

    var _fileInput = document.createElement("INPUT");
    var _widthInput = document.createElement("INPUT");
    var _heightInput = document.createElement("INPUT");

    // temp memory for undo, redo
    var _undoMem = [],_redoMem = [], _undoEntry = '', _redoEntry = '';
    // temp memory for box selection tool
    my.selectionMem = "";

    var _chosenTileTool, _chosenObjTool;

    my.chosenObj = "enemy1";
    my.snapToGrid = false;
    my.chosenTile = 0;

    var _tilesModeButton, _objsModeButton, _triggersModeButton;

    var _chosenMode = "tiles";

    var _chosen_TileObj_Light; // green box on the bottom left
    var _chosen_Tool_Light; // small, White box, also bottom left

    var helpText;
    /*
        here is the terminology used in this page:
        "selection" is the process of using the selection tool (number 4)
        "choosing" is for choosing the tool/tile used to draw
    */

	var _init = function _init(screenWidth, screenHeight) {
        
        // file options
        var _save = new Land.Button(_exportMapJSON, { x: 8, y: 50 });
        var _saveText = new PIXI.extras.BitmapText("F2 Export Map", { font: "24px visitor", tint: "0xFFFFFF" });
        _saveText.position = new PIXI.Point(_save.position.x + 3, _save.position.y);

        var _resize = new Land.Button(function() {
            _on_resize(_widthInput.value, _heightInput.value);
        }, { x: 400, y: 20 });
        var _resizeText = new PIXI.extras.BitmapText("Resize", { font: "36px visitor", tint: "0xffFFff" });
        _resizeText.position = new PIXI.Point(_resize.position.x + 3, _resize.position.y);

        _fileInput.type = "file";
        _fileInput.setAttribute("style", "position: fixed; top: 20px; left: 70px");
        _fileInput.setAttribute("onchange", "landEditor.importFileJSON(this.files)");
        document.body.appendChild(_fileInput);

        _widthInput.type = "number";
        _widthInput.setAttribute("style", "position: fixed; top: 20px; left: 230px");
        document.body.appendChild(_widthInput);

        _heightInput.type = "number";
        _heightInput.setAttribute("style", "position: fixed; top: 50px; left: 230px");
        document.body.appendChild(_heightInput);


        _mainHUD = new PIXI.Container();

        // Modes
        _tilesModeButton = new Land.Button(_ChooseLayer.bind(null, "tiles"),
            { width: 50, height: 21, x: screenWidth-205, y: screenHeight-140, texture: Land.asset.resources.ed_tilesButton.texture });
        _objsModeButton = new Land.Button(_ChooseLayer.bind(null, "objs"),
            { width: 50, height: 21, x: screenWidth-150, y: screenHeight-140, texture: Land.asset.resources.ed_objsButton.texture });
        _triggersModeButton = new Land.Button(_ChooseLayer.bind(null, "triggers"),
            { width: 83, height: 21, x: screenWidth-91, y: screenHeight-140, texture: Land.asset.resources.ed_triggersButton.texture });
        
        
        // "colors" //
        _chosen_TileObj_Light = new PIXI.Sprite(Land.asset.resources.outline_green.texture);
        _chosen_TileObj_Light.position.y = screenHeight-102;

		var _tile0 = new Land.Button(my.chooseTile.bind(null, 0), { x: 0, y: screenHeight-102, width: 32, height: 32, texture: Land.asset.resources.blank.texture});
		var _tile1 = new Land.Button(my.chooseTile.bind(null, 1), { x: 32, y: screenHeight-102, width: 32, height: 32, texture: Land.asset.resources.block1.texture});
		var _tile2 = new Land.Button(my.chooseTile.bind(null, 2), { x: 64, y: screenHeight-102, width: 32, height: 32, texture: Land.asset.resources.block2.texture});
		var _tile3 = new Land.Button(my.chooseTile.bind(null, 3), { x: 96, y: screenHeight-102, width: 32, height: 32, texture: Land.asset.resources.block3.texture});
		var _tile4 = new Land.Button(my.chooseTile.bind(null, 4), { x: 128, y: screenHeight-102, width: 32, height: 32, texture: Land.asset.resources.block4.texture});
		var _tile5 = new Land.Button(my.chooseTile.bind(null, 5), { x: 160, y: screenHeight-102, width: 32, height: 32, texture: Land.asset.resources.block5.texture});

        var _obj0 = new Land.Button(_chooseObj.bind(null, "player"), { x: 0, y: screenHeight-102, width: 32, height: 32, texture: Land.asset.resources.actor_player.texture });
        var _obj1 = new Land.Button(_chooseObj.bind(null, "enemy1"), { x: 32, y: screenHeight-102, width: 32, height: 32, texture: Land.asset.resources.actor_enemy.texture });
       
        // tools //
        // tile
        _chosen_Tool_Light = new PIXI.Sprite(Land.asset.resources.ed_toolLight.texture);
        _chosen_Tool_Light.position = new PIXI.Point(8, screenHeight-140);

        var _penButton = new Land.Button(my.chooseTool.bind(null, 1), { x: 8, y: screenHeight-140, width: 16, height: 16, texture: Land.asset.resources.ed_pen.texture });
        var _bucketButton = new Land.Button(my.chooseTool.bind(null, 2), { x: 40, y: screenHeight-140, width: 16, height: 16, texture: Land.asset.resources.ed_bucket.texture });
        var _eyedropButton = new Land.Button(my.chooseTool.bind(null, 3), { x: 72, y: screenHeight-140, width: 16, height: 16, texture: Land.asset.resources.ed_eyedrop.texture });
        var _selectionButton = new Land.Button(my.chooseTool.bind(null, 4), { x: 104, y: screenHeight-140, width: 16, height: 16, texture: Land.asset.resources.ed_selection.texture });
        _penButton.scale.set(2, 2);
        _bucketButton.scale.set(2, 2);
        _eyedropButton.scale.set(2, 2);
        _selectionButton.scale.set(2, 2);
        _chosen_Tool_Light.scale.set(2, 2);

        // obj
        var _objPenButton = new Land.Button(my.chooseTool.bind(null, 1), { x: 8, y: screenHeight-140, width: 16, height: 16, texture: Land.asset.resources.ed_pen.texture });
        var _objCursorButton = new Land.Button(my.chooseTool.bind(null, 2), { x: 40, y: screenHeight-140, width: 16, height: 16, texture: Land.asset.resources.ed_cursor.texture });
        _objPenButton.scale.set(2, 2);
        _objCursorButton.scale.set(2, 2);

        _objHUD.visible = false;


        _chosenTileTool = my.pen_tool;
        _chosenObjTool = my.objPen_tool;

        //// graphics ////

        _whiteBG.beginFill(0xffaaff, 0.5);
        _whiteBG.drawRect(0, screenHeight-140, screenWidth, 100);
        _whiteBG.endFill();

        // green box used in "tile" and "obj" selection tool, when you left click & drag
        my.boxSelect = new PIXI.Graphics();
        my.boxSelect.beginFill(0x1ec108, 0.8);
        my.boxSelect.drawRect(0, 0, 1, 1);
        my.boxSelect.endFill();
        my.boxSelect.startClick = new PIXI.Point(0, 0);
        my.boxSelect.actualStartClick = new PIXI.Point(0, 0);
        // and this will hold our selected blue boxes, after dragging and releasing
        my.elementsSelectedBox = new PIXI.Graphics();


        // map drawing aid-lines
        _greenLines.lineStyle(1, 0x1fbd00);
        for (var x = 0; x < Land.map.tileBoard[0].length; x++) {
            _greenLines.moveTo(x * 32, 0);
            _greenLines.lineTo(x * 32, Land.map.tileBoard.length * 32);
        }
        for (var y = 0; y < Land.map.tileBoard.length; y++) {
            _greenLines.moveTo(0, y * 32);
            _greenLines.lineTo(Land.map.tileBoard[0].length * 32, y * 32);
        }
        _greenLines.endFill();
        ////

        // misc //
        my.penTileTxture = new PIXI.Sprite(Land.asset.resources.blank.texture);
        my.penTileTxture.alpha = 0.7;
        helpText = new PIXI.extras.BitmapText("Try holding 'Ctrl' to pick a color! Try '1, 2, 3' keys. What about middle clicking?", { font: "24px home", tint: "#000000" });
        helpText.position = new PIXI.Point(4, screenHeight-32);

        var _snapToGridButton = new Land.Button(function() { my.snapToGrid = !my.snapToGrid },
            { toggle: true, width: 70, height: 9, x: 50, y: screenHeight-140, texture: Land.asset.resources.ed_snapToGrid.texture });
        _snapToGridButton.scale.set(2, 2);


        Land.play.tilesContainer.addChild(my.elementsSelectedBox); // adding to playState so it pans correctly
        Land.play.tilesContainer.addChild(_greenLines);
        Land.play.tilesContainer.addChild(my.penTileTxture);
        
        // remember: order of following matters in renderer layer sorting!

        _mainHUD.addChild(_resize);
        _mainHUD.addChild(_resizeText);
        _mainHUD.addChild(_save);
        _mainHUD.addChild(_saveText);

        _mainHUD.addChild(my.boxSelect);

        _mainHUD.addChild(_whiteBG);

        _mainHUD.addChild(_tilesModeButton);
        _mainHUD.addChild(_objsModeButton);
        _mainHUD.addChild(_triggersModeButton);

        //tile hud
        _tileHUD.addChild(_penButton);
        _tileHUD.addChild(_bucketButton);
        _tileHUD.addChild(_eyedropButton);
        _tileHUD.addChild(_selectionButton);
		_tileHUD.addChild(_tile0);
		_tileHUD.addChild(_tile1);
		_tileHUD.addChild(_tile2);
		_tileHUD.addChild(_tile3);
		_tileHUD.addChild(_tile4);
		_tileHUD.addChild(_tile5);

        //obj hud
        _objHUD.addChild(_objPenButton);
        _objHUD.addChild(_objCursorButton);
        _objHUD.addChild(_snapToGridButton);
        _objHUD.addChild(_obj0);
        _objHUD.addChild(_obj1);

        // add obj & tile hud to mainHUD
        _mainHUD.addChild(_chosen_Tool_Light);  // must be before its tools
        _mainHUD.addChild(_tileHUD);
        _mainHUD.addChild(_objHUD);
        _mainHUD.addChild(_chosen_TileObj_Light);   // must be after its tools

        _mainHUD.addChild(helpText);

		Land.stage.addChild(_mainHUD);
	};

    var _1 = new Land.keyboard.Key(49, ["Digit1"]);
    var _2 = new Land.keyboard.Key(50, ["Digit2"]);
    var _3 = new Land.keyboard.Key(51, ["Digit3"]);
    var _4 = new Land.keyboard.Key(52, ["Digit4"]);
    var _num1 = new Land.keyboard.Key(97, ["Numpad1"]);
    var _num2 = new Land.keyboard.Key(98, ["Numpad2"]);
    var _num3 = new Land.keyboard.Key(99, ["Numpad3"]);
    var _num4 = new Land.keyboard.Key(100, ["Numpad4"]);
    var _f1 = new Land.keyboard.Key(112, ["F1"]);
    var _f2 = new Land.keyboard.Key(113, ["F2"]);

    var _shiftKey = new Land.keyboard.Key(16, ["ShiftLeft", "ShiftRight"]);
    var _controlKey = new Land.keyboard.Key(17, ["ControlLeft", "ControlRight"]);
    var _altKey = new Land.keyboard.Key(18, ["AltLeft", "AltRight"]);
    var _yKey = new Land.keyboard.Key(89, ["keyY"]);
    var _zKey = new Land.keyboard.Key(90, ["keyZ"]);

    var _functionStack = [_1, _2, _3, _4, _num1, _num2, _num3, _num4, _f1, _f2, _shiftKey, _controlKey, _altKey, _yKey, _zKey];

    var _repeatTimer = 0;

    var updateEditorKeys = function updateEditorKeys() {

        // released mouse & there are memeory entries
        if (Land.pixiMouse.originalEvent.buttons === 0 && _undoEntry.length > 0) {
            _rememberIn("undo");
        }

        Land.renderer.view.style.cursor = "crosshair";
        if (Land.pixiMouse.originalEvent.buttons === 4) {   // middle mouse button
            Land.renderer.view.style.cursor = "move";
            Land.play.dragCamera();
        }

        if (_controlKey.state.pressed) {

            if (_yKey.state.pressed && _repeatTimer <= 0) {
                _backtrack("redo");
                _repeatTimer = 10;
            } else if (_zKey.state.pressed && _repeatTimer <= 0) {
                _backtrack("undo");
                _repeatTimer = 10;
            }
            _repeatTimer -= 1;
        }

        if (_f2.state.justPressed) {
            _exportMapJSON();
        }

        if (_1.state.pressed || _num1.state.pressed) {
            my.chooseTool(1);
        } 
        if (_2.state.pressed || _num2.state.pressed) {
            my.chooseTool(2);
        } 
        if (_3.state.pressed || _num3.state.pressed) {
            my.chooseTool(3);
        }
        if (_4.state.pressed || _num4.state.pressed) {
            my.chooseTool(4);
        }

        switch (_chosenMode) {
            case "tiles":
            _chosenTileTool.idle(_controlKey);
            break;
            case "objs":
            _chosenObjTool.idle(_controlKey);
            break;
        }
        
    };


    var _ChooseLayer = function _ChooseLayer(layer) {
        _tileHUD.visible = false;
        _objHUD.visible = false;

        switch (layer){
            case "tiles":
            _tileHUD.visible = true;
            my.chooseTile(my.chosenTile); // Resetting highlight pos

            break;
            case "objs":
            _objHUD.visible = true;
            _chooseObj(my.chosenObj); // Resetting highlight pos

            break;
            case "triggers":

            break;
        }
        my.chooseTool(1);

        _chosenMode = layer;
    };
    my.chooseTool = function chooseTool(toolNum) {
        my.penTileTxture.visible = false;

        var tool;

        if (_chosenMode === "tiles") {
            if (toolNum === 1) {
                my.penTileTxture.visible = true;
                helpText.text = "Hold 'Ctrl' to pick a color. Middle click to drag";
                _chosenTileTool = my.pen_tool;
            }
            if (toolNum === 2) {
                helpText.text = "Click anywhere to fill. Middle clicking to drag.";
                _chosenTileTool = my.bucket_tool;
            }
            if (toolNum === 3) {
                helpText.text = "Click anywhere to copy tile selection.";
                _chosenTileTool = my.eyedrop_tool;
            }
            if (toolNum === 4) {
                my.selectionMem = "";
                helpText.text = "Left click and drag to select. Hold 'Alt' and click anywhere to STAMP selection";
                _chosenTileTool = my.boxSelection_tool;
            }
        }

        if (_chosenMode === "objs") {
            if (toolNum === 1) {
                my.penTileTxture.visible = true;
                helpText.text = "You can only draw objects here!";
                _chosenObjTool = my.objPen_tool;
            }
            if (toolNum === 2) {
                helpText.text = "click any object to edit or delete.";
                _chosenObjTool = my.objCursor_tool;
            }
        }
        
        _chosen_Tool_Light.position.x = (32 * (toolNum-1)) + 8;
    };
    my.chooseTile = function chooseTile(type) {

        _chosen_TileObj_Light.position.x = 32 * type;
        my.chosenTile = type;

        // saving tile properties here will complicate undo redo commands. Maybe later?
        switch (type) {
            case 0:
                my.penTileTxture.texture = Land.asset.resources.blank.texture;
                break;
            case 1:
                my.penTileTxture.texture = Land.asset.resources.block1.texture;
                break;
            case 2:
                my.penTileTxture.texture = Land.asset.resources.block2.texture;
                break;
            case 3:
                my.penTileTxture.texture = Land.asset.resources.block3.texture;
                break;
            case 4:
                my.penTileTxture.texture = Land.asset.resources.block4.texture;
                break;
            case 5:
                my.penTileTxture.texture = Land.asset.resources.block5.texture;
                break;
        }
    };
    var _chooseObj = function _chooseObj(type) {
        var offset = 0;

        switch (type) {
            case "player":
            my.penTileTxture.texture = Land.asset.resources.actor_player.texture;
            offset = 0;
            break;
            case "enemy1":
            my.penTileTxture.texture = Land.asset.resources.actor_enemy.texture;
            offset = 1;
            break;
        }
        
        _chosen_TileObj_Light.position.x = offset * 32;
        my.chosenObj = type;
    };

    /*
        placeholder functions, overrided throughout obj/tileTools.js
    */
    my.Tool = function Tool () {

    };
    my.Tool.prototype.idle = function idle() {};
    my.Tool.prototype.onDown = function onDown() {};
    my.Tool.prototype.onUp = function onUp() {};
    my.Tool.prototype.onMove = function onMove() {};


    var _downMouse_cell = function _downMouse_cell(clickEvent) {

        // make sure its left mouse button
        if (Land.pixiMouse.originalEvent.buttons !== 1) {
            return;
        }
        var mouseCoords = Land.events.getMouseCoords(clickEvent, Land.play.tilesContainer);

        if (_chosenMode === "tiles") {
            _chosenTileTool.onDown(mouseCoords, clickEvent, _controlKey.state.pressed);
        }

        if (_chosenMode === "objs") {
            _chosenObjTool.onDown(mouseCoords, clickEvent, _controlKey.state.pressed);
        }
    };


    var _moveMouse_cell = function _moveMouse_cell(moveEvent) {

        var mouseCoords = Land.events.getMouseCoords(moveEvent, Land.play.tilesContainer);

        if (_chosenMode === "tiles") {
            _chosenTileTool.onMove(mouseCoords, moveEvent, _controlKey.state.pressed);
        }

        if (_chosenMode === "objs") {
            _chosenObjTool.onMove(mouseCoords, moveEvent, _controlKey.state.pressed);
        }
    };

    my.leftClicked = false;
    var _upMouse_cell = function _upMouse_cell(upEvent) {

        // upmouse could have been _initiated by middle clicking, cant be detected with events, so we save a variable
        if (my.leftClicked === false) {
            return;
        }
        var mouseCoords = Land.events.getMouseCoords(upEvent, Land.play.tilesContainer);

        if (_chosenMode === "tiles") {
            _chosenTileTool.onUp(mouseCoords, upEvent, _altKey.state.pressed);
        }
    };

    var _on_resize = function _on_resize(widthIn, heightIn) {

        if (!widthIn || widthIn <= 0 || !heightIn || heightIn <= 0) {
            return;
        }

        Land.map.bounds.right = widthIn * 32;
        Land.map.bounds.bottom = heightIn * 32;

        var x, y, tile;
        var currentWidth = Land.map.tileBoard[0].length, currentHeight = Land.map.tileBoard.length;

        // Delete excess tiles
        for (y = 0; y < currentHeight; y++) {
            for (x = 0; x < currentWidth; x++) {
                
                // removes individual tile sprites
                if (y >= _heightInput.value || x >= _widthInput.value) {

                    Land.play.tilesContainer.removeChild(Land.map.tileBoard[y][x]);
                }
            }

            Land.map.tileBoard[y].splice(widthIn, currentWidth); // Deletes tile data
        }
        
        Land.map.tileBoard.splice(heightIn, currentHeight);

        // Create new tiles
        for (y = 0; y < heightIn; y++) {
            
            if (typeof(Land.map.tileBoard[y]) === "undefined") {

                Land.map.tileBoard[y] = [];
                //Land.map.data[y] = '';
            }
            
            for (x = 0; x < widthIn; x++) {

                if (typeof(Land.map.tileBoard[y][x]) === "undefined") {

                    //Land.map.data[y] = Land.map.data[y] + 0; // place a 0 in a "data row" on each iteration.

                    tile = new PIXI.Sprite(Land.asset.resources.blank.texture);
                    Land.map.tileBoard[y][x] = tile;

                    tile.type = 0;
                    tile.passable = true;
                    tile.visitedBy = 0; // For pathfinding
                    tile.position = new PIXI.Point(x * 32, y * 32); // Pixel cordnations.
                    tile.gridCoords = { x: x, y: y };  // gridCoords(2, 0) is position{y:64, x:0}, helper for pathfinding

                    Land.play.tilesContainer.addChild(tile);
                }
            }
        }

        // resize map drawing aid-lines
        _greenLines.clear();
        _greenLines.lineStyle(1, 0x1fbd00);
        for (var x = 0; x < currentWidth; x++) {
            _greenLines.moveTo(x * 32, 0);
            _greenLines.lineTo(x * 32, currentHeight * 32);
        }
        for (var y = 0; y < currentHeight; y++) {
            _greenLines.moveTo(0, y * 32);
            _greenLines.lineTo(currentWidth * 32, y * 32);
        }
        _greenLines.endFill();
    };
    var _exportMapJSON = function _exportMapJSON() {
        
        var x, y, mapData = [], objData = [], entity;

        for (y = 0; y < Land.map.tileBoard.length; y++) {
            mapData[y] = [];
            for (x = 0; x < Land.map.tileBoard[y].length; x++) {
                mapData[y] += Land.map.tileBoard[y][x].type; 
            }
        }

        for (x = 0; x < Land.play.objContainer.children.length; x++) {
            entity = Land.play.objContainer.children[x];

            objData[entity.name + "_" + entity.id] = { x: entity.position.x, y: entity.position.y };
        }

        var fileObject = JSON.stringify({ map: mapData, objs: objData }, null, "\t");

        var mapBlob = new Blob([fileObject], {type: "application/json"});
        saveAs(mapBlob, "map1.json");
    };
    // needs to be public
    my.importFileJSON = function importFileJSON(files) {

        var file = files[0]; 

        if (file) {
            var reader = new FileReader();
            reader.readAsText(file);

            reader.onload = function(event) {
                var contents = JSON.parse(event.target.result);
                Land.play.createMap(contents.map, contents.objs)
            }
        } else { 
          alert("Failed to load file");
        }
    };

    my.switch_MapEditText = function switch_MapEditText() {

        // if there is no map to edit (play hasn't started). stop
        if (typeof(Land.map.tileBoard[0]) === "undefined") {
            return;
        }
        // if editor has never been called before. initiate
        if (typeof(_mainHUD) === "undefined") {
            _init(Land.screenWidth, Land.screenHeight);
        }

        if (Land.options.inputState === "mapEdit") {
            Land.options.inputState = "move";

            Land.renderer.view.style.cursor = "inherit";    // back to normal cursor shape

            _hudVisible(false);

            Land.play.tilesContainer
                .off("mousedown", _downMouse_cell)
                .off("mousemove", _moveMouse_cell)
                .off("mouseup", _upMouse_cell);

            window.focus();
            document.body.removeEventListener("keydown", _keyDownEvent, false); // modified from Land.keyboard
            document.body.removeEventListener("keyup", _keyUpEvent, false);

            // this is esentially a "removeUpdateListener" function
            // stateUpdate is an array full of function objects which updates them all.
            for (var i = 0; i < Land.stateUpdate.length; i++) {
                if (Land.stateUpdate[i].name === "updateEditorKeys") {
                    Land.stateUpdate.splice(i, 1);
                }
            }
        } 
        else if (Land.options.inputState !== "mapEdit") {
            Land.options.inputState = "mapEdit";

            Land.renderer.view.style.cursor = "crosshair";

            _hudVisible(true);

            Land.play.tilesContainer
                .on("mousedown", _downMouse_cell)
                .on("mousemove", _moveMouse_cell)
                .on("mouseup", _upMouse_cell);
            window.focus();
            document.body.addEventListener("keydown", _keyDownEvent, false); // modified from Land.keyboard
            document.body.addEventListener("keyup", _keyUpEvent, false);

            Land.stateUpdate.push(updateEditorKeys);
        }
    };

    var _hudVisible = function _hudVisible(show) {
        if (show === true) {
            _fileInput.style.display = ""; // show
            _widthInput.style.display = "";
            _heightInput.style.display = "";
            _mainHUD.visible = true;
            _greenLines.visible = true;
            my.penTileTxture.visible = true;
        } else {
            _fileInput.style.display = "none";
            _widthInput.style.display = "none";
            _heightInput.style.display = "none";
            _mainHUD.visible = false;
            _greenLines.visible = false;
            my.penTileTxture.visible = false;
        }
    };

    /*
        we cant pass _undoEntry/memory as arguments because javascript cant "delete" a string, can only assign to another, empty string. Complicates things
        there goes more function purity!
    */
    var _rememberIn = function _rememberIn(command) {

        if (command === "undo") {
            _undoMem.push(_undoEntry);
            _undoEntry = "";
        }
        if (command === "redo") {
            _redoMem.push(_redoEntry);
            _redoEntry = "";
        }
    };
    var _backtrack = function _backtrack(command) {
        if (command === "undo") {
            if (_undoMem.length === 0) {
                return;
            }

            // Each string in _undoMem array reprisents a user action.
            // split the last (most recent) string and do ops on that
            var i, tempAction = _undoMem[_undoMem.length - 1].split("-");

            for (i = 1; i < tempAction.length; i += 3) {

                // i = type, x= i+1, y = i+2
                my.colorCell(tempAction[i+1], tempAction[i+2], tempAction[i], "undo");
            }
            _rememberIn("redo");

            _undoMem.pop();
        } else if (command === "redo") {
            if (_redoMem.length === 0) {
                return;
            }
            var i, tempAction = _redoMem[_redoMem.length - 1].split("-"); // split the last string in _redoMem array

            for (i = 1; i < tempAction.length; i += 3) {

                my.colorCell(tempAction[i+1], tempAction[i+2], tempAction[i], "redo");
            }
            _rememberIn("undo");

            _redoMem.pop();
        }
    };

    my.colorCell = function colorCell(x, y, type, command) {
        if (typeof(type) !== "number") { // may come as strings from memory
            x = Number(x);
            y = Number(y);
            type = Number(type);
        }

        if (_redoEntry.length === 0) {
            _redoEntry = "cc";
        }
        
        if (typeof(Land.map.tileBoard[y]) === "undefined" || typeof(Land.map.tileBoard[y][x]) === "undefined"
            || type === Land.map.tileBoard[y][x].type) { // if (clicked tile type is same chosen one)
            return;
        }

        
        if (typeof(command) === "undefined") { // if called from simple editing(drawing)
            if (_undoEntry.length === 0) {
                _undoEntry = "cc";
            }
            _undoEntry = _undoEntry.concat("-", Land.map.tileBoard[y][x].type, "-", x, "-", y); // save what it was originally
            _redoMem.splice(0, _redoMem.length); // delete redo memory
            _redoEntry = "";
        } else if (command === "undo") {
            if (_redoEntry.length === 0) {
                _redoEntry = "cc";
            }
            _redoEntry = _redoEntry.concat("-", Land.map.tileBoard[y][x].type, "-", x, "-", y); // save what it is right before "undo"ing it
        } else if (command === "redo") {
            if (_undoEntry.length === 0) {
                _undoEntry = "cc";
            }
            _undoEntry = _undoEntry.concat("-", Land.map.tileBoard[y][x].type, "-", x, "-", y); // save what it is right before redo
        }

        Land.map.tileBoard[y][x].type = type; // replace tile type

        switch (type) {
            case 0:
                Land.map.tileBoard[y][x].texture = Land.asset.resources.blank.texture;
                Land.map.tileBoard[y][x].passable = true;
                break;
            case 1:
                Land.map.tileBoard[y][x].texture = Land.asset.resources.block1.texture;
                Land.map.tileBoard[y][x].passable = true;
                break;
            case 2:
                Land.map.tileBoard[y][x].texture = Land.asset.resources.block2.texture;
                Land.map.tileBoard[y][x].passable = true;
                break;
            case 3:
                Land.map.tileBoard[y][x].texture = Land.asset.resources.block3.texture;
                Land.map.tileBoard[y][x].passable = true;
                break;
            case 4:
                Land.map.tileBoard[y][x].texture = Land.asset.resources.block4.texture;
                Land.map.tileBoard[y][x].passable = false;
                break;
            case 5:
                Land.map.tileBoard[y][x].texture = Land.asset.resources.block5.texture;
                Land.map.tileBoard[y][x].passable = false;
                break;
        }
        
    };

    /*
        I felt the need to duplicate this function from Land.keyboard to add a little more function purity (because frankly, that's really lacking in this project)
        a solution involving ".bind" creates bad limitations (cant use removeEventListener)
        I also didn't want to bloat the main _keyStack array which needs to be traversed twice on every key stroke

        Really, I'm not pleased either by this move but here goes:
    */
    var _keyDownEvent = function _keyDownEvent(event) {
        var key;

        if (event.keyCode || event.which) {
            key = event.keyCode || event.which;
        } else {
            key = event.key;
        }

        Land.keyboard.handleKeyDown(_functionStack, key, event);
    };
    var _keyUpEvent = function _keyUpEvent(event) {
        var key;

        if (event.keyCode || event.which) {
            key = event.keyCode || event.which;
        } else {
            key = event.key;
        }

        Land.keyboard.handleKeyUp(_functionStack, key, event);
    };

	return my;
}(landEditor || {}));