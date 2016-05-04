// Polyfill (archic): Used to support Shiternet Explorer 8
// bind - preventDefault() - requestAnimationFrame - window.setTimeout - global modules (browserfy) - fullscreen - removeEventListener - saveAs? - FileReader
// indexOf
// http://stackoverflow.com/questions/1181575/determine-whether-an-array-contains-a-value

window.performance = window.performance || {};

performance.now = performance.now || Date.now;

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new performance.now();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
}());

if(!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function(callback, element) {
        var currTime = performance.now();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
          timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    }());
};