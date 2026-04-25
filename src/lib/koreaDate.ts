const KOREA_TIME_ZONE = 'Asia/Seoul';

const koreaDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: KOREA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function getKoreaIsoDate(date = new Date()): string {
  return koreaDateFormatter.format(date);
}

export function getKoreaIsoDateWithOffset(dayOffset: number, date = new Date()): string {
  const shifted = new Date(date);
  shifted.setUTCDate(shifted.getUTCDate() - dayOffset);

  return getKoreaIsoDate(shifted);
}
