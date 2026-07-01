import {
  ArrowLeft,
  Camera,
  Check,
  Clipboard,
  Copy,
  Image as ImageIcon,
  AlertCircle,
  Hammer,
  Home,
  Keyboard,
  MessageCircle,
  RotateCcw,
  SkipForward,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';

import {
  ActionButton,
  Alert,
  Chip,
  DataTable,
  MahjongTile,
  MetricStatCard,
  PaymentCards,
  PlaceholderPanel,
  PracticeAnswerPanel,
  SectionCard,
  SegmentedControl,
  TileStrip,
} from '../components';
import type { PageProps } from './shared';

const sampleHand = ['m2', 'm3', 'm4', 'p2', 'p3', 'p4', 's6', 's7', 's8', 'z1', 'z1', 'z7', 'z7', 'z7'];
const compactTiles = ['m1', 'm9', 'p2', 'p5', 's3', 's5r', 's8', 'z1', 'z3', 'z7'];

export function ChatScorePage() {
  return (
    <div className="mj-page-stack mj-chat-design">
      <section className="mj-chat-flow-card">
        <div className="mj-step-row">
          {['手牌', '和牌', '宝牌', '确认'].map((step, index) => (
            <span key={step} className={index < 2 ? 'mj-step-badge mj-step-badge--active' : 'mj-step-badge'}>
              {index + 1} {step}
            </span>
          ))}
        </div>
        <div className="mj-chat-stack">
          <div className="mj-chat-bubble mj-chat-bubble--assistant">
            先录入手牌。已识别 11 张，还差和牌或自摸牌。
          </div>
          <div className="mj-chat-bubble mj-chat-bubble--user mj-chat-bubble--tiles">
            <strong>二三四万 345筒 678索 东东中</strong>
            <TileStrip tileSize="sm" tiles={['m2', 'm3', 'm4', 'p3', 'p4', 'p5r', 's6', 's7', 's8', 'z1', 'z1', 'z7']} />
          </div>
          <div className="mj-chat-bubble mj-chat-bubble--assistant">
            请选择和牌方式，并确认场风/自风。
          </div>
          <div className="mj-chat-bubble mj-chat-bubble--user">荣和，东场南家。</div>
        </div>
      </section>

      <section className="mj-design-card mj-chat-step-card">
        <header className="mj-design-card__header">
          <h2>当前步骤：宝牌指示牌</h2>
        </header>
        <TileStrip tileSize="sm" tiles={['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9']} />
        <div className="mj-button-row mj-button-row--three">
          <ActionButton icon={<ArrowLeft aria-hidden="true" />} variant="ghost">
            上一步
          </ActionButton>
          <ActionButton icon={<SkipForward aria-hidden="true" />} variant="gold">
            跳过
          </ActionButton>
          <ActionButton className="mj-action-button--soft-danger" icon={<Trash2 aria-hidden="true" />} variant="ghost">
            清空重来
          </ActionButton>
        </div>
      </section>

      <section className="mj-summary-card mj-summary-card--outlined">
        <h2>确认摘要</h2>
        <p>手牌 14 张 · 荣和 · 东场南家 · 宝牌 1 · 额外役：立直</p>
        <ActionButton fullWidth icon={<Check aria-hidden="true" />}>
          开始计算
        </ActionButton>
      </section>
    </div>
  );
}

export function LegacyScorePage() {
  return (
    <div className="mj-page-stack mj-legacy-page">
      <SectionCard title="地方役 / 古役">
        <div className="mj-chip-row">
          {['大车轮', '大竹林', '大数邻', '三连刻', '一色四顺', '十三不塔'].map((label, index) => (
            <Chip key={label} selected={index === 0} tone={index === 0 ? 'warning' : 'default'}>
              {label}
            </Chip>
          ))}
        </div>
        <div className="mj-legacy-custom-row">
          <span>自定义古役名</span>
          <b>2番</b>
        </div>
      </SectionCard>

      <SectionCard title="估算条件">
        {[
          ['亲闲', '闲家', '亲家'],
          ['和牌', '自摸', '荣和'],
          ['符数', '40符', '20/25/30/50'],
          ['役满倍数', '单倍', '双倍/三倍'],
        ].map(([label, active, muted]) => (
          <div key={label} className="mj-info-row">
            <span>{label}</span>
            <span className="mj-info-row__chips">
              <Chip selected>{active}</Chip>
              <Chip>{muted}</Chip>
            </span>
          </div>
        ))}
      </SectionCard>

      <div className="mj-score-hero">
        <span>估算点数</span>
        <strong>8,000</strong>
        <small>闲家自摸：2000 / 4000 · 古役 2番40符</small>
      </div>

      <Alert icon={<AlertCircle aria-hidden="true" />} tone="warning" title="三麻规则警告">
        拔北和北宝牌按当前规则估算。
      </Alert>
    </div>
  );
}

export function TableRecordsPage() {
  const rows = [
    { id: 'east', wind: '东', name: '石', score: '32100', badge: '亲家', tone: 'green' },
    { id: 'south', wind: '南', name: '林', score: '27800', badge: '赢家', tone: 'green' },
    { id: 'west', wind: '西', name: '陈', score: '22600', badge: '放铳', tone: 'red' },
    { id: 'north', wind: '北', name: '王', score: '17500', badge: '调整', tone: 'muted' },
  ];

  return (
    <div className="mj-page-stack mj-table-records-page">
      <div className="mj-table-record-stats">
        <span>
          <small>局数</small>
          <strong>东二局</strong>
        </span>
        <span>
          <small>本场</small>
          <strong>1本场</strong>
        </span>
        <span>
          <small>供托</small>
          <strong>供托2</strong>
        </span>
      </div>

      <SectionCard className="mj-table-seat-card" title="四人桌">
        <div className="mj-player-score-list">
          {rows.map((row) => (
            <div key={row.id} className={`mj-player-score-row mj-player-score-row--${row.tone}`}>
              <span className="mj-wind-dot">{row.wind}</span>
              <b>{row.name}</b>
              <strong>{row.score}</strong>
              <small>{row.badge}</small>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard className="mj-round-record-card" title="记录一手">
        <div className="mj-chip-row">
          {['荣和', '自摸', '流局', '手动调整'].map((label, index) => (
            <Chip key={label} selected={index === 0}>
              {label}
            </Chip>
          ))}
        </div>
        {[
          ['赢家', '林', '选择'],
          ['放铳者', '陈', '无'],
          ['番符', '4番30符', '自动建议'],
          ['支付值', '7700', '手动覆盖'],
        ].map(([label, value, action]) => (
          <div key={label} className="mj-record-form-row">
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{action}</small>
          </div>
        ))}
      </SectionCard>

      <Alert icon={<AlertCircle aria-hidden="true" />} tone="success" title="总点校验">
        当前合计 100000 点，供托 2000 点，校验通过。
      </Alert>

      <SectionCard className="mj-history-card" title="历史流水">
        <div className="mj-history-list">
          {[
            ['东一局 0本场', '石 立直荣和 王', '+3900'],
            ['东一局 1本场', '流局 三家听牌', '供托+1'],
            ['东二局 1本场', '林 荣和 陈', '+7700'],
          ].map(([meta, title, delta]) => (
            <div key={title} className="mj-history-row">
              <span>
                <small>{meta}</small>
                <strong>{title}</strong>
              </span>
              <b>{delta}</b>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="mj-button-row mj-button-row--two">
        <ActionButton className="mj-record-white-action" icon={<RotateCcw aria-hidden="true" />} variant="ghost">
          撤销上一条
        </ActionButton>
        <ActionButton className="mj-action-button--soft-danger" icon={<Trash2 aria-hidden="true" />} variant="ghost">
          清空本桌
        </ActionButton>
      </div>

      <section className="mj-danger-confirm-card">
        <h2>确认清空本桌？</h2>
        <p>将删除当前四人桌昵称、起始点、局数和全部流水。</p>
        <div className="mj-button-row mj-button-row--two">
          <ActionButton className="mj-record-white-action" icon={<X aria-hidden="true" />} variant="ghost">
            取消
          </ActionButton>
          <ActionButton icon={<Trash2 aria-hidden="true" />} variant="danger">
            确认清空
          </ActionButton>
        </div>
      </section>
    </div>
  );
}

export function HandRecognitionPage() {
  const correctionTiles = ['m1', 'm2', 'm3', 'm4', 'm5r', 'm6', 'm7', 'm8', 'm9', 'z7'];

  return (
    <div className="mj-page-stack mj-hand-recognition-page">
      <div className="mj-button-row mj-button-row--two">
        <ActionButton icon={<Camera aria-hidden="true" />}>拍照识别</ActionButton>
        <ActionButton className="mj-gallery-button" icon={<ImageIcon aria-hidden="true" />} variant="secondary">
          相册选择
        </ActionButton>
      </div>

      <SectionCard className="mj-recognition-preview-card">
        <div className="mj-scan-preview">
          <ScanFrameIcon />
          <span>识别图片预览区域</span>
        </div>
      </SectionCard>

      <SectionCard className="mj-recognition-result-card" title="识别结果">
        <TileStrip tileSize="sm" tiles={sampleHand} />
      </SectionCard>

      <Alert icon={<AlertCircle aria-hidden="true" />} tone="warning" title="识别警告">
        第 5 张置信度较低，请点按单张牌进行修正。
      </Alert>
      <Alert icon={<AlertCircle aria-hidden="true" />} tone="danger" title="识别错误">
        图片过暗或牌面遮挡，请重新拍摄或手动输入。
      </Alert>

      <SectionCard title="手动修正">
        <div className="mj-tile-choice-grid">
          {correctionTiles.map((tile) => (
            <MahjongTile key={tile} code={tile} selected={tile === 'm5r'} size="lg" />
          ))}
        </div>
      </SectionCard>

      <ActionButton fullWidth icon={<Copy aria-hidden="true" />}>
        复制最终牌序
      </ActionButton>
    </div>
  );
}

export function TileKeyboardDemoPage() {
  const [suit, setSuit] = useState<'m' | 'p' | 's' | 'z'>('m');
  const tiles = suit === 'z' ? ['z1', 'z2', 'z3', 'z4', 'z5', 'z6', 'z7'] : Array.from({ length: 9 }, (_, index) => `${suit}${index + 1}`);

  return (
    <div className="mj-page-stack mj-keyboard-demo-page">
      <SectionCard title="手牌预览">
        <TileStrip tileSize="sm" tiles={['m1', 'm2', 'm3', 'p4', 'p5r', 'p8', 'z1', 'z1']} />
      </SectionCard>
      <Alert icon={<AlertCircle aria-hidden="true" />} tone="warning" title="最大张数限制">
        当前目标最多 14 张，超过时保持输入并提示原因。
      </Alert>
      <section className="mj-inline-keyboard" aria-label="牌输入键盘示例">
        <h2>选择手牌 11/14</h2>
        <SegmentedControl
          ariaLabel="选择花色"
          options={[
            { value: 'm', label: '万子' },
            { value: 'p', label: '筒子' },
            { value: 's', label: '索子' },
            { value: 'z', label: '字牌' },
          ]}
          value={suit}
          onChange={(value) => setSuit(value as 'm' | 'p' | 's' | 'z')}
        />
        <div className="mj-tile-choice-grid">
          {tiles.map((tile) => (
            <MahjongTile key={tile} code={tile} selected={tile === 'm5'} size="lg" />
          ))}
        </div>
        <div className="mj-tile-keyboard__actions">
          <ActionButton icon={<Trash2 aria-hidden="true" />} variant="ghost">
            退格
          </ActionButton>
          <ActionButton className="mj-action-button--soft-danger" icon={<Trash2 aria-hidden="true" />} variant="ghost">
            清空
          </ActionButton>
          <ActionButton fullWidth icon={<Check aria-hidden="true" />}>
            完成
          </ActionButton>
        </div>
      </section>
    </div>
  );
}

export function DesignedPlaceholderPage({ navigate }: PageProps) {
  return (
    <div className="mj-page-stack mj-placeholder-designed-page">
      <PlaceholderPanel
        icon={<Hammer aria-hidden="true" />}
        title="功能建设中"
        description="该入口已预留页面结构，等待对应任务完成后接入真实功能。"
        statusLabel={null}
      />
      <SectionCard className="mj-task-info-card" title="任务信息">
        <div className="mj-info-row">
          <span>功能标题</span>
          <strong>AI 牌谱复盘</strong>
        </div>
        <div className="mj-info-row">
          <span>当前状态</span>
          <strong>排期中</strong>
        </div>
        <div className="mj-info-row">
          <span>下一步</span>
          <strong>补充规则和交互流</strong>
        </div>
      </SectionCard>
      <ActionButton fullWidth icon={<Home aria-hidden="true" />} onClick={() => navigate('home')}>
        返回首页
      </ActionButton>
    </div>
  );
}

function ScanFrameIcon() {
  return (
    <span className="mj-scan-frame" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

export function ScorePracticePreview() {
  return (
    <PracticeAnswerPanel
      status="wrong"
      title="本题需要复盘"
      userAnswer="3,900 点"
      correctAnswer="0 点"
      breakdown={<p>若题目没有役，正确答案为 0。</p>}
      actions={<ActionButton icon={<Sparkles aria-hidden="true" />}>下一题</ActionButton>}
    />
  );
}

export function ClipboardNotice() {
  return (
    <Alert tone="info" title="本地预览">
      页面控件保留交互外观，不会上传图片、发送聊天内容或保存对局数据。
    </Alert>
  );
}
