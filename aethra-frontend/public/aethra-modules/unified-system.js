(function () {
  var nodes = document.querySelectorAll(".reveal");
  if (!nodes.length || !("IntersectionObserver" in window)) return;

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
  );

  nodes.forEach(function (el) { io.observe(el); });
})();

(function () {
  var line = document.getElementById("organismStateLine");
  var tag = document.querySelector(".status-indicator");
  if (!line && !tag) return;

  var states = [
    "Scanning economic surface...",
    "Signal detected",
    "Interpreting context",
    "Deploying asset...",
    "Optimising performance..."
  ];

  var i = 0;
  function tick() {
    var txt = states[i % states.length];
    if (line) line.textContent = txt;
    if (tag && txt) tag.textContent = txt.replace("...", "");
    i += 1;
  }

  tick();
  window.setInterval(tick, 5500);
})();
