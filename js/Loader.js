/*
    Percent text
    tips (
        use fullscreen
        use a browser that doesnt suck, we reccomend latest Chrome or Firefox*

        * current versions as of "6-10-2015" are Chrome v45
    )
*/

var gameLoader = (function() {
    "use strict";
    function isCanvasSupported() {
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    }

    Land.init();

    var _initiateGame = function _initiateGame() {
        Land.stage.removeChild(_progressBar);
        Land.stage.removeChild(_startButton);
        Land.mouse.hudMode = false; // reset back to false
        
        Land.play.init();
    }

    var _progressBar = new PIXI.Graphics();
    _progressBar.beginFill(0xcc0000, 1);
    _progressBar.drawRect(0, 500, 30, 26);
    _progressBar.endFill();

    var _startButton = new Land.Button(_initiateGame, {texture: PIXI.Texture.fromImage("assets/hud/option_start.png"), width: 80, height: 20});
    _startButton.scale.set(2, 2);
    _startButton.position = new PIXI.Point(480 - _startButton.width/2, 400);
    _startButton.visible = false;


    Land.stage.addChild(_progressBar);
    Land.stage.addChild(_startButton);

    var _assetsLoaded = function _assetsLoaded() {
        _progressBar.width = 960;

        Land.menu.init();

        _startButton.visible = true;
    };

    Land.asset = PIXI.loader
        .add('visitor', 'assets/fonts/visitor.fnt')
        .add('home', 'assets/fonts/home.fnt')
        .add('setback', 'assets/fonts/setback.fnt')

        .add("blank", "assets/tiles/blank.png")
        .add("block1", "assets/tiles/block1.png")
        .add("block2", "assets/tiles/block2.png")
        .add("block3", "assets/tiles/block3.png")
        .add("block4", "assets/tiles/block4.png")
        .add("block5", "assets/tiles/block5.png")


        .add("box_yellow", "assets/fx/boxYellow.png")
        .add("box_red", "assets/fx/boxRed.png")
        .add("outline_green", "assets/fx/outlineGreen.png")
        .add("outline_red", "assets/fx/outlineRed.png")
        .add("attackTarget", "assets/hud/attackTarget.png")

        .add("actor_player", "assets/actors/player.png")
        .add("actor_enemy", "assets/actors/enemy.png")
        .add("object_bullet", "assets/bullet.png")

        .add("option_cog", "assets/hud/option_cog.png")
        .add("option_esc", "assets/hud/option_esc.png")
        .add("defaultButton", "assets/hud/defaultButton.png")

        .add("ed_toolLight", "assets/hud/ed_toolLight.png")
        .add("ed_pen", "assets/hud/ed_pen.png")
        .add("ed_bucket", "assets/hud/ed_bucket.png")
        .add("ed_eyedrop", "assets/hud/ed_eyedrop.png")
        .add("ed_selection", "assets/hud/ed_selection.png")
        .add("ed_cursor", "assets/hud/ed_cursor.png")
        .add("ed_snapToGrid", "assets/hud/ed_snapToGrid.png")

        .add("ed_tilesButton", "assets/hud/ed_tilesButton.png")
        .add("ed_objsButton", "assets/hud/ed_objsButton.png")
        .add("ed_triggersButton", "assets/hud/ed_triggersButton.png")

        // snd1
        .add("explosion", "assets/snd/explosion.wav")
        .add("shotgun-fire", "assets/snd/shotgun-fire.wav")
        .add("gatling-gun", "assets/snd/104401__kantouth__gatling-gun.mp3")

        .load(_assetsLoaded)

        .on("progress", function (loader) {
            _progressBar.width = ((loader.progress) / 100) * 960;
        });
        
}());