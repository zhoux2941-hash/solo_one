import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BayesianParams, BayesianResult, TestResult } from '../types';
import { formatProbability, formatNumber } from './formatters';

export interface ExportData {
  params: BayesianParams;
  result: BayesianResult;
  testResults?: TestResult[];
  viewMode: 'single' | 'iteration';
}

async function captureElement(element: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });
}

function addCanvasToPDF(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  startY: number = 0,
  margin: number = 10
): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  let heightLeft = imgHeight;
  let position = startY;

  pdf.addImage(
    canvas.toDataURL('image/png'),
    'PNG',
    margin,
    position,
    imgWidth,
    imgHeight
  );
  
  heightLeft -= (pageHeight - position);

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      margin,
      position,
      imgWidth,
      imgHeight
    );
    heightLeft -= pageHeight;
  }

  return Math.max(0, position + imgHeight + 10);
}

async function createHeaderCanvas(
  data: ExportData
): Promise<HTMLCanvasElement> {
  const header = document.createElement('div');
  header.style.cssText = `
    width: 800px;
    padding: 20px;
    background: linear-gradient(135deg, #1e3a5f 0%, #0d9488 100%);
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
  `;
  header.innerHTML = `
    <div style="text-align: center;">
      <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">贝叶斯定理计算报告</h1>
      <p style="font-size: 12px; opacity: 0.9; margin: 0;">
        生成时间: ${new Date().toLocaleString('zh-CN')}
      </p>
      <p style="font-size: 12px; opacity: 0.8; margin: 4px 0 0 0;">
        ${data.viewMode === 'single' ? '单次检测分析' : `迭代更新分析 (${data.testResults?.length || 0}次检测)`}
      </p>
    </div>
  `;
  document.body.appendChild(header);
  
  try {
    return await captureElement(header);
  } finally {
    document.body.removeChild(header);
  }
}

async function createSummaryCanvas(
  data: ExportData
): Promise<HTMLCanvasElement> {
  const { params, result, viewMode, testResults } = data;
  
  const summary = document.createElement('div');
  summary.style.cssText = `
    width: 800px;
    padding: 20px;
    background: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
    color: #334155;
  `;

  let iterationsHtml = '';
  if (viewMode === 'iteration' && testResults && testResults.length > 0) {
    iterationsHtml = `
      <div style="margin-top: 20px;">
        <h3 style="font-size: 16px; font-weight: bold; margin: 0 0 12px 0; color: #4f46e5;">检测迭代记录</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 8px 12px; text-align: left; border: 1px solid #e2e8f0;">检测序号</th>
              <th style="padding: 8px 12px; text-align: left; border: 1px solid #e2e8f0;">结果</th>
              <th style="padding: 8px 12px; text-align: left; border: 1px solid #e2e8f0;">先验概率</th>
              <th style="padding: 8px 12px; text-align: left; border: 1px solid #e2e8f0;">后验概率</th>
            </tr>
          </thead>
          <tbody>
            ${testResults.map((test, index) => `
              <tr style="${index % 2 === 0 ? 'background: #ffffff;' : 'background: #f8fafc;'}">
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">第${test.testNumber}次检测</td>
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">
                  <span style="color: ${test.testResult === 'positive' ? '#dc2626' : '#16a34a'}; font-weight: bold;">
                    ${test.testResult === 'positive' ? '阳性' : '阴性'}
                  </span>
                </td>
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${formatProbability(test.params.priorProbability)}</td>
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">
                  <strong>${formatProbability(test.result.posteriorProbability)}</strong>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  const displayResult = viewMode === 'iteration' && testResults && testResults.length > 0
    ? testResults[testResults.length - 1].result
    : result;

  summary.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px;">
        <h3 style="font-size: 14px; font-weight: bold; margin: 0 0 12px 0; color: #166534;">参数设置</h3>
        <div style="space-y: 8px;">
          <p style="font-size: 12px; margin: 4px 0;">
            <span style="color: #64748b;">先验概率（患病率）:</span>
            <strong style="margin-left: 8px;">${formatProbability(params.priorProbability)}</strong>
          </p>
          <p style="font-size: 12px; margin: 4px 0;">
            <span style="color: #64748b;">检测灵敏度:</span>
            <strong style="margin-left: 8px;">${formatProbability(params.sensitivity)}</strong>
          </p>
          <p style="font-size: 12px; margin: 4px 0;">
            <span style="color: #64748b;">假阳性率:</span>
            <strong style="margin-left: 8px;">${formatProbability(params.falsePositiveRate)}</strong>
          </p>
        </div>
      </div>
      
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px;">
        <h3 style="font-size: 14px; font-weight: bold; margin: 0 0 12px 0; color: #075985;">计算结果</h3>
        <div style="space-y: 8px;">
          <p style="font-size: 12px; margin: 4px 0;">
            <span style="color: #64748b;">后验概率:</span>
            <strong style="margin-left: 8px; font-size: 18px; color: #0369a1;">
              ${formatProbability(displayResult.posteriorProbability)}
            </strong>
          </p>
          <p style="font-size: 12px; margin: 4px 0;">
            <span style="color: #64748b;">真阳性:</span>
            <strong style="margin-left: 8px;">${formatNumber(displayResult.truePositives)}人</strong>
          </p>
          <p style="font-size: 12px; margin: 4px 0;">
            <span style="color: #64748b;">假阳性:</span>
            <strong style="margin-left: 8px;">${formatNumber(displayResult.falsePositives)}人</strong>
          </p>
          <p style="font-size: 12px; margin: 4px 0;">
            <span style="color: #64748b;">总人数:</span>
            <strong style="margin-left: 8px;">${formatNumber(displayResult.totalPopulation)}人</strong>
          </p>
        </div>
      </div>
    </div>
    ${iterationsHtml}
  `;
  document.body.appendChild(summary);
  
  try {
    return await captureElement(summary);
  } finally {
    document.body.removeChild(summary);
  }
}

export async function exportToPDF(
  elementId: string,
  exportData: ExportData
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found for PDF export');
    throw new Error('Element not found for PDF export');
  }

  try {
    const [headerCanvas, summaryCanvas, contentCanvas] = await Promise.all([
      createHeaderCanvas(exportData),
      createSummaryCanvas(exportData),
      captureElement(element),
    ]);

    const pdf = new jsPDF('p', 'mm', 'a4');
    
    addCanvasToPDF(pdf, headerCanvas, 0, 0);
    pdf.addPage();
    
    let currentY = 10;
    currentY = addCanvasToPDF(pdf, summaryCanvas, currentY);
    
    pdf.addPage();
    addCanvasToPDF(pdf, contentCanvas, 10);

    const finalResult = exportData.viewMode === 'iteration' && exportData.testResults && exportData.testResults.length > 0
      ? exportData.testResults[exportData.testResults.length - 1].result
      : exportData.result;

    pdf.setProperties({
      title: '贝叶斯定理计算报告',
      subject: `后验概率: ${formatProbability(finalResult.posteriorProbability)}`,
      creator: '贝叶斯定理工具',
      author: '贝叶斯定理工具',
    });

    pdf.save('贝叶斯定理计算报告.pdf');
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
}
