import { redirect } from 'next/navigation';
import { getKoreaIsoDateWithOffset } from '../../src/lib/koreaDate';

export const dynamic = 'force-dynamic';

export default function BriefingIndexPage() {
  redirect(`/briefing/${getKoreaIsoDateWithOffset(1)}`);
}
