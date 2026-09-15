import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../mockups/aspen-terminal/App';

function active() {
  const element = document.querySelector<HTMLElement>('[data-active="true"]');
  if (!element) throw new Error('No active mockup screen');
  return within(element);
}

async function navigate(hash: string) {
  await act(async () => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

function scenario(value: string) {
  fireEvent.change(screen.getByLabelText('데이터 상태'), { target: { value } });
}

beforeEach(() => {
  window.history.replaceState(null, '', '/#/home');
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('The mockup must not call the network'); }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('isolated Aspen terminal mockup', () => {
  it('opens the dated archive, preserves the event through navigation and rejects an invalid event URL', async () => {
    render(<App />);
    expect(active().getByText('지난 이벤트')).toBeInTheDocument();
    expect(active().getByRole('link', { name: /아카이브 보기/ })).toHaveAttribute('href', '#/gate?event=TRM-02');
    await navigate('/gate?event=TRM-01');
    expect(active().getByRole('heading', { level: 1 })).toHaveTextContent('TERMINAL [01]');
    expect(active().getByRole('link', { name: /라인업 보기/ })).toHaveAttribute('href', '#/lineup?event=TRM-01');
    expect(active().queryByRole('link', { name: /게스트 신청/ })).not.toBeInTheDocument();
    await navigate('/gate?event=missing');
    expect(active().getByRole('heading', { level: 1 })).toHaveTextContent('이벤트를 찾을 수 없습니다');
  });

  it('shows a public artist without changing the URL or focus and keeps invalid/unpublished selections explicit', async () => {
    await navigate('/lineup?event=TRM-02');
    render(<App />);
    expect(active().getByRole('heading', { name: 'STANN LUMO' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/lineup?event=TRM-02');
    expect(document.activeElement).toBe(document.body);
    expect(active().getByText(/그 외 4개 항목/)).toBeInTheDocument();
    expect(active().queryByRole('link', { name: /ENCRYPTED/ })).not.toBeInTheDocument();
    await navigate('/lineup?event=TRM-02&artist=02-B');
    expect(active().getByRole('heading', { name: '아티스트 정보 미공개' })).toBeInTheDocument();
    expect(active().queryByRole('heading', { name: 'STANN LUMO' })).not.toBeInTheDocument();
    await navigate('/lineup?event=TRM-02&artist=missing');
    expect(active().getByRole('heading', { name: '아티스트를 찾을 수 없습니다.' })).toBeInTheDocument();
  });

  it('retains the Signal draft through navigation and a failed attempt, validates consent, and completes offline', async () => {
    const user = userEvent.setup();
    await navigate('/signal');
    render(<App />);
    await user.type(active().getByLabelText('이메일'), 'reader@example.com');
    await user.type(active().getByLabelText('인스타그램 ID'), '@reader');
    await user.click(active().getByRole('button', { name: /소식 신청/ }));
    await waitFor(() => expect(active().getByRole('checkbox')).toHaveFocus());
    expect(active().getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
    await user.click(active().getByRole('checkbox'));
    await navigate('/about');
    await navigate('/signal');
    expect(active().getByLabelText('이메일')).toHaveValue('reader@example.com');
    fireEvent.change(screen.getByLabelText('제출 결과'), { target: { value: 'error' } });
    await user.click(active().getByRole('button', { name: /소식 신청/ }));
    expect(active().getByRole('button', { name: /처리 중/ })).toBeDisabled();
    await waitFor(() => expect(active().getByRole('alert')).toHaveTextContent('전송 실패 예시'));
    expect(active().getByLabelText('이메일')).toHaveValue('reader@example.com');
    fireEvent.change(screen.getByLabelText('제출 결과'), { target: { value: 'success' } });
    await user.click(active().getByRole('button', { name: /소식 신청/ }));
    await waitFor(() => expect(active().getByRole('heading', { name: '소식 신청 완료' })).toHaveFocus());
    expect(active().getByText(/실제로 전송되거나 저장되지 않습니다/)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('unlocks only the preview request code and keeps target changes from claiming a stale submission', async () => {
    const user = userEvent.setup();
    await navigate('/gate/request?event=TRM-02');
    render(<App />);
    expect(active().getByRole('heading', { level: 1 })).toHaveTextContent('현재 신청 가능한');
    scenario('upcoming');
    expect(active().getByLabelText('이름')).toBeDisabled();
    await user.type(active().getByLabelText('인증 코드'), 'WRONG');
    expect(active().getByLabelText('인증 코드')).toHaveAttribute('aria-invalid', 'false');
    await user.click(active().getByRole('button', { name: '확인' }));
    expect(active().getByLabelText('인증 코드')).toHaveAttribute('aria-invalid', 'true');
    await user.clear(active().getByLabelText('인증 코드'));
    await user.type(active().getByLabelText('인증 코드'), 'DEMO02');
    await user.click(active().getByRole('button', { name: '확인' }));
    await user.type(active().getByLabelText('이름'), '목업 방문자');
    await user.type(active().getByLabelText('이메일'), 'guest@example.com');
    await user.type(active().getByLabelText('인스타그램 ID'), '@guest');
    await user.click(active().getByRole('checkbox', { name: /게스트 접근 관리/ }));
    await user.click(active().getByRole('button', { name: /신청 제출/ }));
    expect(active().getByRole('button', { name: /처리 중/ })).toBeDisabled();
    scenario('snapshot');
    expect(active().queryByText('신청 접수 완료')).not.toBeInTheDocument();
    scenario('upcoming');
    expect(active().getByLabelText('이름')).toHaveValue('목업 방문자');
    expect(active().getByLabelText('이름')).toBeDisabled();
    await user.click(active().getByRole('button', { name: '확인' }));
    await user.click(active().getByRole('button', { name: /신청 제출/ }));
    await waitFor(() => expect(active().getByRole('heading', { name: '신청 접수 완료' })).toBeInTheDocument());
    const result = active().getByRole('heading', { name: '신청 접수 완료' }).parentElement!;
    expect(within(result).getByText('접수는 입장 확정을 뜻하지 않습니다.')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('preserves guestbook draft and previous-page recovery when the next page fails', async () => {
    const user = userEvent.setup();
    await navigate('/transmit');
    render(<App />);
    expect(active().getByText('게시된 글이 없습니다.')).toBeInTheDocument();
    await user.type(active().getByLabelText('별칭'), 'DRAFT');
    await user.type(active().getByLabelText(/메시지/), '아직 제출하지 않은 글');
    fireEvent.change(screen.getByLabelText('방명록 내용'), { target: { value: 'sample' } });
    await user.click(active().getByRole('button', { name: '다음' }));
    expect(active().getByText('SAMPLE_04')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('제출 결과'), { target: { value: 'error' } });
    await user.click(active().getByRole('button', { name: '다음' }));
    expect(active().getByRole('alert')).toHaveTextContent('다음 페이지를 불러오지 못했습니다');
    await user.click(active().getByRole('button', { name: '이전' }));
    expect(active().getByText('SAMPLE_01')).toBeInTheDocument();
    expect(active().getByLabelText(/메시지/)).toHaveValue('아직 제출하지 않은 글');
    await navigate('/home');
    await navigate('/transmit');
    expect(active().getByLabelText('별칭')).toHaveValue('DRAFT');
  });

  it('falls back from a failed poster and recovers the data error without a request', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '이미지 오류 복귀 확인' }));
    fireEvent.error(active().getByRole('img'));
    expect(active().queryByRole('img')).not.toBeInTheDocument();
    expect(active().getByText('[02]')).toBeInTheDocument();
    scenario('error');
    expect(active().getByRole('heading', { level: 1 })).toHaveTextContent('정보를 불러오지 못했습니다');
    fireEvent.click(active().getByRole('button', { name: '다시 시도' }));
    expect(active().getByRole('link', { name: /아카이브 보기/ })).toBeInTheDocument();
    scenario('empty');
    expect(active().getByRole('heading', { level: 1 })).toHaveTextContent('공개된 이벤트가 없습니다');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps every screen usable in both languages and restores the mobile menu trigger on Escape', async () => {
    const user = userEvent.setup();
    render(<App />);
    for (const language of ['ko', 'en']) {
      if (language === 'en') await user.click(screen.getByRole('button', { name: '영어로 보기' }));
      for (const path of ['/home', '/gate', '/lineup', '/gate/request', '/status', '/transmit', '/signal', '/about', '/link']) {
        await navigate(path);
        expect(active().getByRole('heading', { level: 1 }).textContent?.trim()).toBeTruthy();
      }
      expect(document.documentElement.lang).toBe(language);
    }
    const menu = screen.getByRole('button', { name: /Menu/ });
    await user.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(menu).toHaveFocus();
    const crt = screen.getByRole('button', { name: 'CRT display effects' });
    await user.click(crt);
    expect(crt).toHaveAttribute('aria-pressed', 'false');
    expect(fetch).not.toHaveBeenCalled();
  });
});
