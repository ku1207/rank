'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { excelToJson, analyzeData, jsonToExcel, downloadFile } from '@/lib/excel-utils'
import type { AnalysisResult } from '@/types/competitor-rank'

export default function Page1() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult[] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setAnalysisResult(null) // 새 파일 선택 시 이전 분석 결과 초기화
    }
  }

  // 파일 업로드 영역 클릭 핸들러
  const handleUploadAreaClick = () => {
    fileInputRef.current?.click()
  }

  // 분석 버튼 클릭 핸들러
  const handleAnalyze = async () => {
    if (!selectedFile) return

    setIsAnalyzing(true)
    try {
      // 1. 엑셀 파일을 JSON으로 변환
      const jsonData = await excelToJson(selectedFile)

      // 2. 데이터 분석
      const result = analyzeData(jsonData)

      // 3. 분석 결과 저장
      setAnalysisResult(result)
    } catch (error) {
      console.error('분석 중 오류 발생:', error)
      alert('파일 분석 중 오류가 발생했습니다.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 분석 파일 다운로드 핸들러
  const handleDownload = () => {
    if (!analysisResult) return

    // 3. 분석 결과를 엑셀로 변환
    const excelBlob = jsonToExcel(analysisResult)

    // 4. 파일 다운로드
    const filename = `분석결과_${new Date().toISOString().split('T')[0]}.xlsx`
    downloadFile(excelBlob, filename)
  }

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* 제목 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">경쟁사 순위 분석 서비스</h1>
          <p className="text-gray-600">엑셀 파일을 업로드하여 경쟁사 순위 데이터를 분석하세요</p>
        </div>

        {/* 파일 업로드 영역 */}
        <div
          onClick={handleUploadAreaClick}
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm text-gray-600">
              {selectedFile ? (
                <span className="font-medium text-gray-900">{selectedFile.name}</span>
              ) : (
                <>
                  <span className="font-medium text-blue-600">클릭하여 파일 업로드</span>
                  <span> 또는 드래그 앤 드롭</span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500">XLSX, XLS 파일만 업로드 가능</p>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex gap-4">
          <Button
            onClick={handleAnalyze}
            disabled={!selectedFile || isAnalyzing}
            className="flex-1"
            size="lg"
          >
            {isAnalyzing ? '분석 중...' : '분석'}
          </Button>

          <Button
            onClick={handleDownload}
            disabled={!analysisResult}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            분석 파일 다운로드
          </Button>
        </div>

        {/* 분석 결과 표시 */}
        {analysisResult && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              ✓ 분석 완료: {analysisResult.length}개의 데이터가 분석되었습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}