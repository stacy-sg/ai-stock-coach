# AI Stock Coach — 프로젝트 기획 · 설계 · 개발 로드맵

> **최종 업데이트**: 2026-06-05
>
> **프로젝트 타입**: 개인 사이드 프로젝트 (AI Portfolio)
>
> **한 줄 요약**:
>
> 사용자 투자 성향과 시장 데이터를 기반으로 종목을 분석하고,
> AI가 매수·매도 판단 근거를 설명해주는 개인 투자 코치 시스템.

---

## 1. 프로젝트 개요

### 1.1 프로젝트 소개

주식 초보자는 대부분 다음과 같은 문제를 겪는다.

* 어떤 종목을 사야 하는지 모르겠다.
* 왜 사야 하는지 이해하지 못한다.
* 언제 팔아야 하는지 더 어렵다.
* 뉴스가 많아도 무엇이 중요한지 판단하기 어렵다.

이 프로젝트는 AI를 이용하여 단순히 종목을 추천하는 것이 아니라,

**"왜 지금 매수(혹은 관망)해야 하는지"**
**"왜 지금 매도(혹은 분할 익절)해야 하는지"**

를 데이터 기반으로 설명해주는 개인 AI 투자 코치를 만드는 것을 목표로 한다.

---

### 1.2 프로젝트 목표

#### 기술적 목표

* 금융 데이터 수집 파이프라인 구축
* 기술적 지표 기반 분석 엔진 구현
* Rule Engine + LLM Hybrid 구조 설계
* 뉴스 데이터 분석 및 요약
* 개인 맞춤형 추천 시스템 구현
* 백테스트 가능한 구조 설계

#### 개인적인 목표

* AI 개발자로서 실제 사용할 수 있는 프로젝트 완성
* LLM 활용 능력 향상
* 금융 데이터 처리 경험 확보
* 추천 시스템 설계 경험
* End-to-End 서비스 개발 경험

---

### 1.3 프로젝트 철학

이 프로젝트는 미래를 예언하는 AI를 만드는 것이 아니다.

대신,

> 현재 시장 상황과 사용자의 투자 성향을 분석하여,
> 투자 판단을 보조하는 AI 코치를 만드는 것을 목표로 한다.

LLM은 설명과 의사소통을 담당하고,

실제 투자 판단은
정량적인 데이터와 규칙 기반 분석 엔진이 담당한다.

> 시스템은 여러 정량 지표를 기반으로 BUY / HOLD / WATCH / SELL 신호를 생성하고,
> LLM은 해당 신호가 생성된 이유를 사용자가 이해하기 쉬운 언어로 설명한다.

---

### 1.4 개발 목적

본 프로젝트는 사업화 목적이 아닌 개인 학습 및 포트폴리오 목적의 프로젝트이다.

실제 본인이 사용할 것을 전제로 하며,

개발 과정에서 다음 역량을 함께 학습하는 것을 목표로 한다.

* AI Engineering
* Financial Data Processing
* Recommender System
* LLM Integration
* RAG Architecture
* Agent Design
* Time-Series Data Handling

---

## 2. 핵심 사용자 시나리오

### 2.1 최초 사용

1. 사용자가 투자 경험, 투자 기간, 월 투자 가능 금액, 손실 허용 범위, 관심 산업을 입력한다.
2. AI가 개인 투자 프로필을 생성한다. (MVP에서는 안정형 고정)

---

### 2.2 종목 분석

1. 사용자가 특정 종목을 선택한다. (한국 / 미국 주식 모두 가능)
2. 시스템이 시장 데이터를 수집한다.
3. 기술적 지표를 계산한다.
4. 뉴스 데이터를 분석한다.
5. 종합 점수를 계산한다.
6. AI가 분석 결과를 자연어로 설명한다.

예시)

* 현재 상승 추세가 유지되고 있습니다.
* 거래량이 평균 대비 증가하고 있습니다.
* 다만 실적 발표가 가까워 단기 변동성이 커질 가능성이 있습니다.

---

### 2.3 보유 종목 관리

사용자가 현재 보유 중인 종목을 등록한다. (종목, 매수가, 수량 입력)

시스템은

* 현재 수익률 (매수가 대비 현재가)
* 리스크 수준
* 기술적 신호
* 뉴스 이벤트

를 종합하여

* 보유
* 분할 익절
* 관망
* 리스크 경고

등의 가이드를 제공한다.

---

## 3. 핵심 기능 (MVP)

### 3.1 사용자 투자 성향 분석

MVP에서는 안정형 프로필 고정.

입력 항목

* 투자 경험
* 투자 기간
* 월 투자 가능 금액
* 손실 허용 범위
* 관심 산업

출력

* 안정형 투자 프로필 (향후 성장형 / 공격형으로 확장)

---

### 3.2 종목 분석

분석 대상

* 이동평균선
* RSI
* MACD
* 거래량
* 변동성
* 최근 추세

각 지표를 기반으로 종목 상태를 점수화한다.

---

### 3.3 AI 투자 코치

LLM은 다음 역할을 담당한다.

* 기술 지표 설명
* 투자 용어 설명
* 분석 결과 자연어 변환
* 사용자 맞춤형 리포트 생성
* 뉴스 요약

---

### 3.4 매도 타이밍 가이드

본 프로젝트의 핵심 기능.

예시

현재 수익률 : +11.4%

AI 의견

* 상승 추세는 유지되고 있습니다.
* 최근 거래량 감소가 관찰됩니다.
* 일부 물량 분할 익절을 고려할 수 있습니다.

---

### 3.5 뉴스 분석

초기 버전에서는

* 뉴스 수집
* 뉴스 요약
* 긍정/부정 감성 분석

까지만 구현한다.

향후

* 실적 발표
* CEO 교체
* M&A
* 정책 변화

등 이벤트 추출 기능으로 확장한다.

---

## 4. 시스템 아키텍처

### 4.1 전체 구조

```text
[Frontend - Next.js]
        │
        ▼
[FastAPI Backend]
        │
        ├─────────────────────┐
        │                     │
        ▼                     ▼
[Analysis Engine]         [LLM API]
        │
        ├─────────────────────┐
        │                     │
        ▼                     ▼
[FinanceDataReader]      [뉴스 수집기]
(가격 이력 수집)          (한국어 / 영어 분기)
        │
        ▼
[PostgreSQL]
```

---

### 4.2 설계 원칙

#### Rule Engine이 판단한다

계산, 점수화, 추천 생성은 모두 정량 분석 엔진이 수행한다.

#### LLM은 설명한다

LLM은 계산하지 않고 예측하지 않는다.
오직 설명, 요약, 사용자 친화적 리포트 생성 역할만 수행한다.

---

## 5. AI 파이프라인

```text
주가 데이터 수집 (FinanceDataReader)
        │
        ▼
기술적 지표 계산 (TA-Lib)
        │
        ▼
뉴스 데이터 분석 (감성 분석)
        │
        ▼
종합 점수 계산 (Score Engine)
        │
        ▼
analysis_snapshots 조회
        │
        ├── Cache Hit ──▶ 기존 Report 반환
        │
        ▼ Cache Miss
        │
LLM 설명 생성 (Gemini API)
        │
        ▼
DB 저장 (analysis_snapshots)
        │
        ▼
사용자에게 리포트 제공
```

---

## 6. 추천 엔진 설계

### 6.1 Score System

안정형 기준 가중치 (MVP 고정)

| Score | 가중치 |
| --- | --- |
| Risk Score | 30% |
| Trend Score | 25% |
| Volume Score | 20% |
| Momentum Score | 15% |
| News Score | 10% |

> **Risk Score**는 변동성, ATR, MDD, 최근 급등 여부 등 여러 리스크 지표를 내부적으로 종합하여 계산된다. 세부 계산 공식은 추후 정의한다.

향후 성장형 / 공격형 가중치 세트를 추가하여 투자 성향별로 확장한다.

---

### 6.2 Score v1 계산 공식

> **방식**: 절대 임계값 (MVP 고정)
> 시장 국면과 무관하게 고정된 임계값으로 계산한다.
> 향후 "최근 N일 분포 기반 퍼센타일(상대 순위)" 방식으로 교체를 고려할 수 있으나, MVP에서는 단순성을 우선한다.

#### Trend Score (이동평균선 기반)

| 조건 | 점수 |
| --- | --- |
| 현재가 > MA5 > MA20 > MA60 (완전 정배열) | 100 |
| MA5 > MA20 이지만 MA60 역전 | 70 |
| 현재가 > MA20 이지만 MA5 < MA20 | 50 |
| 현재가 < MA20 | 20 |
| MA5 < MA20 < MA60 (완전 역배열) | 10 |

#### Momentum Score (RSI + MACD)

| 조건 | 점수 |
| --- | --- |
| RSI 50~65 + MACD > Signal | 90~100 |
| RSI 50~65 but MACD < Signal | 60 |
| RSI 65~70 | 70 |
| RSI > 70 (과매수) | 30 |
| RSI 40~50 | 40 |
| RSI 30~40 | 25 |
| RSI < 30 (과매도) | 10 |

#### Risk Score (변동성 기반 — 낮을수록 고점수)

ATR / 현재가 비율로 일일 변동성을 계산한다.

| ATR/Price (%) | 점수 |
| --- | --- |
| < 1% | 90~100 |
| 1~2% | 70~89 |
| 2~4% | 40~69 |
| 4~6% | 20~39 |
| > 6% | 10~19 |

> 최근 5거래일 내 15% 이상 급등한 경우 -20점 패널티를 적용한다.

#### Volume Score (거래량 vs 20일 평균)

| 현재 거래량 / 20일 평균 | 점수 |
| --- | --- |
| > 2.0배 | 100 |
| 1.5~2.0배 | 80 |
| 1.0~1.5배 | 60 |
| 0.7~1.0배 | 40 |
| < 0.7배 | 20 |

#### News Score (감성 점수 평균)

```python
news_score = (avg_sentiment_score + 1) / 2 * 100
```

`avg_sentiment_score` 범위: -1.0 ~ 1.0 → 0 ~ 100 선형 변환

뉴스가 없을 경우 50점(중립)으로 처리한다.

---

### 6.3 최종 Signal 매핑

| total_score | Signal |
| --- | --- |
| >= 70 | **BUY** |
| 50 ~ 69 | **HOLD** |
| 30 ~ 49 | **WATCH** |
| < 30 | **SELL** |

---

### 6.4 보유 종목 가이드 규칙 (Phase 5)

보유 종목은 `analysis_snapshots`의 LLM 리포트를 재사용하지 않는다. `GET /api/holdings` 조회마다 Gemini를 호출하면 비용이 통제 불가능하므로, Score Engine(순수 계산)만으로 가이드를 산출한다. 자연어 설명이 필요하면 해당 종목의 `/api/stocks/{ticker}/analysis`로 유도한다.

수익률 = (현재가 - avg_price) / avg_price * 100 (환율 미반영, 통화별 개별 표시 — 9장 참고)

우선순위 순으로 판정(먼저 만족하는 조건 채택):

| 조건 | 가이드 |
| --- | --- |
| signal == SELL 이거나 risk_score < 20 | **리스크 경고** |
| 수익률 >= 10% 이고 signal in (WATCH, HOLD) | **분할 익절** |
| signal == BUY | **보유** |
| 그 외 | **관망** |

> 임계값(수익률 10%, risk_score 20)은 설계서에 명시되지 않아 구현 시 임의로 정한 값이다. 3.4절 예시("+11.4%, 상승 추세 유지, 분할 익절 고려")와 부합하도록 잡았으며, 실사용하며 조정 가능하다.

---

### 6.5 백테스트 (Phase 6)

12.2절에서 Score Engine을 `calculate_scores(ticker, market, as_of_date)` 순수 함수로 설계해둔 덕에, 백테스트는 이 함수와 동일한 채점 로직(`_trend_score`, `_momentum_score`, `_risk_score`, `_volume_score`, `WEIGHTS`, `_signal`)을 재사용한다. 다만 그 함수를 날짜마다 그대로 호출하면 매번 전체 이력을 다시 잘라 지표를 재계산해 백테스트 구간 전체에서 O(n²)이 되므로, 백테스트 전용 엔진(`app/engine/backtest.py`)은 지표를 전체 구간에 대해 한 번에 벡터화 계산한 뒤 하루씩 순회한다. 스코어링 공식 자체는 라이브 경로와 100% 동일 — 백테스트가 실제 라이브 신호와 어긋나지 않도록 검증됨(수동 대조 테스트로 확인).

**전략 (설계서에 정의 없어 임의로 정함)**: 롱 온리, 신호 추종.

* 무포지션 + signal == BUY → 그날 종가에 전량 매수
* 보유 중 + signal == SELL → 그날 종가에 전량 매도, 거래 1건으로 기록
* HOLD / WATCH는 포지션 변경 없음 (보유 중이면 계속 보유, 무포지션이면 계속 관망)
* 백테스트 종료일까지 포지션이 남아있으면 마지막 날 종가로 강제 청산해 수익률에 반영

**한계**:

* price_history가 온디맨드 캐시라(9장 결정 사항), 백테스트 시작일이 이미 캐싱된 범위보다 오래전이면 데이터 부족으로 422가 날 수 있다. 전체 시장 사전 수집을 하지 않기로 한 결정과 트레이드오프.
* 슬리피지·수수료·세금 미반영 — 순수 신호 검증용이며 실현 가능한 수익률 추정치가 아니다.
* 종목 1개씩만 백테스트 가능 (포트폴리오 단위 백테스트는 미구현).

---

## 7. LLM 활용 범위

### 사용

* 뉴스 요약
* 투자 용어 설명
* 추천 이유 설명
* 사용자 맞춤형 리포트

### 사용하지 않음

* 주가 예측
* 기술 지표 계산
* 매수/매도 여부 결정

---

## 8. 기술 스택

### Frontend

* Next.js

### Backend

* FastAPI

### Data Analysis

* Pandas
* NumPy
* ta (TA-Lib 대체 — 순수 Python, 설치 의존성 없음)
* FinanceDataReader (한국 / 미국 주식 통합)

### AI

초기

* Gemini API (google-genai SDK, `gemini-flash-lite-latest`)

향후

* Ollama
* Qwen 계열 Local LLM

### Database

* PostgreSQL

---

## 9. DB 스키마

### users (사용자)

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | UUID PK | |
| nickname | VARCHAR | 표시 이름 |
| investment_type | VARCHAR | 안정형 / 성장형 / 공격형 |
| created_at | TIMESTAMP | |

> 개인 프로젝트 초기 단계에서는 `SINGLE_USER = true` 모드로 운영하고, 사용자 인증 없이 고정 사용자로 개발한다. 향후 멀티유저 지원 시 users 테이블을 활성화한다.

---

### stocks (종목 마스터)

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | SERIAL PK | |
| ticker | VARCHAR | 종목 코드 |
| market | VARCHAR(2) | KR / US |
| name | VARCHAR | 종목명 |
| sector | VARCHAR | 섹터 |

`(ticker, market)` 유니크 제약 — 한국/미국 티커 충돌 방지

### price_history (가격 이력 캐시)

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | SERIAL PK | |
| stock_id | INT FK | stocks.id |
| date | DATE | |
| open | DECIMAL | |
| high | DECIMAL | |
| low | DECIMAL | |
| close | DECIMAL | |
| volume | BIGINT | |

`(stock_id, date)` 유니크 제약

> **수집 정책**: 국장/미장 전체 종목을 사전에 일괄 수집하지 않는다. 사용자가 특정 종목을 검색·조회하는 시점에 FinanceDataReader로 해당 종목의 가격 이력만 온디맨드로 가져와 캐싱한다. 이후 재조회 시에는 캐시를 재사용하고, 누락된 최근 구간만 증분 갱신한다. 전체 시장 사전 수집(스크리닝/대시보드용)은 범위가 다른 작업이며 별도 요청 시에만 검토한다. **watchlist/holdings에 등록된 종목만 예외로 매일 자동 갱신한다** — `app/scheduler.py`, APScheduler `BackgroundScheduler`를 FastAPI lifespan에서 기동, 국장(15:30 KST)·미장(~06:00 KST) 마감 이후인 매일 07:00 KST에 1회 실행. 실패한 종목은 로그만 남기고 나머지는 계속 진행(부분 실패 허용).

### news (뉴스)

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | SERIAL PK | |
| stock_id | INT FK | stocks.id |
| title | VARCHAR | 뉴스 제목 |
| url | VARCHAR | 원문 링크 |
| published_at | TIMESTAMP | 발행일 |
| sentiment | VARCHAR(10) | POSITIVE / NEGATIVE / NEUTRAL |
| sentiment_score | DECIMAL | 감성 수치 (-1.0 ~ 1.0) |
| summary | TEXT | LLM 요약 |
| created_at | TIMESTAMP | |

### watchlist (관심 종목)

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | SERIAL PK | |
| user_id | UUID FK | users.id |
| stock_id | INT FK | stocks.id |
| created_at | TIMESTAMP | |

`(user_id, stock_id)` 유니크 제약 — 중복 등록 방지

### holdings (보유 종목)

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | SERIAL PK | |
| user_id | UUID FK | users.id |
| stock_id | INT FK | stocks.id |
| quantity | DECIMAL | 보유 수량 |
| avg_price | DECIMAL | 평균 매수가 |
| currency | VARCHAR(3) | KRW / USD |
| purchase_date | DATE | 최초 매수일 (보유기간, 장기투자 여부 계산) |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

`(user_id, stock_id)` 유니크 제약 — 중복 등록 방지

> **환율 처리 (MVP 제외)**: 한·미 혼합 포트폴리오의 통합 수익률 계산은 환율 환산이 필요하다. MVP에서는 KRW / USD 수익률을 각각 따로 표시하고, 통합 원화 환산은 향후 확장 과제로 남긴다.

### analysis_snapshots (분석 스냅샷 캐시)

특정 시점의 분석 결과를 저장하는 스냅샷 테이블.

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | SERIAL PK | |
| stock_id | INT FK | stocks.id |
| analyzed_at | TIMESTAMP | 분석 시각 |
| engine_version | VARCHAR | Score Engine 버전 (예: score_v1.0) |
| trend_score | DECIMAL | |
| momentum_score | DECIMAL | |
| risk_score | DECIMAL | |
| volume_score | DECIMAL | |
| news_score | DECIMAL | |
| total_score | DECIMAL | 가중 합산 점수 |
| signal | VARCHAR(10) | BUY / HOLD / WATCH / SELL |
| llm_report | TEXT | LLM 생성 리포트 |
| expires_at | TIMESTAMP | 캐시 만료 시각 |

> `engine_version`은 가중치 또는 계산 방식이 변경될 때 버전을 올린다. 백테스트 결과와 현재 결과가 섞이지 않도록 버전으로 구분한다.

---

## 10. API 설계

### 종목

```http
GET /api/stocks/search?keyword={검색어}&market={KR|US}&limit=20
GET /api/stocks/{ticker}?market={KR|US}
```

### 분석

```http
GET  /api/stocks/{ticker}/analysis?market={KR|US}
POST /api/stocks/{ticker}/analysis?market={KR|US}   # 강제 재분석
```

> 응답에 `close`/`change_pct`(전일 대비 등락률) 포함. 종목 분석 화면에 현재가를 보여주기 위해 추가— `analysis_snapshots` 캐시와 무관하게 매 요청마다 `price_history` 최신 2행에서 라이브로 계산한다 (분석 리포트는 캐시돼도 가격 표시는 최신이어야 하므로).

### 뉴스

```http
GET /api/stocks/{ticker}/news?market={KR|US}&limit=10
```

> 응답에 `source`(발행처명) 포함. 네이버 뉴스는 도메인 매핑 테이블로 추정(모르는 도메인은 원본 도메인 그대로 노출), Finnhub는 API 자체 제공 필드 사용.

### 관심 종목

```http
GET    /api/watchlist
POST   /api/watchlist        body: { ticker, market }
DELETE /api/watchlist/{id}
```

### 보유 종목

```http
GET    /api/holdings
POST   /api/holdings         body: { ticker, market, quantity, avg_price }
PUT    /api/holdings/{id}    body: { quantity, avg_price }
DELETE /api/holdings/{id}
```

---

## 11. 개발 로드맵

### MVP 완성 기준

> **"종목 하나 입력 → 정량 엔진 점수 계산 → LLM 설명 리포트 출력"**
>
> 이 한 줄 루프가 끝까지 동작하는 것이 MVP 완성이다.
> 관심종목 / 보유종목 / 뉴스는 이 루프가 완성된 후 붙인다.

---

### Phase 0 — 기반 구축

* 프로젝트 구조 생성 (FastAPI + Next.js)
* PostgreSQL DB 구축 및 스키마 적용
* FinanceDataReader 연동 확인

### Phase 1 — 데이터 파이프라인

* 종목 검색 API 구현
* 가격 데이터 수집 및 price_history 저장
* TA-Lib 기술 지표 계산 (이동평균, RSI, MACD, ATR 등)

### Phase 2 — Score Engine

* 각 Score 계산 로직 구현 (Trend / Momentum / Risk / Volume)
* 가중 합산 및 BUY / HOLD / WATCH / SELL 신호 생성
* analysis_snapshots 저장 및 캐시 조회

### Phase 3 — AI 리포트

* Gemini API 연동 (google-genai SDK)
* Score 결과 기반 LLM 리포트 생성
* 캐시 Miss 시에만 LLM 호출하는 구조 적용
* LLM 호출 실패 시(일시 장애 등) 재시도 후에도 실패하면 llm_report=NULL로 스냅샷은 그대로 저장 — 규칙 엔진 점수 계산 결과가 LLM 장애로 함께 유실되지 않도록 분리

### Phase 4 — 뉴스 분석

* 뉴스 수집기 구현 (한국어 / 영어 분기)
* sentiment 분석 및 sentiment_score 저장
* News Score 계산에 반영

### Phase 5 — 보유 종목 관리

* holdings CRUD API 구현
* 수익률 계산 (avg_price 대비 현재가)
* 보유 종목 기반 익절 / 손절 가이드 생성 (규칙은 6.4절 참고)
* watchlist / holdings 등록 종목에 한해 price_history 매일 자동 갱신 (스케줄러)

> **범위 메모**: 이 Phase에서는 holdings만 구현했다. watchlist CRUD는 로드맵에 별도 Phase가 없어 이번엔 빠졌지만, 이후 holdings와 거의 동일한 패턴으로 추가했다(검색 결과에서 바로 추가/제거하는 퀵토글까지 포함). 매일 자동 갱신 스케줄러도 이후 추가 완료.

### Phase 6 — 확장

* 백테스트 구조 설계 및 구현 (아래 6.5절 참고)
* 투자 성향 확장 (성장형 / 공격형)
* 포트폴리오 분석

> **범위 메모**: 이번엔 백테스트만 구현했다. 성향 확장 / 포트폴리오 분석은 아직 미착수.

---

## 12. 운영 정책

### 12.1 캐시 TTL 정책

`analysis_snapshots`의 `expires_at`은 아래 규칙을 따른다.

| 상황 | TTL |
| --- | --- |
| 장중 (한국 09:00~15:30 / 미국 23:30~06:00 KST) | 30분 |
| 장 마감 후 | 다음 거래일 개장 시각 |
| 주말 / 공휴일 | 다음 거래일 개장 시각 |

> FinanceDataReader는 실시간 데이터가 아닌 지연 데이터(15~20분)를 제공한다.
> 매도 타이밍 가이드는 이 지연을 감안하여 "정확한 현재가"가 아님을 UI에서 명시한다.

---

### 12.2 Score Engine 인터페이스 원칙

Score Engine은 반드시 **기준 날짜(as_of_date)를 인자로 받는 순수 함수** 형태로 설계한다.

```python
def calculate_scores(ticker: str, market: str, as_of_date: date) -> ScoreResult:
    # as_of_date 이전 데이터만 사용 — look-ahead bias 방지
    ...
```

현재 시점 분석은 `as_of_date=today()`로 호출하고,
백테스트는 과거 임의의 날짜 T를 넘겨 동일 함수를 재사용한다.

> Phase 6에서 백테스트를 추가할 때 엔진을 다시 쓰지 않도록,
> Phase 2에서 인터페이스를 이 형태로 고정한다.

---

## 13. 향후 확장 기능

* 투자 성향 확장 (성장형 / 공격형 가중치 세트)
* 포트폴리오 분석
* 백테스트 기능
* AI 투자 일지
* 자동 투자 리포트 생성
* 경제 지표 분석
* ETF 추천
* 섹터 로테이션 분석
* 사용자별 투자 성향 학습
* RAG 기반 기업 분석
* 리스크 경고 알림 (이메일 / 웹훅)

---

## 14. 현재 결정된 사항

### 확정

* 개인 프로젝트 (실제 본인 사용 전제)
* Rule Engine + LLM Hybrid 구조
* LLM은 설명 전담 / 정량 분석 엔진이 실제 판단 담당
* 대상 시장: 한국 주식 + 미국 주식
* 데이터 소스: FinanceDataReader (한국 / 미국 통합)
* MVP 투자 성향: 안정형 고정
* Score 가중치: Risk 30% / Trend 25% / Volume 20% / Momentum 15% / News 10%
* Score v1 계산 방식: 절대 임계값 (향후 퍼센타일 방식으로 교체 검토)
* Signal 임계값: total_score >= 70 BUY / 50~69 HOLD / 30~49 WATCH / < 30 SELL
* Score Engine 인터페이스: `calculate_scores(ticker, market, as_of_date)` 순수 함수 — look-ahead bias 방지 및 백테스트 재사용
* 캐시 TTL: 장중 30분 / 장 마감 후 다음 거래일 개장 시각
* price_history 수집 정책: 온디맨드 캐싱 (국장/미장 전체 사전 수집 아님). watchlist/holdings 종목만 예외로 매일 자동 갱신 (APScheduler, 매일 07:00 KST — 9장 참고)
* FinanceDataReader는 지연 데이터(15~20분)임을 UI에 명시
* 데이터 분석 라이브러리: ta 0.11.0 (TA-Lib 대체, 순수 Python)
* 뉴스 데이터 활용 (초기: 요약 + 감성 분석)
* LLM: Gemini API (google-genai SDK, `gemini-flash-lite-latest`) — 최초 계획했던 OpenAI에서 변경
* MVP 완성 기준: 종목 하나 → 점수 → LLM 리포트 루프 동작
* SINGLE_USER 처리: 인증 없이 고정 닉네임("default")의 users row를 최초 요청 시 자동 생성해 재사용. holdings/watchlist API는 요청에 user_id를 받지 않음
* 보유 종목 가이드: LLM 리포트 재사용 안 함 (조회할 때마다 Gemini 호출 시 비용 문제) — Score Engine만으로 규칙 기반 판정 (6.4절)
* 백테스트 전략: 롱 온리 신호 추종 (BUY 진입 / SELL 청산, HOLD·WATCH는 유지) — 슬리피지·수수료·세금 미반영, 종목 1개 단위만 지원 (6.5절)
* DB: PostgreSQL
* Backend: FastAPI
* Frontend: Next.js

---

### 추후 논의 필요

* 프로젝트 이름
* 백테스트 구조
* 뉴스 수집 소스 선정 (한국어 / 영어 각각)
* 화면(UI/UX) 설계
* 개발 로드맵 (단계별 일정)
* Score별 세부 계산 공식

---

*이 문서는 프로젝트 진행에 따라 지속적으로 업데이트된다.*
