package com.autotech.invoice.service;

import com.autotech.common.exception.BusinessException;
import com.autotech.invoice.dto.InvoiceDetailResponse;
import com.autotech.invoice.dto.InvoiceProductResponse;
import com.autotech.invoice.dto.InvoiceServiceItemResponse;
import com.autotech.invoice.model.InvoiceStatus;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoicePdfServiceImpl implements InvoicePdfService {

    private final InvoiceService invoiceService;

    private static final Locale LOCALE_AR = Locale.of("es", "AR");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final Font FONT_TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20);
    private static final Font FONT_DOC_TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
    private static final Font FONT_SECTION = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
    private static final Font FONT_NORMAL = FontFactory.getFont(FontFactory.HELVETICA, 10);
    private static final Font FONT_BOLD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
    private static final Font FONT_BIG = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
    private static final Font FONT_LABEL = FontFactory.getFont(FontFactory.HELVETICA, 9, Font.NORMAL, new Color(110, 110, 110));

    private static final Color BORDER = new Color(222, 222, 222);
    private static final Color HEADER_BG = new Color(240, 240, 240);
    private static final Color TOTAL_BG = new Color(248, 238, 228);

    @Override
    public byte[] generate(Long invoiceId) {
        InvoiceDetailResponse invoice = invoiceService.getById(invoiceId);
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4, 48, 48, 48, 48);
            PdfWriter.getInstance(document, out);
            document.open();

            document.add(buildHeader(invoice));
            document.add(spacer(20));
            document.add(buildCustomerTable(invoice));

            if (invoice.services() != null && !invoice.services().isEmpty()) {
                document.add(spacer(18));
                document.add(sectionTitle("Servicios"));
                document.add(buildServicesTable(invoice.services()));
            }
            if (invoice.products() != null && !invoice.products().isEmpty()) {
                document.add(spacer(18));
                document.add(sectionTitle("Productos"));
                document.add(buildProductsTable(invoice.products()));
            }

            document.add(spacer(18));
            document.add(buildTotals(invoice));

            document.close();
            return out.toByteArray();
        } catch (DocumentException e) {
            log.error("Failed to generate invoice PDF for id {}", invoiceId, e);
            throw new BusinessException("No se pudo generar el PDF de la factura");
        }
    }

    private PdfPTable buildHeader(InvoiceDetailResponse invoice) throws DocumentException {
        PdfPTable table = new PdfPTable(new float[]{1.4f, 1f});
        table.setWidthPercentage(100);

        PdfPCell left = borderlessCell();
        left.addElement(new Paragraph("AUTOTECH", FONT_TITLE));
        left.addElement(new Paragraph("Servicio Mecánico Integral", FONT_NORMAL));
        left.addElement(new Paragraph("Av. Colón 1234, Córdoba", FONT_LABEL));
        left.addElement(new Paragraph("Teléfono: (351) 480-1234", FONT_LABEL));

        PdfPCell right = borderlessCell();
        right.addElement(rightAligned("FACTURA", FONT_DOC_TITLE));
        String number = invoice.id() != null ? String.format("%08d", invoice.id()) : "PROVISORIA";
        right.addElement(rightAligned("Nº: " + number, FONT_NORMAL));
        String date = invoice.createdAt() != null ? invoice.createdAt().format(DATE_FMT) : "—";
        right.addElement(rightAligned("Fecha: " + date, FONT_NORMAL));
        right.addElement(rightAligned("Estado: " + statusLabel(invoice.status()), FONT_BOLD));

        table.addCell(left);
        table.addCell(right);
        return table;
    }

    private PdfPTable buildCustomerTable(InvoiceDetailResponse invoice) throws DocumentException {
        PdfPTable table = new PdfPTable(new float[]{1f, 1f});
        table.setWidthPercentage(100);

        PdfPCell client = borderlessCell();
        client.addElement(sectionTitle("Cliente"));
        client.addElement(infoLine("Nombre", invoice.clientFullName()));
        client.addElement(infoLine("DNI", invoice.clientDni()));
        client.addElement(infoLine("Teléfono", invoice.clientPhone()));
        client.addElement(infoLine("Email", invoice.clientEmail()));
        client.addElement(infoLine("Tipo de cliente", invoice.clientType()));
        table.addCell(client);

        PdfPCell vehicle = borderlessCell();
        vehicle.addElement(sectionTitle("Vehículo"));
        vehicle.addElement(infoLine("Patente", invoice.vehiclePlate()));
        vehicle.addElement(infoLine("Marca", invoice.vehicleBrand()));
        vehicle.addElement(infoLine("Modelo", invoice.vehicleModel()));
        vehicle.addElement(infoLine("Año", invoice.vehicleYear() != null ? String.valueOf(invoice.vehicleYear()) : null));
        table.addCell(vehicle);

        return table;
    }

    private PdfPTable buildServicesTable(List<InvoiceServiceItemResponse> services) throws DocumentException {
        PdfPTable table = new PdfPTable(new float[]{4f, 1.6f});
        table.setWidthPercentage(100);
        table.addCell(headerCell("Servicio", Element.ALIGN_LEFT));
        table.addCell(headerCell("Precio", Element.ALIGN_RIGHT));
        for (InvoiceServiceItemResponse service : services) {
            table.addCell(bodyCell(service.serviceName(), Element.ALIGN_LEFT));
            table.addCell(bodyCell(money(service.price()), Element.ALIGN_RIGHT));
        }
        return table;
    }

    private PdfPTable buildProductsTable(List<InvoiceProductResponse> products) throws DocumentException {
        PdfPTable table = new PdfPTable(new float[]{4f, 1.2f, 1.6f, 1.6f});
        table.setWidthPercentage(100);
        table.addCell(headerCell("Producto", Element.ALIGN_LEFT));
        table.addCell(headerCell("Cantidad", Element.ALIGN_RIGHT));
        table.addCell(headerCell("Precio unit.", Element.ALIGN_RIGHT));
        table.addCell(headerCell("Total", Element.ALIGN_RIGHT));
        for (InvoiceProductResponse product : products) {
            table.addCell(bodyCell(product.productName(), Element.ALIGN_LEFT));
            table.addCell(bodyCell(String.valueOf(product.quantity()), Element.ALIGN_RIGHT));
            table.addCell(bodyCell(money(product.unitPrice()), Element.ALIGN_RIGHT));
            table.addCell(bodyCell(money(totalPrice(product)), Element.ALIGN_RIGHT));
        }
        return table;
    }

    private PdfPTable buildTotals(InvoiceDetailResponse invoice) throws DocumentException {
        BigDecimal servicesSubtotal = sumServices(invoice.services());
        BigDecimal productsSubtotal = sumProducts(invoice.products());
        BigDecimal subtotal = servicesSubtotal.add(productsSubtotal);
        BigDecimal discountPct = defaultZero(invoice.discountPercentage());
        BigDecimal taxPct = defaultZero(invoice.taxPercentage());
        BigDecimal discount = applyPercent(subtotal, discountPct);
        BigDecimal afterDiscount = subtotal.subtract(discount);
        BigDecimal tax = applyPercent(afterDiscount, taxPct);
        BigDecimal total = afterDiscount.add(tax);

        PdfPTable table = new PdfPTable(new float[]{3f, 1.6f});
        table.setWidthPercentage(48);
        table.setHorizontalAlignment(Element.ALIGN_RIGHT);

        addTotalRow(table, "Subtotal servicios", money(servicesSubtotal), false);
        addTotalRow(table, "Subtotal productos", money(productsSubtotal), false);
        addTotalRow(table, "Subtotal", money(subtotal), false);
        if (discountPct.compareTo(BigDecimal.ZERO) > 0) {
            addTotalRow(table, "Descuento (" + stripZeros(discountPct) + "%)", "- " + money(discount), false);
        }
        if (taxPct.compareTo(BigDecimal.ZERO) > 0) {
            addTotalRow(table, "Impuesto (" + stripZeros(taxPct) + "%)", "+ " + money(tax), false);
        }
        addTotalRow(table, "TOTAL", money(total), true);
        return table;
    }

    private void addTotalRow(PdfPTable table, String label, String value, boolean emphasize) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, emphasize ? FONT_BOLD : FONT_NORMAL));
        PdfPCell valueCell = new PdfPCell(new Phrase(value, emphasize ? FONT_BIG : FONT_NORMAL));
        labelCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPadding(5);
        valueCell.setPadding(5);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        if (emphasize) {
            labelCell.setBackgroundColor(TOTAL_BG);
            valueCell.setBackgroundColor(TOTAL_BG);
        }
        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private Paragraph sectionTitle(String text) {
        Paragraph paragraph = new Paragraph(text, FONT_SECTION);
        paragraph.setSpacingAfter(6);
        return paragraph;
    }

    private Paragraph infoLine(String label, String value) {
        Paragraph paragraph = new Paragraph();
        paragraph.add(new Phrase(label + ": ", FONT_LABEL));
        paragraph.add(new Phrase(isBlank(value) ? "—" : value, FONT_NORMAL));
        paragraph.setSpacingAfter(3);
        return paragraph;
    }

    private Paragraph rightAligned(String text, Font font) {
        Paragraph paragraph = new Paragraph(text, font);
        paragraph.setAlignment(Element.ALIGN_RIGHT);
        paragraph.setSpacingAfter(2);
        return paragraph;
    }

    private Paragraph spacer(float height) {
        Paragraph paragraph = new Paragraph(" ");
        paragraph.setLeading(height);
        return paragraph;
    }

    private PdfPCell borderlessCell() {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(0);
        cell.setPaddingRight(12);
        return cell;
    }

    private PdfPCell headerCell(String text, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FONT_BOLD));
        cell.setBackgroundColor(HEADER_BG);
        cell.setBorderColor(BORDER);
        cell.setPadding(6);
        cell.setHorizontalAlignment(alignment);
        return cell;
    }

    private PdfPCell bodyCell(String text, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(isBlank(text) ? "—" : text, FONT_NORMAL));
        cell.setBorderColor(BORDER);
        cell.setPadding(6);
        cell.setHorizontalAlignment(alignment);
        return cell;
    }

    private BigDecimal sumServices(List<InvoiceServiceItemResponse> services) {
        BigDecimal total = BigDecimal.ZERO;
        if (services != null) {
            for (InvoiceServiceItemResponse service : services) {
                total = total.add(defaultZero(service.price()));
            }
        }
        return total;
    }

    private BigDecimal sumProducts(List<InvoiceProductResponse> products) {
        BigDecimal total = BigDecimal.ZERO;
        if (products != null) {
            for (InvoiceProductResponse product : products) {
                total = total.add(totalPrice(product));
            }
        }
        return total;
    }

    private BigDecimal totalPrice(InvoiceProductResponse product) {
        return defaultZero(product.unitPrice()).multiply(BigDecimal.valueOf(product.quantity()));
    }

    private BigDecimal applyPercent(BigDecimal base, BigDecimal percentage) {
        return base.multiply(percentage).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal defaultZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private String money(BigDecimal value) {
        return "$ " + String.format(LOCALE_AR, "%,.2f", defaultZero(value));
    }

    private String stripZeros(BigDecimal value) {
        return value.stripTrailingZeros().toPlainString();
    }

    private String statusLabel(InvoiceStatus status) {
        if (status == InvoiceStatus.PAGADA) {
            return "Pagada";
        }
        return "Pendiente";
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
