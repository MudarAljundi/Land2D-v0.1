Land.keyboard = (function() { // new Key(keyCode, mozilla key),
    "use strict";

    var justErase = [];

    function Key (keyCode, key) {
        
        this.keyCode = keyCode;
        this.key = key;

        this.state = {
            pressed: false,
            released: true,
            justPressed: false,
            justReleased: false
        };
    }
    Key.prototype.refreshState = function refreshState(current) {
        if (current === "pressed") {
            Land.keyboard.justErase.push(this.state);
            this.state.pressed = true;
            this.state.released = false;
        }
        if (current === "released") {
            Land.keyboard.justErase.push(this.state);
            this.state.pressed = false;
            this.state.released = true;
        }
    };

    var cameraLeft = new Key(65, ["KeyA"]);
    var cameraUp = new Key(87, ["KeyW"]);
    var cameraRight = new Key(68, ["KeyD"]);
    var cameraDown = new Key(83, ["KeyS"]);

    var moveLeft = new Key(37, ["ArrowLeft", "Left"]);
    var moveUp = new Key(38, ["ArrowUp", "Up"]);
    var moveRight = new Key(39, ["ArrowRight", "Right"]);
    var moveDown = new Key(40, ["ArrowDown", "Down"]);
    
    var attack = new Key(88, ["KeyX"]);
    var switchToMapEdit = new Key(192, ["DOM_VK_BACK_QUOTE"]);

    var callMenu = new Key(27, ["Esc", "Escape"]);


    var _keyStack = [
        moveLeft, moveUp, moveRight, moveDown,
        cameraLeft, cameraUp, cameraRight, cameraDown,

        attack,
        callMenu, switchToMapEdit
    ];

    /*
        Cant pass keyStack as a paramater because bind creates bad limitations because fuck javascript. So I split the key handling to 2 phases:
        1.keyDownEvent and 2.HandleKeyDown
        same for up: 1.keyUpEvent 2.handleKeyUp

        Following two functions are called by listeners.
    */
    var keyDownEvent = function keyDownEvent(event) {
        var key;

        if (event.keyCode || event.which) {
            key = event.keyCode || event.which;
        // else: for modern browsers that don't accept event.keyCode we use event.key
        } else {
            key = event.key;
        }

        handleKeyDown(_keyStack, key, event, true);
    };
    var keyUpEvent = function keyUpEvent(event) {
        var key;

        if (event.keyCode || event.which) {
            key = event.keyCode || event.which;
        // else: for modern browsers that don't accept event.keyCode we use event.key
        } else {
            key = event.key;
        }

        handleKeyUp(_keyStack, key, event);
    };

    /*
        Following two functions handle the "logic" of the keypress. Comparing them to provided lists
    */
    var handleKeyDown = function handleKeyDown(list, input, event, preventDefault) {
        var i;
        for (i = 0; i < list.length; i++) {

            if (typeof(input) === "number") {

                if (input === list[i].keyCode) {
                    if (preventDefault === true) {
                        event.preventDefault();
                    }
                    
                    if (!list[i].state.pressed) {
                        list[i].state.justPressed = true;
                        // justPressed will reset at the end of the update loop
                        // we shouldn't reset it in list[i].keyIsPressed() because that update wont catch it
                    }
                    list[i].refreshState("pressed");
                    break;
                }
            } else {
                for (i = 0; i < list.length; i++) {
                    for (var n = 0; n < list[i].key.length; n++) {
                        if (input === list[i].key[n]) {
                            if (preventDefault === true) {
                                event.preventDefault();
                            }
                            if (!list[i].state.pressed) {
                                list[i].state.justPressed = true;
                                // justPressed will reset at the end of the update loop
                                // we shouldn't reset it in list[i].keyIsPressed() because that update wont catch it
                            }
                            list[i].refreshState("pressed");
                            break;
                        }
                    }
                }
            }
        }
    };
    var handleKeyUp = function handleKeyUp(list, input, event) {
        var i;
        for (i = 0; i < list.length; i++) {

            if (typeof(input) === "number") {

                if (input === list[i].keyCode) {
                    if (!list[i].state.released) {
                        list[i].state.justReleased = true;
                        // justPressed will reset at the end of the update loop
                        // we shouldn't reset it in list[i].keyIsPressed() because that update wont catch it
                    }
                    list[i].refreshState("released");
                    break;
                }
            } else {
                for (i = 0; i < list.length; i++) {
                    for (var n = 0; n < list[i].key.length; n++) {
                        if (input === list[i].key[n]) {
                            if (!list[i].state.released) {
                                list[i].state.justReleased = true;
                                // justPressed will reset at the end of the update loop
                                // we shouldn't reset it in list[i].keyIsPressed() because that update wont catch it
                            }
                            list[i].refreshState("released");
                            break;
                        }
                    }
                }
            }
        }
    };


    /*
        keyFunction examples:
        Land.keyboard.cameraLeft - Land.keyboard.callMenu - Land.keyboard.moveLeft - etc, see above
    */
    var bindKey = function bindKey(event, keyFunction) {
        var key, i;
        if (event.keyCode || event.which) {
            key = event.keyCode || event.which;

            keyFunction.keyCode = key;
        // else: for modern browsers that don't accept event.keyCode we use event.key
        } else {
            key = event.key;
            keyFunction.key[0] = key;
        }
    }

    return {
        Key: Key,
        keyDownEvent: keyDownEvent,
        keyUpEvent: keyUpEvent,
        handleKeyDown: handleKeyDown,
        handleKeyUp: handleKeyUp,

        bindKey: bindKey,

        justErase: justErase,
        
        cameraLeft: cameraLeft,
        cameraUp: cameraUp,
        cameraRight: cameraRight,
        cameraDown: cameraDown,

        moveLeft: moveLeft,
        moveUp: moveUp,
        moveRight: moveRight,
        moveDown: moveDown,

        attack: attack,
        callMenu: callMenu,
        switchToMapEdit: switchToMapEdit
    };
}());