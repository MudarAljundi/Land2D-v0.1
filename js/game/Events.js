Land.events = (function() {
	"use strict";

	//tutorial
	var remove_controlsText = function remove_controlsText() {
		
		window.setTimeout(_complete_controlsText, 3000);
	};

	// Options

	var launchIntoFullscreen = function launchIntoFullscreen(element, scaleMode) {

		//Land.renderer.view.style.position = "absolute; top: 0px; left: 0px";
	    if (scaleMode === "stretch") {
			//Land.renderer.view.setAttribute("style", "position: fixed; top: 0px; left: 0px");

	        //Land.renderer.view.style.width = window.screen.width + "px";
	        //Land.renderer.view.style.height = window.screen.height + "px";
	        Land.renderer.view.style.width = "100%";
	        Land.renderer.view.style.height = "100%";
	    }
	    else if (scaleMode === "keepRatio") {
	        // var ratio = 3 / 2
	        // http://www.html5rocks.com/en/tutorials/casestudies/gopherwoord-studios-resizing-html5-games/
	    }
	    else if (scaleMode === "blackBar") {
	        Land.renderer.view.style.width = "960px";
	        Land.renderer.view.style.height = "640px";

	        Land.renderer.view.style.top = "50%";
	        Land.renderer.view.style.left = "50%";
	        Land.renderer.view.style.marginLeft = "-480px";
	        Land.renderer.view.style.marginTop = "-320px";
	    }

		if (!document.fullscreenElement &&
      		!document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {
 
			if (element.requestFullscreen) {
				element.requestFullscreen();
				document.addEventListener("fullscreenchange", _changeFullscreen, false);

			} else if (element.mozRequestFullScreen) {
			   element.mozRequestFullScreen();
			   document.addEventListener("mozfullscreenchange", _changeFullscreen, false);

			} else if (element.webkitRequestFullscreen) {
				element.webkitRequestFullscreen();
				document.addEventListener("webkitfullscreenchange", _changeFullscreen, false);

			} else if (element.msRequestFullscreen) {
				element.msRequestFullscreen();
				document.addEventListener("msfullscreenchange", _changeFullscreen, false);

			} else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
		        var wscript = new ActiveXObject("WScript.Shell");
		        if (wscript !== null) {
		            wscript.SendKeys("{F11}");
		        }
		    }
		} else {
			if (document.exitFullscreen) {
		      document.exitFullscreen();
		    } else if (document.msExitFullscreen) {
		      document.msExitFullscreen();
		    } else if (document.mozCancelFullScreen) {
		      document.mozCancelFullScreen();
		    } else if (document.webkitExitFullscreen) {
		      document.webkitExitFullscreen();
		    }
		}
	};

	//privates
	var _changeFullscreen = function _changeFullscreen(event) {
		/*
			((document.webkitIsFullScreen && document.webkitIsFullScreen === false)
		(document.fullscreenEnabled && document.fullscreenEnabled === false),
		(document.mozFullScreen && document.mozFullScreen === false),
		(document.msFullscreenElement && document.msFullscreenElement === false))
		*/

		if (document.fullscreenElement === null
     	|| document.webkitFullscreenElement === null
     	|| document.mozFullScreenElement === null
     	|| document.mozFullScreen === false
     	|| document.webkitIsFullScreen === false
     	|| (document.body.clientHeight == screen.height && document.body.clientWidth == screen.width)) {

	        Land.renderer.view.style.width = 960 + "px";
	        Land.renderer.view.style.height = 640 + "px";
	        Land.renderer.view.style.top = "0px";
	        Land.renderer.view.style.left = "0px";
	        Land.renderer.view.style.marginLeft = "0px";
	        Land.renderer.view.style.marginTop = "0px";

			document.removeEventListener("webkitfullscreenchange", _changeFullscreen, false);
			document.removeEventListener("msfullscreenchange", _changeFullscreen, false);
			document.removeEventListener("mozfullscreenchange", _changeFullscreen, false);
			document.removeEventListener("fullscreenchange", _changeFullscreen, false);
		}
		//Land.renderer.view.style.position = "fixed; top: 0px; left: 0px";
	};

    /*
        Helper function to get local coords in relation to the tileContainer.
        Returns grid coords (not pixel coords).
    */
    var getMouseCoords = function getMouseCoords(clickEvent, obj) {
        var mouseLocal = clickEvent.data.getLocalPosition(obj);
        var cell_x = Math.floor(mouseLocal.x / 32); // divide by 32
        var cell_y = Math.floor(mouseLocal.y / 32);

        return new PIXI.Point(cell_x, cell_y);
    };
	var _complete_controlsText = function _complete_controlsText() {
		
        Land.play.mainHUD.removeChild(Land.play.text_controls);
	};
	
	return {
		remove_controlsText: remove_controlsText,
		launchIntoFullscreen: launchIntoFullscreen,
		getMouseCoords: getMouseCoords
	};
}());