import { Calculator, Copy, Mail } from 'lucide-react';
import { useState } from 'react';

import { ActionButton, Alert, ContactSection, PlaceholderPanel, SurfacePanel } from '../components';
import { PAGE_TITLES, type PageId } from './pageModel';
import type { PageProps } from './shared';

const PLACEHOLDER_COPY: Partial<Record<PageId, string>> = {
  placeholder: '当前入口没有绑定到可用页面，请返回快速算分或选择其他底部功能。',
};

export function SafePlaceholderPage({ page, navigate }: PageProps & { page: PageId }) {
  return (
    <div className="mj-page-stack">
      <PlaceholderPanel
        title={PAGE_TITLES[page] ?? '页面不可用'}
        description={PLACEHOLDER_COPY[page] ?? PLACEHOLDER_COPY.placeholder}
        actions={
          <>
            <ActionButton icon={<Calculator aria-hidden="true" />} variant="secondary" onClick={() => navigate('quick-score')}>
              快速算分
            </ActionButton>
            <ActionButton onClick={() => navigate('contact')}>反馈需求</ActionButton>
          </>
        }
      />
      <Alert title="安全说明" tone="info">
        本页不会创建账号、发送数据、展示广告、引导支付或开放会员功能；只作为后续需求确认入口。
      </Alert>
    </div>
  );
}

async function copyLocalText(text: string, done: () => void) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      done();
      return;
    }
  } catch {
    // Fall through to prompt fallback.
  }
  window.prompt('复制反馈内容', text);
  done();
}

export function ContactPage() {
  const [feedback, setFeedback] = useState('');
  const [recorded, setRecorded] = useState('');
  const [copied, setCopied] = useState(false);

  return (
    <div className="mj-page-stack">
      <ContactSection
        aria-label="联系反馈"
        feedbackValue={feedback}
        methods={[
          {
            id: 'local',
            kind: 'static',
            title: '本地反馈',
            meta: '当前页面记录',
            description: '提交后只在本机页面显示已记录提示，不会联网发送。',
            icon: <Mail aria-hidden="true" />,
          },
        ]}
        onFeedbackChange={setFeedback}
        onSubmit={(value) => {
          setRecorded(value.trim());
          setFeedback('');
          setCopied(false);
        }}
        title={null}
      />

      {recorded ? (
        <>
          <SurfacePanel aria-live="polite" role="status" title="已记录" tone="success">
            <p className="mj-muted-line">{recorded}</p>
            <ActionButton
              fullWidth
              icon={<Copy aria-hidden="true" />}
              variant="secondary"
              onClick={() => void copyLocalText(recorded, () => setCopied(true))}
            >
              复制反馈内容
            </ActionButton>
          </SurfacePanel>
          {copied ? <Alert tone="success">已复制到剪贴板</Alert> : null}
        </>
      ) : null}
    </div>
  );
}
