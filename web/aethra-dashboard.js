(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }

  function money(n) { return "GBP " + (Number(n || 0).toFixed(2)); }

  async function fetchJson(url, opts) {
    const r = await fetch(url, opts || {});
    return r.json();
  }

  async function refresh() {
    try {
      const venturesResp = await fetchJson("/core/ventures");
      const metricsResp = await fetchJson("/core/metrics");
      const revPerf = await fetchJson("/core/revenue/metrics");
      const today = await fetchJson("/core/revenue/today");
      const net = await fetchJson("/core/network/intelligence");
      const ventures = Array.isArray(venturesResp.ventures) ? venturesResp.ventures.slice().reverse() : [];

      $("metric-total").textContent = String(metricsResp.launched || 0);
      $("metric-active").textContent = String(metricsResp.active || 0);
      $("metric-killed").textContent = String(metricsResp.killed || 0);
      $("metric-revenue").textContent = money(metricsResp.totalRevenue || 0);

      if ($("rev-leads-day")) $("rev-leads-day").textContent = String(revPerf.leads_per_day || 0);
      if ($("rev-messages-day")) $("rev-messages-day").textContent = String(revPerf.messages_sent || 0);
      if ($("rev-reply-rate")) $("rev-reply-rate").textContent = String(revPerf.reply_rate || 0) + "%";
      if ($("rev-conv-rate")) $("rev-conv-rate").textContent = String(revPerf.conversion_rate || 0) + "%";
      if ($("rev-revenue-day")) $("rev-revenue-day").textContent = money(revPerf.revenue_per_day || 0);

      if ($("exp-launched")) $("exp-launched").textContent = String(today.ventures_launched_today || 0);
      if ($("exp-revenue")) $("exp-revenue").textContent = money(today.revenue_generated_today_gbp || 0);
      if ($("exp-running")) $("exp-running").textContent = String(today.experiments_running || 0);

      $("system-status").textContent = "Execution is continuous. System is adapting.";
      if ($("net-ventures")) $("net-ventures").textContent = String((net.totals && net.totals.ventures_across_users) || 0);
      if ($("net-revenue")) $("net-revenue").textContent = money((net.totals && net.totals.aggregated_revenue) || 0);
      if ($("net-strategies")) {
        const top = Array.isArray(net.top_performing_strategies) ? net.top_performing_strategies.length : 0;
        $("net-strategies").textContent = String(top);
      }
      if ($("net-learning")) {
        $("net-learning").textContent = String(
          (net.live_system_learning && net.live_system_learning.graph_nodes) || 0
        );
      }
      if ($("trustorigin-hash")) {
        const links = net.trustorigin && Array.isArray(net.trustorigin.proof_links) ? net.trustorigin.proof_links : [];
        const latest = links.length ? links[links.length - 1] : null;
        $("trustorigin-hash").textContent = latest
          ? "Latest verification hash: " + String(latest.hash || "").slice(0, 18)
          : "No verification receipts yet.";
      }
      if ($("trustorigin-links")) {
        const links = net.trustorigin && Array.isArray(net.trustorigin.proof_links) ? net.trustorigin.proof_links : [];
        $("trustorigin-links").innerHTML = links.length
          ? links.map(function (item) {
              return "<div><a class='nav' href='" + String(item.proof_link || "#") + "' target='_blank' rel='noreferrer'>"
                + String(item.receipt_id || "TrustOrigin proof") + "</a></div>";
            }).join("")
          : "<div style='color:#6b7280'>No proof links generated yet.</div>";
      }

      var rows = ventures.map(function (v) {
        return "<tr>" +
          "<td>" + String(v.id || "-") + "</td>" +
          "<td>" + String(v.idea || v.niche || "-") + "</td>" +
          "<td>" + money(v.revenue || 0) + "</td>" +
          "<td>" + String(v.status || "-") + "</td>" +
          "</tr>";
      }).join("");
      $("ventures-body").innerHTML = rows || "<tr><td colspan='4'>No ventures yet</td></tr>";
      if ($("trust-venture-id") && ventures.length > 0) {
        $("trust-venture-id").value = String(ventures[0].id || "");
      }
    } catch (e) {
      $("system-status").textContent = "Core API unavailable";
    }
  }

  async function createVenture() {
    var seed = ($("seed-input").value || "local B2B diagnostic").trim();
    await fetchJson("/core/create-venture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seed: seed, concurrency: 1 })
    });
    await refresh();
  }

  window.AethraCoreDashboard = { refresh: refresh, createVenture: createVenture };
  window.addEventListener("load", function () {
    var btn = $("create-venture-btn");
    if (btn) btn.addEventListener("click", createVenture);
    var sampleBtn = $("sample-btn");
    if (sampleBtn) {
      sampleBtn.addEventListener("click", async function () {
        var email = ($("sample-email") && $("sample-email").value || "").trim();
        await fetchJson("/core/sample-dossier", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email, idea: "AETHRA sample" }),
        });
        alert("Sample dossier generated — check API response or TrustOrigin link in console network tab.");
      });
    }
    var trustBtn = $("trust-receipt-btn");
    if (trustBtn) {
      trustBtn.addEventListener("click", async function () {
        var ventureId = (($("trust-venture-id") && $("trust-venture-id").value) || "").trim();
        if (!ventureId) {
          alert("Enter a venture id first.");
          return;
        }
        var out = await fetchJson("/core/trustorigin/receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ venture_id: ventureId }),
        });
        if (out && out.receipt && out.receipt.public_verification_endpoint) {
          alert("TrustOrigin receipt created: " + String(out.receipt.receipt_id || ""));
          await refresh();
        }
      });
    }
    refresh();
    setInterval(refresh, 20000);
  });
})();