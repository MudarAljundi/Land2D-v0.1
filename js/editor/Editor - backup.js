Land.editor = (function() {
    "use strict";
    var _mainHUD;
    var _tileToolsHUD = new PIXI.Container();
    var _objToolsHUD = new PIXI.Container();

    /*
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

    var _greenLines = new PIXI.Graphics();
    var _whiteBG = new PIXI.Graphics();
    var _boxSelect = new PIXI.Graphics();
    var _tilesSelected = new PIXI.Graphics();

    var _fileInput = document.createElement("INPUT");
    var _widthInput = document.createElement("INPUT");
    var _heightInput = document.createElement("INPUT");

    var _helpText;

    var _undoMem = [],_redoMem = [], _undoEntry = '', _redoEntry = '';
    var _selectionMem = "";

    var _chosenTile = 0, _currentTileTool, _penTileTexture;

    var _currentObjTool;

    var _chosenObj = "enemy1";
    var _snapToGrid = false;

    var _tilesLayerText, _objsLayerText, _triggersLayerText;
    var _snapToGridButton;

    var _chosenLayer = "tiles";

    var _chosen_TileObj_Light; // green box on the bottom left
    var _chosen_Tool_Light; // small, White box, also bottom left

    /*
        here is the terminology used in this page:
        "selection" is the process of using the selection tool (number 4)
        "choosing" is for choosing the tool/tile used to draw
    */

    var init = function init () {
        _fileInput.type = "file";
        _fileInput.setAttribute("style", "position: fixed; top: 20px; left: 70px");
        _fileInput.setAttribute("onchange", "Land.editor.importFileJSON(this.files)");
        document.body.appendChild(_fileInput);

        _widthInput.type = "number";
        _widthInput.setAttribute("style", "position: fixed; top: 20px; left: 230px");
        document.body.appendChild(_widthInput);

        _heightInput.type = "number";
        _heightInput.setAttribute("style", "position: fixed; top: 50px; left: 230px");
        document.body.appendChild(_heightInput);

        _mainHUD = new PIXI.Container();

        // Layers
        _tilesLayerText = new Land.Button(_ChooseLayer.bind(null, "tiles"),
            { width: 50, height: 21, x: Land.gameWidth-205, y: Land.gameHeight-70, texture: Land.asset.resources.ed_tilesButton.texture });
        _objsLayerText = new Land.Button(_ChooseLayer.bind(null, "objs"),
            { width: 50, height: 21, x:Land.gameWidth-150, y: Land.gameHeight-70, texture: Land.asset.resources.ed_objsButton.texture });
        _triggersLayerText = new Land.Button(_ChooseLayer.bind(null, "triggers"),
            { width: 83, height: 21, x:Land.gameWidth-91, y: Land.gameHeight-70, texture: Land.asset.resources.ed_triggersButton.texture });
        
        _snapToGridButton = new Land.Button(function() { _snapToGrid = !_snapToGrid },
            { toggle: true, width: 70, height: 9, x: 50, y: Land.gameHeight-65, texture: Land.asset.resources.ed_snapToGrid.texture });

        _helpText = new PIXI.extras.BitmapText("Try holding 'Ctrl' to pick a color! Try '1, 2, 3' keys. What about middle clicking?", { font: "12px home", tint: "#000000" });
        _helpText.position = new PIXI.Point(4, Land.gameHeight-16);

        // tiles
        _chosen_TileObj_Light = new PIXI.Sprite(Land.asset.resources.outline_green.texture);
        _chosen_TileObj_Light.position.y = 270;
        _penTileTexture = new PIXI.Sprite(Land.asset.resources.blank.texture);
        _penTileTexture.alpha = 0.7;

        var _tile0 = new Land.Button(_chooseTile.bind(null, 0), { texture: Land.asset.resources.blank.texture, width: 32, height: 32, x: 0, y: 270 });
        var _tile1 = new Land.Button(_chooseTile.bind(null, 1), { texture: Land.asset.resources.block1.texture, width: 32, height: 32, x: 32, y: 270 });
        var _tile2 = new Land.Button(_chooseTile.bind(null, 2), { texture: Land.asset.resources.block2.texture, width: 32, height: 32, x: 64, y: 270 });
        var _tile3 = new Land.Button(_chooseTile.bind(null, 3), { texture: Land.asset.resources.block3.texture, width: 32, height: 32, x: 96, y: 270 });
        var _tile4 = new Land.Button(_chooseTile.bind(null, 4), { texture: Land.asset.resources.block4.texture, width: 32, height: 32, x: 128, y: 270 });
        var _tile5 = new Land.Button(_chooseTile.bind(null, 5), { texture: Land.asset.resources.block5.texture, width: 32, height: 32, x: 160, y: 270 });

        var _obj0 = new Land.Button(_chooseObj.bind(null, "player"), { texture: Land.asset.resources.actor_player.texture, width: 32, height: 32, x: 0, y: 270 });
        var _obj1 = new Land.Button(_chooseObj.bind(null, "enemy1"), { texture: Land.asset.resources.actor_enemy.texture, width: 32, height: 32, x: 32, y: 270 });
       
        // tools
        _chosen_Tool_Light = new PIXI.Sprite(Land.asset.resources.ed_toolLight.texture);
        _chosen_Tool_Light.position = new PIXI.Point(4, 252);

        var _pen = new Land.Button(_chooseTool.bind(null, 1), { x: 4, y: 252, width: 16, height: 16, texture: Land.asset.resources.ed_pen.texture });
        var _bucket = new Land.Button(_chooseTool.bind(null, 2), { x: 20, y: 252, width: 16, height: 16, texture: Land.asset.resources.ed_bucket.texture });
        var _eyedrop = new Land.Button(_chooseTool.bind(null, 3), { x: 36, y: 252, width: 16, height: 16, texture: Land.asset.resources.ed_eyedrop.texture });
        var _selection = new Land.Button(_chooseTool.bind(null, 4), { x: 52, y: 252, width: 16, height: 16, texture: Land.asset.resources.ed_selection.texture });
    
        var _objPen = new Land.Button(_chooseTool.bind(null, 1), { x: 4, y: 252, width: 16, height: 16, texture: Land.asset.resources.ed_pen.texture });
        var _objCursor = new Land.Button(_chooseTool.bind(null, 2), { x: 20, y: 252, width: 16, height: 16, texture: Land.asset.resources.ed_cursor.texture });
       
        _currentTileTool = _pen_tool;
        _currentObjTool = _objPen_tool;

        _objToolsHUD.visible = false;

        // other options
        var _save = new Land.Button(_exportMapJSON, { x: 4, y: 25 });
        var _saveText = new PIXI.extras.BitmapText("F2 Export Map", { font: "12px visitor", tint: "0xFFFFFF" });
        _saveText.position = new PIXI.Point(_save.position.x + 3, _save.position.y);

        var _resize = new Land.Button(function() {
            _on_resize(_widthInput.value, _heightInput.value);
        }, { x: 200, y: 10 });
        var _resizeText = new PIXI.extras.BitmapText("Resize", { font: "20px visitor", tint: "0xffFFff" });
        _resizeText.position = new PIXI.Point(_resize.position.x + 3, _resize.position.y);

        //// graphics, need to move these elsewhere
        _boxSelect.beginFill(0x1ec108, 0.8);
        _boxSelect.drawRect(0, 0, 1, 1);
        _boxSelect.endFill();
        _boxSelect.leftClicked = false;
        _boxSelect.startClick = new PIXI.Point(0, 0);
        _boxSelect.actualStartClick = new PIXI.Point(0, 0);

        _whiteBG.beginFill(0xffaaff, 0.5);
        _whiteBG.drawRect(0, Land.gameHeight-70, Land.gameWidth, 70);
        _whiteBG.endFill();

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

        Land.play.tilesContainer.addChild(_tilesSelected);
        Land.play.tilesContainer.addChild(_greenLines);
        Land.play.tilesContainer.addChild(_penTileTexture); // adding to playState so it pans correctly
        
        _mainHUD.addChild(_whiteBG);

        _mainHUD.addChild(_tilesLayerText);
        _mainHUD.addChild(_objsLayerText);
        _mainHUD.addChild(_triggersLayerText);


        _mainHUD.addChild(_chosen_Tool_Light);
        _tileToolsHUD.addChild(_pen);
        _tileToolsHUD.addChild(_bucket);
        _tileToolsHUD.addChild(_eyedrop);
        _tileToolsHUD.addChild(_selection);
        _objToolsHUD.addChild(_objPen);
        _objToolsHUD.addChild(_objCursor);
        _objToolsHUD.addChild(_snapToGridButton);

        _mainHUD.addChild(_resize);
        _mainHUD.addChild(_resizeText);
        _mainHUD.addChild(_save);
        _mainHUD.addChild(_saveText);

        _tileToolsHUD.addChild(_tile0);
        _tileToolsHUD.addChild(_tile1);
        _tileToolsHUD.addChild(_tile2);
        _tileToolsHUD.addChild(_tile3);
        _tileToolsHUD.addChild(_tile4);
        _tileToolsHUD.addChild(_tile5);
        _mainHUD.addChild(_tileToolsHUD);

        _objToolsHUD.addChild(_obj0);
        _objToolsHUD.addChild(_obj1);
        _mainHUD.addChild(_objToolsHUD);
        _mainHUD.addChild(_chosen_TileObj_Light);

        _mainHUD.addChild(_boxSelect);

        _mainHUD.addChild(_helpText);

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
            _chooseTool(1);
        } 
        if (_2.state.pressed || _num2.state.pressed) {
            _chooseTool(2);
        } 
        if (_3.state.pressed || _num3.state.pressed) {
            _chooseTool(3);
        }
        if (_4.state.pressed || _num4.state.pressed) {
            _chooseTool(4);
        }
    };


    var _ChooseLayer = function _ChooseLayer(layer) {
        _tileToolsHUD.visible = false;
        _objToolsHUD.visible = false;

        switch (layer){
            case "tiles":
            _tileToolsHUD.visible = true;
            _chooseTile(_chosenTile); // Resetting highlight pos
            break;
            case "objs":
            _objToolsHUD.visible = true;
            _chooseObj(_chosenObj); // Resetting highlight pos

            break;
            case "triggers":

            break;
        }

        _chosenLayer = layer;
    };
    var _chooseTool = function _chooseTool(toolNum) {
        _penTileTexture.visible = false;

        var tool;

        if (_chosenLayer === "tiles") {
            if (toolNum === 1) {
                _penTileTexture.visible = true;
                _helpText.text = "Hold 'Ctrl' to pick a color. Middle click to drag";
                _currentTileTool = _pen_tool;
            }
            if (toolNum === 2) {
                _helpText.text = "Click anywhere to fill. Middle clicking to drag.";
                _currentTileTool = _bucket_tool;
            }
            if (toolNum === 3) {
                _helpText.text = "Click anywhere to copy tile selection.";
                _currentTileTool = _eyedrop_tool;
            }
            if (toolNum === 4) {
                _selectionMem = "";
                _helpText.text = "Left click and drag; then hold 'Alt' and click anywhere to STAMP selection";
                _currentTileTool = _boxSelection_tool;
            }
        }

        if (_chosenLayer === "objs") {
            if (toolNum === 1) {
                _penTileTexture.visible = true;
                _helpText.text = "You can only draw objects here!";
                _currentObjTool = _objPen_tool;
            }
            if (toolNum === 2) {
                _helpText.text = "click any object to edit or delete.";
                _currentObjTool = _objCursor_tool;
            }
        }
        
        _chosen_Tool_Light.position.x = (16 * (toolNum-1)) + 4;
    };
    var _chooseTile = function _chooseTile(type) {

        _chosen_TileObj_Light.position.x = 32 * type;
        _chosenTile = type;

        // saving tile properties here will complicate undo redo commands. Maybe later?
        switch (type) {
            case 0:
                _penTileTexture.texture = Land.asset.resources.blank.texture;
                break;
            case 1:
                _penTileTexture.texture = Land.asset.resources.block1.texture;
                break;
            case 2:
                _penTileTexture.texture = Land.asset.resources.block2.texture;
                break;
            case 3:
                _penTileTexture.texture = Land.asset.resources.block3.texture;
                break;
            case 4:
                _penTileTexture.texture = Land.asset.resources.block4.texture;
                break;
            case 5:
                _penTileTexture.texture = Land.asset.resources.block5.texture;
                break;
        }
    };
    var _chooseObj = function _chooseObj(type) {
        var offset = 0;

        switch (type) {
            case "player":
            _penTileTexture.texture = Land.asset.resources.actor_player.texture;
            offset = 0;
            break;
            case "enemy1":
            _penTileTexture.texture = Land.asset.resources.actor_enemy.texture;
            offset = 1;
            break;
        }
        
        _chosen_TileObj_Light.position.x = offset * 32;
        _chosenObj = type;
    };

    Land.Tool = function Tool (texture) {
        //this.altFunction = altFunction; // strings
        //this.ctrlFunction = ctrlFunction;
    };

    //Land.Tool.prototype.onIdle = function onDown() {
        //};
    Land.Tool.prototype.onDown = function onDown() {
    };
    Land.Tool.prototype.onUp = function onDown() {
    };
    Land.Tool.prototype.onMove = function onDown() {
    };


    var _objPen_tool = new Land.Tool();
    _objPen_tool.onDown = function (mouseTile, downEvent) {

        var coords = {};
        var id = Land.play.objContainer.children.length;

        if (_snapToGrid === true) {
            coords.x = mouseTile.x * 32;
            coords.y = mouseTile.y * 32;
        } else {
            coords = downEvent.data.getLocalPosition(Land.play.tilesContainer);
        }

        switch (_chosenObj) {
            case "enemy1":
                var newEntity = new Land.objs.Enemy1();
                newEntity.position = new PIXI.Point(coords.x, coords.y);

                newEntity.id = id;

                Land.map.objs[newEntity.name + "_" + id] = { x: newEntity.position.x, y: newEntity.position.y };
                Land.play.enemy1Container.addChild(newEntity);
                break;
            case "player":

                //Land.play.player.position = new PIXI.Point(coords.x, coords.y);
                break;

            default:
                return;
                break;
        }
        
    };
    _objPen_tool.onMove = function (mouseTile, moveEvent) {
        if (_controlKey.state.pressed) {
            _penTileTexture.visible = false;
            _chosen_Tool_Light.position.x = 36; // highlight eyedrop tool
        } else {
            if (_chosenLayer === "objs") {
                if (_snapToGrid === true) {
                    _penTileTexture.position = new PIXI.Point(mouseTile.x * 32, mouseTile.y * 32);
                } else {
                    var coords = moveEvent.data.getLocalPosition(Land.play.tilesContainer);
                    _penTileTexture.position = new PIXI.Point(coords.x, coords.y);
                }
            }
            if (_chosenLayer === "tiles") { //snap to grid
                _penTileTexture.position = new PIXI.Point(mouseTile.x * 32, mouseTile.y * 32);
            }
            
            
            _penTileTexture.visible = true;
            _chosen_Tool_Light.position.x = 4;
        }
    };

    var _objCursor_tool = new Land.Tool();
    _objCursor_tool.onDown = function (mouseTile, downEvent) {
        var mouseCoords = downEvent.data.getLocalPosition(Land.play.tilesContainer);
        var object;
        var inContainer;

        // We need to check the containers within the objContainer (such as enemy1Container).
        for (var i = 0; i < Land.play.objContainer.children.length; i++) {

            inContainer = Land.play.objContainer.children[i];
            // run that inContainer in our AABB checker
            object = getObjAtPos(mouseCoords, inContainer);

            if (object) {
                delete Land.map.objs[object.name + "_" + object.id];
                Land.play.objContainer.removeChild(object);
                this.onDown();
                return;
            }
        }

    };


    var _eyedrop_tool = new Land.Tool();
    _eyedrop_tool.onDown = function (mouseTile) {

        _chooseTile(Land.map.tileBoard[mouseTile.y][mouseTile.x].type);
    };
    _eyedrop_tool.onMove = function (mouseTile) {
        console.log("move")
        // we're left clicking
        if (Land.pixiMouse.originalEvent.buttons !== 1) {
            return;
        }
        _chooseTile(Land.map.tileBoard[mouseTile.y][mouseTile.x].type);
    };

    var _pen_tool = new Land.Tool();
    _pen_tool.onDown = function (mouseTile) {

        if (_controlKey.state.pressed) {
            _chooseTile(Land.map.tileBoard[mouseTile.y][mouseTile.x].type);
            return;
        }

        _colorCell(mouseTile.x, mouseTile.y, _chosenTile);
    };
    _pen_tool.onMove = function (mouseTile) {

        if (Land.mouse.hudMode === true) {
            return;
        }
        
        if (_controlKey.state.pressed) {
            _penTileTexture.visible = false;
            _chosen_Tool_Light.position.x = 36; // highlight eyedrop tool
        } else {
            _penTileTexture.position = new PIXI.Point(mouseTile.x * 32, mouseTile.y * 32);
            _penTileTexture.visible = true;
            _chosen_Tool_Light.position.x = 4;
        }

        // this point onward: we're left clicking
        if (Land.pixiMouse.originalEvent.buttons !== 1) {
            return;
        }
        if (_controlKey.state.pressed) {
            _chooseTile(Land.map.tileBoard[mouseTile.y][mouseTile.x].type);
            return;
        }

        _colorCell(mouseTile.x, mouseTile.y, _chosenTile);
    };


    var _bucket_tool = new Land.Tool();
    _bucket_tool.onDown = function (mouseTile) {

        _breadthCells(mouseTile.x, mouseTile.y, _chosenTile);
    };


    var _boxSelection_tool = new Land.Tool();
    _boxSelection_tool.onDown = function (mouseTile, clickEvent) {

        _boxSelect.startClick = new PIXI.Point(clickEvent.data.global.x/2, clickEvent.data.global.y/2); // relative to screen
        _boxSelect.position = _boxSelect.startClick;
        // "Land.events.getMouseCoords" floors and divids by 32 so instead we will do this:
        _boxSelect.actualStartClick = clickEvent.data.getLocalPosition(Land.play.tilesContainer);
        _boxSelect.leftClicked = true;
    };
    _boxSelection_tool.onMove = function (mouseTile, moveEvent) {

       // only when left clicking
        if (Land.pixiMouse.originalEvent.buttons !== 1) {
            return;
        }
        _boxSelect.width = (moveEvent.data.global.x / 2) - _boxSelect.startClick.x;
        _boxSelect.height = (moveEvent.data.global.y / 2) - _boxSelect.startClick.y;
    };
    _boxSelection_tool.onUp = function (mouseTile, upEvent) {

        _boxSelect.leftClicked = false; // free up leftClicked for the next upMouse event
        // if alt key is pressed
        if (_altKey.state.pressed) {

            var i, offsetCoords = {x: 0, y:0};

            // we convert to a temp string memory because that allows us to "copy" a selection and stamp it even on itself
            var tempMem = _selectionMem.split("-");
            for (i = 1; i < tempMem.length; i += 3) {

                // X = _selectionMem[i + 1], Y = _selectionMem[i + 2]
                // cheesy transform: x = x0 + X;
                offsetCoords.x = mouseTile.x + Number(tempMem[i + 1]);
                offsetCoords.y = mouseTile.y + Number(tempMem[i + 2]);
                _colorCell(offsetCoords.x, offsetCoords.y, tempMem[i])
            }
            return;
        }

        // if no function keys are pressed


        _selectionMem = "";
        _tilesSelected.clear();
        if (_boxSelect.width === 0 && _boxSelect.height === 0) {
            // if selection is empty box, Dont go furthor
            //_selectionMem = "";
            //_tilesSelected.clear();
            return;
        }

        
        // update hitbox
        var actualEndClick = upEvent.data.getLocalPosition(Land.play.tilesContainer); // uses floats. Land.events.getMouseCoords uses ints

        var minX = (_boxSelect.actualStartClick.x < actualEndClick.x) ? _boxSelect.actualStartClick.x : actualEndClick.x;
        var minY = (_boxSelect.actualStartClick.y < actualEndClick.y) ? _boxSelect.actualStartClick.y : actualEndClick.y;

        var maxX = (_boxSelect.actualStartClick.x > actualEndClick.x) ? _boxSelect.actualStartClick.x : actualEndClick.x;
        var maxY = (_boxSelect.actualStartClick.y > actualEndClick.y) ? _boxSelect.actualStartClick.y : actualEndClick.y;

        var tile, x, y, origin = {x: Math.floor(minX / 32), y: Math.floor(minY / 32)};
        for (y = 0; y < Land.map.tileBoard.length; y++) {
            for (x = 0; x < Land.map.tileBoard[0].length; x++) {
                tile = Land.map.tileBoard[y][x];

                //if box selection overlaps any of the tiles
               if (tile.position.x < maxX
                && (tile.position.x + tile.width) > minX
                && tile.position.y < maxY
                && (tile.position.y + tile.height) > minY) {

                    _tilesSelected.beginFill(0x00d2ff, 0.7);
                    _tilesSelected.drawRect(tile.position.x, tile.position.y, tile.width, tile.height);
                    _tilesSelected.endFill();
                    _selectionMem = _selectionMem.concat("-", tile.type, "-", tile.gridCoords.x - origin.x, "-", tile.gridCoords.y - origin.y);
                }
            }
        }

        _boxSelect.width = 0;   // remove graphical selection box
        _boxSelect.height = 0;
    };



    var _downMouse_cell = function _downMouse_cell(clickEvent) {

        // make sure its left mouse button
        if (Land.pixiMouse.originalEvent.buttons !== 1) {
            return;
        }
        var mouseCoords = Land.events.getMouseCoords(clickEvent, Land.play.tilesContainer);

        if (_chosenLayer === "tiles") {
            _currentTileTool.onDown(mouseCoords, clickEvent);
        }

        if (_chosenLayer === "objs") {
            _currentObjTool.onDown(mouseCoords, clickEvent);
        }
    };


    var _moveMouse_cell = function _moveMouse_cell(moveEvent) {

        var mouseCoords = Land.events.getMouseCoords(moveEvent, Land.play.tilesContainer);

        if (_chosenLayer === "tiles") {
            _currentTileTool.onMove(mouseCoords, moveEvent);
        }

        if (_chosenLayer === "objs") {
            _currentObjTool.onMove(mouseCoords, moveEvent);
        }
    };

    var _upMouse_cell = function _upMouse_cell(upEvent) {

        // upmouse could have been initiated by middle clicking, cant be detected with events, so we save a variable to our boxSelect object
        if (_boxSelect.leftClicked === false) {
            return;
        }
        var mouseCoords = Land.events.getMouseCoords(upEvent, Land.play.tilesContainer);

        if (_chosenLayer === "tiles") {
            _currentTileTool.onUp(mouseCoords, upEvent);
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


    var getObjAtPos = function getObjAtPos (coords, container) {
        var i, obj;

        for (i = 0; i < container.children.length; i++) {
            obj = container.children[i];

            if (obj.x < coords.x && obj.y < coords.y
                && (obj.x + obj.width) > coords.x && (obj.y + obj.height) > coords.y) {
                return obj;
            }
        }
    };
    var switch_MapEditText = function switch_MapEditText() {

        if (typeof(_mainHUD) === "undefined") {
            Land.editor.init();
        }

        if (Land.options.inputMode === "mapEdit") {

            Land.options.inputMode = "move";

            Land.renderer.view.style.cursor = "inherit";

            Land.play.tilesContainer
                .off("mousedown", _downMouse_cell)
                .off("mousemove", _moveMouse_cell)
                .off("mouseup", _upMouse_cell);

            window.focus();
            document.body.removeEventListener("keydown", _keyDownEvent, false); // modified from Land.keyboard
            document.body.removeEventListener("keyup", _keyUpEvent, false);

            for (var i = 0; i < Land.stateUpdate.length; i++) {
                if (Land.stateUpdate[i].name === "updateEditorKeys") {
                    Land.stateUpdate.splice(i, 1);
                }
            }
            _hudVisible(false);
        } 
        else if (Land.options.inputMode !== "mapEdit") {

            Land.options.inputMode = "mapEdit";

            Land.renderer.view.style.cursor = "crosshair";

            Land.play.tilesContainer
                .on("mousedown", _downMouse_cell)
                .on("mousemove", _moveMouse_cell)
                .on("mouseup", _upMouse_cell);
            window.focus();
            document.body.addEventListener("keydown", _keyDownEvent, false); // modified from Land.keyboard
            document.body.addEventListener("keyup", _keyUpEvent, false);

            Land.stateUpdate.push(updateEditorKeys);

            _hudVisible(true);
        }
    };

    var _hudVisible = function _hudVisible(show) {
        if (show === true) {
            _fileInput.style.display = ""; // show
            _widthInput.style.display = "";
            _heightInput.style.display = "";
            _mainHUD.visible = true;
            _greenLines.visible = true;
            _penTileTexture.visible = true;
        } else {
            _fileInput.style.display = "none";
            _widthInput.style.display = "none";
            _heightInput.style.display = "none";
            _mainHUD.visible = false;
            _greenLines.visible = false;
            _penTileTexture.visible = false;
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
                _colorCell(tempAction[i+1], tempAction[i+2], tempAction[i], "undo");
            }
            _rememberIn("redo");

            _undoMem.pop();
        } else if (command === "redo") {
            if (_redoMem.length === 0) {
                return;
            }
            var i, tempAction = _redoMem[_redoMem.length - 1].split("-"); // split the last string in _redoMem array

            for (i = 1; i < tempAction.length; i += 3) {

                _colorCell(tempAction[i+1], tempAction[i+2], tempAction[i], "redo");
            }
            _rememberIn("undo");

            _redoMem.pop();
        }
    };

    var _breadthCells = function _breadthCells(startX, startY, type) {
        
        var i, currentTile, startQueue = [], neighbors, typeToFill = Land.map.tileBoard[startY][startX].type;

        if (type === typeToFill) {
            return;
        }
        _colorCell(startX, startY, type);

        startQueue.push(Land.map.tileBoard[startY][startX]);

        while (startQueue.length) {

            currentTile = startQueue.shift();

            neighbors = _getNeighbors(currentTile.gridCoords.x, currentTile.gridCoords.y);

            for (i = 0; i < neighbors.length; i++) {
                //neighbor = neighbors[i];

                // if any of this tile's neighbors share the same type as the type we're trying to fill. color them and check their neighbors.
                if (neighbors[i].type === typeToFill) {

                    _colorCell(neighbors[i].gridCoords.x, neighbors[i].gridCoords.y, type);
                    startQueue.push(neighbors[i]);
                }
            }
        }
    };

    var _getNeighbors = function _getNeighbors(x, y) {
        
        var neighbors = [];

        // west
        if (Land.map.tileBoard[y] && Land.map.tileBoard[y][x-1]) {
            neighbors.push(Land.map.tileBoard[y][x-1]);
        }
        // north
        if (Land.map.tileBoard[y-1] && Land.map.tileBoard[y-1][x]) {
            neighbors.push(Land.map.tileBoard[y-1][x]);
        }
        // east
        if (Land.map.tileBoard[y] && Land.map.tileBoard[y][x+1]) {
            neighbors.push(Land.map.tileBoard[y][x+1]);
        }
        // south
        if (Land.map.tileBoard[y+1] && Land.map.tileBoard[y+1][x]) {
            neighbors.push(Land.map.tileBoard[y+1][x]);
        }

        return neighbors;
    };

    var _colorCell = function _colorCell(x, y, type, command) {
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

    var _exportMapJSON = function _exportMapJSON() {
        
        var x, y, mapData = [];

        for (y = 0; y < Land.map.tileBoard.length; y++) {
            mapData[y] = [];
            for (x = 0; x < Land.map.tileBoard[y].length; x++) {
                mapData[y] += Land.map.tileBoard[y][x].type; 
            }
        }

        var map = JSON.stringify(mapData);
        var objs = JSON.stringify(Land.map.objs);

        var mapBlob = new Blob(['{'
            + '\r\n"map":' + map + ','
            + '\r\n"objs":' + objs + '\r\n}'], {type: "application/json"});
        saveAs(mapBlob, "map1.json");
    };
    // needs to be public
    var importFileJSON = function importFileJSON(files) {

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

    return {
        init: init,
        updateEditorKeys: updateEditorKeys,
        switch_MapEditText: switch_MapEditText,
        importFileJSON: importFileJSON,

        getObjAtPos: getObjAtPos
    };
}());