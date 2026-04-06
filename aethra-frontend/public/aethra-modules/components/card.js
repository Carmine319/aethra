(function () {
  var cards = document.querySelectorAll(".card");
  if (!cards.length || !("IntersectionObserver" in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  cards.forEach(function (c) {
    c.classList.add("fade-in");
    io.observe(c);
  });
})();
