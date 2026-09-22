import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "C:/Users/chand/OneDrive/Desktop/Major-project/outputs/australia_tableau_dataset";
await fs.mkdir(outputDir, { recursive: true });

const states = [
  ["Australian Capital Territory", "ACT", "Territory", 57582, 3.54, 118775, 3.96, 361766, 481713, 1.68, 1.13],
  ["New South Wales", "NSW", "State", 829130, 0.95, 96479, 1.22, 7144292, 8545100, 31.79, 0.95],
  ["Northern Territory", "NT", "Territory", 33960, 1.04, 128442, 4.60, 255407, 262200, 0.96, -0.07],
  ["Queensland", "QLD", "State", 523847, 2.23, 92392, 2.11, 4404744, 5618800, 20.15, 1.58],
  ["South Australia", "SA", "State", 151803, 1.00, 79780, 1.19, 1627322, 1817900, 6.89, 0.95],
  ["Tasmania", "TAS", "State", 42821, 1.00, 74342, 1.38, 530100, 575800, 2.10, 1.11],
  ["Victoria", "VIC", "State", 615414, 1.13, 86990, 1.52, 5461101, 7011100, 26.07, 1.49],
  ["Western Australia", "WA", "State", 461658, 1.31, 151677, 0.48, 2290845, 3008700, 10.36, 1.47]
];

const cities = [
  ["Western Australia", "WA", "Perth", 1477815, 2006], ["Western Australia", "WA", "Mandurah", 67813, 2006], ["Western Australia", "WA", "Geraldton", 31553, 2006], ["Western Australia", "WA", "Bunbury", 31421, 2006], ["Western Australia", "WA", "Kalgoorlie", 28242, 2006],
  ["Northern Territory", "NT", "Darwin", 122207, 2021], ["Northern Territory", "NT", "Alice Springs", 24855, 2021], ["Northern Territory", "NT", "Katherine", 5980, 2021], ["Northern Territory", "NT", "Nhulunbuy", 3267, 2021], ["Northern Territory", "NT", "Tennant Creek", 2949, 2021],
  ["South Australia", "SA", "Adelaide", 1245011, 2021], ["South Australia", "SA", "Gawler", 28562, 2021], ["South Australia", "SA", "Mount Gambier", 26734, 2021], ["South Australia", "SA", "Mount Barker", 21554, 2021], ["South Australia", "SA", "Whyalla", 20880, 2021], ["South Australia", "SA", "Murray Bridge", 17457, 2021], ["South Australia", "SA", "Victor Harbor", 16709, 2021], ["South Australia", "SA", "Port Lincoln", 14404, 2021], ["South Australia", "SA", "Port Pirie", 13708, 2021], ["South Australia", "SA", "Port Augusta", 12788, 2021],
  ["Victoria", "VIC", "Melbourne", 4585537, 2021], ["Victoria", "VIC", "Geelong", 180239, 2021], ["Victoria", "VIC", "Ballarat", 105348, 2021], ["Victoria", "VIC", "Bendigo", 100649, 2021], ["Victoria", "VIC", "Melton", 76346, 2021], ["Victoria", "VIC", "Shepparton - Mooroopna", 49862, 2021], ["Victoria", "VIC", "Sunbury", 38010, 2021], ["Victoria", "VIC", "Wodonga", 37839, 2021], ["Victoria", "VIC", "Mildura", 35652, 2021], ["Victoria", "VIC", "Warrnambool", 32894, 2021],
  ["Tasmania", "TAS", "Hobart", 197451, 2021], ["Tasmania", "TAS", "Launceston", 80943, 2021], ["Tasmania", "TAS", "Devonport", 24591, 2021], ["Tasmania", "TAS", "Burnie - Somerset", 20267, 2021], ["Tasmania", "TAS", "Ulverstone", 12723, 2021]
];

const rivers = [
  ["Australian Capital Territory", "Murrumbidgee River", 59, 37, 2012],
  ["New South Wales", "Murray River", 1808, 1123, 2012],
  ["Northern Territory", "Victoria River", 510, 317, 2012],
  ["Queensland", "Flinders River", 1004, 624, 2012],
  ["South Australia", "Murray River", 700, 435, 2012],
  ["Tasmania", "South Esk River", 245, 152, 2012],
  ["Victoria", "Goulburn River", 654, 406, 2012],
  ["Western Australia", "Gascoyne River", 834, 518, 2012]
];

const stateAreas = [
  ["Australian Capital Territory", "ACT", "Territory", 2358, "km²", "Land area"],
  ["New South Wales", "NSW", "State", 800642, "km²", "Land area"],
  ["Northern Territory", "NT", "Territory", 1347791, "km²", "Land area"],
  ["Queensland", "QLD", "State", 1730648, "km²", "Land area"],
  ["South Australia", "SA", "State", 984314, "km²", "Land area"],
  ["Tasmania", "TAS", "State", 68401, "km²", "Land area"],
  ["Victoria", "VIC", "State", 227444, "km²", "Land area"],
  ["Western Australia", "WA", "State", 2527013, "km²", "Land area"]
];

const cityAreas = [
  ["New South Wales", "NSW", "Sydney", 12000, "km²", "Approx. urban/metro area"],
  ["Victoria", "VIC", "Melbourne", 10000, "km²", "Approx. urban/metro area"],
  ["Queensland", "QLD", "Brisbane", 5000, "km²", "Approx. urban/metro area"],
  ["Western Australia", "WA", "Perth", 6000, "km²", "Approx. urban/metro area"],
  ["South Australia", "SA", "Adelaide", 3200, "km²", "Approx. urban/metro area"],
  ["Australian Capital Territory", "ACT", "Canberra", 800, "km²", "Approx. urban/metro area"],
  ["Queensland", "QLD", "Gold Coast", 600, "km²", "Approx. urban/metro area"],
  ["New South Wales", "NSW", "Newcastle", 300, "km²", "Approx. urban/metro area"],
  ["New South Wales", "NSW", "Wollongong", 250, "km²", "Approx. urban/metro area"],
  ["Tasmania", "TAS", "Hobart", 170, "km²", "Approx. urban/metro area"]
];

const wb = Workbook.create();
const overview = wb.worksheets.add("README");
const stateSheet = wb.worksheets.add("State Economy");
const citySheet = wb.worksheets.add("City Population");
const riverSheet = wb.worksheets.add("Rivers");
const stateAreaSheet = wb.worksheets.add("State Area");
const cityAreaSheet = wb.worksheets.add("City Area");

overview.getRange("A1:F1").merge();
overview.getRange("A1").values = [["Australia Tableau Visualization Dataset"]];
overview.getRange("A3:B10").values = [
  ["Worksheet", "Use in Tableau"],
  ["State Economy", "Filled maps, GSP and population comparisons"],
  ["City Population", "Symbol maps and city population rankings"],
  ["Rivers", "River length comparisons by state/territory"],
  ["State Area", "State/territory land area comparisons"],
  ["City Area", "Approximate urban/metro area comparisons"],
  ["Data scope", "Values are transcribed from the user-provided pasted text; source years vary by worksheet."],
  ["Geographic role", "Set State/Territory and City fields to Tableau geographic roles; add Country = Australia for city maps."]
];

stateSheet.getRange("A1:K9").values = [["State/Territory", "Abbreviation", "Type", "GSP AUD million FY 2024-25", "GSP growth % FY 2024-25", "GSP per capita AUD FY 2024-25", "GSP per capita growth % FY 2024-25", "Population June 2010", "Population June 2024", "National population share % June 2024", "Population annual growth % 2019-24"], ...states];
citySheet.getRange(`A1:F${cities.length + 1}`).values = [["State/Territory", "State abbreviation", "City", "Population", "Census year", "Country"], ...cities.map(r => [...r, "Australia"])];
riverSheet.getRange("A1:E9").values = [["State/Territory", "Longest river", "Length km", "Length miles", "Reference year"], ...rivers];
stateAreaSheet.getRange("A1:F9").values = [["State/Territory", "Abbreviation", "Type", "Land area", "Unit", "Area definition"], ...stateAreas];
cityAreaSheet.getRange("A1:F11").values = [["State/Territory", "State abbreviation", "City", "Area", "Unit", "Area definition"], ...cityAreas];

const navy = "#0B3954", teal = "#087E8B", pale = "#EAF3F5", white = "#FFFFFF";
function styleTable(sheet, range, headerRange, numericRange) {
  sheet.showGridLines = false;
  sheet.getRange(headerRange).format = { fill: navy, font: { bold: true, color: white }, horizontalAlignment: "center", verticalAlignment: "center", wrapText: true };
  sheet.getRange(range).format.borders = { preset: "outside", style: "thin", color: "#B7C9D3" };
  sheet.getRange(range).format.font = { name: "Aptos", size: 10 };
  sheet.getRange(numericRange).format.horizontalAlignment = "right";
  sheet.getRange(range).format.autofitColumns();
  sheet.getRange(range).format.autofitRows();
  sheet.freezePanes.freezeRows(1);
}

styleTable(stateSheet, "A1:K9", "A1:K1", "D2:K9");
stateSheet.getRange("D2:D9").format.numberFormat = "#,##0";
stateSheet.getRange("E2:E9").format.numberFormat = "0.00";
stateSheet.getRange("F2:F9").format.numberFormat = "#,##0";
stateSheet.getRange("G2:G9").format.numberFormat = "0.00";
stateSheet.getRange("H2:I9").format.numberFormat = "#,##0";
stateSheet.getRange("J2:K9").format.numberFormat = "0.00";
stateSheet.tables.add("A1:K9", true, "StateEconomyTable");

styleTable(citySheet, `A1:F${cities.length + 1}`, "A1:F1", `D2:E${cities.length + 1}`);
citySheet.getRange(`D2:D${cities.length + 1}`).format.numberFormat = "#,##0";
citySheet.tables.add(`A1:F${cities.length + 1}`, true, "CityPopulationTable");

styleTable(riverSheet, "A1:E9", "A1:E1", "C2:E9");
riverSheet.getRange("C2:D9").format.numberFormat = "#,##0";
riverSheet.tables.add("A1:E9", true, "RiversTable");

styleTable(stateAreaSheet, "A1:F9", "A1:F1", "D2:D9");
stateAreaSheet.getRange("D2:D9").format.numberFormat = "#,##0";
stateAreaSheet.tables.add("A1:F9", true, "StateAreaTable");

styleTable(cityAreaSheet, "A1:F11", "A1:F1", "D2:D11");
cityAreaSheet.getRange("D2:D11").format.numberFormat = "#,##0";
cityAreaSheet.tables.add("A1:F11", true, "CityAreaTable");

overview.showGridLines = false;
overview.getRange("A1:F1").format = { fill: navy, font: { bold: true, color: white, size: 16 }, horizontalAlignment: "left", verticalAlignment: "center" };
overview.getRange("A3:B3").format = { fill: teal, font: { bold: true, color: white } };
overview.getRange("A4:B10").format = { fill: pale, wrapText: true, verticalAlignment: "top" };
overview.getRange("A3:B10").format.borders = { preset: "all", style: "thin", color: "#B7C9D3" };
overview.getRange("A1:F1").format.rowHeight = 30;
overview.getRange("A:A").format.columnWidth = 25;
overview.getRange("B:B").format.columnWidth = 75;
overview.getRange("A3:B10").format.rowHeight = 32;

const inspect = await wb.inspect({ kind: "table", range: "State Area!A1:F9", include: "values", tableMaxRows: 10, tableMaxCols: 8 });
console.log(inspect.ndjson);
const errors = await wb.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 50 }, summary: "formula errors" });
console.log(errors.ndjson);
const preview = await wb.render({ sheetName: "City Area", range: "A1:F11", scale: 1.3, format: "png" });
await fs.writeFile(`${outputDir}/city_area_preview.png`, new Uint8Array(await preview.arrayBuffer()));
const file = await SpreadsheetFile.exportXlsx(wb);
await file.save(`${outputDir}/australia_tableau_dataset.xlsx`);
