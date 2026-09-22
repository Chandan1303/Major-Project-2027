import fs from "node:fs/promises";
import path from "node:path";
import { Workbook, SpreadsheetFile } from "@oai/artifact-tool";

const root = "C:\\Users\\chand\\OneDrive\\Desktop\\Major-project";
const inputs = [
  { name: "Training Data", file: "C:\\Users\\chand\\OneDrive\\Desktop\\master_sugarcane_training_dataset.csv" },
  { name: "Production Data", file: "C:\\Users\\chand\\OneDrive\\Desktop\\Cleaned_Sugarcane_Dataset.csv" },
  { name: "Variety Master", file: path.join(root, "backend", "data", "sugarcane_varieties_master.csv") },
];
const outputPath = path.join(root, "sugarcane_complete_imputed_workbook.xlsx");

function parseCsv(text) {
  const rows = [];
  let row = [], value = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(value); value = ""; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(value); value = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else value += char;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  return rows;
}

function numericValue(value) {
  const cleaned = String(value).trim().replace(/,/g, "");
  if (!cleaned || !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(cleaned)) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function mode(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))[0][0];
}

function cleanData(headers, rows) {
  const normalizedRows = rows.map((row) => headers.map((_, index) => String(row[index] ?? "").trim()));
  const audit = [];
  for (let col = 0; col < headers.length; col += 1) {
    const observed = normalizedRows.map((row) => row[col]).filter(Boolean);
    const numeric = observed.length > 0 && observed.filter((value) => numericValue(value) !== null).length / observed.length >= 0.95;
    const fill = numeric ? median(observed.map(numericValue).filter((value) => value !== null)) : mode(observed);
    let filled = 0;
    for (const row of normalizedRows) {
      if (!row[col]) { row[col] = String(fill); filled += 1; }
    }
    audit.push({ field: headers[col], type: numeric ? "Numeric" : "Categorical", strategy: numeric ? "Median" : "Mode", filled });
  }
  return { rows: normalizedRows, audit };
}

function colName(index) {
  let result = "";
  let n = index + 1;
  while (n > 0) { const rem = (n - 1) % 26; result = String.fromCharCode(65 + rem) + result; n = Math.floor((n - 1) / 26); }
  return result;
}

const workbook = Workbook.create();
const allAudits = [];
for (const input of inputs) {
  const csvText = await fs.readFile(input.file, "utf8");
  const [headers, ...rows] = parseCsv(csvText);
  const { rows: cleanedRows, audit } = cleanData(headers, rows);
  const sheet = workbook.worksheets.add(input.name);
  sheet.showGridLines = false;
  sheet.getRangeByIndexes(0, 0, 1, headers.length).values = [headers];
  for (let start = 0; start < cleanedRows.length; start += 150) {
    const block = cleanedRows.slice(start, start + 150).map((row) => row.map((value, index) => {
      const observedNumeric = audit[index].type === "Numeric" ? numericValue(value) : null;
      return observedNumeric ?? value;
    }));
    sheet.getRangeByIndexes(start + 1, 0, block.length, headers.length).values = block;
  }
  const headerRange = sheet.getRangeByIndexes(0, 0, 1, headers.length);
  headerRange.format = { fill: "#1F4E78", font: { bold: true, color: "#FFFFFF" }, wrapText: true };
  headerRange.format.rowHeight = 30;
  sheet.freezePanes.freezeRows(1);
  sheet.freezePanes.freezeColumns(Math.min(2, headers.length));
  for (let col = 0; col < headers.length; col += 1) {
    const range = sheet.getRangeByIndexes(0, col, cleanedRows.length + 1, 1);
    range.format.columnWidth = Math.min(Math.max(headers[col].length + 2, 12), 24);
    if (audit[col].type === "Numeric") range.format.numberFormat = "0.00";
  }
  allAudits.push(...audit.map((item) => ({ sheet: input.name, ...item })));
}

const guide = workbook.worksheets.add("Imputation Guide");
guide.showGridLines = false;
guide.getRange("A1:E1").merge();
guide.getRange("A1").values = [["Sugarcane Dataset: Missing-Value Treatment"]];
guide.getRange("A1").format = { fill: "#1F4E78", font: { bold: true, color: "#FFFFFF", size: 14 }, horizontalAlignment: "center" };
guide.getRange("A3:B7").values = [
  ["Rule", "Implementation"],
  ["Numeric columns", "Blank values are replaced with that sheet's column median (robust to extreme agricultural values)."],
  ["Categorical columns", "Blank values are replaced with that sheet's most frequent observed value (mode)."],
  ["Scope", "Each source is imputed independently; no values are borrowed across Training, Production, and Variety datasets."],
  ["Audit", "The table below records the method and number of replacements for every field."],
];
guide.getRange("A3:B3").format = { fill: "#D9EAF7", font: { bold: true } };
guide.getRange("A10:E10").values = [["Sheet", "Field", "Type", "Strategy", "Values Replaced"]];
guide.getRange("A10:E10").format = { fill: "#1F4E78", font: { bold: true, color: "#FFFFFF" } };
const auditMatrix = allAudits.map((item) => [item.sheet, item.field, item.type, item.strategy, item.filled]);
guide.getRangeByIndexes(10, 0, auditMatrix.length, 5).values = auditMatrix;
guide.freezePanes.freezeRows(10);
guide.getRange(`A1:B${auditMatrix.length + 10}`).format.columnWidth = 32;
guide.getRange(`C1:E${auditMatrix.length + 10}`).format.columnWidth = 18;
guide.getRange("B4:B7").format.wrapText = true;
guide.getRange("B4:B7").format.rowHeight = 34;

const verification = await workbook.inspect({ kind: "table", range: "Imputation Guide!A1:E20", include: "values", tableMaxRows: 20, tableMaxCols: 5 });
console.log(verification.ndjson);
const exported = await SpreadsheetFile.exportXlsx(workbook);
await exported.save(outputPath);
console.log(JSON.stringify({ outputPath, sheets: workbook.worksheets.items.map((sheet) => sheet.name), auditRows: allAudits.length }));
