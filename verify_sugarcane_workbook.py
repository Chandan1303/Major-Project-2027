import xml.etree.ElementTree as ET
import zipfile

PATH = "sugarcane_complete_imputed_workbook.xlsx"
NAMESPACE = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

with zipfile.ZipFile(PATH) as archive:
    print("zip_integrity_ok:", archive.testzip() is None)
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    print("sheets:", [sheet.attrib["name"] for sheet in workbook.find("main:sheets", NAMESPACE)])
    for item in sorted(name for name in archive.namelist() if name.startswith("xl/worksheets/sheet")):
        root = ET.fromstring(archive.read(item))
        print(item, root.find("main:dimension", NAMESPACE).attrib["ref"])
    for item, expected in {
        "xl/worksheets/sheet1.xml": 22134 * 273,
        "xl/worksheets/sheet2.xml": 18468 * 7,
        "xl/worksheets/sheet3.xml": 124 * 21,
    }.items():
        with archive.open(item) as source:
            cell_count = 0
            while chunk := source.read(1024 * 1024):
                cell_count += chunk.count(b"<c ")
        print(item, "cells", cell_count, "expected", expected, "no_blanks", cell_count == expected)

    with archive.open("xl/worksheets/sheet1.xml") as source:
        data = source.read()
    missing = []
    pointer = 0
    while True:
        start = data.find(b"<row", pointer)
        if start < 0:
            break
        end = data.find(b"</row>", start) + 6
        row = data[start:end]
        cells = row.count(b"<c ")
        if cells != 273:
            row_number = row.split(b' r="', 1)[1].split(b'"', 1)[0].decode()
            missing.append((row_number, cells))
        pointer = end
    print("training_rows_with_missing_cells:", missing[:20])
