import Papa from 'papaparse';
import type { DataAdapter, OrderRecord, ParseResult, CSVParseOptions } from '@/types';
import { CSV_COLUMNS } from '@/config';
import { parseDate, parseNumber } from '@/utils';

interface RawCSVRow {
  [key: string]: string;
}

export class CSVAdapter implements DataAdapter<OrderRecord> {
  private requiredColumns = [
    CSV_COLUMNS.ORDER_DATE,
    CSV_COLUMNS.DISH_NAME,
    CSV_COLUMNS.QUANTITY,
    CSV_COLUMNS.UNIT_PRICE,
    CSV_COLUMNS.COST_PRICE,
  ];

  parse(raw: string, options: CSVParseOptions = {}): ParseResult<OrderRecord> {
    const { delimiter = ',', hasHeader = true } = options;
    
    const errors: string[] = [];
    const parsedData: OrderRecord[] = [];
    
    const result = Papa.parse<RawCSVRow>(raw, {
      header: hasHeader,
      delimiter,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (result.errors.length > 0) {
      result.errors.forEach((err) => {
        if (err.type !== 'FieldMismatch' || err.code !== 'TooManyFields') {
          errors.push(`第${err.row}行: ${err.message}`);
        }
      });
    }

    const rows = result.data as RawCSVRow[];
    
    if (rows.length === 0) {
      errors.push('CSV文件为空或格式不正确');
      return { data: [], errors, meta: { rowCount: 0, delimiter } };
    }

    const validation = this.validate(rows);
    if (!validation.valid) {
      return { data: [], errors: validation.errors, meta: { rowCount: rows.length, delimiter } };
    }

    rows.forEach((row, index) => {
      const lineNumber = index + 2;
      const record = this.transformRow(row, lineNumber, errors);
      if (record) {
        parsedData.push(record);
      }
    });

    return {
      data: parsedData,
      errors,
      meta: {
        rowCount: rows.length,
        delimiter,
      },
    };
  }

  validate(data: unknown[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (data.length === 0) {
      return { valid: false, errors: ['数据为空'] };
    }

    const firstRow = data[0] as RawCSVRow;
    const columns = Object.keys(firstRow);
    
    const missingColumns = this.requiredColumns.filter(
      (col) => !columns.some((c) => c.trim() === col)
    );

    if (missingColumns.length > 0) {
      errors.push(`缺少必需列: ${missingColumns.join(', ')}`);
      errors.push(`必需列名: ${this.requiredColumns.join('、')}`);
      return { valid: false, errors };
    }

    return { valid: true, errors };
  }

  private transformRow(
    row: RawCSVRow,
    lineNumber: number,
    errors: string[]
  ): OrderRecord | null {
    const orderDate = parseDate(row[CSV_COLUMNS.ORDER_DATE] || '');
    const dishName = (row[CSV_COLUMNS.DISH_NAME] || '').trim();
    const quantity = parseNumber(row[CSV_COLUMNS.QUANTITY] || '');
    const unitPrice = parseNumber(row[CSV_COLUMNS.UNIT_PRICE] || '');
    const costPrice = parseNumber(row[CSV_COLUMNS.COST_PRICE] || '');

    const rowErrors: string[] = [];

    if (!orderDate) {
      rowErrors.push(`日期格式错误"${row[CSV_COLUMNS.ORDER_DATE]}"`);
    }
    if (!dishName) {
      rowErrors.push('菜品名称为空');
    }
    if (quantity === null || quantity < 0) {
      rowErrors.push(`份数无效"${row[CSV_COLUMNS.QUANTITY]}"`);
    }
    if (unitPrice === null || unitPrice < 0) {
      rowErrors.push(`单价无效"${row[CSV_COLUMNS.UNIT_PRICE]}"`);
    }
    if (costPrice === null || costPrice < 0) {
      rowErrors.push(`成本价无效"${row[CSV_COLUMNS.COST_PRICE]}"`);
    }

    if (rowErrors.length > 0) {
      errors.push(`第${lineNumber}行: ${rowErrors.join('; ')}`);
      return null;
    }

    return {
      orderDate: orderDate!,
      dishName,
      quantity: quantity!,
      unitPrice: unitPrice!,
      costPrice: costPrice!,
    };
  }
}

export const csvAdapter = new CSVAdapter();

export function parseCSVFile(file: File): Promise<ParseResult<OrderRecord>> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = csvAdapter.parse(content);
      resolve(result);
    };
    
    reader.onerror = () => {
      resolve({
        data: [],
        errors: ['文件读取失败'],
        meta: { rowCount: 0, delimiter: ',' },
      });
    };
    
    reader.readAsText(file, 'UTF-8');
  });
}

export function generateSampleCSV(): string {
  const header = Object.values(CSV_COLUMNS).join(',');
  const sampleData = [
    ['2024-01-01', '红烧肉', '25', '58', '28'],
    ['2024-01-01', '清蒸鲈鱼', '18', '88', '45'],
    ['2024-01-01', '宫保鸡丁', '32', '38', '15'],
    ['2024-01-02', '红烧肉', '22', '58', '28'],
    ['2024-01-02', '麻婆豆腐', '45', '22', '8'],
    ['2024-01-02', '佛跳墙', '0', '198', '120'],
    ['2024-01-02', '酸辣土豆丝', '120', '18', '6'],
    ['2024-01-03', '清蒸鲈鱼', '15', '88', '45'],
    ['2024-01-03', '红烧肉', '28', '58', '28'],
    ['2024-01-03', '松茸炖鸡', '0', '168', '140'],
    ['2024-01-03', '水煮鱼', '95', '68', '35'],
    ['2024-01-04', '宫保鸡丁', '29', '38', '15'],
    ['2024-01-04', '麻婆豆腐', '38', '22', '8'],
    ['2024-01-04', '帝王蟹', '0', '388', '310'],
    ['2024-01-04', '鱼香肉丝', '78', '32', '12'],
    ['2024-01-05', '清蒸鲈鱼', '20', '88', '45'],
    ['2024-01-05', '龙虾刺身', '0', '288', '240'],
  ];
  
  return [header, ...sampleData.map((row) => row.join(','))].join('\n');
}
