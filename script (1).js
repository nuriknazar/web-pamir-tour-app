/* ---------------------------------------------------------
   M41 — Pamir Highway jeep booking prototype (vanilla JS)
--------------------------------------------------------- */

const WAYPOINTS = [
  { code: "DYU", name: "Dushanbe", elevation: 803 },
  { code: "KLK", name: "Kalaikhum", elevation: 1300 },
  { code: "KHO", name: "Khorog", elevation: 2200 },
  { code: "ISH", name: "Ishkashim", elevation: 2600 },
  { code: "MUR", name: "Murghab", elevation: 3630 },
  { code: "AKB", name: "Ak-Baital Pass", elevation: 4655, isPass: true },
  { code: "KZA", name: "Kyzyl-Art Pass", elevation: 4280, isPass: true },
  { code: "SAR", name: "Sary-Tash", elevation: 3170 },
  { code: "OSH", name: "Osh", elevation: 963 },
];

const RIDES = [
  {
    id: "r1",
    operator: "Roof of the World Travel",
    vehicle: "Toyota Land Cruiser 4x4",
    departs: "07:30",
    duration: "3 days",
    stops: ["Khorog", "Murghab", "Karakul Lake"],
    sharedSeatPrice: 145,
    privatePrice: 520,
    seatsLeft: 2,
  },
  {
    id: "r2",
    operator: "Discover The Pamirs",
    vehicle: "UAZ Patriot 4x4",
    departs: "08:00",
    duration: "7 days",
    stops: ["Jizeu", "Wakhan Valley", "Bulunkul", "Karakul Lake"],
    sharedSeatPrice: 410,
    privatePrice: 1380,
    seatsLeft: 1,
  },
  {
    id: "r3",
    operator: "Visit Alay",
    vehicle: "Mitsubishi Delica 4x4",
    departs: "06:45",
    duration: "2 days",
    stops: ["Sary-Tash", "Kyzyl-Art Pass"],
    sharedSeatPrice: 95,
    privatePrice: 340,
    seatsLeft: 3,
  },
];

const state = {
  direction: "d2o",
  seatType: "shared",
  travelers: 2,
  selectedRide: null,
  permitChecked: false,
  name: "",
  email: "",
};

function buildElevationSVG(direction) {
  const points = direction === "d2o" ? WAYPOINTS : WAYPOINTS.slice().reverse();
  const w = 900, h = 160, padX = 40, padTop = 20, padBottom = 34;
  const maxEl = 4655, minEl = 700;

  const coords = points.map((p, i) => {
    const x = padX + (i * (w - padX * 2)) / (points.length - 1);
    const y = padTop + (1 - (p.elevation - minEl) / (maxEl - minEl)) * (h - padTop - padBottom);
    return { ...p, x, y };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${h - padBottom} L ${coords[0].x} ${h - padBottom} Z`;

  let svg = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;display:block;">`;
  svg += `<defs><linearGradient id="elevFill" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#C98A3E" stop-opacity="0.35" />
    <stop offset="100%" stop-color="#C98A3E" stop-opacity="0" />
  </linearGradient></defs>`;
  svg += `<path d="${areaPath}" fill="url(#elevFill)" />`;
  svg += `<path d="${linePath}" fill="none" stroke="#C98A3E" stroke-width="2" />`;

  coords.forEach((c) => {
    svg += `<circle cx="${c.x}" cy="${c.y}" r="${c.isPass ? 5 : 3.5}" fill="${c.isPass ? "#B14A32" : "#F3EEE4"}" stroke="#17212C" stroke-width="1.5" />`;
    svg += `<text x="${c.x}" y="${h - padBottom + 16}" font-size="10" font-family="'IBM Plex Mono', monospace" fill="#8C8577" text-anchor="middle">${c.code}</text>`;
    svg += `<text x="${c.x}" y="${c.y - 10}" font-size="9" font-family="'IBM Plex Mono', monospace" fill="${c.isPass ? "#B14A32" : "#8C8577"}" text-anchor="middle">${c.elevation}m</text>`;
  });

  svg += `</svg>`;
  return svg;
}

function renderElevation() {
  document.getElementById("elevation-wrap").innerHTML = buildElevationSVG(state.direction);
}

function showView(name) {
  ["home", "results", "checkout", "confirmed"].forEach((v) => {
    document.getElementById("view-" + v).hidden = v !== name;
  });
}

function originDestination() {
  return state.direction === "d2o"
    ? { origin: "Dushanbe", destination: "Osh" }
    : { origin: "Osh", destination: "Dushanbe" };
}

function renderResults() {
  const { origin, destination } = originDestination();
  document.getElementById("results-title").textContent = `${origin} → ${destination}`;
  document.getElementById("results-sub").textContent =
    `${state.seatType === "shared" ? "Shared seat" : "Private charter"} · ${state.travelers} traveler${state.travelers > 1 ? "s" : ""}`;

  const container = document.getElementById("results-cards");
  container.innerHTML = "";

  RIDES.forEach((r) => {
    const price = state.seatType === "shared" ? r.sharedSeatPrice : r.privatePrice;
    const priceNote = state.seatType === "shared" ? `per seat · ${r.seatsLeft} left` : "whole vehicle";

    const card = document.createElement("div");
    card.className = "m41-card";
    card.innerHTML = `
      <div>
        <div class="m41-card-op">${r.operator}</div>
        <div class="m41-card-meta">${r.vehicle} · departs ${r.departs} · ${r.duration}</div>
        <div style="margin-top:8px;">${r.stops.map((s) => `<span class="m41-tag">${s}</span>`).join("")}</div>
      </div>
      <div style="text-align:right;">
        <div class="m41-price">$${price}<small>${priceNote}</small></div>
        <button class="m41-cta" style="margin-top:10px;" data-ride="${r.id}">Select</button>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll("button[data-ride]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedRide = RIDES.find((r) => r.id === btn.dataset.ride);
      renderCheckout();
      showView("checkout");
    });
  });
}

function calcTotal() {
  if (!state.selectedRide) return 0;
  return state.seatType === "shared"
    ? state.selectedRide.sharedSeatPrice * state.travelers
    : state.selectedRide.privatePrice;
}

function renderCheckout() {
  const { origin, destination } = originDestination();
  document.getElementById("checkout-sub").textContent = `${state.selectedRide.operator} · ${origin} → ${destination}`;

  document.getElementById("checkout-summary").innerHTML = `
    <div class="m41-summary-row"><span>Ride type</span><span class="m41-mono">${state.seatType === "shared" ? "Shared seat" : "Private charter"}</span></div>
    <div class="m41-summary-row"><span>Travelers</span><span class="m41-mono">${state.travelers}</span></div>
    <div class="m41-summary-row"><span>Route</span><span class="m41-mono">${origin} → ${destination}</span></div>
    <div class="m41-summary-row total"><span>Total</span><span>$${calcTotal()}</span></div>
  `;
  updateConfirmButton();
}

function updateConfirmButton() {
  document.getElementById("btn-confirm").disabled = !(state.permitChecked && state.name && state.email);
}

function renderConfirmed() {
  const { origin, destination } = originDestination();
  document.getElementById("confirmed-sub").textContent = `A confirmation has been sent to ${state.email || "your email"}.`;
  document.getElementById("confirmed-checklist").innerHTML = `
    <li>🚙 ${state.selectedRide.operator} — ${origin} → ${destination}, departs ${state.selectedRide.departs}</li>
    <li>📋 Arrange your GBAO permit via evisa.tj before departure</li>
    <li>🧭 Meeting point details will be sent 48 hours before pickup</li>
    <li>💵 Bring cash — ATMs are scarce along the route</li>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  renderElevation();

  document.getElementById("btn-d2o").addEventListener("click", () => {
    state.direction = "d2o";
    document.getElementById("btn-d2o").classList.add("active");
    document.getElementById("btn-o2d").classList.remove("active");
    renderElevation();
  });

  document.getElementById("btn-o2d").addEventListener("click", () => {
    state.direction = "o2d";
    document.getElementById("btn-o2d").classList.add("active");
    document.getElementById("btn-d2o").classList.remove("active");
    renderElevation();
  });

  document.getElementById("input-travelers").addEventListener("change", (e) => {
    state.travelers = Number(e.target.value);
  });

  document.getElementById("input-seattype").addEventListener("change", (e) => {
    state.seatType = e.target.value;
  });

  document.getElementById("btn-search").addEventListener("click", () => {
    renderResults();
    showView("results");
  });

  document.getElementById("btn-back-home").addEventListener("click", () => showView("home"));
  document.getElementById("btn-back-results").addEventListener("click", () => showView("results"));

  document.getElementById("input-name").addEventListener("input", (e) => {
    state.name = e.target.value;
    updateConfirmButton();
  });

  document.getElementById("input-email").addEventListener("input", (e) => {
    state.email = e.target.value;
    updateConfirmButton();
  });

  document.getElementById("input-permit").addEventListener("change", (e) => {
    state.permitChecked = e.target.checked;
    updateConfirmButton();
  });

  document.getElementById("btn-confirm").addEventListener("click", () => {
    renderConfirmed();
    showView("confirmed");
  });

  document.getElementById("btn-restart").addEventListener("click", () => {
    state.selectedRide = null;
    state.permitChecked = false;
    state.name = "";
    state.email = "";
    document.getElementById("input-name").value = "";
    document.getElementById("input-email").value = "";
    document.getElementById("input-permit").checked = false;
    showView("home");
  });
});
