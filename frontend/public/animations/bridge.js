// Animation side of the iframe protocol used by src/components/AnimationFrame.jsx.
// An animation calls JasushaBridge({ run, restore, options, capture }):
//   run(stage, params)        -> Promise, resolved when the stage animation has finished
//   restore(completed, params)   jump straight to the state after the completed stages
//   options(opts)                display options such as labels
//   capture()                 -> PNG data URL of the current frame
// The bridge reports "ready", "stage-start" and "stage-end" to the parent page.
(function () {
  "use strict";
  window.JasushaBridge = function (handlers) {
    var origin = window.location.origin;
    var busy = false;
    function post(message) {
      if (window.parent === window) return;
      message.jasusha = 1;
      window.parent.postMessage(message, origin);
    }
    window.addEventListener("message", function (event) {
      if (event.origin !== origin || event.source !== window.parent) return;
      var msg = event.data;
      if (!msg || msg.jasusha !== 1) return;
      if (msg.type === "run" && !busy) {
        busy = true;
        post({ type: "stage-start", stage: msg.stage });
        Promise.resolve(handlers.run(msg.stage, msg.params || {})).then(function (result) {
          busy = false;
          post({ type: "stage-end", stage: msg.stage, result: result || null });
        });
      } else if (msg.type === "restore" && handlers.restore) {
        handlers.restore(msg.completed || [], msg.params || {});
      } else if (msg.type === "options" && handlers.options) {
        handlers.options(msg.options || {});
      } else if (msg.type === "capture") {
        var image = "";
        try { image = handlers.capture ? handlers.capture() : ""; } catch (e) { image = ""; }
        post({ type: "capture", id: msg.id, image: image });
      }
    });
    post({ type: "ready" });
  };

  // Shared helpers for the animations.
  window.JasushaAnim = {
    reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    ease: function (t) { return t * t * (3 - 2 * t); },
    hash: function (n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); },
    // Resizes a canvas to its CSS box and returns a 2D context in CSS pixels.
    fit: function (canvas) {
      var r = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      var ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { ctx: ctx, w: r.width, h: r.height };
    },
    // Calls step(progress 0..1) every frame for `duration` ms, then resolves.
    tween: function (duration, step) {
      var self = this;
      if (self.reduced) duration = Math.min(duration, 600);
      return new Promise(function (resolve) {
        var start = performance.now();
        function frame(now) {
          var t = Math.min(1, (now - start) / duration);
          step(t);
          if (t < 1) requestAnimationFrame(frame); else resolve();
        }
        requestAnimationFrame(frame);
      });
    },
  };
})();
