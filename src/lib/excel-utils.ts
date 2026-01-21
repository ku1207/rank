import * as XLSX from 'xlsx'
import type { CompetitorRankData, AnalysisResult } from '@/types/competitor-rank'

/**
 * 엑셀 파일을 JSON 형태로 변환
 */
export async function excelToJson(file: File): Promise<CompetitorRankData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]

        // 엑셀 데이터를 JSON으로 변환
        const rawData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[]

        // 데이터 매핑
        const mappedData: CompetitorRankData[] = rawData.map((row) => ({
          keyword: String(row['키워드'] || ''),
          ad_area: (row['광고영역'] || 'PC') as 'PC' | 'Mobile',
          advertiser: String(row['광고주'] || ''),
          url: String(row['URL'] || ''),
          average: Number(row['평균']) || 0,
          hour_00: Number(row['00시']) || 0,
          hour_01: Number(row['01시']) || 0,
          hour_02: Number(row['02시']) || 0,
          hour_03: Number(row['03시']) || 0,
          hour_04: Number(row['04시']) || 0,
          hour_05: Number(row['05시']) || 0,
          hour_06: Number(row['06시']) || 0,
          hour_07: Number(row['07시']) || 0,
          hour_08: Number(row['08시']) || 0,
          hour_09: Number(row['09시']) || 0,
          hour_10: Number(row['10시']) || 0,
          hour_11: Number(row['11시']) || 0,
          hour_12: Number(row['12시']) || 0,
          hour_13: Number(row['13시']) || 0,
          hour_14: Number(row['14시']) || 0,
          hour_15: Number(row['15시']) || 0,
          hour_16: Number(row['16시']) || 0,
          hour_17: Number(row['17시']) || 0,
          hour_18: Number(row['18시']) || 0,
          hour_19: Number(row['19시']) || 0,
          hour_20: Number(row['20시']) || 0,
          hour_21: Number(row['21시']) || 0,
          hour_22: Number(row['22시']) || 0,
          hour_23: Number(row['23시']) || 0,
        }))

        resolve(mappedData)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = (error) => {
      reject(error)
    }

    reader.readAsBinaryString(file)
  })
}

/**
 * 데이터 분석 함수
 */
export function analyzeData(data: CompetitorRankData[]): AnalysisResult[] {
  return data.map((item) => {
    // 시간대별 데이터 추출
    const hourlyData = [
      { hour: '00시', value: item.hour_00 },
      { hour: '01시', value: item.hour_01 },
      { hour: '02시', value: item.hour_02 },
      { hour: '03시', value: item.hour_03 },
      { hour: '04시', value: item.hour_04 },
      { hour: '05시', value: item.hour_05 },
      { hour: '06시', value: item.hour_06 },
      { hour: '07시', value: item.hour_07 },
      { hour: '08시', value: item.hour_08 },
      { hour: '09시', value: item.hour_09 },
      { hour: '10시', value: item.hour_10 },
      { hour: '11시', value: item.hour_11 },
      { hour: '12시', value: item.hour_12 },
      { hour: '13시', value: item.hour_13 },
      { hour: '14시', value: item.hour_14 },
      { hour: '15시', value: item.hour_15 },
      { hour: '16시', value: item.hour_16 },
      { hour: '17시', value: item.hour_17 },
      { hour: '18시', value: item.hour_18 },
      { hour: '19시', value: item.hour_19 },
      { hour: '20시', value: item.hour_20 },
      { hour: '21시', value: item.hour_21 },
      { hour: '22시', value: item.hour_22 },
      { hour: '23시', value: item.hour_23 },
    ]

    // 0이 아닌 값들만 필터링
    const nonZeroData = hourlyData.filter((d) => d.value !== 0)

    // 최고 시간대
    const peakHour = nonZeroData.reduce((max, current) =>
      current.value > max.value ? current : max
    , nonZeroData[0] || { hour: '-', value: 0 })

    // 최저 시간대
    const lowestHour = nonZeroData.reduce((min, current) =>
      current.value < min.value ? current : min
    , nonZeroData[0] || { hour: '-', value: 0 })

    // 분산 계산
    const values = nonZeroData.map((d) => d.value)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length

    return {
      keyword: item.keyword,
      ad_area: item.ad_area,
      advertiser: item.advertiser,
      url: item.url,
      average: item.average,
      peak_hour: peakHour.hour,
      lowest_hour: lowestHour.hour,
      variance: Number(variance.toFixed(2)),
    }
  })
}

/**
 * 분석 결과를 엑셀 파일로 변환
 */
export function jsonToExcel(data: AnalysisResult[]): Blob {
  // 엑셀 형태로 변환할 데이터 준비
  const excelData = data.map((item) => ({
    '키워드': item.keyword,
    '광고영역': item.ad_area,
    '광고주': item.advertiser,
    'URL': item.url,
    '평균 순위': item.average,
    '최고 시간대': item.peak_hour,
    '최저 시간대': item.lowest_hour,
    '분산': item.variance,
  }))

  // 워크시트 생성
  const worksheet = XLSX.utils.json_to_sheet(excelData)

  // 워크북 생성
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '분석 결과')

  // 바이너리 데이터 생성
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })

  // Blob 생성
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

/**
 * 파일 다운로드
 */
export function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
