(function () {
  "use strict";
  var selectedCycleIndex = -1;

  function $(id) { return document.getElementById(id); }
  function gbp(n) { return "GBP " + Number(n || 0).toFixed(2); }
  function stamp() { return new Date().toLocaleTimeString(); }

  async function fetchJson(url, opts) {
    const res = await fetch(url, opts || {});
    const data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || ("HTTP " + res.status));
    return data;
  }

  function paintDashboard(d) {
    const out = d.output || {};
    const p = d.portfolio_totals || {};
    const cap = d.capital_snapshot || {};
    const intel = d.intelligence || {};
    const scaling = intel.scaling_decision || {};
    const feedback = intel.feedback_learning || {};
    const signal = Array.isArray(intel.signal_snapshot) && intel.signal_snapshot.length ? intel.signal_snapshot[0] : null;

    $("loop-running").textContent = d.loop && d.loop.running ? "RUNNING" : "STOPPED";
    $("selected-idea").textContent = out.selected_idea || "-";
    $("execution-status").textContent = out.execution_status || "-";
    $("profit-generated").textContent = gbp(out.profit_generated || 0);

    $("p-active").textContent = String(p.active || 0);
    $("p-scaled").textContent = String(p.scaled || 0);
    $("p-killed").textContent = String(p.killed || 0);
    $("capital-balance").textContent = cap && cap.wallet ? gbp(cap.wallet.available_gbp) : "-";
    $("deployment-type").textContent = intel.deployment_type || "-";
    $("scaling-action").textContent = scaling.action || "-";
    $("best-channel").textContent = feedback.bestChannel || "-";
    $("top-signal").textContent = signal ? String(signal.name || "-") : "-";
    $("last-updated").textContent = "Updated " + stamp();
    $("api-log").textContent = JSON.stringify(d, null, 2);
    const cycles = d && d.trends && Array.isArray(d.trends.recent_cycles) ? d.trends.recent_cycles : [];
    paintSparklines(cycles);
    $("trend-log").textContent = JSON.stringify(cycles, null, 2);
  }

  function toBars(values, minHeight, maxHeight) {
    const nums = Array.isArray(values) ? values.map(function (x) { return Number(x || 0); }) : [];
    const max = nums.length ? Math.max.apply(null, nums) : 1;
    const safeMax = max > 0 ? max : 1;
    return nums.map(function (n) {
      const ratio = n <= 0 ? 0 : n / safeMax;
      return Math.round(minHeight + ratio * (maxHeight - minHeight));
    });
  }

  function renderBars(id, heights, classPicker, titlePicker, onClick) {
    const el = $(id);
    if (!el) return;
    el.innerHTML = "";
    heights.forEach(function (h, i) {
      const bar = document.createElement("div");
      bar.className = "sparkline-bar " + classPicker(i);
      bar.style.height = String(h) + "px";
      bar.title = titlePicker ? String(titlePicker(i) || "") : "";
      if (selectedCycleIndex === i) bar.className += " active";
      if (onClick) {
        bar.style.cursor = "pointer";
        bar.addEventListener("click", function () { onClick(i); });
      }
      el.appendChild(bar);
    });
  }

  function paintSparklines(cycles) {
    const rows = Array.isArray(cycles) ? cycles.slice(-10) : [];
    const profitBars = toBars(rows.map(function (x) { return Number(x.profit || 0); }), 2, 34);
    const convBars = toBars(rows.map(function (x) { return Number(x.conversionRate || 0) * 100; }), 2, 34);
    const scalingHeights = rows.map(function () { return 28; });
    renderBars(
      "spark-profit",
      profitBars,
      function () { return "bar-profit"; },
      function (i) {
        const r = rows[i] || {};
        return "Cycle " + (i + 1) + " | Profit: " + Number(r.profit || 0).toFixed(2);
      },
      function (idx) {
        selectedCycleIndex = idx;
        paintSparklines(rows);
      }
    );
    renderBars(
      "spark-conversion",
      convBars,
      function () { return "bar-conversion"; },
      function (i) {
        const r = rows[i] || {};
        return "Cycle " + (i + 1) + " | Conversion: " + (Number(r.conversionRate || 0) * 100).toFixed(2) + "%";
      },
      function (idx) {
        selectedCycleIndex = idx;
        paintSparklines(rows);
      }
    );
    renderBars("spark-scaling", scalingHeights, function (i) {
      const action = String((rows[i] && rows[i].scalingAction) || "");
      if (action === "scale") return "bar-scaling-scale";
      if (action === "reduce_or_kill") return "bar-scaling-kill";
      return "bar-scaling-hold";
    }, function (i) {
      const r = rows[i] || {};
      return "Cycle " + (i + 1) + " | Scaling: " + String(r.scalingAction || "hold_and_optimize");
    }, function (idx) {
      selectedCycleIndex = idx;
      paintSparklines(rows);
    });
    if (selectedCycleIndex < 0 || selectedCycleIndex >= rows.length) selectedCycleIndex = rows.length - 1;
    const selected = rows[selectedCycleIndex] || {};
    $("selected-cycle-log").textContent = JSON.stringify(selected, null, 2);
  }

  async function loadDashboard() {
    const data = await fetchJson("/api/v1/aethra/dashboard");
    paintDashboard(data);
  }

  async function postJson(url, body) {
    const data = await fetchJson(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });
    $("api-log").textContent = JSON.stringify(data, null, 2);
    await loadDashboard();
  }

  async function runOnce() {
    const capital = Number(($("capital-input").value || 300));
    const seed = String(($("seed-input").value || "capital mode live run")).trim();
    await postJson("/api/v1/aethra/run/once", { capital: capital, seed: seed });
  }

  window.addEventListener("load", function () {
    $("start-loop").addEventListener("click", function () {
      void postJson("/api/v1/aethra/run/continuous/start", {});
    });
    $("stop-loop").addEventListener("click", function () {
      void postJson("/api/v1/aethra/run/continuous/stop", {});
    });
    $("refresh").addEventListener("click", function () {
      void loadDashboard();
    });
    $("run-once").addEventListener("click", function () {
      void runOnce();
    });
    void loadDashboard();
    setInterval(loadDashboard, 10000);
  });
})();
