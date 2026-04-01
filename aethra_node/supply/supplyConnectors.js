"use strict";

/**
 * Layer 2 - live search connectors.
 * Google Places: real when GOOGLE_PLACES_API_KEY is set.
 * Other channels: structured stubs (wire credentials to activate).
 */

function stubConnector(name, searchTemplates, operatorNext) {
  return {
    connector: name,
    status: "credential_required",
    results: [],
    search_templates: searchTemplates,
    operator_next_step: operatorNext,
  };
}

function hashScore(seed, min, max) {
  let h = 0;
  const s = String(seed || "");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const t = min + ((h % 1000) / 1000) * (max - min);
  return Math.round(t * 10) / 10;
}

function mapPlaceToRow(place, idx, bucket) {
  const id = place.id || `place_${idx}`;
  const dn = place.displayName;
  const name =
    (dn && typeof dn === "object" && dn.text) || (typeof dn === "string" ? dn : "") || "Unknown listing";
  const addr = place.formattedAddress || "";
  const phone = place.nationalPhoneNumber || "";
  const web = place.websiteUri || "";
  const maps = place.googleMapsUri || "";
  return {
    name,
    location: addr || bucket,
    type: "google_places_listing",
    moq: "verify_with_supplier",
    lead_time: "verify_with_supplier",
    price_signal: "quote_required",
    contact: phone || web || maps || "listing",
    score: hashScore(id + name, 7.2, 8.9),
    notes:
      "Live Places listing - confirm wholesale fit before PO." + (maps ? " Maps: " + maps : ""),
    _raw_place_id: id,
    intel_source: "google_places_text_search",
  };
}

async function googlePlacesSearch(textQuery, regionCode) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    return {
      connector: "google_places",
      status: "credential_required",
      results: [],
      search_templates: [String(textQuery || "").slice(0, 120)],
      operator_next_step:
        "Set GOOGLE_PLACES_API_KEY (Places API v1) for live UK/EU supplier discovery.",
    };
  }

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri",
      },
      body: JSON.stringify({
        textQuery: String(textQuery || "").slice(0, 280),
        maxResultCount: 5,
        regionCode: regionCode || "GB",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return {
        connector: "google_places",
        status: "error",
        results: [],
        error: err.slice(0, 400),
      };
    }

    const data = await res.json();
    const places = Array.isArray(data.places) ? data.places : [];
    return {
      connector: "google_places",
      status: "ok",
      region_code: regionCode,
      results: places.map((p, i) => mapPlaceToRow(p, i, regionCode)),
    };
  } catch (e) {
    return {
      connector: "google_places",
      status: "error",
      results: [],
      error: String(e && e.message ? e.message : e),
    };
  }
}

function takeFive(rows) {
  return (Array.isArray(rows) ? rows : []).slice(0, 5);
}

async function runLiveConnectorSweep(productContext, layer1) {
  const base = String(productContext || "industrial supply").slice(0, 200);
  const ukQuery = `${base} supplier wholesale UK B2B`;
  const euQuery = `${base} supplier wholesale Germany Netherlands industrial`;
  const chinaTemplates = [
    `${base} OEM concentrate Alibaba`,
    `${base} 1688 factory MOQ`,
    `${base} bulk chemical manufacturer FOB China`,
  ];

  const [ukRes, euRes] = await Promise.all([
    googlePlacesSearch(ukQuery, "GB"),
    googlePlacesSearch(euQuery, "DE"),
  ]);

  const uk = takeFive(ukRes.results);
  const eu = takeFive(euRes.results);

  const chinaFromCurated = (layer1 && layer1.china_manufacturers) || [];
  const china = takeFive(
    chinaFromCurated.length
      ? chinaFromCurated.map((r) => ({
          name: r.name,
          location: r.location,
          type: r.type,
          moq: r.moq,
          lead_time: r.lead_time,
          price_signal: r.price_signal,
          contact: r.contact,
          score: r.score,
          notes: r.notes,
          intel_source: r.intel_source || "aethra_curated_library",
        }))
      : []
  );

  const manifest = [
    ukRes,
    euRes,
    stubConnector(
      "alibaba_1688",
      chinaTemplates,
      "Wire official Alibaba / 1688 API or procurement agent for live manufacturer rows."
    ),
    stubConnector(
      "linkedin_sales_nav",
      [`${base} procurement manager`, `${base} facilities director UK`],
      "Sales Navigator exports; AETHRA classifies and drafts - cap list size, respect ToS."
    ),
    stubConnector(
      "europages",
      [`${base} supplier site:europages.com`],
      "Europages API or manual directory merge when available."
    ),
    stubConnector(
      "amazon_business_reverse",
      [`${base} commercial pack size Amazon Business`],
      "Reverse-source SKUs for benchmark pricing - not a substitute for trade quotes."
    ),
  ];

  const liveOk = ukRes.status === "ok" || euRes.status === "ok";
  const freshnessNote = liveOk
    ? "Live Google Places merged for UK/EU buckets - validate wholesale fit and credit terms."
    : "Curated + connector templates active. Set GOOGLE_PLACES_API_KEY for live regional discovery.";

  return {
    top_suppliers_uk: uk,
    top_suppliers_eu: eu,
    top_manufacturers_china: china,
    connector_manifest: manifest,
    freshness_note: freshnessNote,
  };
}

module.exports = {
  runLiveConnectorSweep,
  googlePlacesSearch,
  stubConnector,
};
