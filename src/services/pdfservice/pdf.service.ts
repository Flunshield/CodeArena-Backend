/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { CvUser, SoftSkill, TechnicalSkill, User } from 'src/interfaces/userInterface';
import * as fs from 'fs';

@Injectable()
export class PdfService {
  async generateInvoicePDF(invoice, user: User): Promise<Buffer> {
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
      this.drawCompanyAndClientInfo(doc, invoice, startY, user);

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

  private drawCompanyAndClientInfo(doc, invoice, startY, user) {
    const companyInfo = [
      'CodeArena',
      '26 Av. Tony Garnier',
      '69007 Lyon',
      'Siret : 45165687000057',
      'N° TVA : FR29451656870',
      'Tél : 04 27 18 14 40',
    ];
    const clientInfo = [
      `Entreprise: ${user.company ? user.company : invoice.customer_name}`,
      `Adresse: ${user.localisation ? user.localisation : ''}`,
      `Pays: ${invoice.customer_address ? invoice.customer_address.country || '' : ''}`,
      `Email: ${user.email || 'N/A'}`,
      `Siren: ${user.siren || 'N/A'}`,
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
    doc.text('', 400, startY);
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

  async generateCvPDF(cv: CvUser): Promise<Buffer> {
    return await new Promise((resolve) => {
      const doc = new PDFDocument({
        size: 'LETTER',
        margin: 50,
        bufferPages: true,
      });

      // Colors
      const primaryColor = '#3498db';
      const secondaryColor = '#2ecc71';
      const textColor = '#333333';

      // Load your logo image
      const logoPath = 'src/images/logo.png'; // Replace with your actual logo path
      const logoBuffer = fs.readFileSync(logoPath);
 
      // Add logo to the PDF
      doc.image(logoBuffer, {
        fit: [100, 100], // Adjust width and height as needed
        align: 'center',
        valign: 'center', // or 'bottom'
      });

      // Title
      doc
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .fontSize(26)
        .text('Curriculum Vitae', { align: 'center' })
        .moveDown(2);

      // Personal Information
      this.drawPersonalInfo(doc, cv, primaryColor, textColor);
      // Summary
      if (cv.summary) {
        this.drawSectionTitle(doc, 'Résumé', secondaryColor);
        this.drawSummary(doc, cv.summary, textColor);
      }

      // Experiences
      if (cv.experiences.length > 0) {
        this.drawSectionTitle(doc, cv.experiences.length > 1 ? 'Expériences' : 'Expérience', secondaryColor);
        this.drawExperiences(doc, cv.experiences, textColor);
      }

      // Educations
      if (cv.educations.length > 0) {
        this.drawSectionTitle(doc, cv.educations.length > 1 ? 'Formations' : 'Formation', secondaryColor);
        this.drawEducations(doc, cv.educations, textColor);
      }

      // Technical Skills
      if (cv.technicalSkills.length > 0) {
        this.drawSectionTitle(doc, cv.technicalSkills.length > 1 ? 'Compétences techniques' : 'Compétence technique', secondaryColor);
        this.drawTechnicalSkills(doc, cv.technicalSkills, textColor);
      }

      // Soft Skills
      if (cv.softSkills.length > 0) {
        this.drawSectionTitle(doc, cv.softSkills.length > 1 ? 'Compétences humaines' : 'Compétence humaine', secondaryColor);
        this.drawSoftSkills(doc, cv.softSkills, textColor);
      }

      doc.end();

      const buffer = [];
      doc.on('data', buffer.push.bind(buffer));
      doc.on('end', () => {
        const data = Buffer.concat(buffer);
        resolve(data);
      });
    });
  }

  private drawPersonalInfo(doc, cv, primaryColor, textColor) {
    doc
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .fontSize(14)
      .text(`${cv.firstName} ${cv.lastName}`, { align: 'center' })
      .moveDown(1);

    doc
      .fillColor(textColor)
      .font('Helvetica')
      .fontSize(10)
      .text(`Email: ${cv.email}`, { align: 'center' })
      .text(`Phone: ${cv.phone}`, { align: 'center' })
      .text(`Address: ${cv.address}`, { align: 'center' })
      .moveDown(2);
  }

  private drawSectionTitle(doc, title, color) {
    doc
      .fillColor(color)
      .font('Helvetica-Bold')
      .fontSize(18)
      .text(title, { align: 'left' })
      .moveDown(1)
      .strokeColor(color)
      .lineWidth(2)
      .moveTo(doc.x, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .stroke()
      .moveDown(2);
  }

  private drawExperiences(doc, experiences, textColor) {
    experiences.forEach(exp => {
      if(exp.position !== "") {
      doc
        .fillColor(textColor)
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(exp.position, { continued: true })
        .font('Helvetica')
        .text(` at ${exp.company}`)
        .font('Helvetica')
        .fontSize(10)
        .text(`From: ${exp.startDate} To: ${exp.endDate}`)
        .moveDown(0.5)
        .text(exp.description)
        .moveDown(1.5);
      }
    });
  }

  private drawEducations(doc, educations, textColor) {
    educations.forEach(edu => {
      if(edu.degree !== "") {
      doc
        .fillColor(textColor)
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(edu.degree, { continued: true })
        .font('Helvetica')
        .text(` at ${edu.institution}`)
        .font('Helvetica')
        .fontSize(10)
        .text(`From: ${edu.startDate} To: ${edu.endDate}`)
        .moveDown(0.5)
        .text(edu.description)
        .moveDown(1.5);
      }
    });
  }

  private drawTechnicalSkills(doc: any, technicalSkills: TechnicalSkill[], textColor: string) {
    technicalSkills.forEach((skill, index) => {
      if(skill.name !== "") {
      doc
        .fillColor(textColor)
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('Compétence ' + (index + 1) + ' : ' + skill.name)
        .moveDown(2);
    }
  });
  }
  
  private drawSoftSkills(doc: any, softSkills: SoftSkill[], textColor: string) {
    softSkills.forEach((skill, index) => {
      if(skill.name !== "") {
      doc
        .fillColor(textColor)
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('Compétence ' + (index + 1) + ' : ' + skill.name)
        .moveDown(2);
      }
    });
  }

  private drawSummary(doc, summary, textColor) {
    doc
      .fillColor(textColor)
      .font('Helvetica')
      .fontSize(12)
      .text(summary)
      .moveDown(2);
  }
}
