(function () {
  document.querySelectorAll("button").forEach(function (el) {
    if (!el.classList.contains("btn")) el.classList.add("btn");
    if (!el.classList.contains("btn-primary") && !el.classList.contains("btn-secondary")) {
      el.classList.add("btn-secondary");
    }
  });
})();
