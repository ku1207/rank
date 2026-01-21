import * as XLSX from 'xlsx';
import { CompetitorData, AnalysisResult } from '@/types/competitor';

export function parseExcelToJSON(file: File): Promise<CompetitorData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

        if (jsonData.length < 2) {
          reject(new Error('엑셀 파일에 데이터가 충분하지 않습니다.'));
          return;
        }

        const rows = jsonData.slice(1);

        const parsedData: CompetitorData[] = rows.map(row => {
          const data: Partial<CompetitorData> = {
            keyword: (row[0] as string) || '',
            ad_area: ((row[1] as string) || 'PC') as 'PC' | 'Mobile',
            advertiser: (row[2] as string) || '',
            url: (row[3] as string) || '',
            average: parseFloat(row[4] as string) || 0,
          };

          for (let i = 0; i < 24; i++) {
            const hourKey = `hour_${String(i).padStart(2, '0')}` as keyof CompetitorData;
            (data as Record<string, number | string>)[hourKey] = parseFloat(row[5 + i] as string) || 0;
          }

          return data as CompetitorData;
        });

        resolve(parsedData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('파일 읽기 중 오류가 발생했습니다.'));
    };

    reader.readAsBinaryString(file);
  });
}

export function analyzeData(data: CompetitorData[]): AnalysisResult[] {
  return data.map(item => {
    const hourValues: { hour: string; value: number }[] = [];

    for (let i = 0; i < 24; i++) {
      const hourKey = `hour_${String(i).padStart(2, '0')}` as keyof CompetitorData;
      const value = item[hourKey] as number;
      hourValues.push({
        hour: `${String(i).padStart(2, '0')}시`,
        value: value,
      });
    }

    const nonZeroValues = hourValues.filter(h => h.value > 0);
    const activeHours = nonZeroValues.length;

    const peakHour = hourValues.reduce((max, current) =>
      current.value > max.value ? current : max
    );

    const lowestHour = nonZeroValues.length > 0
      ? nonZeroValues.reduce((min, current) =>
          current.value < min.value ? current : min
        )
      : { hour: '00시', value: 0 };

    return {
      keyword: item.keyword,
      ad_area: item.ad_area,
      advertiser: item.advertiser,
      url: item.url,
      average: item.average,
      peak_hour: peakHour.hour,
      peak_value: peakHour.value,
      lowest_hour: lowestHour.hour,
      lowest_value: lowestHour.value,
      active_hours: activeHours,
      hour_00: item.hour_00,
      hour_01: item.hour_01,
      hour_02: item.hour_02,
      hour_03: item.hour_03,
      hour_04: item.hour_04,
      hour_05: item.hour_05,
      hour_06: item.hour_06,
      hour_07: item.hour_07,
      hour_08: item.hour_08,
      hour_09: item.hour_09,
      hour_10: item.hour_10,
      hour_11: item.hour_11,
      hour_12: item.hour_12,
      hour_13: item.hour_13,
      hour_14: item.hour_14,
      hour_15: item.hour_15,
      hour_16: item.hour_16,
      hour_17: item.hour_17,
      hour_18: item.hour_18,
      hour_19: item.hour_19,
      hour_20: item.hour_20,
      hour_21: item.hour_21,
      hour_22: item.hour_22,
      hour_23: item.hour_23,
    };
  });
}

export function exportToExcel(data: AnalysisResult[], filename: string = '분석결과.xlsx') {
  const headers = [
    '키워드',
    '광고영역',
    '광고주',
    'URL',
    '평균',
    '최고 시간대',
    '최고 수치',
    '최저 시간대',
    '최저 수치',
    '활성 시간대 수',
    '00시',
    '01시',
    '02시',
    '03시',
    '04시',
    '05시',
    '06시',
    '07시',
    '08시',
    '09시',
    '10시',
    '11시',
    '12시',
    '13시',
    '14시',
    '15시',
    '16시',
    '17시',
    '18시',
    '19시',
    '20시',
    '21시',
    '22시',
    '23시',
  ];

  const rows = data.map(item => [
    item.keyword,
    item.ad_area,
    item.advertiser,
    item.url,
    item.average,
    item.peak_hour,
    item.peak_value,
    item.lowest_hour,
    item.lowest_value,
    item.active_hours,
    item.hour_00,
    item.hour_01,
    item.hour_02,
    item.hour_03,
    item.hour_04,
    item.hour_05,
    item.hour_06,
    item.hour_07,
    item.hour_08,
    item.hour_09,
    item.hour_10,
    item.hour_11,
    item.hour_12,
    item.hour_13,
    item.hour_14,
    item.hour_15,
    item.hour_16,
    item.hour_17,
    item.hour_18,
    item.hour_19,
    item.hour_20,
    item.hour_21,
    item.hour_22,
    item.hour_23,
  ]);

  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '분석결과');

  XLSX.writeFile(workbook, filename);
}
