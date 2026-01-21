'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { parseExcelToJSON, analyzeData, exportToExcel } from '@/lib/excel-utils';
import { AnalysisResult } from '@/types/competitor';

export default function Page1() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setAnalysisResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) return;

    setIsAnalyzing(true);
    try {
      const parsedData = await parseExcelToJSON(uploadedFile);
      const result = analyzeData(parsedData);
      setAnalysisResult(result);
    } catch (error) {
      console.error('분석 중 오류 발생:', error);
      alert('파일 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownload = () => {
    if (!analysisResult) return;
    exportToExcel(analysisResult);
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>경쟁사 순위 분석</CardTitle>
          <CardDescription>
            엑셀 파일을 업로드하여 경쟁사 순위 데이터를 분석하고 인사이트를 확인하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 파일 업로드 영역 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">파일 업로드</label>
            <div
              onClick={handleFileUploadClick}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
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
                  {uploadedFile ? (
                    <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                  ) : (
                    <>
                      <p className="font-medium">클릭하여 파일을 선택하세요</p>
                      <p className="text-xs text-gray-500">Excel 파일만 지원합니다 (.xlsx, .xls)</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="flex gap-4">
            <Button
              onClick={handleAnalyze}
              disabled={!uploadedFile || isAnalyzing}
              className="flex-1"
            >
              {isAnalyzing ? '분석 중...' : '분석'}
            </Button>
            <Button
              onClick={handleDownload}
              disabled={!analysisResult}
              variant="outline"
              className="flex-1"
            >
              분석 파일 다운로드
            </Button>
          </div>

          {/* 분석 결과 미리보기 */}
          {analysisResult && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">
                분석 완료! 총 {analysisResult.length}개의 데이터가 분석되었습니다.
              </p>
              <p className="text-xs text-green-600 mt-1">
                &apos;분석 파일 다운로드&apos; 버튼을 클릭하여 결과를 다운로드하세요.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}