import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { CompetitorRankData, ClaudeInsight } from '@/types/competitor-rank'

const ANALYSIS_PROMPT = `당신은 디지털 마케팅(검색광고) 실무 컨설턴트입니다. '광고 순위 모니터링 결과(시간대/매체/키워드/광고주별 순위 데이터)'를 해석해, 실무자가 바로 실행할 수 있는 인사이트를 도출하세요.

##배경
- 본 데이터는 일정 기간 동안 특정 키워드의 광고 노출 순위를 시간대별로 기록한 모니터링 결과입니다.
- 순위 값이 0(또는 null/미노출)이라면 해당 시간대에 광고가 노출되지 않았음을 의미합니다.
- 결과는 "왜 그런지"를 길게 설명하기보다, "무엇이 문제/기회인지"와 "지금 뭘 해야 하는지"를 즉시 제시해야 합니다.

##입력 데이터
{DATA}

##분석 가이드(출력에는 공식/로직 설명 금지)
아래 항목들을 데이터에서 계산/비교하여 결론을 내리되, 계산 방법(표준편차, 임계값 등)이나 개념 설명은 출력에 쓰지 마세요.

- 전체 건강도: 평균 순위, Top 1~3 점유(가능 시), 미노출(0) 비중, 시간대별 변동성
- 매체 비대칭: PC vs Mobile 평균 순위/미노출 비중 격차가 큰 키워드·광고주 탐지
- 경쟁 강도: 특정 시간대에 다수 광고주의 순위가 동반 악화(평균 하락/0 증가)하는 구간 탐지, 변동성이 큰 키워드/매체 식별
- 광고주 성향: (안정형/효율형/방치형/공격형 등) 데이터 패턴으로 분류하고, 우리 전략 관점의 의미 도출
- 기회 시간대(골든 타임): 전체 경쟁이 느슨해지는 시간대(평균 순위가 전반적으로 낮아지거나 0이 늘어나는 구간)를 찾아 "최소 비용으로 상위 점유 가능" 관점의 제안

※ 데이터 구조(예: keyword, device, hour, rank 등)를 최대한 활용해 위 관점으로 추론하세요.
※ 가능한 경우, 인사이트 문장 안에 "키워드/광고주/시간대/PC·MO" 중 1~2개 이상을 구체 예시로 포함하고, 수치(평균 순위, 격차, 0 비중 등)를 1개 이상 포함하세요.
※ 단, 문장은 각 항목당 3~5문장으로 제한합니다.

##분석 요청사항 (각 1~2문장, 알고리즘/로직 설명 금지)
- overall_health: 전체 순위/노출 건강도 요약(Top권 유지 여부, 미노출 리스크, 변동성 관점)
- media_asymmetry: PC/Mobile 간 성과 비대칭이 큰 키워드·광고주 패턴과 그 의미
- competitor_dynamics: 경쟁 강도가 높은 구간/키워드/매체(입찰 격전/집중 경쟁/급변 구간)와 대응 방향
- golden_time: '기회 시간대'(경쟁 약화/미노출 증가 등)와 활용 제안(공격/방어 관점 중 1개 이상)
- action_items: 실무자가 즉시 검토할 1~2가지(예: 매체별 입찰/예산 분리, 특정 시간대 데이파팅 테스트, 특정 광고주/키워드 모니터링 강화 등)

##출력 형식(반드시 JSON만 출력, 다른 텍스트 금지)
{
"overall_health": "...",
"media_asymmetry": "...",
"competitor_dynamics": "...",
"golden_time": "...",
"action_items": "..."
}`

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json() as { data: CompetitorRankData[] }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: '분석할 데이터가 없습니다.' },
        { status: 400 }
      )
    }

    // API 키 확인
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'your_api_key_here') {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인하세요.' },
        { status: 500 }
      )
    }

    // Anthropic 클라이언트 생성
    const anthropic = new Anthropic({
      apiKey,
    })

    // 데이터를 프롬프트에 삽입
    const dataString = JSON.stringify(data, null, 2)
    const prompt = ANALYSIS_PROMPT.replace('{DATA}', dataString)

    // Claude API 호출
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // 응답 파싱
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // JSON 추출 (코드 블록이나 다른 텍스트가 있을 수 있음)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Claude 응답에서 JSON을 찾을 수 없습니다.')
    }

    const insight: ClaudeInsight = JSON.parse(jsonMatch[0])

    return NextResponse.json({ insight })
  } catch (error) {
    console.error('분석 API 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
