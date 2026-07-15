import { useEffect, useRef } from 'react';

import {
  Alert,
  AppFrame,
  BottomTabBar,
  ModuleTabs,
  TopNav,
} from './components';
import {
  DesignedPlaceholderPage,
  HandRecognitionPage,
  TableRecordsPage,
  TileKeyboardDemoPage,
} from './pages/DeferredPages';
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
import {
  APP_SECTIONS,
  PAGE_TITLES,
  defaultPageForSection,
  sectionForPage,
  type AppSectionId,
  type PageId,
} from './pages/pageModel';
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

function initialVisitedPages(): Record<AppSectionId, PageId> {
  return Object.fromEntries(
    APP_SECTIONS.map((section) => [section.id, section.defaultPage]),
  ) as Record<AppSectionId, PageId>;
}

export function AppScreen({ page, onNavigate, shareStatus = null }: AppScreenProps) {
  const lastVisitedPagesRef = useRef<Record<AppSectionId, PageId>>(initialVisitedPages());
  const lastPrimaryPageRef = useRef<PageId>('quick-score');
  const currentSection = sectionForPage(page);
  const fallbackSection = sectionForPage(lastPrimaryPageRef.current);
  const activeSection = currentSection ?? fallbackSection;

  useEffect(() => {
    if (currentSection) {
      lastVisitedPagesRef.current[currentSection.id] = page;
      lastPrimaryPageRef.current = page;
    }
  }, [currentSection, page]);

  const navigateToSection = (sectionId: AppSectionId) => {
    const target = lastVisitedPagesRef.current[sectionId] ?? defaultPageForSection(sectionId);
    if (target !== page) onNavigate(target);
  };

  const navigateBack = () => {
    onNavigate(lastPrimaryPageRef.current);
  };

  const navigation = (
    <div className="mj-app-navigation">
      {currentSection ? (
        <ModuleTabs
          activeId={page}
          ariaLabel={`${currentSection.label}功能`}
          items={currentSection.tabs.map((tab) => ({ id: tab.page, label: tab.label }))}
          onSelect={onNavigate}
        />
      ) : (
        <TopNav title={PAGE_TITLES[page]} onBack={navigateBack} />
      )}
    </div>
  );

  const bottomNavigation = (
    <BottomTabBar
      activeId={activeSection?.id}
      items={APP_SECTIONS.map((section) => {
        const Icon = section.icon;
        return { id: section.id, label: section.label, icon: <Icon aria-hidden="true" /> };
      })}
      onSelect={navigateToSection}
    />
  );

  return (
    <AppFrame footer={bottomNavigation} nav={navigation}>
      {shareStatus ? <Alert className="mj-app-toast" tone={shareStatus.tone}>{shareStatus.message}</Alert> : null}
      {renderPage(page, onNavigate)}
    </AppFrame>
  );
}

function renderPage(page: PageId, onNavigate: (page: PageId) => void) {
  switch (page) {
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
