import { Mail, X } from 'lucide-react';
import { useState } from 'react';

import { ActionButton, Alert, FeatureCard, SectionCard } from '../components';
import { NAV_ENTRIES, type NavEntry } from './pageModel';
import type { PageProps } from './shared';

const GROUPS: NavEntry['group'][] = ['计分', '练习', '资料', '记录与识别'];

export function HomePage({ navigate }: PageProps) {
  const [contactOpen, setContactOpen] = useState(() => window.location.hash.includes('contact=1'));

  return (
    <div className="mj-page-stack">
      {GROUPS.map((group) => (
        <SectionCard key={group} className="mj-home-group" title={group}>
          <div className="mj-home-entry-grid">
            {NAV_ENTRIES.filter((entry) => entry.group === group).map((entry) => {
              const Icon = entry.icon;
              return (
                <FeatureCard
                  key={entry.id}
                  className="mj-feature-card--compact"
                  icon={<Icon aria-hidden="true" />}
                  title={entry.title}
                  tone={entry.status === 'ready' ? 'success' : 'warning'}
                  onClick={() => navigate(entry.id)}
                />
              );
            })}
          </div>
        </SectionCard>
      ))}

      <ActionButton
        className="mj-contact-button"
        fullWidth
        icon={<Mail aria-hidden="true" />}
        variant="secondary"
        onClick={() => setContactOpen(true)}
      >
        联系我 / 反馈
      </ActionButton>

      {contactOpen ? (
        <div className="mj-modal-layer" role="dialog" aria-modal="true" aria-label="联系我">
          <button className="mj-modal-scrim" aria-label="关闭联系反馈" type="button" onClick={() => setContactOpen(false)} />
          <section className="mj-contact-sheet">
            <span className="mj-sheet-handle" aria-hidden="true" />
            <h2>联系我</h2>
            <p>遇到规则差异、识别错误或想补充地方役，可发送牌姿、规则和期望结果。</p>
            <Alert tone="success" title="反馈信息">
              请附上四麻/三麻、场风、自风、本场和截图。
            </Alert>
            <div className="mj-button-row mj-button-row--two">
              <ActionButton icon={<X aria-hidden="true" />} variant="ghost" onClick={() => setContactOpen(false)}>
                稍后
              </ActionButton>
              <ActionButton icon={<Mail aria-hidden="true" />} onClick={() => navigate('contact')}>打开反馈页</ActionButton>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
