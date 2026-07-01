import { Copy, Home, Mail } from 'lucide-react';
import { useState } from 'react';

import { ActionButton, Alert, ContactPanel, PlaceholderPanel, SectionCard } from '../components';
import { entryForPage, type PageId } from './pageModel';
import type { PageProps } from './shared';

const PLACEHOLDER_COPY: Partial<Record<PageId, string>> = {
  'chat-score': '聊天式算分会涉及多轮理解与纠错，当前只保留入口，避免把半成品对话误当成可靠算分。',
  'legacy-score': '古役范围、地方规则和番值差异较大，当前不接入主算分引擎。',
  'table-records': '面麻记录需要确认字段、结算规则和导出格式，当前不保存对局数据。',
  'hand-recognition': '实体手牌识别涉及拍照、模型和隐私边界，当前不上传、不识别图片。',
  placeholder: '这个模块已经预留入口，具体规则和交互确认后再开放。',
};

export function SafePlaceholderPage({ page, navigate }: PageProps & { page: PageId }) {
  const entry = entryForPage(page);

  return (
    <div className="mj-page-stack">
      <PlaceholderPanel
        title={entry?.title ?? '功能建设中'}
        description={PLACEHOLDER_COPY[page] ?? entry?.subtitle ?? PLACEHOLDER_COPY.placeholder}
        actions={
          <>
            <ActionButton icon={<Home aria-hidden="true" />} variant="secondary" onClick={() => navigate('home')}>
              回首页
            </ActionButton>
            <ActionButton onClick={() => navigate('contact')}>反馈需求</ActionButton>
          </>
        }
      />
      <SectionCard title="安全说明">
        <Alert tone="info">
          本页不会创建账号、发送数据、展示广告、引导支付或开放会员功能；只作为后续需求确认入口。
        </Alert>
      </SectionCard>
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
      <ContactPanel
        feedbackValue={feedback}
        methods={[
          {
            id: 'local',
            label: '本地反馈',
            value: '当前页面记录',
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
      />

      {recorded ? (
        <SectionCard title="已记录">
          <Alert tone="success" title="反馈已在本地记录">
            {recorded}
          </Alert>
          <ActionButton
            fullWidth
            icon={<Copy aria-hidden="true" />}
            variant="secondary"
            onClick={() => void copyLocalText(recorded, () => setCopied(true))}
          >
            复制反馈内容
          </ActionButton>
          {copied ? <Alert tone="success">已复制到剪贴板</Alert> : null}
        </SectionCard>
      ) : null}
    </div>
  );
}
