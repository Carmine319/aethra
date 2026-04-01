(function () {
  var nav = document.getElementById("navbar");
  if (!nav) return;

  var path = (window.location.pathname || "/").toLowerCase();
  function active(href) {
    if (href === "/index.html" || href === "/") return path === "/" || path === "/index.html";
    return path === href;
  }

  nav.className = "navbar";
  nav.innerHTML =
    '<div class="navbar-inner">' +
      '<a class="brand" href="/index.html">AETHRA</a>' +
      '<div class="nav-items">' +
        '<a href="/index.html"' + (active("/index.html") ? ' aria-current="page"' : "") + '>Home</a>' +
        '<a href="/ideas.html"' + (active("/ideas.html") ? ' aria-current="page"' : "") + '>Ideas</a>' +
        '<a href="/business.html"' + (active("/business.html") ? ' aria-current="page"' : "") + '>Business</a>' +
        '<a href="/portfolio.html"' + (active("/portfolio.html") ? ' aria-current="page"' : "") + '>Portfolio</a>' +
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
