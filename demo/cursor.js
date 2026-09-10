(() => {
  const id = "demoCursor";
  if (document.getElementById(id)) return;
  function boot() {
    if (document.getElementById(id)) return;
    const el = document.createElement("div");
    el.id = id;
    el.style.cssText =
      "position:fixed;z-index:2147483647;pointer-events:none;width:20px;height:20px;" +
      "border:2px solid rgba(255,255,255,0.95);border-radius:50%;" +
      "box-shadow:0 0 0 1px rgba(0,0,0,0.45),0 0 8px rgba(0,0,0,0.55);" +
      "transform:translate(-50%,-50%);transition:left 0.13s ease-out,top 0.13s ease-out;" +
      "display:none;";
    const dot = document.createElement("div");
    dot.style.cssText =
      "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);" +
      "width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.95);";
    el.appendChild(dot);
    (document.documentElement || document.body || document).appendChild(el);
    window.addEventListener("mousemove", (e) => {
      el.style.display = "block";
      el.style.left = e.clientX + "px";
      el.style.top = e.clientY + "px";
    });
    window.addEventListener(
      "mousedown",
      () => {
        el.style.transform = "translate(-50%,-50%) scale(0.72)";
      },
      true
    );
    window.addEventListener(
      "mouseup",
      () => {
        el.style.transform = "translate(-50%,-50%) scale(1)";
      },
      true
    );
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();