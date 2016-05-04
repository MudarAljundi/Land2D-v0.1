Land.objs.Player = function Player() {

    PIXI.Sprite.call(this, Land.asset.resources.actor_player.texture);
    this.path = [];
    this.name = "player";
    this.id = 0;
};
Land.objs.Player.prototype = PIXI.Sprite.prototype;


Land.objs.Player.prototype.goTo = function (cellx, celly) {
    "use strict";
    var path;

    if (!Land.map.tileBoard[celly] || !Land.map.tileBoard[celly][cellx]
    || !Land.map.tileBoard[celly][cellx].passable) {
        return;
    }

    if (this.path.length) {
        this.clearPath();
    }
    
    this.path = Land.finder.breadthSearch(this.position.x / 32, this.position.y / 32, cellx, celly);
    if (this.path.length) {
        // stupidest hack eva!
        // on one node long paths (smallest), the second position is the position where we started due to bi directional finding... 
        
        if (this.path[1].position === this.position) {
            this.path.splice(1, 1); // ... so we remove the second node.
        }

        this._highlightPath(this.path);
    }
};

Land.objs.Player.prototype.nextTile = function (tile) {
    "use strict";
    Land.play.newTurn();

    this.path.splice(0, 1);
    this.position = tile.position;

    if (tile.highlightObject) {
        tile.highlightObject.PushInPool(Land.finder.highlightPool)
        tile.highlightObject = null;
    }
};

Land.objs.Player.prototype.clearPath = function () {
    "use strict";
    var i, path = this.path;

    for (i = 0; i < path.length; i++) {
        path[i].highlightObject.PushInPool(Land.finder.highlightPool)
        path[i].highlightObject = null;
    }

    this.path = [];
};

// Pretend privite :O
Land.objs.Player.prototype._highlightPath = function (path) {
    "use strict";
    var i, currentHighlight;

    for (i = path.length - 1; i >= 0; i--) {   // starting at length so we can delete start highlights if they're a lot
        currentHighlight = Land.finder.highlightPool.getFirstInPool();

        if (currentHighlight) {
            currentHighlight.position = path[i].position;
            path[i].highlightObject = currentHighlight;    // refrence for deletion
        }
    }
};