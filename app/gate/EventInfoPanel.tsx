'use client';
import Image from 'next/image';
import TerminalPanel from '@/components/TerminalPanel';
import { SubtitleText } from '@/components/ui/TerminalText';
import { useT, useLang } from '@/lib/langContext';
import type { TerminalEvent } from '@/lib/eventData';

interface Props {
  event: TerminalEvent;
}

export default function EventInfoPanel({ event }: Props) {
  const t = useT();
  const { lang } = useLang();

  const { posterUrl, description } = event;

  if (!posterUrl && !description) return null;

  const descText = description ? (lang === 'ko' ? description.ko : description.en) : null;

  return (
    <TerminalPanel title={t.gate.eventInfoTitle} accent="secondary">
      {posterUrl ? (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-shrink-0 w-full sm:w-44">
            <div className="relative w-full aspect-[1/1.414]">
              <Image
                src={posterUrl}
                alt={`${event.session} poster`}
                fill
                className="object-cover"
              />
            </div>
          </div>
          {descText && (
            <div className="flex-1 font-mono">
              <SubtitleText
                autoHeight
                text={descText}
                className="text-terminal-subdued leading-relaxed whitespace-pre-line"
              />
            </div>
          )}
        </div>
      ) : (
        descText && (
          <SubtitleText
            autoHeight
            text={descText}
            className="text-terminal-subdued leading-relaxed whitespace-pre-line"
          />
        )
      )}
    </TerminalPanel>
  );
}
