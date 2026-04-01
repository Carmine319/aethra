(function () {
  var KEY = "aethra_age_confirmed_v1";

  function showGate() {
    var ov = document.getElementById("ageGateOverlay");
    if (ov) {
      ov.style.display = "flex";
      ov.style.alignItems = "center";
      ov.style.justifyContent = "center";
    }
    document.documentElement.classList.add("age-gate-open");
  }

  function hideGate() {
    var ov = document.getElementById("ageGateOverlay");
    if (ov) ov.style.display = "none";
    document.documentElement.classList.remove("age-gate-open");
  }

  function init() {
    try {
      if (localStorage.getItem(KEY) === "1") {
        hideGate();
        return;
      }
    } catch (e) {
      /* storage blocked */
    }
    showGate();
    var btn = document.getElementById("ageGateConfirm");
    if (btn) {
      btn.addEventListener("click", function () {
        try {
          localStorage.setItem(KEY, "1");
        } catch (e) {}
        hideGate();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
