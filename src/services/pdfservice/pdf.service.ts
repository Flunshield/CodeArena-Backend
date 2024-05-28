import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
  async generateInvoicePDF(invoice): Promise<Buffer> {
    return await new Promise((resolve) => {
      const doc = new PDFDocument({
        size: 'LETTER',
        margin: 50,
        bufferPages: true,
      });

      // Title
      doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .text('Facture', { align: 'center' })
        .moveDown(2);

      // Company and Client Information
      let startY = doc.y;
      this.drawCompanyAndClientInfo(doc, invoice, startY);

      // Invoice Dates
      startY = doc.y + 20; // Adding some space between sections
      this.drawInvoiceDates(doc, invoice, startY);

      // Line Items
      startY = doc.y + 5; // Adding some space between sections
      this.drawLineItems(doc, invoice, startY);

      // Totals
      startY = doc.y + 20; // Adding some space between sections
      this.drawTotals(doc, invoice, startY);

      // Footer
      doc.moveDown(2);
      doc
        .font('Helvetica')
        .fontSize(10)
        .text('CodeArena vous remercie pour votre achat !', { align: 'left' });

      doc.end();

      const buffer = [];
      doc.on('data', buffer.push.bind(buffer));
      doc.on('end', () => {
        const data = Buffer.concat(buffer);
        resolve(data);
      });
    });
  }

  private drawCompanyAndClientInfo(doc, invoice, startY) {
    const companyInfo = [
      'CodeArena',
      '26 Av. Tony Garnier',
      '69007 Lyon',
      'Siret : 45165687000057',
      'N° TVA : FR29451656870',
      'Tél : 04 27 18 14 40',
    ];
    const clientInfo = [
      `Nom du client: ${invoice.customer_name}`,
      `Adresse: ${invoice.customer_address ? invoice.customer_address.line1 || '' : ''}`,
      `Code postal: ${invoice.customer_address ? invoice.customer_address.postal_code || '' : ''} Ville: ${invoice.customer_address ? invoice.customer_address.city || '' : ''}`,
      `Pays: ${invoice.customer_address ? invoice.customer_address.country || '' : ''}`,
      `Email: ${invoice.customer_email || 'N/A'}`,
    ];

    doc.font('Helvetica-Bold').fontSize(10);

    companyInfo.forEach((line, index) => {
      doc.text(line, 50, startY + index * 15);
    });

    clientInfo.forEach((line, index) => {
      doc.text(line, 300, startY + index * 15);
    });

    doc.moveDown(2);
  }

  private drawInvoiceDates(doc, invoice, startY) {
    const datesTable = [
      [
        'Date de facture',
        new Date(invoice.created * 1000).toLocaleDateString('fr-FR'),
      ],
      [
        'Date de livraison',
        new Date(invoice.created * 1000).toLocaleDateString('fr-FR'),
      ],
    ];

    this.drawTable(doc, datesTable, [200, 200], 20, startY);
    doc.moveDown(2);
  }

  private drawLineItems(doc, invoice, startY) {
    doc.font('Helvetica-Bold').fontSize(10).text('Désignation', 50, startY);
    doc.text('Quantité', 200, startY);
    doc.text('Prix unitaire HT', 300, startY);
    doc.text('Prix total HT', 400, startY);
    doc.moveDown(0.5).font('Helvetica').fontSize(10);

    const columnWidths = [150, 50, 100, 100]; // Adjust the column widths as needed

    if (invoice.lines && invoice.lines.data) {
      invoice.lines.data.forEach((item, index) => {
        const itemY = startY + (index + 1) * 20;

        doc.text(item.description || 'N/A', 50, itemY, {
          width: columnWidths[0] - 10,
        });

        doc.text(item.quantity || 1, 200, itemY);
        doc.text(
          item.price && item.price.unit_amount
            ? (item.price.unit_amount / 100).toFixed(2)
            : 'N/A',
          300,
          itemY,
        );
        doc.text((item.amount / 100).toFixed(2), 400, itemY);
        doc.moveDown(1);
      });
    } else {
      doc.text('Aucun article disponible', 50, startY + 20);
    }

    doc.moveDown(2);
  }

  private drawTotals(doc, invoice, startY) {
    const total_excluding_tax = invoice.total_excluding_tax / 100;
    const TVA = (invoice.total_excluding_tax / 100) * 0.2;
    const totalsTable = [
      [
        'Total HT',
        `${total_excluding_tax.toFixed(2)} ${invoice.currency.toUpperCase()}`,
      ],
      ['TVA (20.00%)', TVA.toFixed(2)], // Adjust the tax rate and value as needed
      [
        'Total TTC',
        `${(total_excluding_tax + TVA).toFixed(2)} ${invoice.currency.toUpperCase()}`,
      ],
    ];

    this.drawTable(doc, totalsTable, [200, 100], 20, startY);
  }

  private drawTable(doc, table, columnWidths, cellHeight, startY) {
    table.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const x = 50 + colIndex * columnWidths[colIndex];
        const y = startY + rowIndex * cellHeight;

        doc.text(cell, x, y, {
          width: columnWidths[colIndex],
          align: 'left',
        });
      });
    });

    doc.moveDown(table.length * 0.5);
  }
}
