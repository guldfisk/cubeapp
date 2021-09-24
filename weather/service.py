import datetime


def get_next_weekday(weekday: int, now: datetime.datetime) -> datetime.datetime:
    current_weekday = now.weekday()
    return datetime.datetime(
        year = now.year,
        month = now.month,
        day = now.day,
    ) + datetime.timedelta(
        days = (
            weekday - current_weekday
            if weekday >= current_weekday else
            7 - current_weekday + weekday
        )
    )
