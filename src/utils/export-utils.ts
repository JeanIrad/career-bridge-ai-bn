import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as ExcelJS from 'exceljs';

export class ExportUtils {
  static async generatePDFReport(
    data: any,
    reportType: string,
    includeCharts?: boolean,
  ): Promise<any> {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${reportType}_analytics_${timestamp}.pdf`;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Helper function to add page if needed
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
    };

    // Header with logo and title
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Career Bridge AI', 20, 25);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text(`${reportType.toUpperCase()} ANALYTICS REPORT`, 20, 35);

    yPosition = 60;

    // Report metadata
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
    doc.text(`Report Type: ${reportType}`, 20, yPosition + 5);
    doc.text(
      `Include Charts: ${includeCharts ? 'Yes' : 'No'}`,
      20,
      yPosition + 10,
    );

    yPosition += 25;

    // Overview Section
    if (data.overview) {
      checkPageBreak(60);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text('📊 OVERVIEW METRICS', 20, yPosition);
      yPosition += 10;

      const overviewData = [
        ['Metric', 'Value', 'Performance'],
        [
          'Total Users',
          data.overview.totalUsers?.toLocaleString() || '0',
          '👥',
        ],
        [
          'Active Users',
          data.overview.activeUsers?.toLocaleString() || '0',
          '🟢',
        ],
        [
          'Total Sessions',
          data.overview.totalSessions?.toLocaleString() || '0',
          '📱',
        ],
        ['Page Views', data.overview.pageViews?.toLocaleString() || '0', '👁️'],
        [
          'User Growth Rate',
          `${data.overview.userGrowthRate || 0}%`,
          (data.overview.userGrowthRate || 0) > 0 ? '📈' : '📉',
        ],
        ['Retention Rate', `${data.overview.retentionRate || 0}%`, '🎯'],
        [
          'Avg Session Duration',
          `${data.overview.averageSessionDuration || 0} min`,
          '⏱️',
        ],
        ['Bounce Rate', `${data.overview.bounceRate || 0}%`, '🔄'],
      ];

      (doc as any).autoTable({
        startY: yPosition,
        head: [overviewData[0]],
        body: overviewData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 20, right: 20 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    // User Growth Section
    if (
      data.userGrowth &&
      Array.isArray(data.userGrowth) &&
      data.userGrowth.length > 0
    ) {
      checkPageBreak(80);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text('📈 USER GROWTH TREND', 20, yPosition);
      yPosition += 10;

      const growthData = [
        ['Month', 'New Users', 'Total Users', 'Growth Rate'],
        ...data.userGrowth
          .slice(-6)
          .map((month: any) => [
            month.month || '',
            (month.newUsers || 0).toString(),
            (month.totalUsers || 0).toString(),
            `${month.growthRate || 0}%`,
          ]),
      ];

      (doc as any).autoTable({
        startY: yPosition,
        head: [growthData[0]],
        body: growthData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
        margin: { left: 20, right: 20 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    // Role Distribution
    if (data.roleDistribution) {
      checkPageBreak(60);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text('👥 USER ROLE DISTRIBUTION', 20, yPosition);
      yPosition += 10;

      const total =
        (data.roleDistribution.students || 0) +
        (data.roleDistribution.alumni || 0) +
        (data.roleDistribution.employers || 0) +
        (data.roleDistribution.professors || 0);

      const roleData = [
        ['Role', 'Count', 'Percentage', 'Icon'],
        [
          'Students',
          (data.roleDistribution.students || 0).toString(),
          `${total > 0 ? (((data.roleDistribution.students || 0) / total) * 100).toFixed(1) : '0'}%`,
          '🎓',
        ],
        [
          'Alumni',
          (data.roleDistribution.alumni || 0).toString(),
          `${total > 0 ? (((data.roleDistribution.alumni || 0) / total) * 100).toFixed(1) : '0'}%`,
          '🏆',
        ],
        [
          'Employers',
          (data.roleDistribution.employers || 0).toString(),
          `${total > 0 ? (((data.roleDistribution.employers || 0) / total) * 100).toFixed(1) : '0'}%`,
          '🏢',
        ],
        [
          'Professors',
          (data.roleDistribution.professors || 0).toString(),
          `${total > 0 ? (((data.roleDistribution.professors || 0) / total) * 100).toFixed(1) : '0'}%`,
          '👨‍🏫',
        ],
      ];

      (doc as any).autoTable({
        startY: yPosition,
        head: [roleData[0]],
        body: roleData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 20, right: 20 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    // Footer
    const pageCount = (doc as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Career Bridge AI Analytics | Page ${i} of ${pageCount}`,
        pageWidth - 80,
        pageHeight - 10,
      );
      doc.text(
        `Generated on ${new Date().toLocaleDateString()}`,
        20,
        pageHeight - 10,
      );
    }

    return {
      filename,
      content: doc.output('arraybuffer'),
      contentType: 'application/pdf',
    };
  }

  static async generateExcelReport(
    data: any,
    reportType: string,
  ): Promise<any> {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${reportType}_analytics_${timestamp}.xlsx`;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Career Bridge AI';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Overview Sheet
    if (data.overview) {
      const overviewSheet = workbook.addWorksheet('Overview');

      // Header
      overviewSheet.mergeCells('A1:D1');
      const headerCell = overviewSheet.getCell('A1');
      headerCell.value = `${reportType.toUpperCase()} ANALYTICS OVERVIEW`;
      headerCell.font = { size: 18, bold: true, color: { argb: 'FF3B82F6' } };
      headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
      overviewSheet.getRow(1).height = 30;

      // Metadata
      overviewSheet.getCell('A3').value = 'Generated:';
      overviewSheet.getCell('B3').value = new Date().toLocaleString();
      overviewSheet.getCell('A4').value = 'Report Type:';
      overviewSheet.getCell('B4').value = reportType;

      // Overview metrics
      overviewSheet.getCell('A6').value = 'OVERVIEW METRICS';
      overviewSheet.getCell('A6').font = {
        size: 14,
        bold: true,
        color: { argb: 'FF3B82F6' },
      };

      const overviewData = [
        ['Total Users', (data.overview.totalUsers || 0).toLocaleString(), '👥'],
        [
          'Active Users',
          (data.overview.activeUsers || 0).toLocaleString(),
          '🟢',
        ],
        [
          'Total Sessions',
          (data.overview.totalSessions || 0).toLocaleString(),
          '📱',
        ],
        ['Page Views', (data.overview.pageViews || 0).toLocaleString(), '👁️'],
        [
          'User Growth Rate',
          `${data.overview.userGrowthRate || 0}%`,
          (data.overview.userGrowthRate || 0) > 0 ? '📈' : '📉',
        ],
        ['Retention Rate', `${data.overview.retentionRate || 0}%`, '🎯'],
        [
          'Avg Session Duration',
          `${data.overview.averageSessionDuration || 0} min`,
          '⏱️',
        ],
        ['Bounce Rate', `${data.overview.bounceRate || 0}%`, '🔄'],
      ];

      // Add data to sheet
      overviewSheet.addTable({
        name: 'OverviewTable',
        ref: 'A8',
        headerRow: true,
        style: {
          theme: 'TableStyleMedium2',
          showRowStripes: true,
        },
        columns: [{ name: 'Metric' }, { name: 'Value' }, { name: 'Icon' }],
        rows: overviewData,
      });

      // Auto-fit columns
      overviewSheet.columns = [{ width: 25 }, { width: 20 }, { width: 10 }];
    }

    // User Growth Sheet
    if (
      data.userGrowth &&
      Array.isArray(data.userGrowth) &&
      data.userGrowth.length > 0
    ) {
      const growthSheet = workbook.addWorksheet('User Growth');

      // Header
      growthSheet.mergeCells('A1:D1');
      const headerCell = growthSheet.getCell('A1');
      headerCell.value = 'USER GROWTH ANALYSIS';
      headerCell.font = { size: 18, bold: true, color: { argb: 'FF10B981' } };
      headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
      growthSheet.getRow(1).height = 30;

      const growthData = data.userGrowth.map((month: any) => [
        month.month || '',
        month.newUsers || 0,
        month.totalUsers || 0,
        month.growthRate || 0,
      ]);

      growthSheet.addTable({
        name: 'GrowthTable',
        ref: 'A3',
        headerRow: true,
        style: {
          theme: 'TableStyleMedium3',
          showRowStripes: true,
        },
        columns: [
          { name: 'Month' },
          { name: 'New Users' },
          { name: 'Total Users' },
          { name: 'Growth Rate (%)' },
        ],
        rows: growthData,
      });

      // Auto-fit columns
      growthSheet.columns = [
        { width: 15 },
        { width: 15 },
        { width: 15 },
        { width: 18 },
      ];
    }

    // Demographics Sheet
    if (data.roleDistribution || data.genderDistribution) {
      const demoSheet = workbook.addWorksheet('Demographics');

      // Header
      demoSheet.mergeCells('A1:D1');
      const headerCell = demoSheet.getCell('A1');
      headerCell.value = 'USER DEMOGRAPHICS';
      headerCell.font = { size: 18, bold: true, color: { argb: 'FF8B5CF6' } };
      headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
      demoSheet.getRow(1).height = 30;

      let currentRow = 3;

      // Role Distribution
      if (data.roleDistribution) {
        demoSheet.getCell(`A${currentRow}`).value = 'ROLE DISTRIBUTION';
        demoSheet.getCell(`A${currentRow}`).font = {
          size: 14,
          bold: true,
          color: { argb: 'FF8B5CF6' },
        };
        currentRow += 2;

        const total =
          (data.roleDistribution.students || 0) +
          (data.roleDistribution.alumni || 0) +
          (data.roleDistribution.employers || 0) +
          (data.roleDistribution.professors || 0);

        const roleData = [
          [
            'Students',
            data.roleDistribution.students || 0,
            `${total > 0 ? (((data.roleDistribution.students || 0) / total) * 100).toFixed(1) : '0'}%`,
            '🎓',
          ],
          [
            'Alumni',
            data.roleDistribution.alumni || 0,
            `${total > 0 ? (((data.roleDistribution.alumni || 0) / total) * 100).toFixed(1) : '0'}%`,
            '🏆',
          ],
          [
            'Employers',
            data.roleDistribution.employers || 0,
            `${total > 0 ? (((data.roleDistribution.employers || 0) / total) * 100).toFixed(1) : '0'}%`,
            '🏢',
          ],
          [
            'Professors',
            data.roleDistribution.professors || 0,
            `${total > 0 ? (((data.roleDistribution.professors || 0) / total) * 100).toFixed(1) : '0'}%`,
            '👨‍🏫',
          ],
        ];

        demoSheet.addTable({
          name: 'RoleTable',
          ref: `A${currentRow}`,
          headerRow: true,
          style: {
            theme: 'TableStyleMedium4',
            showRowStripes: true,
          },
          columns: [
            { name: 'Role' },
            { name: 'Count' },
            { name: 'Percentage' },
            { name: 'Icon' },
          ],
          rows: roleData,
        });
      }

      // Auto-fit columns
      demoSheet.columns = [
        { width: 20 },
        { width: 15 },
        { width: 15 },
        { width: 10 },
      ];
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return {
      filename,
      content: buffer,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }
}
