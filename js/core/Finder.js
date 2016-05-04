Land.finder = (function() {
	"use strict";

	var highlightPool = new Land.Pool();

	/*
		Create 40 member pool of pathfinding highlights
		Called on the Game state initialization.
	*/
	var createYellowBoxes = function createYellowBoxes() {
    	
		var i, highlight_path;
		for (i = 0; i < 40; i++) {
			highlight_path = new PIXI.Sprite(Land.asset.resources.box_yellow.texture);
			highlight_path.PushInPool(this.highlightPool);
			this.highlightPool.addChild(highlight_path);
		}
	}

	/*
		Used when an inpassible tile is chosen (clicked).
		Breadth first search is too expensive. Here's something cheaper for this situation
		(Produces similar results to breadth. I'm not gonna include diagonals.)
	*/
	var findNearbyPassable = function findNearbyPassable(startX, startY) {
    	var x, y;

    	// y = 1 because you shouldn't start from the current coordnations. we already know its false
    	// loops twice.
    	for (y = 1; y < 3; y++) {
    		for (x = 1; x < 3; x++) {
    			if (Land.map.tileBoard[startY + y] && Land.map.tileBoard[startY + y][startX]) {
    				if (Land.map.tileBoard[startY + y][startX].passable) {
	    				return Land.map.tileBoard[startY + y][startX];
	    			}
    			}
    			
    			if (Land.map.tileBoard[startY - y] && Land.map.tileBoard[startY - y][startX]) {
    				if (Land.map.tileBoard[startY - y][startX].passable) {
	    				return Land.map.tileBoard[startY - y][startX];
	    			}
    			}

    			if (Land.map.tileBoard[startY] && Land.map.tileBoard[startY][startX + x]) {
    				if (Land.map.tileBoard[startY][startX + x].passable) {
	    				return Land.map.tileBoard[startY][startX + x];
	    			}
    			}
    			
    			if (Land.map.tileBoard[startY] && Land.map.tileBoard[startY][startX - x]) {
    				if (Land.map.tileBoard[startY][startX - x].passable) {
	    				return Land.map.tileBoard[startY][startX - x];
	    			}
    			}
    		}
    	}
	};

	var _unvisitGrid = function _unvisitGrid() {
    	
		var x, y, tile;
		
		for (y = 0; y < Land.map.tileBoard.length; y++) {
			for (x = 0; x < Land.map.tileBoard[0].length; x++) {
				tile = Land.map.tileBoard[y][x];
				tile.visitedBy = 0;
				tile.pathParent = null;
			}
		}
	};
	var _BIcontstructPath = function _BIcontstructPath(tile1, tile2) {
		
		var i, path1 = [], path2 = [];

		while (tile1.pathParent !== null) {

			path1.push(tile1);
			tile1 = tile1.pathParent;
		}
		while (tile2 !== null) {

			path2.push(tile2);
			tile2 = tile2.pathParent;
		}

		_unvisitGrid();
		return path1.reverse().concat(path2);
	};
	/*
		BiDerectional Breath First Search
		Cheesy brute-force search immersing from both start and end nodes.
		A solution is found on first contact betweent start search and end search
		O(n^(k/2)) where n is the number of nodes, k is the number of edges (neighbors) of each node
	*/
	var breadthSearch = function breadthSearch(startX, startY, endX, endY) {
    	
		var i, currentTile, startQueue = [], endQueue = [], neighbors, neighbor;
		
		if (startX === endX && startY === endY) {
			return [];
		}

		Land.map.tileBoard[startY][startX].pathParent = null;
		Land.map.tileBoard[endY][endX].pathParent = null;

		startQueue.push(Land.map.tileBoard[startY][startX]);
		endQueue.push(Land.map.tileBoard[endY][endX]);

		while (startQueue.length && endQueue.length) {
			// START QUEUE
			currentTile = startQueue.shift();

			currentTile.visitedBy = 1;

			neighbors = _getNeighbors(currentTile.gridCoords.x, currentTile.gridCoords.y);

			for (i = 0; i < neighbors.length; i++) {
				neighbor = neighbors[i];

				if (neighbor.passable && (neighbor.visitedBy !== 1)) {

					if (neighbor.visitedBy === 2) {
						return _BIcontstructPath(currentTile, neighbor);
					}

					neighbor.visitedBy = 1;
					neighbor.pathParent = currentTile;
					startQueue.push(neighbor);
				}
			}

			// END QUEUE
			currentTile = endQueue.shift();
			currentTile.visitedBy = 2;

			neighbors = _getNeighbors(currentTile.gridCoords.x, currentTile.gridCoords.y);

			for (i = 0; i < neighbors.length; i++) {
				neighbor = neighbors[i];

				if (neighbor.passable && (neighbor.visitedBy !== 2)) {

					if (neighbor.visitedBy === 1) {
						return _BIcontstructPath(neighbor, currentTile);
					}

					neighbor.visitedBy = 2;
					neighbor.pathParent = currentTile;
					endQueue.push(neighbor);
				}
			}
		}

        _unvisitGrid();
		return []; // No paths found
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
		/*	The rest are diagonal! (Outdated code)
		// northWest
		if (Land.map.tileBoard[y-1] && Land.map.tileBoard[y-1][x-1]) {
			if (Land.map.tileBoard[y-1][x-1].passable) {
				neighbors.push(Land.map.tileBoard[y-1][x-1]);
			}
			
		}
		// northEast
		if (Land.map.tileBoard[y-1] && Land.map.tileBoard[y-1][x+1]) {

			if (Land.map.tileBoard[y-1][x+1].passable) {
				neighbors.push(Land.map.tileBoard[y-1][x+1]);
			}
		}
		// southEast
		if (Land.map.tileBoard[y+1] && Land.map.tileBoard[y+1][x+1]) {

			if (Land.map.tileBoard[y+1][x+1].passable) {
				neighbors.push(Land.map.tileBoard[y+1][x+1]);
			}
		}
		// southWest
		if (Land.map.tileBoard[y+1] && Land.map.tileBoard[y+1][x-1]) {

			if (Land.map.tileBoard[y+1][x-1].passable) {
				neighbors.push(Land.map.tileBoard[y+1][x-1]);
			}
		}
		*/
		return neighbors;
	};

	return {
		breadthSearch: breadthSearch, 
		createYellowBoxes: createYellowBoxes, 
		findNearbyPassable: findNearbyPassable,
		
		highlightPool: highlightPool
	};
}());