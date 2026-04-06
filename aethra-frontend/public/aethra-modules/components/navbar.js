(function () {
  var nav = document.getElementById("navbar");
  if (!nav) return;

  var path = (window.location.pathname || "/").toLowerCase();
  function active(href) {
    if (href === "/") return path === "/" || path === "";
    return path === href || path === href + "/";
  }

  nav.className = "navbar";
  nav.innerHTML =
    '<div class="navbar-inner">' +
      '<a class="brand" href="/">AETHRA</a>' +
      '<div class="nav-items">' +
        '<a href="/"' + (active("/") ? ' aria-current="page"' : "") + '>Home</a>' +
        '<a href="/ideas"' + (active("/ideas") ? ' aria-current="page"' : "") + '>Ideas</a>' +
        '<a href="/business"' + (active("/business") ? ' aria-current="page"' : "") + '>Business</a>' +
        '<a href="/portfolio"' + (active("/portfolio") ? ' aria-current="page"' : "") + '>Portfolio</a>' +
      '</div>' +
      '<span id="stateDot" class="state-dot">SCANNING</span>' +
    '</div>';

  var states = ["SCANNING", "DEPLOYING", "ANALYSING"];
  var idx = 0;
  var dot = document.getElementById("stateDot");
  if (!dot) return;
  window.setInterval(function () {
    idx = (idx + 1) % states.length;
    dot.textContent = states[idx];
  }, 5200);
})();
