import App from '../src/App';
import { getArticlesByDate } from '../src/services/articleServerApi';

function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default async function Page() {
  const selectedDate = getTodayIsoDate();
  const response = await getArticlesByDate(selectedDate, null);

  return (
    <App
      initialSelectedDate={selectedDate}
      initialArticles={response.items}
      initialNextCursor={response.nextCursor}
      initialHasMore={response.hasNext}
    />
  );
}
