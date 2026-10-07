package com.autotech.common.excel;

import org.apache.poi.ss.SpreadsheetVersion;
import org.apache.poi.ss.util.AreaReference;
import org.apache.poi.ss.util.CellReference;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFTable;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

/**
 * Shared helper to build native Excel tables (XSSFTable) from a grid of headers and data rows.
 *
 * <p>A native table renders with filters, banded-row styling and named columns in Excel,
 * as opposed to a plain grid of loose cells. Every Excel export in the application should
 * use this helper so that all downloads share the same look and feel.</p>
 */
public final class ExcelTableBuilder {

    private static final String DEFAULT_TABLE_STYLE = "TableStyleMedium2";

    private ExcelTableBuilder() {
        // static utility
    }

    /**
     * Turns the used range of {@code sheet} (starting at row 0) into a native Excel table.
     *
     * @param sheet          the sheet that already contains the header row and data rows
     * @param tableName      unique table name (without spaces), used as the underlying table id
     * @param headers        column headers, used to name each table column
     * @param dataRowCount   number of data rows below the header (used to compute the area)
     * @param autoSizeColumns whether to auto-size every column after creating the table
     */
    public static void createTable(XSSFSheet sheet,
                                   String tableName,
                                   String[] headers,
                                   int dataRowCount,
                                   boolean autoSizeColumns) {
        createTable(sheet, tableName, headers, dataRowCount, 0, autoSizeColumns);
    }

    /**
     * Turns a range of {@code sheet} into a native Excel table, supporting a header row that is
     * not at row 0 (for example when an informational row sits above the table).
     *
     * @param headerRowIndex zero-based row index where the header cells live
     */
    public static void createTable(XSSFSheet sheet,
                                   String tableName,
                                   String[] headers,
                                   int dataRowCount,
                                   int headerRowIndex,
                                   boolean autoSizeColumns) {
        if (dataRowCount <= 0) {
            if (autoSizeColumns) {
                autoSize(sheet, headers.length);
            }
            return;
        }

        int lastRow = headerRowIndex + dataRowCount;
        int lastCol = headers.length - 1;
        AreaReference area = new AreaReference(
                new CellReference(headerRowIndex, 0),
                new CellReference(lastRow, lastCol),
                SpreadsheetVersion.EXCEL2007);

        XSSFTable table = sheet.createTable(area);
        table.setName(tableName);
        table.setDisplayName(tableName);
        table.setStyleName(DEFAULT_TABLE_STYLE);

        // Make Excel render this as a visible table: header filters and row banding.
        // POI's setStyleName alone writes the table object but Excel may show it unstyled,
        // so the style flags and auto filter must be set explicitly.
        var ctTable = table.getCTTable();
        ctTable.setHeaderRowCount(1L);
        ctTable.setTotalsRowCount(0L);
        ctTable.addNewAutoFilter();
        var styleInfo = ctTable.getTableStyleInfo();
        if (styleInfo == null) {
            styleInfo = ctTable.addNewTableStyleInfo();
        }
        styleInfo.setName(DEFAULT_TABLE_STYLE);
        styleInfo.setShowRowStripes(true);
        styleInfo.setShowColumnStripes(false);
        styleInfo.setShowFirstColumn(false);
        styleInfo.setShowLastColumn(false);

        for (int i = 0; i < headers.length; i++) {
            ctTable.getTableColumns().getTableColumnArray(i).setName(headers[i]);
        }

        if (autoSizeColumns) {
            autoSize(sheet, headers.length);
        }
    }

    private static void autoSize(XSSFSheet sheet, int columnCount) {
        for (int i = 0; i < columnCount; i++) {
            sheet.autoSizeColumn(i);
        }
    }
}
