from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone

KST = timezone(timedelta(hours=9))

KR_OPEN = time(9, 0)
KR_CLOSE = time(15, 30)
US_OPEN_KST = time(23, 30)  # US session, expressed in KST, crosses midnight
US_CLOSE_KST = time(6, 0)

INTRADAY_TTL = timedelta(minutes=30)


def _is_weekday(d: date) -> bool:
    return d.weekday() < 5  # Mon-Fri


def is_market_open(market: str, now: datetime) -> bool:
    """Approximate market-hours check. Does not account for exchange
    holidays (only weekends) or US daylight-saving shifts — good enough for
    an MVP TTL heuristic, not for precise session state."""
    now_kst = now.astimezone(KST)
    d, t = now_kst.date(), now_kst.time()

    if market == "KR":
        return _is_weekday(d) and KR_OPEN <= t < KR_CLOSE

    # US: open from 23:30 KST through 06:00 KST the next calendar day
    if t >= US_OPEN_KST:
        return _is_weekday(d)
    if t < US_CLOSE_KST:
        return _is_weekday(d - timedelta(days=1))
    return False


def _next_weekday(d: date) -> date:
    d += timedelta(days=1)
    while not _is_weekday(d):
        d += timedelta(days=1)
    return d


def next_open(market: str, now: datetime) -> datetime:
    now_kst = now.astimezone(KST)
    d, t = now_kst.date(), now_kst.time()
    open_time = KR_OPEN if market == "KR" else US_OPEN_KST

    if t < open_time and _is_weekday(d):
        target_date = d
    else:
        target_date = _next_weekday(d)

    return datetime.combine(target_date, open_time, tzinfo=KST)


def compute_expires_at(market: str, now: datetime | None = None) -> datetime:
    now = now or datetime.now(KST)
    if is_market_open(market, now):
        return now + INTRADAY_TTL
    return next_open(market, now)
