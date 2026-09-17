'use client';

import { useUrlQueryState } from '@/lib/useUrlQueryState';
import { useEventScreen } from './useEventScreen';
import { Gate, Home } from './EventScreens';
import { Lineup } from '../lineup/Lineup';
import { Status } from '../info/InfoScreens';
import { NoEvent, PageHeading } from '../shared/Ui';

export function EventScreen({ page }: { page: 'home' | 'gate' | 'lineup' | 'status' }) {
  const { props, isLoading, isError, refetch, eventId } = useEventScreen();
  const [artistId] = useUrlQueryState('artist');
  const { t, event } = props;
  if (isLoading || isError) return <section className="tm-empty">
    <PageHeading code={`${page.toUpperCase()} / ${isError ? 'LOAD ERROR' : 'LOADING'}`} title={isError ? t('정보를 불러오지 못했습니다.', 'Could not load information.') : t('정보를 불러오는 중', 'Loading information')} />
    <p role={isError ? 'alert' : 'status'}>{isError ? t('정보를 불러오지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.', 'Could not load information. Check your connection and try again.') : t('불러오는 중…', 'Loading…')}</p>
    {isError && <button type="button" className="tm-button" onClick={() => void refetch()}>{t('다시 시도', 'Retry')}</button>}
  </section>;
  if (page === 'status') return <Status {...props} />;
  if (eventId && !event) return <NoEvent t={t} invalid />;
  if (page === 'lineup') return <Lineup {...props} artistId={artistId || null} />;
  if (page === 'gate') return <Gate {...props} poster={event?.posterUrl ?? ''} />;
  return <Home {...props} poster={event?.posterUrl ?? ''} />;
}
