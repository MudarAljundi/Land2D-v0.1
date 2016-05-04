var landEditor = (function(my) {

    my.eyedrop_tool = new my.Tool();
    my.eyedrop_tool.idle = function idle(funcKey1) {

        // if pressing control key
        if (funcKey1.state.justReleased) {
            my.chooseTool(1);
        }
    };
    my.eyedrop_tool.onDown = function onDown(mouseTile) {

        my.chooseTile(Land.map.tileBoard[mouseTile.y][mouseTile.x].type);
    };
    my.eyedrop_tool.onMove = function onMove(mouseTile) {

        // we're left clicking
        if (Land.pixiMouse.originalEvent.buttons !== 1) {
            return;
        }
        my.chooseTile(Land.map.tileBoard[mouseTile.y][mouseTile.x].type);
    };

    my.pen_tool = new my.Tool();
    my.pen_tool.idle = function idle(funcKey1) {

        // if pressing control key
        if (funcKey1.state.justPressed) {
            my.chooseTool(3);
        }
    };
    my.pen_tool.onDown = function onDown(mouseTile, clickEvent, funcKey1) {

        // if on any clickable hud button
        if (Land.mouse.hudMode === true) {
            return;
        }

        my.colorCell(mouseTile.x, mouseTile.y, my.chosenTile);
    };
    my.pen_tool.onMove = function onMove(mouseTile, clickEvent, funcKey1) {

        // if on any clickable hud button
        if (Land.mouse.hudMode === true) {
            return;
        }
        
        // this point onward: we're left clicking
        if (Land.pixiMouse.originalEvent.buttons !== 1) {
            return;
        }

        my.colorCell(mouseTile.x, mouseTile.y, my.chosenTile);
    };


    my.bucket_tool = new my.Tool();
    my.bucket_tool.onDown = function onDown(mouseTile) {

        _recursiveFill(mouseTile, my.chosenTile);
    };
    /*
        adapted from one-directional, breadth first search
        "targetTileType" is the type of the first tile we clicked, which is the kind we're trying to replace
        "type" variable in the arguments is our chosen one from the options
        ...
        I know, this is confusing to me too
    */
    var _recursiveFill = function _recursiveFill(startPos, type) {

        var targetTileType = Land.map.tileBoard[startPos.y][startPos.x].type;

        // if our chosen type is the same the one we're trying to replace STOP
        if (type === targetTileType) {
            return;
        }

        var i, currentTile, startQueue = [], neighbors;

        my.colorCell(startPos.x, startPos.y, type);
        startQueue.push(Land.map.tileBoard[startPos.y][startPos.x]);

        while (startQueue.length) {

            currentTile = startQueue.shift();

            neighbors = _getNeighbors(currentTile.gridCoords.x, currentTile.gridCoords.y);

            for (i = 0; i < neighbors.length; i++) {

                // if any of this tile's neighbors share the same type as the one we're trying to fill.
                // color them and check their neighbors in the next recursion.
                if (neighbors[i].type === targetTileType) {

                    my.colorCell(neighbors[i].gridCoords.x, neighbors[i].gridCoords.y, type);
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


    my.boxSelection_tool = new my.Tool();
    my.boxSelection_tool.onDown = function onDown(mouseTile, clickEvent) {

        my.boxSelect.startClick = new PIXI.Point(clickEvent.data.global.x, clickEvent.data.global.y); // relative to screen
        my.boxSelect.position = my.boxSelect.startClick;
        // "Land.events.getMouseCoords" floors and divids by 32 so instead we will do this:
        my.boxSelect.actualStartClick = clickEvent.data.getLocalPosition(Land.play.tilesContainer);
        my.leftClicked = true;
    };
    my.boxSelection_tool.onMove = function onMove(mouseTile, moveEvent) {

       // only when left clicking
        if (Land.pixiMouse.originalEvent.buttons !== 1) {
            return;
        }
        my.boxSelect.width = moveEvent.data.global.x - my.boxSelect.startClick.x;
        my.boxSelect.height = moveEvent.data.global.y - my.boxSelect.startClick.y;
    };
    my.boxSelection_tool.onUp = function onUp(mouseTile, upEvent, funcKey2) {

        my.leftClicked = false; // free up leftClicked for the next upMouse event
        // if alt key is pressed
        if (funcKey2) {

            var i, offsetCoords = {x: 0, y:0};

            // we convert to a temp string memory because that allows us to "copy" a selection and stamp it even on itself
            var tempMem = my.selectionMem.split("-");
            for (i = 1; i < tempMem.length; i += 3) {

                // X = selectionMem[i + 1], Y = selectionMem[i + 2]
                // cheesy transform: x = x0 + X;
                offsetCoords.x = mouseTile.x + Number(tempMem[i + 1]);
                offsetCoords.y = mouseTile.y + Number(tempMem[i + 2]);
                my.colorCell(offsetCoords.x, offsetCoords.y, tempMem[i])
            }
            return;
        }

        // if no function keys are pressed


        my.selectionMem = "";
        my.elementsSelectedBox.clear();
        if (my.boxSelect.width === 0 && my.boxSelect.height === 0) {
            // if selection is empty box, Dont go further
            return;
        }

        
        // update hitbox
        var actualEndClick = upEvent.data.getLocalPosition(Land.play.tilesContainer); // uses floats. Land.events.getMouseCoords uses ints

        var minX = (my.boxSelect.actualStartClick.x < actualEndClick.x) ? my.boxSelect.actualStartClick.x : actualEndClick.x;
        var minY = (my.boxSelect.actualStartClick.y < actualEndClick.y) ? my.boxSelect.actualStartClick.y : actualEndClick.y;

        var maxX = (my.boxSelect.actualStartClick.x > actualEndClick.x) ? my.boxSelect.actualStartClick.x : actualEndClick.x;
        var maxY = (my.boxSelect.actualStartClick.y > actualEndClick.y) ? my.boxSelect.actualStartClick.y : actualEndClick.y;

        var tile, x, y, origin = {x: Math.floor(minX / 32), y: Math.floor(minY / 32)};
        for (y = 0; y < Land.map.tileBoard.length; y++) {
            for (x = 0; x < Land.map.tileBoard[0].length; x++) {
                tile = Land.map.tileBoard[y][x];

                //if box selection overlaps any of the tiles
               if (tile.position.x < maxX
                && (tile.position.x + tile.width) > minX
                && tile.position.y < maxY
                && (tile.position.y + tile.height) > minY) {

                    my.elementsSelectedBox.beginFill(0x00d2ff, 0.7);
                    my.elementsSelectedBox.drawRect(tile.position.x, tile.position.y, tile.width, tile.height);
                    my.elementsSelectedBox.endFill();

                    my.selectionMem = my.selectionMem.concat("-", tile.type, "-", tile.gridCoords.x - origin.x, "-", tile.gridCoords.y - origin.y);
                }
            }
        }

        my.boxSelect.width = 0;   // remove graphical selection box
        my.boxSelect.height = 0;
    };

    return my;
}(landEditor || {}));