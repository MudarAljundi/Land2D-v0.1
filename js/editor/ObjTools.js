var landEditor = (function(my) {

	my.objPen_tool = new my.Tool();
    my.objPen_tool.onDown = function onDown(mouseTile, downEvent) {

        var coords = {};
        var id = Land.play.objContainer.children.length;

        if (my.snapToGrid === true) {
            coords.x = mouseTile.x * 32;
            coords.y = mouseTile.y * 32;
        } else {
            coords = downEvent.data.getLocalPosition(Land.play.tilesContainer);
        }

        switch (my.chosenObj) {
            case "enemy1":
                var newEntity = new Land.objs.Enemy1();
                newEntity.position = new PIXI.Point(coords.x, coords.y);

                newEntity.id = id;

                //Land.map.objs[newEntity.name + "_" + id] = { x: newEntity.position.x, y: newEntity.position.y };
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
    my.objPen_tool.idle = function idle(funcKey1) {
        // if pressing control key
        if (funcKey1.state.justPressed) {
            my.chooseTool(3);
        }
    }
    my.objPen_tool.onMove = function onMove(mouseTile, moveEvent, funcKey1) {

        if (my.snapToGrid === true) {
            my.penTileTxture.position = new PIXI.Point(mouseTile.x * 32, mouseTile.y * 32);
        } else {
            var coords = moveEvent.data.getLocalPosition(Land.play.tilesContainer);
            my.penTileTxture.position = new PIXI.Point(coords.x, coords.y);
        }
    };

    my.objCursor_tool = new my.Tool();
    my.objCursor_tool.onDown = function onDown(mouseTile, downEvent) {

        var mouseCoords = downEvent.data.getLocalPosition(Land.play.tilesContainer);
        var object;
        var inContainer;

        // We need to check the containers within the objContainer (such as enemy1Container).
        for (var i = 0; i < Land.play.objContainer.children.length; i++) {

            inContainer = Land.play.objContainer.children[i];
            // run that inContainer in our AABB checker
            object = _getObjAtPos(mouseCoords, inContainer);

            if (object) {
                //delete Land.map.objs[object.name + "_" + object.id];
                Land.play.objContainer.removeChild(object);
                this.onDown(mouseTile, downEvent);  // recurse
                return;
            }
        }
    };
    var _getObjAtPos = function _getObjAtPos(coords, container) {
        var i, obj;

        for (i = 0; i < container.children.length; i++) {
            obj = container.children[i];

            if (obj.x < coords.x && obj.y < coords.y
                && (obj.x + obj.width) > coords.x && (obj.y + obj.height) > coords.y) {
                return obj;
            }
        }
    };


    /////////////////
    /*
	    place holder tool. should use aabb to select new obj

    */
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

    return my;
}(landEditor || {}));