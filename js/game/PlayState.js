Land.play = (function() {
    "use strict";

    var tilesContainer = new PIXI.Container(),
        objContainer = new PIXI.Container(),
        enemy1Container = new PIXI.Container(),
        mainHUD = new PIXI.Container(),
        camera = new PIXI.Container();

    var player;

    var text_controls;
    var _text_version

    var _move_Highlight, _attack_Highlight;

    var _walkTimer = 0;

    // can be called from editor
    var createMap = function createMap(map, positions) {
        var x, y, tile;

        Land.map.bounds.right = map[0].length * 32;
        Land.map.bounds.bottom = map.length * 32;

        if (tilesContainer.children) {
            tilesContainer.children.length = 0;
        }

        for (y = 0; y < map.length; y++) {
            Land.map.tileBoard[y] = [];

            for (x = 0; x < map[0].length; x++) {

                if (map[y][x] === "0") {
                    tile = new PIXI.Sprite(Land.asset.resources.blank.texture);
                    Land.map.tileBoard[y][x] = tile;
                    tile.passable = true;
                }
                if (map[y][x] === "1") {
                    tile = new PIXI.Sprite(Land.asset.resources.block1.texture);
                    Land.map.tileBoard[y][x] = tile;
                    tile.passable = true;
                }
                if (map[y][x] === "2") {
                    tile = new PIXI.Sprite(Land.asset.resources.block2.texture);
                    Land.map.tileBoard[y][x] = tile;
                    tile.passable = true;
                }
                if (map[y][x] === "3") {
                    tile = new PIXI.Sprite(Land.asset.resources.block3.texture);
                    Land.map.tileBoard[y][x] = tile;
                    tile.passable = true;
                }
                if (map[y][x] === "4") {
                    tile = new PIXI.Sprite(Land.asset.resources.block4.texture);
                    Land.map.tileBoard[y][x] = tile;
                    tile.passable = false;
                }
                if (map[y][x] === "5") {
                    tile = new PIXI.Sprite(Land.asset.resources.block5.texture);
                    Land.map.tileBoard[y][x] = tile;
                    tile.passable = false;
                }

                tile.type = Number(map[y][x]);
                tile.visitedBy = 0; // For pathfinding
                tile.position = new PIXI.Point(x * 32, y * 32); // Pixel cordnations.
                tile.gridCoords = { x: x, y: y };  // gridCoords(2, 0) is position{y:64, x:0}, helper for pathfinding

                tilesContainer.addChild(tile);
            }
        }

        for (var object in positions) {
            if (positions.hasOwnProperty(object)) {

                if (object.indexOf("player") >= 0) {
                    Land.play.player = new Land.objs.Player();
                    Land.play.player.position = new PIXI.Point(positions[object].x, positions[object].y);
                    camera.position = new PIXI.Point(-positions[object].x + 250, -positions[object].y + 150);}
                
                if (object.indexOf("enemy1") >= 0) {
                    var newEntity;
                    newEntity = new Land.objs.Enemy1();
                    newEntity.position = new PIXI.Point(positions[object].x, positions[object].y);
                    newEntity.id = enemy1Container.children.length;

                    enemy1Container.addChild(newEntity);
                }
            }
        }

        _startScene();
    };

    var _importEmbededJSON = function _importEmbededJSON(mapURL) {
        
        var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open("GET", mapURL + "?" + new Date().getTime(), true);
        xobj.onreadystatechange = function () {
            if (xobj.readyState === 4 && xobj.status === 200) {

                var scene = JSON.parse(xobj.responseText);

                //Land.map.data = scene.map;
                createMap(scene.map, scene.objs);
            }
                
        }
        xobj.send(null);
    };
    var _startScene = function _startScene() {
        // Adding Objects
        mainHUD.addChild(_text_version);
        mainHUD.addChild(Land.play.text_controls);

        camera.addChild(tilesContainer);
        objContainer.addChild(enemy1Container);
        objContainer.addChild(Land.play.player);
        camera.addChild(objContainer);
        camera.addChild(Land.objs.bulletPool);
        camera.addChild(_move_Highlight);
        camera.addChild(_attack_Highlight);
        camera.addChild(Land.finder.highlightPool);

        // Adding main Containers to stage
        Land.stage.addChildAt(mainHUD, 0);
        Land.stage.addChildAt(camera, 0);

        Land.stateUpdate.push(Land.play.update);

    };

    var init = function init() {

        _importEmbededJSON("assets/maps/map1.json");

        camera.scale.set(2, 2);
        mainHUD.scale.set(2, 2);
        camera.speed = 0;

        Land.objs.createBulletPool();

        Land.finder.createYellowBoxes(); // pathfinding highlight objects
        _move_Highlight = new PIXI.Sprite(Land.asset.resources.outline_green.texture); // mouse on cell highlight objects
        _attack_Highlight = new PIXI.Sprite(Land.asset.resources.attackTarget.texture);

        if (typeof(window.onwheel) !== "undefined") {
            window.addEventListener("wheel", _on_mouseWheel);
        } else if (typeof(window.onmousewheel) !== "undefined") {
            window.addEventListener("mousewheel", _on_mouseWheel);
        }

        tilesContainer.interactive = true;
        tilesContainer
            .on("mouseup", _upMouse_cell).on("mouseupoutside", _upMouse_cell)
            .on("mousemove", _moveMouse_cell);

            //.on("mousemove", Land.moveMouse_cell)//.on("mouseout", Land.upMouse_cell);
            //.on("touchstart", Land.downMouse_cell).on("touchend", Land.upMouse_cell)
            //.on("touchmove", Land.moveMouse_cell).on("touchend", Land.upMouse_cell);

    // ack alphaBeta home kalib setback visitor
        _text_version = new PIXI.extras.BitmapText("Land2D demo "+ Land.version +"\nmantis1.newgrounds.com", {font: "12px visitor",  align: "right"});
        _text_version.position = new PIXI.Point(355, 4);

        Land.play.text_controls = new PIXI.extras.BitmapText("WASD - Pan camera \nPress ` for map edit \nArrow keys - Walk", {font: "12px home", tint: "0x000000"});
        Land.play.text_controls.position = new PIXI.Point(5, 80);
    };

    var dragCamera = function dragCamera() {
        var dragged = {
                x: Land.pixiMouse.global.x,
                y: Land.pixiMouse.global.y
            };

            var delta = {
                x: dragged.x - Land.mouse.clickPos.x,
                y: dragged.y - Land.mouse.clickPos.y
            };

            
            if (Land.mouse.beenDragged === true) {
                Land.mouse.clickPos.x = dragged.x;
                camera.position.x += delta.x * 0.5;

                Land.mouse.clickPos.y = dragged.y;
                camera.position.y += delta.y * 0.5;
            } else {
                // allow some threshold for normal clicks if wasn't panning yet.
                if (delta.x > 2 || delta.x < -2) {
                    Land.mouse.clickPos.x = dragged.x;
                    camera.position.x += delta.x * 0.5;    // * 0.5 because we double the game scale

                    Land.mouse.beenDragged = true;
                }
                if (delta.y > 2 || delta.y < -2) {
                    Land.mouse.clickPos.y = dragged.y;
                    camera.position.y += delta.y * 0.5;

                    Land.mouse.beenDragged = true;
                }
            }
    };

    var _enemiesPlaying = function _enemiesPlaying() {

        var i;

        for (i = 0; i < enemy1Container.children.length; i++) {

            if (enemy1Container.children[i].turnState === "playing") {
                return true;
            }
        }
        return false;
    };
    var newTurn = function newTurn() {
        var i;

        for (i = 0; i < enemy1Container.children.length; i++) {
            
            enemy1Container.children[i].playTurn();
        }
    };

    var update = function update() {
        // for functions that work 'every other frame'
        //_otherFrame = !_otherFrame;

        // attack mode
        if (Land.keyboard.attack.state.justPressed) {

            if (Land.options.inputState === "move") {
                if (Land.play.player.path.length) {  // Stop moving
                    Land.play.player.clearPath();
                }

                Land.options.inputState = "attack";
            }
            else if (Land.options.inputState === "attack") {
                Land.options.inputState = "move";
            }
        }

        // Land.play.player keyboard movement
        if (Land.options.inputState === "move") {
            if (Land.keyboard.moveUp.state.pressed) {
                var coords = {
                    x: (Land.play.player.position.x / 32),
                    y: (Land.play.player.position.y / 32) - 1
                }

                Land.play.player.goTo(coords.x, coords.y);
            }
            if (Land.keyboard.moveDown.state.pressed) {
                var coords = {
                    x: (Land.play.player.position.x / 32),
                    y: (Land.play.player.position.y / 32) + 1
                }
                Land.play.player.goTo(coords.x, coords.y);
            }
            if (Land.keyboard.moveRight.state.pressed) {
                var coords = {
                    x: (Land.play.player.position.x / 32) + 1,
                    y: (Land.play.player.position.y / 32)
                }

                Land.play.player.goTo(coords.x, coords.y);
            }
            if (Land.keyboard.moveLeft.state.pressed) {
                var coords = {
                    x: (Land.play.player.position.x / 32) - 1,
                    y: (Land.play.player.position.y / 32)
                }

                Land.play.player.goTo(coords.x, coords.y);
            }
        }

        // listen for clicks in general
        if (Land.pixiMouse.originalEvent.buttons !== 0 && Land.mouse.anyDown === false) {
            
            Land.mouse.anyDown = true; // To emulate mouse button holding
            Land.mouse.clickPos = new PIXI.Point(Land.pixiMouse.global.x, Land.pixiMouse.global.y);
        }
        if (Land.pixiMouse.originalEvent.buttons === 0) {
            Land.mouse.anyDown = false;
        }
        
        else if (Land.mouse.anyDown === true && Land.options.inputState !== "mapEdit") {
            dragCamera();
        }

        // keyboard camera panning
        if (Land.keyboard.cameraDown.state.pressed) {
            camera.position.y -= 150 * Land.timeStep;
            
            if (Land.options.panning_tutorial) {
                Land.options.panning_tutorial = false;
                Land.events.remove_controlsText();
            }
        }
        if (Land.keyboard.cameraUp.state.pressed) {
            camera.position.y += 150 * Land.timeStep;
        }
        if (Land.keyboard.cameraLeft.state.pressed) {
            camera.position.x += 150 * Land.timeStep;
        }
        if (Land.keyboard.cameraRight.state.pressed) {
            camera.position.x -= 150 * Land.timeStep;
        }

        // Bound camera to walls, must be called AFTER panning
        if (camera.position.y >= 0) {
            camera.position.y = 0;
        }
        if (camera.position.x >= 0) {
            camera.position.x = 0;
        }
        if (camera.position.y <= Land.screenHeight -Land.map.bounds.bottom * camera.scale.x) {
            camera.position.y = Land.screenHeight -Land.map.bounds.bottom * camera.scale.x;
        }
        if (camera.position.x <= Land.screenWidth -Land.map.bounds.right * camera.scale.x) {
            camera.position.x = Land.screenWidth -Land.map.bounds.right * camera.scale.x;
        }
        
        if (Land.keyboard.switchToMapEdit.state.justPressed) {
            landEditor.switch_MapEditText();
        }

        // check if next turn
        if (_enemiesPlaying() === true) {
            return;
        }

        if (Land.play.player.path.length) {
            if (_walkTimer <= 0 && Land.play.player.path[0]) {
                Land.play.player.nextTile(Land.play.player.path[0]);
                _walkTimer = 8;
            }
            _walkTimer -= 1;
        }
    };


    var _on_mouseWheel = function _on_mouseWheel(scrollEvent) {

        if (scrollEvent.x > 960 || scrollEvent.y > 640) {
            return;
        }
        if (scrollEvent.preventDefault) {
            scrollEvent.preventDefault();
        }

        if (scrollEvent.deltaY < 0) {
            if (camera.scale.x >= 3) {
                camera.scale.x = 3;
                camera.scale.y = 3;
                return;
            }
            camera.scale.x += 0.1;
            camera.scale.y += 0.1;

        } else if (scrollEvent.deltaY > 0) {
            if (camera.scale.x <= 1.5) {
                camera.scale.x = 1.5;
                camera.scale.y = 1.5;
                return;
            }
            camera.scale.x -= 0.1;
            camera.scale.y -= 0.1;

            //camera.position.x += ((camera.position.x + event.x) * 0.1);
            //camera.position.y += ((camera.position.y + event.y) * 0.1);
        }
    };

    // "mouseMove" is called in EVERY frame when the cursor moves on the object we're listening to. And on "mouseUp" for no reason
    // "mouseUp", "mouseDown" caled ONCE on the frame where we clicked on the object.
    // That's how it's specified in Pixi.js
    var _upMouse_cell = function _upMouse_cell(clickEvent) {

        if (Land.mouse.beenDragged) {
            Land.mouse.beenDragged = false;
            return; // this stops choosing a tile after dragging the camera
        }

        _selectCell(clickEvent);
    };
    var _moveMouse_cell = function _moveMouse_cell(clickEvent) {

        if (Land.mouse.hudMode === true || Land.options.paused === true) {   // hudMode is stuped! It's all because PIXI mousemove fires on mouseUp FOR NO REASON
            return;
        }
        var coords = Land.events.getMouseCoords(clickEvent, tilesContainer);
        _highlightTile(coords.x, coords.y);
    };

    var _selectCell = function _selectCell(clickEvent) {

        if (Land.options.paused === true) {
            return;
        }
        if (Land.play.player.path.length) {
            Land.play.player.clearPath();
            return;
        }

        var coords = Land.events.getMouseCoords(clickEvent, tilesContainer);

        switch (Land.options.inputState) {
            case "move":

                if (!Land.map.tileBoard[coords.y][coords.x].passable) {
                    var nearTile = Land.finder.findNearbyPassable(coords.x, coords.y);
                    if (nearTile) {
                        coords.x = nearTile.gridCoords.x;
                        coords.y = nearTile.gridCoords.y;
                    }
                }

                Land.play.player.goTo(coords.x, coords.y);
                break;

            case "attack":

                var angleToShoot = Math.atan2(coords.y *32 - Land.play.player.position.y, coords.x* 32 - Land.play.player.position.x);
                Land.objs.bulletPool.shoot(angleToShoot, Land.play.player);
                break;
        }
    };


    var _highlightTile = function _highlightTile(x, y) {

        if (Land.mouse.beenDragged) {
            _attack_Highlight.visible = false;
            _move_Highlight.visible = false;
            return;
        }
        _move_Highlight.visible = true;
        _attack_Highlight.visible = true;

        if (Land.map.tileBoard[y] && Land.map.tileBoard[y][x]) {

            if (Land.options.inputState === "attack") {
                _attack_Highlight.position = new PIXI.Point(x*32, y*32);
            } else {
                _attack_Highlight.visible = false;
            }


            _move_Highlight.position = new PIXI.Point(x*32, y*32);

            if (Land.map.tileBoard[y][x].passable) { // && (_move_Highlight.texture === Land.asset.resources.outline_red.texture)
                _move_Highlight.texture = Land.asset.resources.outline_green.texture;
            }
            else if (Land.map.tileBoard[y][x].passable === false) {
                _move_Highlight.texture = Land.asset.resources.outline_red.texture;
            }
        }
    };

    return {
        update: update,
        init: init,
        dragCamera: dragCamera,
        createMap: createMap,
        newTurn: newTurn,

        mainHUD: mainHUD,
        camera: camera,
        tilesContainer: tilesContainer,
        objContainer: objContainer,
        text_controls: text_controls,

        enemy1Container: enemy1Container,
        player: player
    };
}());