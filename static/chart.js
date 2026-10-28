// chart.js — for visualizing Smart Water Quality historical trends

document.addEventListener("DOMContentLoaded", function () {
  const table = document.getElementById("dataTable");
  if (!table) return;

  // Get data rows (skip header)
  const rows = Array.from(table.querySelectorAll("tr")).slice(1);

  // Arrays for data
  const labels = [];
  const phData = [], tdsData = [], caData = [], mgData = [],
        kData = [], naData = [], so4Data = [], clData = [];

  // Extract values from table cells
  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    if (cells.length >= 10) {
      labels.push(cells[0].innerText);
      phData.push(parseFloat(cells[1].innerText) || 0);
      tdsData.push(parseFloat(cells[2].innerText) || 0);
      caData.push(parseFloat(cells[3].innerText) || 0);
      mgData.push(parseFloat(cells[4].innerText) || 0);
      kData.push(parseFloat(cells[5].innerText) || 0);
      naData.push(parseFloat(cells[6].innerText) || 0);
      so4Data.push(parseFloat(cells[7].innerText) || 0);
      clData.push(parseFloat(cells[8].innerText) || 0);
    }
  });

  // Get chart canvas
  const ctx = document.getElementById("trendChart").getContext("2d");

  // Create Chart
  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels.reverse(),  // Show oldest first
      datasets: [
        { label: "pH", data: phData.reverse(), borderColor: "#0077b6", fill: false, tension: 0.3 },
        { label: "TDS (ppm)", data: tdsData.reverse(), borderColor: "#ef476f", fill: false, tension: 0.3 },
        { label: "Calcium (mg/L)", data: caData.reverse(), borderColor: "#06d6a0", fill: false, tension: 0.3 },
        { label: "Magnesium (mg/L)", data: mgData.reverse(), borderColor: "#ffd166", fill: false, tension: 0.3 },
        { label: "Potassium (mg/L)", data: kData.reverse(), borderColor: "#8338ec", fill: false, tension: 0.3 },
        { label: "Sodium (mg/L)", data: naData.reverse(), borderColor: "#118ab2", fill: false, tension: 0.3 },
        { label: "Sulphate (mg/L)", data: so4Data.reverse(), borderColor: "#ff6700", fill: false, tension: 0.3 },
        { label: "Chloride (mg/L)", data: clData.reverse(), borderColor: "#073b4c", fill: false, tension: 0.3 }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Water Composition Trends Over Time",
          color: "#023e8a",
          font: { size: 18, weight: "bold" }
        },
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 20,
            color: "#333"
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Sample Date & Time",
            color: "#023e8a",
            font: { size: 14 }
          },
          ticks: { color: "#444" }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Concentration (mg/L or ppm)",
            color: "#023e8a",
            font: { size: 14 }
          },
          ticks: { color: "#444" },
          grid: { color: "rgba(0,0,0,0.05)" }
        }
      }
    }
  });
});
