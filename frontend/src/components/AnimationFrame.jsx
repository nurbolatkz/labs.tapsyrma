import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

// Hosts an animation page in an iframe. The animation only draws; it reports
// stage-start / stage-end and answers capture requests via postMessage
// (see public/animations/bridge.js for the other side of the protocol).
const AnimationFrame = forwardRef(function AnimationFrame({ src, title, onMessage }, ref) {
  const frame = useRef(null);
  const pending = useRef(new Map());
  const handler = useRef(onMessage);
  handler.current = onMessage;

  const send = useCallback((message) => {
    frame.current?.contentWindow?.postMessage({ jasusha: 1, ...message }, window.location.origin);
  }, []);

  useEffect(() => {
    function listen(event) {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      const data = event.data;
      if (!data || data.jasusha !== 1) return;
      if (data.type === "capture" && pending.current.has(data.id)) {
        pending.current.get(data.id)(data.image || "");
        pending.current.delete(data.id);
        return;
      }
      handler.current?.(data);
    }
    window.addEventListener("message", listen);
    return () => window.removeEventListener("message", listen);
  }, []);

  useImperativeHandle(ref, () => ({
    send,
    capture() {
      const id = Math.random().toString(36).slice(2);
      return new Promise((resolve) => {
        pending.current.set(id, resolve);
        send({ type: "capture", id });
        setTimeout(() => {
          if (pending.current.has(id)) {
            pending.current.delete(id);
            resolve("");
          }
        }, 3000);
      });
    },
  }), [send]);

  return (
    <div className="anim-frame">
      <iframe ref={frame} src={src} title={title} loading="eager" />
    </div>
  );
});

export default AnimationFrame;
