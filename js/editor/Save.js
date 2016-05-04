Land.editor.save = (function() {

    var fileInput = document.createElement("INPUT");
    var widthInput = document.createElement("INPUT");
    var heightInput = document.createElement("INPUT");

    var init = function init() {

    };
    //Land.editor.save
	var saveMap = function saveMap() {

        // update object positions in map data
        for (var object in Land.map.objs) {
            if (object === "player") {
                Land.map.objs[object].x = Land.objs.player.position.x / 32;
                Land.map.objs[object].y = Land.objs.player.position.y / 32;
            }
        }
        
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
    var handleFiles = function handleFiles(files) {

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
		saveMap: saveMap,
        handleFiles: handleFiles
	};
}());
