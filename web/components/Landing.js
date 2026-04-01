import { track } from "../core/tracking.js";

export function initLanding() {
  track("page_loaded");
  (function () {
      function escapeHtml(s) {
        if (s == null) return "";
        return String(s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
      }

      function isObj(x) {
        return x && typeof x === "object" && !Array.isArray(x);
      }

      function humanize(s) {
        return String(s || "")
          .replace(/_/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      }

      function verdictKey(v) {
        var x = String(v || "").toLowerCase();
        if (x === "kill") return "kill";
        if (x === "advance") return "advance";
        return "hold";
      }

      function verdictHeadline(key) {
        if (key === "kill") {
          return "This direction is unlikely to produce meaningful profit under its current framing.";
        }
        if (key === "advance") {
          return "This direction clears the bar for disciplined deployment, provided execution remains bounded and evidence-led.";
        }
        return "The record is insufficient to commit capital; further validation is required before meaningful spend.";
      }

      function buildExplanation(dec, strat) {
        var parts = [];
        if (dec.executive_summary) parts.push(String(dec.executive_summary).trim());
        if (strat && strat.narrative) {
          var n = String(strat.narrative).trim();
          if (n && (!dec.executive_summary || dec.executive_summary.indexOf(n.slice(0, 40)) === -1)) {
            parts.push(n);
          }
        }
        if (strat && strat.predictive_engine && strat.predictive_engine.summary) {
          var p = String(strat.predictive_engine.summary).trim();
          if (p) parts.push(p);
        }
        if (!parts.length) {
          return "The engine completed its pass; narrative fields were sparse in this payload. Re-run after enriching inputs or consult the raw response.";
        }
        return parts.join("\n\n");
      }

      function buildDiagnosis(dec, val, strat) {
        var chunks = [];
        var br = dec.blocked_reasons;
        if (Array.isArray(br) && br.length) {
          chunks.push(
            "Control-plane blockers include: " +
              br.map(humanize).join("; ") +
              ". These gates exist to prevent capital flowing into structurally weak positions."
          );
        }
        if (dec.intent && dec.intent.allowed === false && Array.isArray(dec.intent.violations) && dec.intent.violations.length) {
          chunks.push(
            "Intent review flagged the following: " +
              dec.intent.violations.map(humanize).join("; ") +
              ". Positioning must be corrected before go-to-market work proceeds."
          );
        }
        if (isObj(val)) {
          if (val.viability_0_100 != null) {
            chunks.push(
              "Viability is scored at " +
                val.viability_0_100 +
                " on a 0–100 scale, derived from internal gates rather than external hype."
            );
          }
          var sig = val.signal_summary;
          if (isObj(sig)) {
            var d = sig.demand_subscore;
            var df = sig.differentiation_subscore;
            if (d != null || df != null) {
              chunks.push(
                "Signal decomposition suggests demand weight " +
                  (d != null ? Number(d).toFixed(2) : "n/a") +
                  " and differentiation weight " +
                  (df != null ? Number(df).toFixed(2) : "n/a") +
                  " relative to configured thresholds."
              );
            }
          }
          var mkt = val.market_reality;
          if (isObj(mkt) && mkt.saturation_level) {
            chunks.push(
              "Market framing reads as " +
                String(mkt.saturation_level).replace(/_/g, " ") +
                " under the selected niche hypothesis."
            );
          }
          if (Array.isArray(val.improvements) && val.improvements.length) {
            chunks.push("Structural improvements flagged: " + val.improvements.slice(0, 4).join(" ") + (val.improvements.length > 4 ? " Further items are available in the full record." : ""));
          }
        }
        var ing = isObj(val) && isObj(val.ingestion) ? val.ingestion : null;
        var an = isObj(val) && isObj(val.analysis) ? val.analysis : null;
        if (ing && ing.url) {
          chunks.push("Source URL ingested: " + String(ing.url) + (ing.title ? " — " + String(ing.title) : "") + ".");
        }
        if (an && typeof an.summary === "string" && an.summary.trim()) {
          chunks.push(an.summary.trim());
        }
        if (!chunks.length) {
          return "No major diagnostic flags were surfaced in this response. That does not imply absence of risk — only that the structured pass did not produce additional blockers beyond the headline verdict.";
        }
        return chunks.join("\n\n");
      }

      function buildWhatItMeans(key, dec) {
        if (key === "kill") {
          return (
            "In practical terms: do not scale traffic, inventory, or headcount against this thesis until the wedge, economics, or market definition materially change. " +
            "Capital and calendar time are better redeployed toward a narrower ICP, a different offer, or a distinct channel test with explicit kill criteria."
          );
        }
        if (key === "advance") {
          return (
            "In practical terms: you may proceed, but under operator discipline — one primary channel, one measurable KPI, and written unit economics before scale. " +
            "Treat the verdict as permission to test with boundaries, not as endorsement of open-ended spend."
          );
        }
        return (
          "In practical terms: freeze discretionary launch spend until the open questions in the diagnosis are resolved with evidence, not narrative. " +
          "A hold is not a rejection of ambition; it is a refusal to pretend uncertainty is resolved."
        );
      }

      function pickField(obj, key) {
        var v = obj && obj[key];
        if (v != null && String(v).trim() !== "") return String(v).trim();
        return "";
      }

      function buildExecutionPlanList(data) {
        var ex = isObj(data.execution) ? data.execution : {};
        var offer = pickField(ex, "offer") || pickField(ex, "product_focus");
        var ctx =
          offer !== ""
            ? "<p><strong>Offer under validation:</strong> " + escapeHtml(offer.slice(0, 220)) + "</p>"
            : "";
        return (
          "<p>AETHRA will initiate a controlled validation cycle.</p>" +
          '<h3 class="op-sub">Phase 1 — Supply activation</h3>' +
          "<p>AETHRA selects and prepares supplier relationships for immediate use. No manual sourcing required.</p>" +
          '<h3 class="op-sub">Phase 2 — Market entry</h3>' +
          "<p>AETHRA deploys a single high-precision offer designed to test real demand within 48 hours.</p>" +
          '<h3 class="op-sub">Phase 3 — Acquisition</h3>' +
          "<p>AETHRA activates a targeted outreach sequence to a defined set of high-probability buyers.</p>" +
          '<h3 class="op-sub">Phase 4 — Signal evaluation</h3>' +
          "<p>Responses, objections, and pricing resistance are analysed in real time.</p>" +
          '<h3 class="op-sub">Phase 5 — Decision</h3>' +
          "<p>If demand validates, scale allocation increases. If signals weaken, the offer is restructured or terminated.</p>" +
          "<p>No capital is deployed without evidence. This cycle repeats until a profitable configuration is achieved.</p>" +
          ctx
        );
      }

      function buildDeliveryBlock(data) {
        var dl = isObj(data.delivery) ? data.delivery : {};
        var steps = dl.service_steps;
        var stepsHtml = "Pending";
        if (Array.isArray(steps) && steps.length) {
          stepsHtml = steps
            .map(function (s) {
              return String(s == null ? "" : s).trim();
            })
            .filter(Boolean)
            .join(" → ");
        }
        return (
          '<p class="delivery-steps"><strong>Service sequence:</strong> ' +
          escapeHtml(stepsHtml) +
          "</p>" +
          '<ul class="exec-list">' +
          "<li><strong>Client output:</strong> " +
          escapeHtml(pickField(dl, "client_output") || "Pending") +
          "</li>" +
          "<li><strong>Retention:</strong> " +
          escapeHtml(pickField(dl, "retention") || "Pending") +
          "</li>" +
          "<li><strong>Upsell:</strong> " +
          escapeHtml(pickField(dl, "upsell") || "Pending") +
          "</li>" +
          "</ul>" +
          "<p>Manual delivery first; document variance, then standardise.</p>"
        );
      }

      function listFromArray(label, arr) {
        if (!Array.isArray(arr) || !arr.length) {
          return "<li><strong>" + escapeHtml(label) + ":</strong> Pending</li>";
        }
        var body = arr
          .map(function (x) {
            return escapeHtml(String(x));
          })
          .join(", ");
        return "<li><strong>" + escapeHtml(label) + ":</strong> " + body + "</li>";
      }

      function buildOperatorMode(data) {
        var b = isObj(data.brand) ? data.brand : {};
        var mk = isObj(data.marketing) ? data.marketing : {};
        var tst = isObj(data.testing) ? data.testing : {};
        var h = isObj(b.handles) ? b.handles : {};
        var alts = Array.isArray(h.alternatives) ? h.alternatives : [];
        var altStr = alts.length ? alts.join("; ") : "Pending";
        var ch = mk.channels;
        var ang = mk.content_angles;
        var ulMk = "<ul class=\"exec-list\">";
        ulMk += listFromArray("Channels", ch);
        ulMk += listFromArray("Content angles", ang);
        ulMk +=
          "<li><strong>Posting frequency:</strong> " +
          escapeHtml(pickField(mk, "posting_frequency") || "Pending") +
          "</li>";
        ulMk +=
          "<li><strong>Outreach message:</strong> " +
          escapeHtml(pickField(mk, "outreach_message") || "Pending") +
          "</li>";
        ulMk += "</ul>";
        var vars = tst.variables;
        var ulT = "<ul class=\"exec-list\">";
        ulT += listFromArray("Variables", vars);
        ulT +=
          "<li><strong>Goal:</strong> " +
          escapeHtml(pickField(tst, "goal") || "Pending") +
          "</li>";
        ulT +=
          "<li><strong>Cycle:</strong> " +
          escapeHtml(pickField(tst, "cycle") || "Pending") +
          "</li>";
        ulT += "</ul>";
        return (
          '<ul class="exec-list">' +
          "<li><strong>Name:</strong> " +
          escapeHtml(pickField(b, "name") || pickField(b, "brand_name") || "Pending") +
          "</li>" +
          "<li><strong>Positioning:</strong> " +
          escapeHtml(pickField(b, "positioning") || "Pending") +
          "</li>" +
          "<li><strong>Tagline:</strong> " +
          escapeHtml(pickField(b, "tagline") || "Pending") +
          "</li>" +
          "<li><strong>Tone:</strong> " +
          escapeHtml(pickField(b, "tone") || "Pending") +
          "</li>" +
          "<li><strong>Visual direction:</strong> " +
          escapeHtml(pickField(b, "visual_direction") || "Pending") +
          "</li>" +
          "<li><strong>Handle (primary):</strong> " +
          escapeHtml(pickField(h, "primary") || "Pending") +
          "</li>" +
          "<li><strong>Alternatives:</strong> " +
          escapeHtml(altStr) +
          "</li>" +
          "<li><strong>Domain:</strong> " +
          escapeHtml(pickField(h, "domain") || "Pending") +
          "</li>" +
          "</ul>" +
          "<h3 class=\"op-sub\">Marketing</h3>" +
          ulMk +
          "<h3 class=\"op-sub\">Testing</h3>" +
          ulT
        );
      }

      function buildAutonomousStack(data) {
        var au = isObj(data.autonomous) ? data.autonomous : {};
        var src = au.lead_sources;
        var ul = "<ul class=\"exec-list\">";
        ul += listFromArray("Lead sources", src);
        ul +=
          "<li><strong>Scraping / list build:</strong> " +
          escapeHtml(pickField(au, "scraping_method") || "Pending") +
          "</li>";
        ul +=
          "<li><strong>Outreach sequence:</strong> " +
          escapeHtml(pickField(au, "outreach_sequence") || "Pending") +
          "</li>";
        ul +=
          "<li><strong>Follow-up logic:</strong> " +
          escapeHtml(pickField(au, "follow_up_logic") || "Pending") +
          "</li>";
        ul +=
          "<li><strong>Tracking:</strong> " +
          escapeHtml(pickField(au, "tracking_method") || "Pending") +
          "</li>";
        ul += "</ul>";
        return (
          ul +
          "<p>AETHRA sequences discovery and follow-up; tooling scales only after the signal stabilises.</p>"
        );
      }

      function buildMemoryInsight(data) {
        var mi = pickField(data, "memory_insight");
        if (!mi) {
          var meta = isObj(data.meta) ? data.meta : {};
          mi = pickField(meta, "memory_insight");
        }
        return (
          "<p>" +
          escapeHtml(
            mi ||
              "No ledger signal on this surface yet. As cycles complete and capital moves, this layer fills in."
          ) +
          "</p>"
        );
      }

      function buildSupplyExecutionPack(data) {
        var aut = isObj(data.autonomous) ? data.autonomous : {};
        var ep = isObj(aut.execution_pack) ? aut.execution_pack : null;
        var si = isObj(aut.supplier_intel) ? aut.supplier_intel : {};
        var sa = isObj(si.supply_access) ? si.supply_access : null;
        if (!ep && !sa) {
          return (
            '<div class="block block-fade narrative-block"><h3>Supply intelligence</h3><div class="body">' +
            "<p>The supply stack activates on a full host cycle. Initiate a run to map curated lanes, connectors, and execution order.</p>" +
            "</div></div>"
          );
        }
        var html =
          '<div class="block block-fade narrative-block"><h3>Execution dossier</h3><div class="body">';

        if (ep && isObj(ep.business_decision)) {
          var bd = ep.business_decision;
          var vLine =
            bd.viable === false
              ? "Not viable under current framing"
              : bd.viable === true
                ? "Viable — execute with verification"
                : "Assessment — review gates";
          html +=
            "<p><strong>Business decision:</strong> " +
            escapeHtml(vLine) +
            " <span class=\"muted-small\">(" +
            escapeHtml(String(bd.verdict || "—")) +
            ")</span></p>";
          if (bd.summary) html += "<p>" + escapeHtml(bd.summary) + "</p>";
        }

        if (sa && isObj(sa.layer1_curated)) {
          var c = sa.layer1_curated;
          html +=
            "<p><strong>Layer 1 — curated library:</strong> " +
            (c.matched
              ? escapeHtml(String(c.industry || "")) +
                " · " +
                escapeHtml(String(c.subcategory || "").replace(/_/g, " "))
              : "no keyword match — connectors and operator research apply") +
            "</p>";
        }
        if (sa && isObj(sa.layer2_connectors)) {
          var l2 = sa.layer2_connectors;
          var uk = Array.isArray(l2.top_suppliers_uk) ? l2.top_suppliers_uk.length : 0;
          var eu = Array.isArray(l2.top_suppliers_eu) ? l2.top_suppliers_eu.length : 0;
          var cn = Array.isArray(l2.top_manufacturers_china) ? l2.top_manufacturers_china.length : 0;
          html +=
            "<p><strong>Layer 2 — connectors:</strong> UK " +
            String(uk) +
            " · EU " +
            String(eu) +
            " · China bucket " +
            String(cn) +
            ". " +
            escapeHtml(String(l2.freshness_note || "")) +
            "</p>";
        }
        if (sa && isObj(sa.layer3_interpretation)) {
          var l3 = sa.layer3_interpretation;
          var st = l3.execution_stack || {};
          html += "<h4 class=\"op-sub\">Execution stack (Layer 3)</h4><ul class=\"exec-list\">";
          if (st.supplier_fast_start && st.supplier_fast_start.primary) {
            var p = st.supplier_fast_start.primary;
            html +=
              "<li><strong>Fast start:</strong> " +
              escapeHtml(p.name || "—") +
              (p.source ? " <span class=\"muted-small\">(" + escapeHtml(p.source) + ")</span>" : "") +
              "</li>";
          }
          if (st.supplier_scale && st.supplier_scale.primary) {
            var ps = st.supplier_scale.primary;
            html +=
              "<li><strong>Scale:</strong> " +
              escapeHtml(ps.name || "—") +
              (ps.source ? " <span class=\"muted-small\">(" + escapeHtml(ps.source) + ")</span>" : "") +
              "</li>";
          }
          if (st.supplier_margin_optimisation && st.supplier_margin_optimisation.primary) {
            var pm = st.supplier_margin_optimisation.primary;
            html +=
              "<li><strong>Margin optimisation:</strong> " +
              escapeHtml(pm.name || "—") +
              "</li>";
          }
          html += "</ul>";
          if (Array.isArray(l3.recommended)) {
            html += "<ul class=\"exec-list\">";
            var ri;
            for (ri = 0; ri < l3.recommended.length; ri++) {
              var rec = l3.recommended[ri];
              var th = rec.threshold != null ? " · ~£" + String(rec.threshold) + "/mo" : "";
              html +=
                "<li><strong>" +
                escapeHtml(String(rec.action || "").replace(/_/g, " ")) +
                ":</strong> " +
                escapeHtml(String(rec.detail || "")) +
                escapeHtml(th) +
                "</li>";
            }
            html += "</ul>";
          }
        }

        if (ep && isObj(ep.supplier_stack)) {
          var ss = ep.supplier_stack;
          html += "<h4 class=\"op-sub\">Supplier roles</h4><ul class=\"exec-list\">";
          html +=
            "<li><strong>Chemicals / consumables:</strong> " +
            escapeHtml(formatNameList(ss.chemicals)) +
            "</li>";
          html +=
            "<li><strong>Equipment:</strong> " +
            escapeHtml(formatNameList(ss.equipment)) +
            "</li>";
          html +=
            "<li><strong>Backup:</strong> " +
            escapeHtml(formatNameList(ss.backup)) +
            "</li>";
          html += "</ul>";
        }

        if (ep && isObj(ep.brand)) {
          var br = ep.brand;
          html += "<h4 class=\"op-sub\">Brand</h4><ul class=\"exec-list\">";
          html += "<li><strong>Name:</strong> " + escapeHtml(String(br.name || "—")) + "</li>";
          html +=
            "<li><strong>Domain candidate:</strong> " +
            escapeHtml(String(br.domain_candidate || "—")) +
            " · " +
            escapeHtml(String(br.domain_availability || "")) +
            "</li>";
          html +=
            "<li><strong>Handles:</strong> " +
            escapeHtml(String((br.handles && br.handles.primary) || "—")) +
            "</li>";
          html += "</ul>";
        }

        if (ep && isObj(ep.website)) {
          var w = ep.website;
          html += "<h4 class=\"op-sub\">Website</h4>";
          html += "<p>" + escapeHtml(String(w.landing_hero || "")) + "</p>";
          if (Array.isArray(w.structure)) {
            html += "<ul class=\"exec-list\">";
            var wi;
            for (wi = 0; wi < w.structure.length; wi++) {
              html += "<li>" + escapeHtml(String(w.structure[wi])) + "</li>";
            }
            html += "</ul>";
          }
        }

        if (ep && isObj(ep.outreach)) {
          var o = ep.outreach;
          html += "<h4 class=\"op-sub\">Outreach (draft — review before send)</h4>";
          if (Array.isArray(o.supplier_emails)) {
            html += "<p class=\"muted-small\"><strong>Supplier emails</strong></p>";
            var se;
            for (se = 0; se < Math.min(3, o.supplier_emails.length); se++) {
              html +=
                '<pre class=\"outreach-pre\">' +
                escapeHtml(String(o.supplier_emails[se])) +
                "</pre>";
            }
          }
          if (Array.isArray(o.client_outreach_messages)) {
            html += "<p class=\"muted-small\"><strong>Client messages</strong></p>";
            var cm;
            for (cm = 0; cm < Math.min(3, o.client_outreach_messages.length); cm++) {
              html += "<p>" + escapeHtml(String(o.client_outreach_messages[cm])) + "</p>";
            }
          }
          if (o.inbound_funnel && isObj(o.inbound_funnel)) {
            var f = o.inbound_funnel;
            html += "<p><strong>Inbound funnel:</strong> " + escapeHtml(String((f.channels || []).join(" · "))) + "</p>";
            if (f.qualification)
              html += "<p class=\"muted-small\">Qualification: " + escapeHtml(String(f.qualification)) + "</p>";
          }
          if (o.whatsapp_script) {
            html +=
              '<p class=\"muted-small\"><strong>WhatsApp script:</strong> ' +
              escapeHtml(String(o.whatsapp_script)) +
              "</p>";
          }
        }

        if (ep && Array.isArray(ep.execution_plan_calendar)) {
          html += "<h4 class=\"op-sub\">Execution calendar</h4><ul class=\"exec-list\">";
          var ci;
          for (ci = 0; ci < ep.execution_plan_calendar.length; ci++) {
            var day = ep.execution_plan_calendar[ci];
            var acts = Array.isArray(day.actions) ? day.actions.join("; ") : "";
            html +=
              "<li><strong>Day " +
              escapeHtml(String(day.day != null ? day.day : ci + 1)) +
              " — " +
              escapeHtml(String(day.focus || "")) +
              ":</strong> " +
              escapeHtml(acts) +
              "</li>";
          }
          html += "</ul>";
        }

        html += "</div></div>";
        return html;
      }

      function formatNameList(arr) {
        if (!Array.isArray(arr) || !arr.length) return "Not mapped on this pass";
        var bits = [];
        var i;
        for (i = 0; i < Math.min(5, arr.length); i++) {
          if (arr[i] && arr[i].name) bits.push(arr[i].name);
        }
        return bits.length ? bits.join("; ") : "Not mapped on this pass";
      }

      function pfNum(x) {
        if (x == null || x === "" || (typeof x === "number" && isNaN(x))) return null;
        if (typeof x === "number") return String(x);
        return String(x);
      }

      function buildPortfolioDashboard(data) {
        var p = isObj(data.portfolio) ? data.portfolio : null;
        var ui = isObj(data._ui_summaries) ? data._ui_summaries : {};
        var line = pickField(ui, "portfolio_dashboard");
        var emptyBody =
          "<p><strong>Portfolio layer</strong></p>" +
          "<p>No active ventures are live on this snapshot yet.</p>" +
          "<p>As ideas and deployments validate, capital assigns here — each pass refines what comes next.</p>";
        if (!p && !line) {
          return (
            '<div class="block block-fade narrative-block portfolio-pulse"><h3>Portfolio pulse</h3><div class="body">' +
            emptyBody +
            "</div></div>"
          );
        }
        if (!p) {
          return (
            '<div class="block block-fade narrative-block portfolio-pulse"><h3>Portfolio pulse</h3><div class="body"><p>' +
            escapeHtml(line) +
            "</p></div></div>"
          );
        }
        var note = pickField(p, "transparency_note") || "";
        var basis = p.success_rate_basis ? String(p.success_rate_basis).replace(/_/g, " ") : "";
        var tw = pfNum(p.total_wallet);
        var tc = pfNum(p.total_combined);
        var av = pfNum(p.active_ventures);
        var sv = pfNum(p.successful_ventures);
        var fv = pfNum(p.failed_ventures);
        var tr = pfNum(p.total_revenue);
        var np = pfNum(p.net_profit);
        var sr = p.success_rate != null && p.success_rate !== "" ? String(p.success_rate) : "Not yet established";
        return (
          '<div class="block block-fade narrative-block portfolio-pulse"><h3>Portfolio pulse</h3><div class="body">' +
          "<p><strong>Liquid capital:</strong> £" +
          escapeHtml(tw != null ? tw : "0") +
          "</p>" +
          "<p><strong>Combined (liquid + deployed):</strong> £" +
          escapeHtml(tc != null ? tc : "0") +
          "</p>" +
          "<p><strong>Active ventures:</strong> " +
          escapeHtml(av != null ? av : "0") +
          "</p>" +
          "<p><strong>Recorded revenue (ventures):</strong> " +
          escapeHtml(sv != null ? sv : "0") +
          " · <strong>Archived:</strong> " +
          escapeHtml(fv != null ? fv : "0") +
          "</p>" +
          "<p><strong>Success rate:</strong> " +
          escapeHtml(sr) +
          (basis ? " <span class=\"muted-small\">(" + escapeHtml(basis) + ")</span>" : "") +
          "</p>" +
          "<p><strong>Total revenue:</strong> £" +
          escapeHtml(tr != null ? tr : "0") +
          "</p>" +
          "<p><strong>Net position (revenue less allocated budgets):</strong> £" +
          escapeHtml(np != null ? np : "0") +
          "</p>" +
          buildWalletAggregateList(data) +
          (note
            ? '<p class="transparency">' + escapeHtml(note) + "</p>"
            : "") +
          "</div></div>"
        );
      }

      function buildWalletAggregateList(data) {
        var agg = isObj(data.wallets_aggregate) ? data.wallets_aggregate : {};
        var w = Array.isArray(agg.wallets) ? agg.wallets : [];
        if (!w.length) {
          return (
            "<p><strong>Wallet</strong></p>" +
            "<p>No capital currently deployed.</p>" +
            "<p>AETHRA operates on controlled allocation. Funds commit only once validation thresholds are met.</p>"
          );
        }
        var rows = "";
        var wi;
        for (wi = 0; wi < Math.min(6, w.length); wi++) {
          var W = w[wi];
          var label =
            W.type === "core"
              ? "Core"
              : "Venture · " + String(W.name || "Unnamed");
          var bal = W.balance != null && W.balance !== "" ? String(W.balance) : "0";
          rows +=
            "<li><strong>" +
            escapeHtml(label) +
            ":</strong> £" +
            escapeHtml(bal) +
            "</li>";
        }
        var comb =
          agg.total_combined != null && agg.total_combined !== ""
            ? String(agg.total_combined)
            : "0";
        return (
          '<p><strong>Wallet breakdown</strong></p><ul class="exec-list">' +
          rows +
          "</ul>" +
          '<p class="transparency">Combined total: £' +
          escapeHtml(comb) +
          "</p>"
        );
      }

      function buildSynergyBlock(data) {
        var s = isObj(data.synergy) ? data.synergy : null;
        var ui = isObj(data._ui_summaries) ? data._ui_summaries : {};
        var line = pickField(ui, "synergy");
        if (!s && !line) {
          return (
            '<div class="block block-fade narrative-block synergy-block"><h3>Cross-portfolio signal</h3><div class="body">' +
            "<p>Compound patterns surface as the ledger and memory deepen. The system is listening.</p>" +
            "</div></div>"
          );
        }
        var html =
          '<div class="block block-fade narrative-block synergy-block"><h3>Cross-portfolio signal</h3><div class="body">';
        if (s && s.aethra_portfolio) {
          html += "<p class=\"synergy-note\"><strong>AETHRA portfolio:</strong> " + escapeHtml(s.aethra_portfolio) + "</p>";
        }
        if (s && s.user_portfolio) {
          html += "<p class=\"synergy-note\"><strong>This cycle:</strong> " + escapeHtml(s.user_portfolio) + "</p>";
        }
        if (s && Array.isArray(s.shared_patterns) && s.shared_patterns.length) {
          html += "<ul class=\"exec-list\">";
          var sp;
          for (sp = 0; sp < Math.min(5, s.shared_patterns.length); sp++) {
            html += "<li>" + escapeHtml(String(s.shared_patterns[sp])) + "</li>";
          }
          html += "</ul>";
        }
        if (s && s.cross_impact) {
          html += "<p>" + escapeHtml(String(s.cross_impact)) + "</p>";
        }
        if (line && (!s || !s.cross_impact)) {
          html += "<p>" + escapeHtml(line) + "</p>";
        }
        html += "</div></div>";
        return html;
      }

      function buildScalingStrip(data) {
        var sc = isObj(data.scaling) ? data.scaling : {};
        var ev = Array.isArray(sc.evaluations) ? sc.evaluations : [];
        if (!ev.length) return "";
        var bits = [];
        var ei;
        for (ei = 0; ei < Math.min(3, ev.length); ei++) {
          var d = ev[ei].decision || {};
          var nm = ev[ei].venture || "Venture";
          if (d.kill) bits.push("«" + escapeHtml(String(nm)) + "»: kill candidate — " + escapeHtml(String(d.reason || "").slice(0, 120)));
          else if (d.scale) bits.push("«" + escapeHtml(String(nm)) + "»: scale signal — " + escapeHtml(String(d.reason || "").slice(0, 120)));
        }
        if (!bits.length) return "";
        return (
          '<div class="block block-fade narrative-block"><h3>Scaling engine</h3><div class="body"><ul class="exec-list">' +
          bits.map(function (b) { return "<li>" + b + "</li>"; }).join("") +
          "</ul></div></div>"
        );
      }

      function buildSupplyNetworkBlock(data) {
        var aut = isObj(data.autonomous) ? data.autonomous : {};
        var si = isObj(aut.supplier_intel) ? aut.supplier_intel : {};
        var sa = isObj(si.supply_access) ? si.supply_access : null;
        var l3 = sa && isObj(sa.layer3_interpretation) ? sa.layer3_interpretation : null;
        var st = l3 && isObj(l3.execution_stack) ? l3.execution_stack : null;
        var l2 = sa && isObj(sa.layer2_connectors) ? sa.layer2_connectors : null;
        var ukName = "Primary lane (curated or live UK)";
        var euName = "Secondary lane (EU cost curve)";
        var cnName = "Scaling lane (contract manufacture)";
        if (st && st.supplier_fast_start && st.supplier_fast_start.primary && st.supplier_fast_start.primary.name) {
          ukName = st.supplier_fast_start.primary.name;
        }
        if (l2 && Array.isArray(l2.top_suppliers_eu) && l2.top_suppliers_eu[0] && l2.top_suppliers_eu[0].name) {
          euName = l2.top_suppliers_eu[0].name;
        } else if (st && st.supplier_scale && st.supplier_scale.primary && st.supplier_scale.primary.name) {
          euName = st.supplier_scale.primary.name;
        }
        if (st && st.supplier_margin_optimisation && st.supplier_margin_optimisation.primary && st.supplier_margin_optimisation.primary.name) {
          cnName = st.supplier_margin_optimisation.primary.name;
        }
        return (
          '<div class="narrative-block"><h2>Supply network</h2><div class="body">' +
          "<p>AETHRA has mapped the operational layer required to execute this venture.</p>" +
          "<ul class=\"exec-list\">" +
          "<li><strong>Supplier (UK):</strong> " +
          escapeHtml(ukName) +
          " — ready for immediate deployment.</li>" +
          "<li><strong>Supplier (EU):</strong> " +
          escapeHtml(euName) +
          " — identified for cost optimisation.</li>" +
          "<li><strong>Manufacturer (scaling):</strong> " +
          escapeHtml(cnName) +
          " — reserved for volume transition.</li>" +
          "</ul>" +
          "<p>Each relationship is ranked on speed, cost, and reliability. No manual research is required to begin.</p>" +
          "</div></div>"
        );
      }

      function buildRuntimePanels(data) {
        var aut = isObj(data.autonomous) ? data.autonomous : {};
        var act = aut.operator_activity;
        var leads = Array.isArray(aut.leads) ? aut.leads : [];
        var crmRows = aut.crm && Array.isArray(aut.crm.pipeline) ? aut.crm.pipeline : [];
        var crmMetrics = aut.crm && isObj(aut.crm.metrics) ? aut.crm.metrics : null;
        var venture = isObj(data.venture) ? data.venture : {};
        var w = venture.wallet || {};
        var ventures = Array.isArray(venture.active_ventures) ? venture.active_ventures : [];
        var ui = isObj(data._ui_summaries) ? data._ui_summaries : {};
        var si = isObj(aut.supplier_intel) ? aut.supplier_intel : {};
        var suppliers = Array.isArray(si.suppliers) ? si.suppliers : [];
        var outreach = isObj(aut.outreach) ? aut.outreach : {};
        var disp = Array.isArray(outreach.email_dispatch) ? outreach.email_dispatch : [];
        var learn = Array.isArray(aut.learning_signals) ? aut.learning_signals : [];
        var cycle = isObj(venture.cycle) ? venture.cycle : {};

        var actLine = pickField(ui, "operator_activity");
        if (!actLine && act) {
          var parts = [];
          if (act.venture_launched && act.venture_name) {
            parts.push(
              "AETHRA allocated £" +
                String(act.budget_allocated || 0) +
                " to operator staging for «" +
                act.venture_name +
                "»."
            );
          } else {
            parts.push("Allocation gates held. No venture wallet debited on this cycle.");
          }
          parts.push(String(act.leads_generated || 0) + " high-probability targets in scope.");
          if (act.suppliers_surfaced != null) {
            parts.push(String(act.suppliers_surfaced) + " supplier rows in the active file (verify before procurement).");
          }
          if ((act.emails_live || 0) > 0 || (act.emails_simulated || 0) > 0) {
            parts.push(
              "Outreach transport: " +
                String(act.emails_live || 0) +
                " live, " +
                String(act.emails_simulated || 0) +
                " simulated."
            );
          }
          parts.push(String(act.replies_simulated || 0) + " replies classified; drafts prepared.");
          if ((act.simulated_closes || 0) > 0) {
            parts.push(
              String(act.simulated_closes) +
                " simulated closes · £" +
                String(act.simulated_revenue_gbp || 0) +
                " tagged revenue · £" +
                String(act.reinvest_tagged_gbp || 0) +
                " reinvest pool."
            );
          }
          actLine = parts.join(" ");
        }
        if (!actLine) {
          actLine =
            "Operator surfaces bind after a full host cycle. Initiate a run to populate staging, supply, and pipeline.";
        }

        var leadRows = "";
        if (leads.length) {
          var li;
          for (li = 0; li < Math.min(5, leads.length); li++) {
            var L = leads[li];
            leadRows +=
              "<li>" +
              escapeHtml(L.name || "Target") +
              " · " +
              escapeHtml(L.location || "") +
              " · fit " +
              escapeHtml(String(L.niche_score != null ? L.niche_score : "Pending")) +
              "</li>";
          }
        } else {
          leadRows =
            "<li>Targets queue on activation. The acquisition layer is ready.</li>";
        }

        var crmLine = pickField(ui, "crm_snapshot");
        if (!crmLine && crmRows.length) {
          var stages = {};
          var ci;
          for (ci = 0; ci < crmRows.length; ci++) {
            var stg = String(crmRows[ci].stage || "lead");
            stages[stg] = (stages[stg] || 0) + 1;
          }
          var keys = Object.keys(stages);
          var seg = [];
          for (var si2 = 0; si2 < keys.length; si2++) {
            seg.push(keys[si2] + ": " + stages[keys[si2]]);
          }
          crmLine = seg.join(" · ");
          if (crmMetrics && typeof crmMetrics.reply_progression_rate === "number") {
            crmLine +=
              " · progression ~" +
              String(Math.round(crmMetrics.reply_progression_rate * 100)) +
              "% · health " +
              String(crmMetrics.pipeline_health || "assessing") +
              " · touches logged " +
              String(crmMetrics.emails_sent_total != null ? crmMetrics.emails_sent_total : "0");
          }
        }

        var crmBlock = "";
        if (crmRows.length && crmLine) {
          crmBlock =
            '<div class="narrative-block"><h2>Pipeline</h2><div class="body"><p>' +
            escapeHtml(crmLine) +
            "</p></div></div>";
        } else {
          crmBlock =
            '<div class="narrative-block"><h2>Pipeline</h2><div class="body">' +
            "<p>No active conversations yet.</p>" +
            "<p>Opportunities populate as outreach initiates.</p>" +
            "<p>Responses are classified, prioritised, and fed into the next actions the system takes.</p>" +
            "</div></div>";
        }

        var ventLine = pickField(ui, "ventures");
        if (!ventLine && ventures.length) {
          var vbits = [];
          var vi;
          for (vi = 0; vi < ventures.length; vi++) {
            var v = ventures[vi];
            vbits.push(
              "«" +
                String(v.name || "Venture") +
                "»: £" +
                String(v.budget != null ? v.budget : "0") +
                " allocated · revenue £" +
                String(v.revenue != null ? v.revenue : 0)
            );
          }
          ventLine = vbits.join(" · ");
        }
        if (!ventLine) {
          ventLine =
            "No venture deployments on this ledger surface. Activation assigns the first allocation.";
        }

        var walletLine = pickField(ui, "wallet");
        if (!walletLine && w.balance != null && w.balance !== "") {
          walletLine =
            "Liquid £" +
            String(w.balance) +
            " (" +
            (w.currency || "GBP") +
            "). Reinvest pool £" +
            String(w.reinvest_pool != null ? w.reinvest_pool : 0) +
            ".";
        }
        if (!walletLine) {
          walletLine =
            "No capital deployed on this surface. Controlled allocation opens after validation gates clear.";
        }

        var supList = "";
        if (suppliers.length) {
          var sj;
          for (sj = 0; sj < Math.min(5, suppliers.length); sj++) {
            var S = suppliers[sj];
            var nm = S.legal_name || S.name || "Supplier row";
            supList +=
              "<li>" +
              escapeHtml(nm) +
              " · " +
              escapeHtml(S.region || "") +
              " · score " +
              escapeHtml(String(S.fit_score_0_100 != null ? S.fit_score_0_100 : "Pending")) +
              "</li>";
          }
        }

        var supplyIntelBlock =
          '<div class="narrative-block"><h2>Supply intelligence</h2><div class="body">' +
          "<p>A verified supply pathway has been constructed.</p>" +
          "<p>Primary supplier (UK) selected for immediate deployment. Secondary supplier identified for margin optimisation at scale. Tertiary backup secured to mitigate disruption.</p>" +
          "<p>Switch conditions are predefined. No manual sourcing pass is required to open execution.</p>";
        if (supList) {
          supplyIntelBlock += "<ul class=\"exec-list\">" + supList + "</ul>";
        }
        supplyIntelBlock += "</div></div>";

        var dispDetail = "";
        if (disp.length) {
          var dj;
          for (dj = 0; dj < disp.length; dj++) {
            var D = disp[dj];
            var rawTo = String(D.to || "");
            var masked = rawTo.indexOf("@") > 0 ? rawTo.replace(/^(.{2}).*(@.*)$/, "$1…$2") : rawTo;
            dispDetail += (dj ? " · " : "") + String(D.mode || "queued") + " → " + masked;
          }
        }

        var outreachBlock = "";
        if (disp.length) {
          outreachBlock =
            '<div class="narrative-block"><h2>Outreach system</h2><div class="body">' +
            "<p>Initial contact sequence is active for this cycle.</p>" +
            "<p>" +
            escapeHtml(dispDetail) +
            "</p>" +
            "<p class=\"muted-small\">Live transport uses Resend when configured; otherwise the cycle runs in simulation.</p>" +
            "</div></div>";
        } else {
          outreachBlock =
            '<div class="narrative-block"><h2>Outreach system</h2><div class="body">' +
            "<p>Initial contact sequence is prepared and ready.</p>" +
            "<p><strong>Three-touch structure:</strong></p>" +
            "<ul class=\"exec-list\">" +
            "<li>Precision introduction</li>" +
            "<li>Proof reinforcement</li>" +
            "<li>Direct conversion trigger</li>" +
            "</ul>" +
            "<p>Messages are calibrated to maximise reply probability while preserving positioning. Dispatch begins on activation.</p>" +
            "</div></div>";
        }

        var learnRows = "";
        if (learn.length) {
          var lj;
          for (lj = 0; lj < Math.min(5, learn.length); lj++) {
            learnRows += "<li>" + escapeHtml(String(learn[lj])) + "</li>";
          }
        } else {
          learnRows =
            "<li>The learning ledger captures each cycle. First entries record when outreach completes.</li>";
        }

        var cycleLine = cycle.narrative
          ? String(cycle.narrative)
          : venture.last_launch && venture.last_launch.launched === false
            ? "Venture gates held — no close credit on this pass."
            : "Cycle narrative attaches when venture simulation completes.";

        return (
          supplyIntelBlock +
          buildSupplyNetworkBlock(data) +
          outreachBlock +
          crmBlock +
          '<div class="narrative-block"><h2>Operator status</h2><div class="body"><p>' +
          escapeHtml(actLine) +
          '</p><ul class="exec-list">' +
          leadRows +
          '</ul></div></div>' +
          '<div class="narrative-block"><h2>Learning loop</h2><div class="body"><ul class="exec-list">' +
          learnRows +
          '</ul></div></div>' +
          '<div class="narrative-block"><h2>Venture cycle</h2><div class="body"><p>' +
          escapeHtml(cycleLine) +
          "</p></div></div>" +
          '<div class="narrative-block"><h2>Active ventures</h2><div class="body"><p>' +
          escapeHtml(ventLine) +
          "</p></div></div>" +
          '<div class="narrative-block"><h2>Wallet</h2><div class="body"><p>' +
          escapeHtml(walletLine) +
          "</p></div></div>"
        );
      }

      function formatMetrics(dec) {
        var conf =
          dec.confidence_0_100 != null && dec.confidence_0_100 !== ""
            ? String(dec.confidence_0_100) + "%"
            : dec.confidence != null
              ? String(dec.confidence)
              : "Pending";
        var sc = isObj(dec.scores) ? dec.scores : {};
        var v = sc.viability_0_100 != null ? String(sc.viability_0_100) : "Pending";
        var d = sc.demand_0_100 != null ? String(sc.demand_0_100) : "Pending";
        var df = sc.differentiation_0_100 != null ? String(sc.differentiation_0_100) : "Pending";
        return { conf: conf, viability: v, demand: d, differentiation: df };
      }

      function paragraphize(text) {
        var t = String(text || "").trim();
        if (!t) return "";
        var paras = t.split(/\n\n+/);
        var html = "";
        for (var i = 0; i < paras.length; i++) {
          html += "<p>" + escapeHtml(paras[i].replace(/\n/g, " ")) + "</p>";
        }
        return html;
      }

      function buildProfitEnforcementBanner(data) {
        var meta = isObj(data.meta) ? data.meta : {};
        var pe = meta.profit_enforcement;
        if (!pe || typeof pe !== "object") return "";
        var ok = pe.satisfied === true;
        var miss = Array.isArray(pe.missing_surfaces) ? pe.missing_surfaces.join(", ") : "";
        var mantra = pe.mantra ? String(pe.mantra) : "";
        if (ok) {
          return (
            '<div class="block block-fade narrative-block narrative-block--profit-ok"><h3>Profit surfaces</h3><div class="body"><p>' +
            escapeHtml("Pricing, acquisition, and execution are present in this envelope — proceed under revenue-first discipline.") +
            (mantra ? "</p><p class=\"muted-small\">" + escapeHtml(mantra) + "</p>" : "</p>") +
            "</div></div>"
          );
        }
        return (
          '<div class="block block-fade narrative-block narrative-block--profit-warn"><h3>Profit enforcement</h3><div class="body"><p>' +
          escapeHtml(
            "Revenue surfaces are incomplete (" +
              (miss || "pricing, acquisition, execution") +
              "). Refine the thesis or run one regeneration pass from the host."
          ) +
          "</p>" +
          (mantra ? '<p class="muted-small">' + escapeHtml(mantra) + "</p>" : "") +
          "</div></div>"
        );
      }

      function buildInvoicesBlock(data) {
        var rl = isObj(data.revenue_layer) ? data.revenue_layer : {};
        var inv = Array.isArray(rl.invoices) ? rl.invoices : [];
        var pay = Array.isArray(rl.payment_events) ? rl.payment_events : [];
        var html =
          '<div class="block block-fade narrative-block"><h3>Invoices &amp; payments</h3><div class="body">';
        if (!inv.length && !pay.length) {
          html +=
            "<p>No recorded payment events on this surface. Revenue lines attach when checkout completes or the ledger records a payment.</p>";
        } else {
          var i;
          for (i = 0; i < Math.min(6, inv.length); i++) {
            var I = inv[i];
            html +=
              "<p><strong>" +
              escapeHtml(String(I.invoice_id || "Pending")) +
              "</strong> — £" +
              escapeHtml(String(I.amount != null ? I.amount : "0")) +
              " — " +
              escapeHtml(String(I.status || "Pending")) +
              " — " +
              escapeHtml(String(I.client_name || "").slice(0, 40)) +
              "</p>";
          }
          if (pay.length) {
            html += '<p class="muted-small">Recent recorded payments (wallet + learning ledger):</p><ul class="exec-list">';
            var j;
            for (j = 0; j < Math.min(4, pay.length); j++) {
              var P = pay[j];
              html +=
                "<li>£" +
                escapeHtml(String(P.amount_gbp != null ? P.amount_gbp : "0")) +
                " · " +
                escapeHtml(String(P.source || "ledger")) +
                "</li>";
            }
            html += "</ul>";
          }
        }
        html += "</div></div>";
        return html;
      }

      function buildConversionIntelligenceBlock() {
        return (
          '<section class="aethra-block conversion-intel" id="aethraConversionIntel">' +
          "<h3>Conversion Intelligence</h3>" +
          '<p><strong>Best Message:</strong> <span id="ciBestMsg">—</span></p>' +
          '<p><strong>Best Price:</strong> <span id="ciBestPrice">—</span></p>' +
          '<p><strong>Best Niche:</strong> <span id="ciBestNiche">—</span></p>' +
          '<p class="muted" id="ciFootnote">' +
          "AETHRA is continuously optimising based on real performance signals." +
          "</p>" +
          "</section>"
        );
      }

      function formatIntelPrice(v) {
        if (v == null || v === "") return "—";
        var s = String(v).trim();
        if (s === "—") return s;
        if (/^£/.test(s)) return s;
        var n = Number(s.replace(/[^0-9.]/g, ""));
        if (!isNaN(n) && s.replace(/[^0-9.]/g, "") !== "") return "£" + String(Math.round(n * 100) / 100);
        return s;
      }

      async function refreshConversionIntelligence() {
        var root = document.getElementById("aethraConversionIntel");
        if (!root) return;

        function set(id, text) {
          var el = document.getElementById(id);
          if (el) el.textContent = text;
        }

        try {
          var res = await fetch("/api/v1/optimisation/insights");
          if (!res.ok) throw new Error("HTTP " + res.status);
          var j = await res.json();
          if (!j.ok) throw new Error("payload");

          var imp = isObj(j.improvements) ? j.improvements : {};
          var pr = isObj(j.pricing) ? j.pricing : {};

          set("ciBestMsg", imp.message != null && imp.message !== "" ? String(imp.message) : "—");

          var bestP = imp.price != null && imp.price !== "" ? imp.price : pr.optimal_price;
          var pLine = "—";
          if (bestP != null && bestP !== "") {
            pLine = formatIntelPrice(bestP);
            if (pr.conversion_pct != null && pr.optimal_price != null) {
              pLine += " · " + String(pr.conversion_pct) + "% conversion";
            }
          }
          set("ciBestPrice", pLine);

          set("ciBestNiche", imp.niche != null && imp.niche !== "" ? String(imp.niche) : "—");
        } catch (err) {
          set("ciBestMsg", "—");
          set("ciBestPrice", "—");
          set("ciBestNiche", "—");
        }
      }

      function buildScalingIntelligenceBlock() {
        return (
          '<section class="aethra-block scaling-intel" id="aethraScalingIntel">' +
          "<h3>Scaling Intelligence</h3>" +
          '<p><strong>Top Venture:</strong> <span id="siTopVenture">—</span></p>' +
          '<p><strong>Decision:</strong> <span id="siDecision">—</span></p>' +
          '<p><strong>Capital Allocation:</strong> <span id="siCapital">—</span></p>' +
          '<p class="muted" id="siFootnote">' +
          "AETHRA is reallocating resources toward highest-performing opportunities." +
          "</p>" +
          "</section>"
        );
      }

      function formatScalingAction(action) {
        var a = String(action || "").toLowerCase();
        if (a === "scale") return "Scale";
        if (a === "maintain") return "Maintain";
        if (a === "kill") return "Kill";
        return action ? String(action) : "—";
      }

      async function refreshPortfolioLiveSpans() {
        function setAll(attr, text) {
          var nodes = document.querySelectorAll('[data-portfolio-live="' + attr + '"]');
          for (var i = 0; i < nodes.length; i++) nodes[i].textContent = text;
        }

        try {
          var res = await fetch("/api/v1/portfolio/brain");
          if (!res.ok) throw new Error("HTTP " + res.status);
          var j = await res.json();
          if (!j.ok) throw new Error("payload");

          var cap = j.capital != null ? Number(j.capital) : 0;
          setAll("capital", "£" + String(Math.round(cap * 100) / 100));

          var ac = j.active_count != null ? String(j.active_count) : "0";
          setAll("active", ac);

          var top = j.top_performer != null && j.top_performer !== "" ? String(j.top_performer) : "—";
          setAll("top", top);

          var act = j.system_action != null && j.system_action !== "" ? String(j.system_action) : "—";
          setAll("action", act);
        } catch (err) {
          setAll("capital", "—");
          setAll("active", "—");
          setAll("top", "—");
          setAll("action", "—");
        }
      }

      async function refreshScalingIntelligence() {
        var root = document.getElementById("aethraScalingIntel");
        if (!root) return;

        function set(id, text) {
          var el = document.getElementById(id);
          if (el) el.textContent = text;
        }

        try {
          var res = await fetch("/api/v1/scaling/brain");
          if (!res.ok) throw new Error("HTTP " + res.status);
          var j = await res.json();
          if (!j.ok) throw new Error("payload");

          set("siTopVenture", j.top_venture != null && j.top_venture !== "" ? String(j.top_venture) : "—");

          var td = isObj(j.top_decision) ? j.top_decision : {};
          set("siDecision", formatScalingAction(td.action));

          var cap = j.top_allocation_gbp;
          if (cap != null && cap !== "" && Number(cap) > 0) {
            set("siCapital", "£" + String(Math.round(Number(cap) * 100) / 100));
          } else if (j.budget != null && Number(j.budget) <= 0) {
            set("siCapital", "£0 (no deployable pool)");
          } else {
            set("siCapital", "—");
          }
        } catch (err) {
          set("siTopVenture", "—");
          set("siDecision", "—");
          set("siCapital", "—");
        }
      }

      function buildPortfolioIntelligenceNarrativeBlock() {
        return (
          '<div class="aethra-block portfolio-intel-narrative">' +
          "<h3>Portfolio Intelligence</h3>" +
          "<p>AETHRA is actively managing multiple ventures and reallocating capital based on real performance signals.</p>" +
          "<p>Strong performers are being scaled. Underperforming ventures are being reduced or removed.</p>" +
          "<p>Intelligence is shared across all active ventures — improving messaging, pricing, and acquisition continuously.</p>" +
          "</div>" +
          '<div class="aethra-block portfolio-intel-snapshot-narrative">' +
          "<h3>Current Position</h3>" +
          '<p><strong>Total Capital:</strong> <span data-portfolio-live="capital">—</span></p>' +
          '<p><strong>Active Ventures:</strong> <span data-portfolio-live="active">—</span></p>' +
          '<p><strong>Top Performer:</strong> <span data-portfolio-live="top">—</span></p>' +
          '<p><strong>System Action:</strong> <span data-portfolio-live="action">—</span></p>' +
          '<p class="muted portfolio-intel-footnote">' +
          "AETHRA reallocates attention and capital continuously — focusing only on what produces measurable outcomes." +
          "</p>" +
          "</div>"
        );
      }

      function buildAethraExecutionOutreachBrandRevenueBlock(data) {
        var saas = isObj(data.saas_layer) ? data.saas_layer : {};
        var feats = isObj(saas.features) ? saas.features : {};
        var canExec = feats.execution !== false;
        var ctaHtml = canExec
          ? "<p>Execution is ready.</p>" +
            '<button type="button" class="aethra-primary" id="executeBtn">Approve and begin</button>' +
            '<p class="execution-feedback muted-small" id="executionFeedback" aria-live="polite"></p>'
          : '<p class="muted-small gate-copy">' +
            "Execution, live outreach, and CRM deployment require an <strong>Operator</strong> or <strong>Portfolio</strong> plan. This analysis pass is complete; activation is gated to paid tiers." +
            "</p>" +
            '<p class="muted-small gate-copy--flush">' +
            '<a href="#onboarding" class="link-accent">Review plans</a> — activation completes on the host via secure checkout.' +
            "</p>";
        return (
          '<section class="aethra-block">' +
          '<div class="aethra-step">' +
          '<div class="aethra-step-number">2</div>' +
          '<div class="aethra-step-content">' +
          "<h3>Execution</h3>" +
          "<p>Supplier relationships have been identified and prepared for activation. The outreach sequence is constructed.</p>" +
          "<p>AETHRA has mapped the operational pathway — supplier selection, offer structure, and acquisition strategy.</p>" +
          "<p>No manual sourcing pass is required. Proceeding is a plan-gated activation decision.</p>" +
          "</div></div>" +
          '<div class="aethra-cta">' +
          ctaHtml +
          "</div>" +
          '<div class="aethra-step">' +
          '<div class="aethra-step-number">3</div>' +
          '<div class="aethra-step-content">' +
          "<h3>Outreach</h3>" +
          "<p>A targeted outreach sequence is ready for deployment.</p>" +
          "<p>Each message is calibrated for high response probability — structured to open, validate, and convert conversations without damaging positioning.</p>" +
          "<p>Replies are classified and routed into the next actions the system takes.</p>" +
          "</div></div>" +
          '<div class="aethra-step">' +
          '<div class="aethra-step-number">4</div>' +
          '<div class="aethra-step-content">' +
          "<h3>Brand</h3>" +
          "<p>AETHRA has defined a viable brand direction aligned with the opportunity.</p>" +
          "<p>This includes naming, domain strategy, and social positioning — structured for immediate deployment.</p>" +
          "<p>All assets are designed to support conversion, not decoration.</p>" +
          "</div></div>" +
          '<div class="aethra-step">' +
          '<div class="aethra-step-number">5</div>' +
          '<div class="aethra-step-content">' +
          "<h3>Revenue</h3>" +
          "<p>A revenue pathway has been established.</p>" +
          "<p>Pricing, offer structure, and payment capture are aligned to validate demand before scaling.</p>" +
          "<p>Capital is only deployed once real signals confirm viability.</p>" +
          "</div></div>" +
          "</section>"
        );
      }

      function buildInstitutionalBriefingBlock(data) {
        var b = isObj(data.meta) && data.meta.institutional_briefing ? String(data.meta.institutional_briefing) : "";
        if (!b.trim()) return "";
        var paras = b.split(/\n\n+/).filter(function (x) {
          return String(x).trim();
        });
        var html =
          '<div class="narrative-block institutional-briefing"><h2>Briefing</h2><div class="body">';
        var i;
        for (i = 0; i < paras.length; i++) {
          html += "<p>" + escapeHtml(String(paras[i]).replace(/\n/g, " ")) + "</p>";
        }
        html += "</div></div>";
        return html;
      }

      function buildEconomicSystemBlock(data) {
        var eco = isObj(data.autonomous_economic) ? data.autonomous_economic : {};
        var sections = isObj(eco.sections) ? eco.sections : {};
        var keys = [
          "System Judgement",
          "Execution Pathway",
          "Supply & Infrastructure",
          "Acquisition",
          "Revenue Logic",
          "Portfolio Impact",
          "System Action",
        ];
        if (!keys.some(function (k) { return sections[k]; })) return "";
        var html =
          '<div class="narrative-block"><h2>Autonomous Economic System</h2><p class="muted-small narrative-kicker">NICHE -> OFFER -> LEADS -> OUTREACH -> REPLIES -> CLOSE -> DELIVERY -> PROOF -> SCALE -> PORTFOLIO</p><div class="body">';
        for (var i = 0; i < keys.length; i++) {
          var k = keys[i];
          if (!sections[k]) continue;
          html += "<p><strong>" + escapeHtml(k) + ":</strong> " + escapeHtml(String(sections[k])) + "</p>";
        }
        html += "</div></div>";
        return html;
      }

      function buildSuggestedOpportunitiesBlock(data) {
        var layer = isObj(data.ideas_layer) ? data.ideas_layer : {};
        var ideas = Array.isArray(layer.suggestions) ? layer.suggestions : [];
        if (!ideas.length) return "";
        var html =
          '<div class="aethra-block ideas-block">' +
          "<h3>Suggested Opportunities</h3>" +
          "<p>AETHRA has identified high-probability ventures based on current market conditions.</p>" +
          "<ul>";
        var i;
        for (i = 0; i < Math.min(10, ideas.length); i++) {
          var it = ideas[i];
          html +=
            "<li>" +
            escapeHtml(String(it.idea || "")) +
            " — Score: " +
            escapeHtml(String(it.score != null ? it.score : "—")) +
            "</li>";
        }
        html += "</ul></div>";
        return html;
      }

      function buildViralShareBlock(data) {
        var v = isObj(data.viral_layer) ? data.viral_layer : {};
        if (!v || (!v.attribution_line && !v.share_url && !v.canonical_share_url)) return "";
        var attr = v.attribution_line ? String(v.attribution_line) : "";
        var share = v.share_url ? String(v.share_url) : "";
        var canon = v.canonical_share_url ? String(v.canonical_share_url) : "";
        var html =
          '<div class="aethra-block viral-block">' +
          "<h3>Share &amp; attribution</h3>" +
          (attr ? "<p><strong>" + escapeHtml(attr) + "</strong></p>" : "") +
          (share
            ? '<p class="muted-small">Shareable report: <a href="' +
              escapeHtml(share) +
              '" class="link-accent break-all">' +
              escapeHtml(share) +
              "</a></p>"
            : "") +
          (canon
            ? '<p class="muted-small">Public results path: <span class="break-all">' +
              escapeHtml(canon) +
              "</span></p>"
            : "") +
          (isObj(v.referral) && v.referral.detail
            ? '<p class="muted-small">' + escapeHtml(String(v.referral.detail)) + "</p>"
            : "") +
          "</div>";
        return html;
      }

      function renderNarrative(data) {
        var out = document.getElementById("output");
        if (!out) return;

        var dec = isObj(data.decision) ? data.decision : {};
        var val = isObj(dec.validation) ? dec.validation : {};
        var strat = isObj(data.strategy) ? data.strategy : {};
        var vk = verdictKey(dec.verdict);
        var expl = buildExplanation(dec, strat);
        var diag = buildDiagnosis(dec, val, strat);
        var means = buildWhatItMeans(vk, dec);
        window.__aethraPlan =
          isObj(data.saas_layer) && data.saas_layer.plan ? String(data.saas_layer.plan) : "free";
        var eobrBlock = buildAethraExecutionOutreachBrandRevenueBlock(data);
        var conversionIntelBlock = buildConversionIntelligenceBlock();
        var scalingIntelBlock = buildScalingIntelligenceBlock();
        var portfolioIntelNarrativeBlock = buildPortfolioIntelligenceNarrativeBlock();
        var memHtml = buildMemoryInsight(data);
        var runtimeHtml = buildRuntimePanels(data);
        var portfolioTop = buildPortfolioDashboard(data);
        var supplyExecHtml = buildSupplyExecutionPack(data);
        var synergyTop = buildSynergyBlock(data);
        var scalingStrip = buildScalingStrip(data);
        var profitBanner = buildProfitEnforcementBanner(data);
        var invoicesBlock = buildInvoicesBlock(data);
        var m = formatMetrics(dec);
        var institutionalBlock = buildInstitutionalBriefingBlock(data);
        var economicBlock = buildEconomicSystemBlock(data);
        var ideasBlock = buildSuggestedOpportunitiesBlock(data);
        var viralBlock = buildViralShareBlock(data);

        out.innerHTML =
          '<div class="narrative">' +
          portfolioTop +
          supplyExecHtml +
          synergyTop +
          scalingStrip +
          profitBanner +
          invoicesBlock +
          '<div class="narrative-block">' +
          "<h2>Verdict</h2>" +
          '<div class="body">' +
          '<p class="verdict-line ' +
          escapeHtml(vk) +
          '">' +
          escapeHtml(verdictHeadline(vk)) +
          "</p>" +
          "<p><strong>Classification:</strong> " +
          escapeHtml(String(dec.verdict || "pending").toUpperCase()) +
          "</p>" +
          "</div></div>" +
          institutionalBlock +
          economicBlock +
          ideasBlock +
          viralBlock +
          '<div class="narrative-block"><h2>Explanation</h2><div class="body">' +
          paragraphize(expl) +
          "</div></div>" +
          '<div class="narrative-block"><h2>Diagnosis</h2><div class="body">' +
          paragraphize(diag) +
          "</div></div>" +
          '<div class="narrative-block"><h2>What this means</h2><div class="body">' +
          paragraphize(means) +
          "</div></div>" +
          eobrBlock +
          conversionIntelBlock +
          scalingIntelBlock +
          portfolioIntelNarrativeBlock +
          '<div class="narrative-block"><h2>Signal</h2><p class="muted-small narrative-kicker">Ledger and memory</p><div class="body">' +
          memHtml +
          "</div></div>" +
          runtimeHtml +
          '<div class="narrative-block subtle"><h2>Confidence and score</h2><div class="body">' +
          '<div class="metrics-row">' +
          '<div class="metric"><div class="label">Confidence</div><div class="value">' +
          escapeHtml(m.conf) +
          "</div></div>" +
          '<div class="metric"><div class="label">Viability</div><div class="value">' +
          escapeHtml(m.viability) +
          "</div></div>" +
          '<div class="metric"><div class="label">Demand</div><div class="value">' +
          escapeHtml(m.demand) +
          "</div></div>" +
          '<div class="metric"><div class="label">Differentiation</div><div class="value">' +
          escapeHtml(m.differentiation) +
          "</div></div>" +
          "</div>" +
          "<p>Figures reflect the engine&rsquo;s internal scoring model, not third-party market research. Use them as structured priors, not guarantees.</p>" +
          "</div></div>" +
          "</div>";
        void refreshConversionIntelligence();
        void refreshScalingIntelligence();
        void refreshPortfolioLiveSpans();
      }

      function showLoading() {
        var out = document.getElementById("output");
        if (!out) return;
        out.innerHTML =
          '<div class="loading-state"><div class="loading-ring"></div>Assessment in progress.</div>';
      }

      function showError(msg) {
        var out = document.getElementById("output");
        if (!out) return;
        out.innerHTML =
          '<div class="narrative"><div class="narrative-block"><div class="body"><p>' +
          escapeHtml(msg) +
          "</p></div></div></div>";
      }

      async function run() {
        var ideaEl = document.getElementById("idea");
        var idea = ideaEl && ideaEl.value ? String(ideaEl.value).trim() : "";
        var status = document.getElementById("status");
        var runBtn = document.getElementById("runBtn");

        if (status) {
          status.textContent = "";
          status.className = "status";
        }

        if (!idea) {
          if (status) {
            status.textContent = "Add an idea, business context, or URL to begin.";
            status.classList.add("err");
          }
          return;
        }

        if (runBtn) runBtn.disabled = true;
        showLoading();

        try {
          var runPayload = { input: idea };
          try {
            var refN = parseInt(localStorage.getItem("aethra_referrals") || "0", 10);
            if (refN > 0) runPayload.referrals = refN;
            var planPick = localStorage.getItem("aethra_plan");
            if (planPick) runPayload.plan = planPick;
          } catch (e) {
            /* ignore */
          }
          var res = await fetch("/run", {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify(runPayload),
          });
          var text = await res.text();
          var data;
          try {
            data = text ? JSON.parse(text) : {};
          } catch (e) {
            var out = document.getElementById("output");
            if (out) {
              out.innerHTML =
                '<div class="narrative"><div class="narrative-block"><div class="body"><p>The server returned a non-JSON response (HTTP ' +
                escapeHtml(String(res.status)) +
                "). Check that the API is running and try again.</p></div></div></div>";
            }
            if (status) {
              status.textContent = "HTTP " + res.status + " · response was not JSON";
              status.classList.add("err");
            }
            if (runBtn) runBtn.disabled = false;
            return;
          }

          if (res.status === 429) {
            showError((data && data.message) || "Daily assessment limit reached for this tier.");
            if (status) {
              status.textContent = "Daily limit reached — adjust plan or refer peers for bonus assessments";
              status.classList.add("err");
            }
            if (runBtn) runBtn.disabled = false;
            return;
          }

          if (data && data.ok === false && data.error) {
            showError(String(data.error));
            if (status) {
              status.textContent = "Request could not complete";
              status.classList.add("err");
            }
          } else {
            try {
              renderNarrative(data);
            } catch (renderErr) {
              showError(
                "Could not render this response. Raw JSON is valid; UI renderer hit: " +
                  (renderErr.message || String(renderErr))
              );
              if (status) {
                status.textContent = "Render error";
                status.classList.add("err");
              }
              if (runBtn) runBtn.disabled = false;
              return;
            }
            if (status) {
              if (res.ok) {
                status.textContent = "Assessment complete — review the pathway below";
                status.classList.add("ok");
              } else {
                status.textContent = "HTTP " + res.status;
                status.classList.add("err");
              }
            }
          }
        } catch (e) {
          showError(e.message || String(e));
          if (status) {
            status.textContent = "Network error";
            status.classList.add("err");
          }
        }

        if (runBtn) runBtn.disabled = false;
      }

      document.addEventListener("click", async function (ev) {
        var btn = ev.target && ev.target.closest ? ev.target.closest("#executeBtn") : null;
        if (!btn) return;
        ev.preventDefault();
        var ideaEl = document.getElementById("idea");
        var idea = ideaEl && ideaEl.value ? String(ideaEl.value).trim() : "";
        var st = document.getElementById("status");
        var fb = document.getElementById("executionFeedback");
        if (!idea) {
          if (st) {
            st.textContent = "A thesis or URL is required before execution.";
            st.className = "status err";
          }
          return;
        }
        btn.disabled = true;
        if (fb) fb.textContent = "";
        if (st) {
          st.textContent = "Starting execution…";
          st.className = "status";
        }
        try {
          var res = await fetch("/api/v1/execution/start", {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
              idea: idea,
              plan: window.__aethraPlan || "free",
            }),
          });
          var data = await res.json().catch(function () {
            return {};
          });
          if (!res.ok) {
            if (st) {
              st.textContent =
                (data && data.message) || (data && data.error) || "Execution could not complete.";
              st.className = "status err";
            }
            return;
          }
          var lines =
            "Execution initiated.\n\nSuppliers are locked.\nOutreach is being deployed.\nPipeline will begin populating as responses arrive.";
          if (fb) {
            fb.innerHTML = lines
              .split("\n")
              .filter(function (x) {
                return x.length;
              })
              .map(function (line) {
                return "<p class=\"execution-line\">" + escapeHtml(line) + "</p>";
              })
              .join("");
          }
          if (st) {
            st.textContent = "Execution initiated — outreach deploying.";
            st.className = "status ok";
          }
        } catch (err) {
          if (st) {
            st.textContent = err && err.message ? String(err.message) : "Network error";
            st.className = "status err";
          }
        } finally {
          btn.disabled = false;
        }
      });

      function getWalletUserId() {
        try {
          return localStorage.getItem("aethra_user_id") || "anonymous";
        } catch (e) {
          return "anonymous";
        }
      }

      async function refreshCapitalAllocation() {
        var uid = getWalletUserId();
        var planEl = document.getElementById("capActivePlan");
        var av = document.getElementById("capAvailableBalance");
        var tot = document.getElementById("capTotalCapital");
        var led = document.getElementById("capLedgerBalance");
        var rem = document.getElementById("capRemaining");
        var ul = document.getElementById("capAllocatedList");
        var notice = document.getElementById("capWalletNotice");
        if (!av || !ul) return;
        function fmt(n) {
          return "£" + String(Math.round(Number(n) * 100) / 100);
        }
        try {
          var planRes = await fetch(
            "/api/v1/billing/user-plan?user_id=" + encodeURIComponent(uid)
          );
          var planPayload = await planRes.json().catch(function () {
            return {};
          });
          var activePlan = planPayload && planPayload.plan ? String(planPayload.plan) : "free";
          try {
            localStorage.setItem("aethra_plan", activePlan);
          } catch (e) {
            /* ignore */
          }
          window.__aethraPlan = activePlan;
          if (planEl) planEl.textContent = activePlan;

          var res = await fetch(
            "/api/v1/wallet/capital-snapshot?user_id=" + encodeURIComponent(uid)
          );
          var j = await res.json();
          if (!j.ok) throw new Error("bad");
          av.textContent = fmt(j.available_balance_gbp);
          if (tot) tot.textContent = fmt(j.total_capital_gbp);
          if (led) led.textContent = fmt(j.ledger_balance_gbp);
          if (rem) rem.textContent = fmt(j.remaining_deployable_gbp);
          if (notice) notice.textContent = j.notice || "";
          ul.innerHTML = "";
          var alloc = Array.isArray(j.allocated) ? j.allocated : [];
          if (!alloc.length) {
            ul.innerHTML =
              '<li class="muted-small list-plain">No venture allocations yet.</li>';
          } else {
            var i;
            for (i = 0; i < alloc.length; i++) {
              var li = document.createElement("li");
              li.textContent =
                String(alloc[i].label || "Item") + ": " + fmt(alloc[i].amount_gbp);
              ul.appendChild(li);
            }
          }
        } catch (e) {
          if (planEl) planEl.textContent = "—";
          av.textContent = "—";
          if (tot) tot.textContent = "—";
          if (led) led.textContent = "—";
          if (rem) rem.textContent = "—";
          ul.innerHTML =
            '<li class="muted-small list-plain">Wallet API unavailable.</li>';
        }
      }

      async function refreshLandingIdeas() {
        var ul = document.getElementById("landingIdeasList");
        if (!ul) return;
        try {
          var res = await fetch("/api/v1/ideas");
          if (!res.ok) throw new Error("HTTP " + res.status);
          var j = await res.json();
          var ideas = j && j.ideas && j.ideas.length ? j.ideas : [];
          if (!ideas.length) {
            ul.innerHTML =
              '<li class="muted-small list-plain">No suggestions available.</li>';
            return;
          }
          ul.innerHTML = "";
          var i;
          for (i = 0; i < Math.min(10, ideas.length); i++) {
            var it = ideas[i];
            var li = document.createElement("li");
            li.textContent =
              String(it.idea || "") + " — Score: " + String(it.score != null ? it.score : "—");
            ul.appendChild(li);
          }
        } catch (e) {
          ul.innerHTML =
            '<li class="muted-small list-plain">Connect the host to load opportunities.</li>';
        }
      }

      async function refreshCoreHomePanel() {
        function setText(id, v) {
          var el = document.getElementById(id);
          if (el) el.textContent = v;
        }
        function money(n) {
          return "£" + String(Math.round(Number(n || 0) * 100) / 100);
        }
        try {
          var rev = await fetch("/core/revenue/metrics");
          if (!rev.ok) throw new Error("no core");
          var rv = await rev.json();
          var today = await fetch("/core/revenue/today");
          var td = await today.json();
          setText("home-rev-leads", String(rv.leads_per_day || 0));
          setText("home-rev-msgs", String(rv.messages_sent || 0));
          setText("home-rev-reply", String(rv.reply_rate || 0) + "%");
          setText("home-rev-conv", String(rv.conversion_rate || 0) + "%");
          setText("home-rev-rev", money(rv.revenue_per_day || 0));
          setText("home-exp-launched", String(td.ventures_launched_today || 0));
          setText("home-exp-revenue", money(td.revenue_generated_today_gbp || 0));
          setText("home-exp-running", String(td.experiments_running || 0));
          setText("home-sample-note", "");
        } catch (e) {
          setText(
            "home-sample-note",
            "Core revenue API not available on this host (set CORE_ENABLED=true)."
          );
        }
      }

      document.addEventListener("click", async function (ev) {
        var sampleHome = ev.target && ev.target.closest ? ev.target.closest("#home-sample-btn") : null;
        if (sampleHome) {
          ev.preventDefault();
          var emailEl = document.getElementById("home-sample-email");
          var note = document.getElementById("home-sample-note");
          var email = emailEl && emailEl.value ? String(emailEl.value).trim() : "";
          sampleHome.disabled = true;
          try {
            var res = await fetch("/core/sample-dossier", {
              method: "POST",
              headers: { "Content-Type": "application/json; charset=utf-8" },
              body: JSON.stringify({ email: email, idea: "Homepage capture" }),
            });
            var j = await res.json().catch(function () {
              return {};
            });
            if (note) {
              note.textContent =
                j && j.ok && j.dossier && j.dossier.public_proof_link
                  ? "Sample ready — proof link " + String(j.dossier.public_proof_link)
                  : "Sample endpoint unavailable.";
            }
          } catch (err) {
            if (note) note.textContent = "Sample request failed.";
          } finally {
            sampleHome.disabled = false;
          }
          return;
        }

        var addBtn = ev.target && ev.target.closest ? ev.target.closest("#capAddFundsBtn") : null;
        var upgradeBtn = ev.target && ev.target.closest ? ev.target.closest("#capUpgradePlanBtn") : null;
        if (!addBtn && !upgradeBtn) return;
        ev.preventDefault();

        if (addBtn) {
          addBtn.disabled = true;
          try {
            var uid = getWalletUserId();
            var res = await fetch("/api/v1/billing/top-up-session", {
              method: "POST",
              headers: { "Content-Type": "application/json; charset=utf-8" },
              body: JSON.stringify({ user_id: uid, amount_gbp: 50 }),
            });
            var j = await res.json().catch(function () {
              return {};
            });
            if (j.url) {
              window.location.href = j.url;
              return;
            }
            alert(
              (j && j.detail) ||
                (j && j.error && String(j.error)) ||
                "Checkout is not available on this host yet. For live top-up, configure billing keys; in development, use Record payment."
            );
          } catch (err) {
            alert(err && err.message ? String(err.message) : "Could not start top-up. Try again shortly.");
          } finally {
            addBtn.disabled = false;
          }
          return;
        }

        if (upgradeBtn) {
          upgradeBtn.disabled = true;
          try {
            var uid2 = getWalletUserId();
            var desired = window.prompt(
              "Choose participation: operator (£49/mo) or portfolio (£199/mo)",
              "operator"
            );
            if (!desired) {
              upgradeBtn.disabled = false;
              return;
            }
            var planPick = String(desired).toLowerCase().trim();
            if (planPick !== "operator" && planPick !== "portfolio") {
              alert("Enter operator or portfolio.");
              upgradeBtn.disabled = false;
              return;
            }

            var sres = await fetch("/api/v1/billing/create-subscription-session", {
              method: "POST",
              headers: { "Content-Type": "application/json; charset=utf-8" },
              body: JSON.stringify({ user_id: uid2, plan: planPick }),
            });
            var sj = await sres.json().catch(function () {
              return {};
            });
            if (sj.url) {
              window.location.href = sj.url;
              return;
            }
            alert(
              (sj && sj.detail) ||
                (sj && sj.error && String(sj.error)) ||
                "Subscription checkout is not available. Confirm plan price IDs are configured on the host."
            );
          } catch (err2) {
            alert(err2 && err2.message ? String(err2.message) : "Could not start plan change. Try again shortly.");
          } finally {
            upgradeBtn.disabled = false;
          }
        }
      });

      document.addEventListener("DOMContentLoaded", function () {
        void refreshPortfolioLiveSpans();
        void refreshLandingIdeas();
        void refreshCapitalAllocation();
        void refreshCoreHomePanel();
        setInterval(function () {
          void refreshCoreHomePanel();
        }, 25000);

        try {
          var qs = new URLSearchParams(window.location.search || "");
          if (qs.get("stripe") === "success" && qs.get("sub") === "1") {
            setTimeout(function () {
              void refreshCapitalAllocation();
            }, 1200);
          }
          if (qs.get("stripe") === "success" && qs.get("topup") === "1") {
            setTimeout(function () {
              void refreshCapitalAllocation();
            }, 2000);
            setTimeout(function () {
              void refreshCapitalAllocation();
            }, 5000);
            var capEl = document.getElementById("capital-allocation");
            if (capEl && capEl.scrollIntoView) {
              capEl.scrollIntoView({ behavior: "smooth", block: "start" });
            }
            if (window.history && window.history.replaceState) {
              var clean = new URL(window.location.href);
              clean.searchParams.delete("stripe");
              clean.searchParams.delete("topup");
              clean.searchParams.delete("session_id");
              var tail = clean.search || "";
              window.history.replaceState({}, "", clean.pathname + tail + (clean.hash || ""));
            }
          }
        } catch (e) {
          /* ignore */
        }
      });

      window.run = run;
      var rb = document.getElementById("runBtn");
      if (rb) rb.addEventListener("click", run);
  })();
}
