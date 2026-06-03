import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { calcEnergy, getMonthlyBill, TARIFFS } from "./electricity";

function detectAnomalies(appliances, totalUnits, tariff) {
  const ALWAYS_ON = ["fridge", "refriger", "freezer", "router", "modem"];
  const isAlwaysOn = (a) => {
    const tag = `${a.name} ${a.category || ""}`.toLowerCase();
    return ALWAYS_ON.some((k) => tag.includes(k));
  };

  const list = appliances
    .map((a) => ({ ...a, units: calcEnergy(a, 30) }))
    .sort((x, y) => y.units - x.units);

  const anomalies = [];

  list.forEach((a) => {
    const share = totalUnits > 0 ? (a.units / totalUnits) * 100 : 0;
    if (share >= 40)
      anomalies.push(`HIGH: ${a.name} makes up ${share.toFixed(0)}% of total usage (~${a.units.toFixed(0)} kWh)`);
  });

  list.forEach((a) => {
    if (!isAlwaysOn(a) && a.hoursPerDay >= 16)
      anomalies.push(`MEDIUM: ${a.name} runs ${a.hoursPerDay}h/day — unusually long runtime`);
  });

  list.forEach((a) => {
    if (a.wattage >= 1500 && a.hoursPerDay >= 4)
      anomalies.push(`MEDIUM: ${a.name} is high-wattage (${a.wattage}W) running ${a.hoursPerDay}h/day`);
  });

  if (totalUnits >= 600)
    anomalies.push(`HIGH: Total usage ${totalUnits.toFixed(0)} kWh/month is very high`);
  else if (totalUnits >= 400)
    anomalies.push(`MEDIUM: Total usage ${totalUnits.toFixed(0)} kWh/month is above average`);

  return anomalies;
}

export function generatePDF({ appliances, state, username }) {
  const tariff = TARIFFS[state] || TARIFFS["maharashtra"];
  const totalUnits = appliances.reduce((s, a) => s + calcEnergy(a, 30), 0);
  const totalBill = getMonthlyBill(totalUnits, tariff);
  const dailyUnits = appliances.reduce((s, a) => s + calcEnergy(a, 1), 0);
  const anomalies = detectAnomalies(appliances, totalUnits, tariff);

  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // ── Header background
  doc.setFillColor(10, 15, 30);
  doc.rect(0, 0, pageW, 42, "F");

  // ── Logo circle
  doc.setFillColor(59, 130, 246);
  doc.circle(20, 21, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("A", 17.5, 24.5);

  // ── Title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("AmperAI", 33, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 180, 255);
  doc.text("Smart Energy Management Report", 33, 26);

  // ── Right side meta
  doc.setFontSize(8);
  doc.setTextColor(180, 190, 220);
  doc.text(`Generated: ${dateStr}`, pageW - 14, 16, { align: "right" });
  doc.text(`User: ${username || "User"}`, pageW - 14, 23, { align: "right" });
  doc.text(`State: ${state?.toUpperCase() || "N/A"}`, pageW - 14, 30, { align: "right" });

  let y = 52;

  // ── Summary Stats boxes
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Monthly Summary", 14, y);
  y += 6;

  const stats = [
    { label: "Daily Usage", value: `${dailyUnits.toFixed(2)} kWh`, color: [59, 130, 246] },
    { label: "Monthly Units", value: `${totalUnits.toFixed(1)} kWh`, color: [234, 179, 8] },
    { label: "Estimated Bill", value: `Rs. ${totalBill.toFixed(0)}`, color: [239, 68, 68] },
    { label: "Appliances", value: `${appliances.length} tracked`, color: [34, 197, 94] },
  ];

  const boxW = (pageW - 28) / 4;
  stats.forEach((s, i) => {
    const x = 14 + i * (boxW + 2);
    doc.setFillColor(245, 247, 255);
    doc.roundedRect(x, y, boxW, 22, 3, 3, "F");
    doc.setFillColor(...s.color);
    doc.roundedRect(x, y, boxW, 4, 3, 3, "F");
    doc.rect(x, y + 2, boxW, 2, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...s.color);
    doc.text(s.value, x + boxW / 2, y + 14, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 120);
    doc.text(s.label, x + boxW / 2, y + 20, { align: "center" });
  });

  y += 32;

  // ── Appliance Table
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Appliance Breakdown", 14, y);
  y += 4;

  const sorted = [...appliances].sort(
    (a, b) => calcEnergy(b, 30) - calcEnergy(a, 30)
  );

  autoTable(doc, {
    startY: y,
    head: [["Appliance", "Category", "Wattage", "Hrs/Day", "Monthly kWh", "Monthly Cost"]],
    body: sorted.map((a) => {
      const units = calcEnergy(a, 30);
      const cost = getMonthlyBill(units, tariff);
      return [
        a.name,
        a.category || "—",
        `${a.wattage}W`,
        `${a.hoursPerDay}h`,
        `${units.toFixed(2)} kWh`,
        `Rs. ${cost.toFixed(0)}`,
      ];
    }),
    headStyles: {
      fillColor: [10, 15, 30],
      textColor: [180, 200, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: [40, 40, 60] },
    alternateRowStyles: { fillColor: [245, 247, 255] },
    columnStyles: {
      0: { fontStyle: "bold" },
      4: { textColor: [234, 179, 8] },
      5: { textColor: [239, 68, 68] },
    },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 10;

  // ── Anomalies section
  if (anomalies.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("Anomalies Detected", 14, y);
    y += 6;

    anomalies.forEach((a) => {
      const isHigh = a.startsWith("HIGH");
      doc.setFillColor(isHigh ? 254 : 255, isHigh ? 242 : 251, isHigh ? 242 : 235);
      doc.roundedRect(14, y, pageW - 28, 10, 2, 2, "F");
      doc.setFillColor(isHigh ? 239 : 245, isHigh ? 68 : 158, isHigh ? 68 : 11);
      doc.circle(20, y + 5, 2, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(isHigh ? 180 : 160, isHigh ? 30 : 60, 30);
      doc.text(a.replace(/^(HIGH|MEDIUM): /, ""), 25, y + 6);
      y += 13;
    });

    y += 4;
  }

  // ── Footer
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setFillColor(10, 15, 30);
  doc.rect(0, footerY - 4, pageW, 20, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 180, 255);
  doc.text("Generated by AmperAI — Smart Energy Manager", pageW / 2, footerY + 2, { align: "center" });

  // ── Save
  const fileName = `AmperAI_Report_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}.pdf`;
  doc.save(fileName);
}