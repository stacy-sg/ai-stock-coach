from __future__ import annotations

import logging
import time
from typing import Callable, TypeVar

from google import genai
from google.genai import errors, types
from pydantic import BaseModel

from app.config import settings
from app.engine.score_engine import ScoreResult

logger = logging.getLogger(__name__)

MODEL = "gemini-flash-lite-latest"
MAX_ATTEMPTS = 3
RETRY_BACKOFF_SECONDS = 2
RETRYABLE_STATUS_CODES = {429, 503}

T = TypeVar("T")


def _with_retry(call: Callable[[], T]) -> T:
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            return call()
        except errors.APIError as e:
            if e.code not in RETRYABLE_STATUS_CODES or attempt == MAX_ATTEMPTS:
                raise
            logger.warning(
                "Gemini call failed (attempt %d/%d, %s), retrying...",
                attempt,
                MAX_ATTEMPTS,
                e.code,
            )
            time.sleep(RETRY_BACKOFF_SECONDS * attempt)

SYSTEM_INSTRUCTION = (
    "너는 개인 투자자를 돕는 AI 투자 코치다. 사용자에게 전달되는 종목 점수와 매매 신호(BUY/HOLD/WATCH/SELL)는 "
    "이미 규칙 기반 정량 분석 엔진이 계산을 마친 확정값이다. 너의 역할은 그 값을 근거로 왜 이런 신호가 나왔는지 "
    "초보 투자자도 이해할 수 있는 자연스러운 한국어로 설명하는 것뿐이다.\n"
    "다음을 반드시 지켜라:\n"
    "- 신호를 재계산하거나 다른 결론(다른 신호)을 제시하지 마라. 주어진 신호를 그대로 받아들이고 설명만 해라.\n"
    "- 주가를 예측하거나 미래 가격을 언급하지 마라.\n"
    "- 제공된 지표 수치에 근거해서만 설명하고, 실적 발표·뉴스 이벤트 등 제공되지 않은 정보는 지어내지 마라.\n"
    "- 짧은 불릿 3~5개로, 어떤 지표가 어떤 방향을 가리키는지 설명해라.\n"
    "- 종목명, 기준일, 최종 신호는 화면의 다른 영역에 이미 표시되어 있다. 제목(마크다운 헤딩)이나 "
    "'기준일: ... / 최종 신호: ...' 같은 메타정보 줄을 넣지 말고, 바로 설명 불릿부터 시작해라."
)

_client = genai.Client(api_key=settings.gemini_api_key)


def generate_report(stock_name: str, market: str, indicators: dict, result: ScoreResult) -> str | None:
    """Best-effort LLM narration of an already-decided signal.

    Returns None on failure instead of raising, so a flaky LLM call never
    discards the (already-computed, already-correct) rule-engine scores —
    callers should still persist the snapshot with llm_report=None.
    """
    try:
        return _generate_report(stock_name, market, indicators, result)
    except Exception:
        logger.exception("LLM report generation failed for %s:%s", market, stock_name)
        return None


def _generate_report(stock_name: str, market: str, indicators: dict, result: ScoreResult) -> str:
    volume_ratio = indicators["volume"] / indicators["volume_ma20"]
    prompt = f"""종목: {stock_name} ({market})
기준일: {result.as_of_date}

[정량 지표]
현재가: {indicators['close']:,.0f}
5일 이동평균: {indicators['ma5']:,.0f}
20일 이동평균: {indicators['ma20']:,.0f}
60일 이동평균: {indicators['ma60']:,.0f}
RSI(14): {indicators['rsi14']:.1f}
MACD: {indicators['macd']:.2f} / Signal: {indicators['macd_signal']:.2f}
ATR(14): {indicators['atr14']:.2f}
거래량: 20일 평균 대비 {volume_ratio:.2f}배

[Score Engine 결과 — 이미 확정된 값, 재계산 금지]
Trend Score: {result.trend_score:.0f} / 100
Momentum Score: {result.momentum_score:.0f} / 100
Risk Score: {result.risk_score:.0f} / 100
Volume Score: {result.volume_score:.0f} / 100
News Score: {result.news_score:.0f} / 100
종합 점수: {result.total_score:.1f} / 100
최종 신호: {result.signal}

위 신호가 왜 나왔는지 설명하는 리포트를 작성해줘."""

    response = _with_retry(
        lambda: _client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(system_instruction=SYSTEM_INSTRUCTION),
        )
    )
    return response.text


class _NewsAnalysis(BaseModel):
    index: int
    summary: str
    sentiment: str  # POSITIVE / NEGATIVE / NEUTRAL
    sentiment_score: float  # -1.0 ~ 1.0


class _NewsAnalysisList(BaseModel):
    items: list[_NewsAnalysis]


def analyze_news(titles: list[str]) -> dict[int, dict] | None:
    """Batch summary + sentiment scoring for news headlines.

    Returns a dict keyed by the input index, or None if the whole batch
    failed — callers should skip sentiment/summary for this sync round
    rather than raise, same resilience policy as generate_report.
    """
    if not titles:
        return {}
    try:
        return _analyze_news(titles)
    except Exception:
        logger.exception("LLM news analysis failed for %d articles", len(titles))
        return None


def _analyze_news(titles: list[str]) -> dict[int, dict]:
    numbered = "\n".join(f"{i}: {t}" for i, t in enumerate(titles))
    prompt = (
        "다음은 어떤 종목 관련 뉴스 제목들이다. 각 제목마다 한국어로 한 문장 요약과, "
        "그 뉴스가 해당 종목에 대해 갖는 감성을 POSITIVE/NEGATIVE/NEUTRAL로 분류하고 "
        "-1.0(매우 부정)~1.0(매우 긍정) 사이의 sentiment_score를 매겨라. "
        "제목만으로 판단이 어려우면 NEUTRAL과 0.0을 사용해라.\n\n" + numbered
    )
    response = _with_retry(
        lambda: _client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=_NewsAnalysisList,
            ),
        )
    )
    parsed = _NewsAnalysisList.model_validate_json(response.text)
    return {item.index: item.model_dump() for item in parsed.items}
