import { HelpCircle, Share2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Alert, AppFrame, TopNav } from './components';
import {
  DesignedPlaceholderPage,
  HandRecognitionPage,
  TableRecordsPage,
  TileKeyboardDemoPage,
} from './pages/DeferredPages';
import { ContactPage } from './pages/PlaceholderContactPages';
import { HomePage } from './pages/HomePage';
import { HanFuCalculatorPage, HanFuTablePage } from './pages/PointPages';
import {
  ChinitsuPracticePage,
  ComebackPracticePage,
  FuPracticePage,
  PointPracticePage,
} from './pages/PracticePages';
import { LegacyScorePage, QuickScorePage } from './pages/QuickScorePage';
import { FuHelpPage, PointHelpPage, YakuDetailPage, YakuListPage } from './pages/YakuHelpPages';
import { PAGE_TITLES, entryForPage, type PageId } from './pages/pageModel';
import './pages.css';

type ShareStatus = {
  tone: 'success' | 'warning';
  message: string;
} | null;

const KNOWN_PAGES = new Set<PageId>(Object.keys(PAGE_TITLES) as PageId[]);

function pageFromHash(): PageId {
  const raw = window.location.hash.replace(/^#\/?/, '').split(/[?&]/)[0];
  if (!raw) return 'home';
  return KNOWN_PAGES.has(raw as PageId) ? (raw as PageId) : 'home';
}

async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return '已复制到剪贴板';
    }
  } catch {
    // Fall through to prompt fallback for embedded browsers that expose but reject clipboard.
  }
  window.prompt('复制链接', text);
  return '已打开复制文本';
}

export default function App() {
  const [page, setPage] = useState<PageId>(() => pageFromHash());
  const [shareStatus, setShareStatus] = useState<ShareStatus>(null);

  useEffect(() => {
    const syncPage = () => {
      const nextPage = pageFromHash();
      setPage(nextPage);
      if (nextPage === 'home' && window.location.hash && !window.location.hash.startsWith('#/home')) {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/home`);
      }
    };
    window.addEventListener('hashchange', syncPage);
    syncPage();
    return () => window.removeEventListener('hashchange', syncPage);
  }, []);

  useEffect(() => {
    document.title = `${PAGE_TITLES[page]} · 日麻点数工具`;
  }, [page]);

  const navigate = useCallback((nextPage: PageId) => {
    const nextHash = `#/${nextPage}`;
    setShareStatus(null);
    setPage(nextPage);
    if (window.location.hash !== nextHash) window.location.hash = nextHash;
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }, []);

  const sharePayload = useMemo(
    () => ({
      title: PAGE_TITLES[page],
      text: `日麻点数工具：${PAGE_TITLES[page]}`,
      url: window.location.href,
    }),
    [page],
  );

  const entry = entryForPage(page);
  const shareCurrentPage = async () => {
    const share = (navigator as Navigator & { share?: (payload: ShareData) => Promise<void> }).share;
    if (share) {
      try {
        await share(sharePayload);
        setShareStatus({ tone: 'success', message: '已打开系统分享' });
        return;
      } catch {
        const message = await copyText(sharePayload.url);
        setShareStatus({ tone: 'warning', message });
        return;
      }
    }
    const message = await copyText(sharePayload.url);
    setShareStatus({ tone: 'success', message });
  };

  return (
    <AppFrame
      nav={
        <TopNav
          subtitle={entry?.subtitle}
          title={PAGE_TITLES[page]}
          onBack={page === 'home' ? undefined : () => navigate('home')}
          actions={[
            {
              label: '帮助',
              icon: <HelpCircle aria-hidden="true" />,
              onClick: () => navigate(page === 'help-fu' ? 'help-points' : 'help-fu'),
            },
            {
              label: '分享',
              icon: <Share2 aria-hidden="true" />,
              onClick: () => void shareCurrentPage(),
            },
          ]}
        />
      }
    >
      {shareStatus ? <Alert className="mj-app-toast" tone={shareStatus.tone}>{shareStatus.message}</Alert> : null}
      {renderPage(page, navigate)}
    </AppFrame>
  );
}

function renderPage(page: PageId, navigate: (page: PageId) => void) {
  switch (page) {
    case 'home':
      return <HomePage navigate={navigate} />;
    case 'quick-score':
      return <QuickScorePage />;
    case 'han-fu-calculator':
      return <HanFuCalculatorPage />;
    case 'han-fu-table':
      return <HanFuTablePage />;
    case 'yaku-list':
      return <YakuListPage navigate={navigate} />;
    case 'yaku-detail':
      return <YakuDetailPage />;
    case 'help-fu':
      return <FuHelpPage />;
    case 'help-points':
      return <PointHelpPage />;
    case 'chinitsu':
      return <ChinitsuPracticePage />;
    case 'fu-practice':
      return <FuPracticePage />;
    case 'point-practice':
      return <PointPracticePage />;
    case 'comeback':
      return <ComebackPracticePage />;
    case 'contact':
      return <ContactPage />;
    case 'legacy-score':
      return <LegacyScorePage />;
    case 'table-records':
      return <TableRecordsPage />;
    case 'hand-recognition':
      return <HandRecognitionPage />;
    case 'tile-keyboard-demo':
      return <TileKeyboardDemoPage />;
    case 'placeholder':
      return <DesignedPlaceholderPage navigate={navigate} />;
    default:
      return <DesignedPlaceholderPage navigate={navigate} />;
  }
}
