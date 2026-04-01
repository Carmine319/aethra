function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pickScore(dec) {
  if (!dec || typeof dec !== "object") return "-";
  if (dec.score != null && dec.score !== "") return String(dec.score);
  var sc = dec.scores;
  if (sc && typeof sc === "object" && sc.viability_0_100 != null) {
    return String(sc.viability_0_100);
  }
  return "-";
}

function pickConfidence(dec) {
  if (!dec || typeof dec !== "object") return "-";
  if (dec.confidence_0_100 != null && dec.confidence_0_100 !== "") {
    return String(dec.confidence_0_100) + "%";
  }
  if (dec.confidence != null && dec.confidence !== "") return String(dec.confidence);
  return "-";
}

function pickInsight(data) {
  var dec = data && data.decision;
  if (dec && dec.executive_summary) return dec.executive_summary;
  if (data && data.strategy && data.strategy.narrative) return data.strategy.narrative;
  return "Market signals analysed.";
}

function pickNextStep(data) {
  var ex = data && data.execution;
  var nba = ex && Array.isArray(ex.next_best_actions) ? ex.next_best_actions[0] : null;
  return nba || "Refine idea.";
}

function verdictUi(raw) {
  var v = String(raw || "unknown").toLowerCase();
  var css = v === "advance" ? "build" : v === "kill" ? "kill" : "hold";
  var line =
    v === "kill"
      ? "This path does not lead to profit."
      : v === "advance"
        ? "This is viable."
        : "Not proven yet — validate before major spend.";
  return { css: css, line: line, label: String(raw || "UNKNOWN").toUpperCase() };
}

function render(data) {
  var elOut = document.getElementById("output");
  if (!elOut) return;

  var dec = data && data.decision;
  var ui = verdictUi(dec && dec.verdict);

  elOut.innerHTML =
    '<div class="block fade">' +
    '<div class="decision ' +
    escapeHtml(ui.css) +
    '">' +
    escapeHtml(ui.line) +
    "</div>" +
    "<p><strong>Confidence:</strong> " +
    escapeHtml(pickConfidence(dec)) +
    "</p>" +
    "<p><strong>Score:</strong> " +
    escapeHtml(pickScore(dec)) +
    "</p>" +
    "</div>" +
    '<div class="block fade">' +
    "<h3>AETHRA Insight</h3>" +
    "<p>" +
    escapeHtml(pickInsight(data)) +
    "</p>" +
    "</div>" +
    '<div class="block fade">' +
    "<h3>AETHRA Command</h3>" +
    "<p>" +
    escapeHtml(pickNextStep(data)) +
    "</p>" +
    "</div>";
}

async function run() {
  var ideaEl = document.getElementById("idea");
  var idea = ideaEl && ideaEl.value ? String(ideaEl.value).trim() : "";
  var status = document.getElementById("status");
  var runBtn = document.getElementById("runBtn");
  var out = document.getElementById("output");

  if (status) {
    status.textContent = "";
    status.className = "status";
  }

  if (!idea) {
    if (status) {
      status.textContent = "Enter an idea or URL.";
      status.classList.add("err");
    }
    return;
  }

  if (runBtn) runBtn.disabled = true;
  if (out) {
    out.innerHTML =
      '<div class="block fade"><p class="placeholder">AETHRA thinking…</p></div>';
  }

  try {
    var res = await fetch("/run", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ input: idea }),
    });
    var text = await res.text();
    var data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      if (out) {
        out.innerHTML =
          '<div class="block fade"><pre class="text-fallback">' +
          escapeHtml(text || "(empty)") +
          "</pre></div>";
      }
      if (status) {
        status.textContent = "HTTP " + res.status + " · non-JSON";
        status.classList.add("err");
      }
      if (runBtn) runBtn.disabled = false;
      return;
    }

    if (data && data.ok === false && data.error) {
      if (out) {
        out.innerHTML =
          '<div class="block fade"><p class="placeholder">' +
          escapeHtml(String(data.error)) +
          "</p></div>";
      }
      if (status) {
        status.textContent = "Error";
        status.classList.add("err");
      }
    } else {
      render(data);
      if (status) {
        if (res.ok) {
          status.textContent = "OK · " + res.status;
          status.classList.add("ok");
        } else {
          status.textContent = "HTTP " + res.status;
          status.classList.add("err");
        }
      }
    }
  } catch (e) {
    if (out) {
      out.innerHTML =
        '<div class="block fade"><p class="placeholder">' +
        escapeHtml(e.message || String(e)) +
        "</p></div>";
    }
    if (status) {
      status.textContent = "Request failed";
      status.classList.add("err");
    }
  }

  if (runBtn) runBtn.disabled = false;
}
