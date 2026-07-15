import { HelpCircle, Share2 } from 'lucide-react';

import { Alert, AppFrame, TopNav, type TopNavAction } from './components';
import {
  DesignedPlaceholderPage,
  HandRecognitionPage,
  TableRecordsPage,
  TileKeyboardDemoPage,
} from './pages/DeferredPages';
import { HomePage } from './pages/HomePage';
import { ContactPage } from './pages/PlaceholderContactPages';
import { HanFuCalculatorPage, HanFuTablePage } from './pages/PointPages';
import {
  ChinitsuPracticePage,
  ComebackPracticePage,
  FuPracticePage,
  PointPracticePage,
} from './pages/PracticePages';
import { LegacyScorePage, QuickScorePage } from './pages/QuickScorePage';
import { FuHelpPage, PointHelpPage, YakuListPage } from './pages/YakuHelpPages';
import { PAGE_TITLES, entryForPage, type PageId } from './pages/pageModel';
import './pages.css';

export type AppShareStatus = {
  tone: 'success' | 'warning';
  message: string;
} | null;

export interface AppScreenProps {
  page: PageId;
  onNavigate: (page: PageId) => void;
  onShare: () => void;
  shareStatus?: AppShareStatus;
}

export function AppScreen({ page, onNavigate, onShare, shareStatus = null }: AppScreenProps) {
  const entry = entryForPage(page);
  const navActions: TopNavAction[] = [
    {
      label: '帮助',
      icon: <HelpCircle aria-hidden="true" />,
      onClick: () => onNavigate(page === 'help-fu' ? 'help-points' : 'help-fu'),
    },
    {
      label: '分享',
      icon: <Share2 aria-hidden="true" />,
      onClick: onShare,
    },
  ];

  return (
    <AppFrame
      nav={(
        <TopNav
          actions={navActions}
          subtitle={entry?.subtitle}
          title={PAGE_TITLES[page]}
          onBack={page === 'home' ? undefined : () => onNavigate('home')}
        />
      )}
    >
      {shareStatus ? <Alert className="mj-app-toast" tone={shareStatus.tone}>{shareStatus.message}</Alert> : null}
      {renderPage(page, onNavigate)}
    </AppFrame>
  );
}

function renderPage(page: PageId, onNavigate: (page: PageId) => void) {
  switch (page) {
    case 'home':
      return <HomePage navigate={onNavigate} />;
    case 'quick-score':
      return <QuickScorePage />;
    case 'han-fu-calculator':
      return <HanFuCalculatorPage />;
    case 'han-fu-table':
      return <HanFuTablePage />;
    case 'yaku-list':
      return <YakuListPage />;
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
      return <DesignedPlaceholderPage navigate={onNavigate} />;
    default:
      return <DesignedPlaceholderPage navigate={onNavigate} />;
  }
}
