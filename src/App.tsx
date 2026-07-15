import { useCallback, useEffect, useMemo, useState } from 'react';

import { AppScreen, type AppShareStatus } from './AppScreen';
import { PAGE_TITLES, resolvePageFromHash, type PageId } from './pages/pageModel';

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
  const [page, setPage] = useState<PageId>(() => resolvePageFromHash(window.location.hash).page);
  const [shareStatus, setShareStatus] = useState<AppShareStatus>(null);

  useEffect(() => {
    const syncPage = () => {
      const resolution = resolvePageFromHash(window.location.hash);
      if (resolution.canonicalHash && window.location.hash !== resolution.canonicalHash) {
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}${resolution.canonicalHash}`,
        );
      }
      setPage(resolution.page);
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
    <AppScreen
      page={page}
      shareStatus={shareStatus}
      onNavigate={navigate}
      onShare={shareCurrentPage}
    />
  );
}
