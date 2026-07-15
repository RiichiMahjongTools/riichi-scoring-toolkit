import {
  Check,
  ChevronLeft,
  Clipboard,
  Copy,
  Mail,
  Minus,
  Plus,
  RotateCcw,
  Send,
  Share2,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type {
  ButtonHTMLAttributes,
  FieldsetHTMLAttributes,
  FormEvent,
  HTMLAttributes,
  ReactNode,
} from 'react';

import '../components.css';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info';
export type SurfaceTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
type ButtonSize = 'sm' | 'md';
type TileSuitId = 'm' | 'p' | 's' | 'z';

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export interface AppFrameProps extends HTMLAttributes<HTMLDivElement> {
  nav?: ReactNode;
  footer?: ReactNode;
}

export function AppFrame({ nav, children, footer, className, ...props }: AppFrameProps) {
  return (
    <div className={cx('mj-app-frame', className)} {...props}>
      <div className="mj-app-frame__chrome">
        {nav ? <div className="mj-app-frame__nav">{nav}</div> : null}
      </div>
      <main className="mj-app-frame__main">{children}</main>
      {footer ? <footer className="mj-app-frame__footer">{footer}</footer> : null}
    </div>
  );
}

export interface TopNavAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'plain' | 'surface' | 'danger';
  ariaControls?: string;
  ariaExpanded?: boolean;
  ariaHaspopup?: 'menu';
}

export interface TopNavProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title: ReactNode;
  subtitle?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  actions?: TopNavAction[];
}

export function TopNav({
  title,
  subtitle,
  onBack,
  backLabel = '返回',
  actions = [],
  className,
  ...props
}: TopNavProps) {
  return (
    <header className={cx('mj-top-nav', className)} {...props}>
      <div className="mj-top-nav__side">
        {onBack ? (
          <IconButton
            ariaLabel={backLabel}
            icon={<ChevronLeft aria-hidden="true" />}
            onClick={onBack}
            variant="surface"
          />
        ) : (
          <span className="mj-top-nav__back-ghost" aria-hidden="true">
            <ChevronLeft />
          </span>
        )}
      </div>
      <div className="mj-top-nav__title">
        <strong>{title}</strong>
        {subtitle ? <span>{subtitle}</span> : null}
      </div>
      <div className="mj-top-nav__side mj-top-nav__side--right">
        {actions.map((action) => (
          <IconButton
            key={action.label}
            ariaLabel={action.label}
            icon={action.icon}
            onClick={action.onClick}
            disabled={action.disabled}
            variant={action.variant}
            aria-controls={action.ariaControls}
            aria-expanded={action.ariaExpanded}
            aria-haspopup={action.ariaHaspopup}
          />
        ))}
      </div>
    </header>
  );
}

export interface ModuleTabItem<T extends string = string> {
  id: T;
  label: ReactNode;
}

export interface ModuleTabsProps<T extends string = string> {
  items: readonly ModuleTabItem<T>[];
  activeId: T;
  onSelect: (id: T) => void;
  ariaLabel?: string;
  className?: string;
}

export function ModuleTabs<T extends string = string>({
  items,
  activeId,
  onSelect,
  ariaLabel = '当前模块功能',
  className,
}: ModuleTabsProps<T>) {
  return (
    <nav aria-label={ariaLabel} className={cx('mj-module-tabs', className)}>
      <div className="mj-module-tabs__track">
        {items.map((item) => {
          const selected = item.id === activeId;
          return (
            <button
              key={item.id}
              aria-current={selected ? 'page' : undefined}
              className={cx('mj-module-tabs__item', selected && 'mj-module-tabs__item--selected')}
              type="button"
              onClick={() => onSelect(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export interface BottomTabBarItem<T extends string = string> {
  id: T;
  label: ReactNode;
  icon: ReactNode;
}

export interface BottomTabBarProps<T extends string = string> {
  items: readonly BottomTabBarItem<T>[];
  activeId?: T;
  onSelect: (id: T) => void;
  ariaLabel?: string;
  className?: string;
}

export function BottomTabBar<T extends string = string>({
  items,
  activeId,
  onSelect,
  ariaLabel = '主要功能',
  className,
}: BottomTabBarProps<T>) {
  return (
    <nav aria-label={ariaLabel} className={cx('mj-bottom-tab-bar', className)}>
      {items.map((item) => {
        const selected = item.id === activeId;
        return (
          <button
            key={item.id}
            aria-current={selected ? 'page' : undefined}
            className={cx('mj-bottom-tab-bar__item', selected && 'mj-bottom-tab-bar__item--selected')}
            type="button"
            onClick={() => onSelect(item.id)}
          >
            <span className="mj-bottom-tab-bar__icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export interface ContentSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  density?: 'default' | 'compact';
  separator?: 'none' | 'top';
}

export function ContentSection({
  eyebrow,
  title,
  description,
  actions,
  footer,
  density = 'default',
  separator = 'none',
  children,
  className,
  ...props
}: ContentSectionProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={title ? headingId : undefined}
      className={cx(
        'mj-content-section',
        `mj-content-section--${density}`,
        separator === 'top' && 'mj-content-section--separated',
        className,
      )}
      {...props}
    >
      {(eyebrow || title || description || actions) ? (
        <div className="mj-content-section__header">
          <div className="mj-content-section__heading">
            {eyebrow ? <p className="mj-eyebrow">{eyebrow}</p> : null}
            {title ? <h2 id={headingId}>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className="mj-content-section__actions">{actions}</div> : null}
        </div>
      ) : null}
      {children ? <div className="mj-content-section__body">{children}</div> : null}
      {footer ? <div className="mj-content-section__footer">{footer}</div> : null}
    </section>
  );
}

export interface FieldGroupProps extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'title'> {
  legend: ReactNode;
  legendVisibility?: 'visible' | 'sr-only';
  description?: ReactNode;
  actions?: ReactNode;
  density?: 'default' | 'compact';
}

export function FieldGroup({
  legend,
  legendVisibility = 'visible',
  description,
  actions,
  density = 'default',
  children,
  className,
  ...props
}: FieldGroupProps) {
  return (
    <fieldset className={cx('mj-field-group', `mj-field-group--${density}`, className)} {...props}>
      <legend
        className={cx(
          'mj-field-group__legend',
          legendVisibility === 'sr-only' && 'mj-field-group__legend--sr-only',
        )}
      >
        {legend}
      </legend>
      {(description || actions) ? (
        <div className="mj-field-group__meta">
          {description ? <p>{description}</p> : null}
          {actions ? <div className="mj-field-group__actions">{actions}</div> : null}
        </div>
      ) : null}
      {children ? <div className="mj-field-group__body">{children}</div> : null}
    </fieldset>
  );
}

export interface SurfacePanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  tone?: SurfaceTone;
  density?: 'default' | 'compact';
}

export function SurfacePanel({
  title,
  description,
  actions,
  footer,
  tone = 'neutral',
  density = 'default',
  children,
  className,
  ...props
}: SurfacePanelProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={title ? headingId : undefined}
      className={cx('mj-surface-panel', `mj-surface-panel--${tone}`, `mj-surface-panel--${density}`, className)}
      data-ui-surface="surface-panel"
      {...props}
    >
      {(title || description || actions) ? (
        <div className="mj-surface-panel__header">
          <div className="mj-surface-panel__heading">
            {title ? <h2 id={headingId}>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className="mj-surface-panel__actions">{actions}</div> : null}
        </div>
      ) : null}
      {children}
      {footer ? <div className="mj-surface-panel__footer">{footer}</div> : null}
    </section>
  );
}

export interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: ReactNode;
}

export function ActionButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  children,
  className,
  type = 'button',
  ...props
}: ActionButtonProps) {
  return (
    <button
      className={cx(
        'mj-action-button',
        `mj-action-button--${variant}`,
        `mj-action-button--${size}`,
        fullWidth && 'mj-action-button--full',
        className,
      )}
      type={type}
      {...props}
    >
      {icon ? <span className="mj-action-button__icon">{icon}</span> : null}
      <span className="mj-action-button__label">{children}</span>
    </button>
  );
}

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {
  ariaLabel: string;
  icon: ReactNode;
  variant?: 'plain' | 'surface' | 'danger';
  size?: ButtonSize;
}

export function IconButton({
  ariaLabel,
  icon,
  variant = 'plain',
  size = 'md',
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      className={cx('mj-icon-button', `mj-icon-button--${variant}`, `mj-icon-button--${size}`, className)}
      type={type}
      {...props}
    >
      {icon}
    </button>
  );
}

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  tone?: Tone;
  size?: ButtonSize;
}

export function Chip({
  selected = false,
  tone = 'default',
  size = 'md',
  className,
  children,
  type = 'button',
  ...props
}: ChipProps) {
  return (
    <button
      aria-pressed={selected}
      className={cx(
        'mj-chip',
        `mj-chip--${tone}`,
        `mj-chip--${size}`,
        selected && 'mj-chip--selected',
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

export interface SegmentedOption<T extends string | number = string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
}

export interface SegmentedControlProps<T extends string | number = string> {
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

export function SegmentedControl<T extends string | number = string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div aria-label={ariaLabel} className={cx('mj-segmented-control', className)} role="group">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={String(option.value)}
            aria-label={option.ariaLabel}
            aria-pressed={selected}
            className={cx('mj-segmented-control__item', selected && 'mj-segmented-control__item--selected')}
            disabled={option.disabled}
            type="button"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

interface CounterControlBaseProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: ReactNode;
  disabled?: boolean;
}

export type CounterControlProps = CounterControlBaseProps & (
  | { label: ReactNode; ariaLabel?: string }
  | { label?: never; ariaLabel: string }
);

export function CounterControl({
  label,
  ariaLabel,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  suffix,
  disabled = false,
  className,
  ...props
}: CounterControlProps) {
  const canDecrease = !disabled && value - step >= min;
  const canIncrease = !disabled && (max === undefined || value + step <= max);
  const hasVisibleLabel = label !== undefined && label !== null;
  const controlLabel =
    ariaLabel ?? (typeof label === 'string' || typeof label === 'number' ? String(label) : '计数器');

  return (
    <div
      aria-label={hasVisibleLabel ? undefined : controlLabel}
      className={cx('mj-counter', !hasVisibleLabel && 'mj-counter--label-hidden', className)}
      role="group"
      {...props}
    >
      {hasVisibleLabel ? <span className="mj-counter__label">{label}</span> : null}
      <div className="mj-counter__controls">
        <IconButton
          ariaLabel={`减少${controlLabel}`}
          className="mj-counter__button"
          disabled={!canDecrease}
          icon={<Minus aria-hidden="true" />}
          onClick={() => onChange(value - step)}
          size="sm"
          variant="surface"
        />
        <output aria-live="polite" className="mj-counter__value">{value}</output>
        <IconButton
          ariaLabel={`增加${controlLabel}`}
          className="mj-counter__button"
          disabled={!canIncrease}
          icon={<Plus aria-hidden="true" />}
          onClick={() => onChange(value + step)}
          size="sm"
          variant="surface"
        />
        {suffix ? <span className="mj-counter__suffix">{suffix}</span> : null}
      </div>
    </div>
  );
}

export interface AlertProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  tone?: Exclude<Tone, 'default'>;
  title?: ReactNode;
  icon?: ReactNode;
}

export function Alert({ tone = 'info', title, icon, children, className, ...props }: AlertProps) {
  return (
    <SurfacePanel
      className={cx('mj-alert', `mj-alert--${tone}`, className)}
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      tone={tone}
      {...props}
    >
      {icon ? <span className="mj-alert__icon">{icon}</span> : null}
      <div className="mj-alert__body">
        {title ? <strong>{title}</strong> : null}
        {children ? <p>{children}</p> : null}
      </div>
    </SurfacePanel>
  );
}

export interface TileMeta {
  code: string;
  label: string;
  suitLabel: string;
  suit: TileSuitId | 'unknown';
  ariaLabel: string;
  isRed: boolean;
  assetFilename?: string;
}

const suitLabels: Record<TileSuitId, string> = {
  m: '万',
  p: '筒',
  s: '索',
  z: '字',
};

const honorLabels = ['东', '南', '西', '北', '白', '发', '中'];
const honorAssets = ['Ton.png', 'Nan.png', 'Shaa.png', 'Pei.png', 'Haku.png', 'Hatsu.png', 'Chun.png'];
const numberAssetPrefix: Record<Exclude<TileSuitId, 'z'>, string> = {
  m: 'Man',
  p: 'Pin',
  s: 'Sou',
};

function parseTileCode(code: string): { suit: TileSuitId; rank: number; isRed: boolean } | null {
  const normalized = code.trim().toLowerCase();
  const leftSuit = normalized.match(/^([mpsz])([0-9])r?$/);
  const rightSuit = normalized.match(/^([0-9])([mpsz])r?$/);

  if (leftSuit) {
    const suit = leftSuit[1] as TileSuitId;
    const rawRank = Number(leftSuit[2]);
    return { suit, rank: rawRank === 0 ? 5 : rawRank, isRed: rawRank === 0 || normalized.endsWith('r') };
  }

  if (rightSuit) {
    const rawRank = Number(rightSuit[1]);
    const suit = rightSuit[2] as TileSuitId;
    return { suit, rank: rawRank === 0 ? 5 : rawRank, isRed: rawRank === 0 || normalized.endsWith('r') };
  }

  return null;
}

export function tileCodeToMeta(code: string): TileMeta {
  if (code.trim().toLowerCase() === 'back') {
    return {
      code,
      label: '',
      suitLabel: '',
      suit: 'unknown',
      ariaLabel: '牌背',
      isRed: false,
      assetFilename: 'Back.png',
    };
  }

  const parsed = parseTileCode(code);

  if (!parsed) {
    return {
      code,
      label: code,
      suitLabel: '',
      suit: 'unknown',
      ariaLabel: code,
      isRed: false,
    };
  }

  if (parsed.suit === 'z') {
    const label = honorLabels[parsed.rank - 1] ?? code;
    return {
      code,
      label,
      suitLabel: suitLabels.z,
      suit: parsed.suit,
      ariaLabel: label,
      isRed: false,
      assetFilename: honorAssets[parsed.rank - 1],
    };
  }

  const suitLabel = suitLabels[parsed.suit];
  const redPrefix = parsed.isRed ? '赤' : '';
  const assetPrefix = numberAssetPrefix[parsed.suit];

  return {
    code,
    label: String(parsed.rank),
    suitLabel,
    suit: parsed.suit,
    ariaLabel: `${redPrefix}${parsed.rank}${suitLabel}`,
    isRed: parsed.isRed,
    assetFilename: `${assetPrefix}${parsed.rank}${parsed.isRed ? '-Dora' : ''}.png`,
  };
}

export interface MahjongTileProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'onClick'> {
  code: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  count?: ReactNode;
  marker?: ReactNode;
}

export function MahjongTile({
  code,
  size = 'md',
  selected = false,
  disabled = false,
  onClick,
  ariaLabel,
  count,
  marker,
  className,
  ...props
}: MahjongTileProps) {
  const meta = tileCodeToMeta(code);
  const tileClass = cx(
    'mj-tile',
    `mj-tile--${size}`,
    `mj-tile--${meta.suit}`,
    meta.assetFilename && 'mj-tile--with-img',
    meta.isRed && 'mj-tile--red',
    selected && 'mj-tile--selected',
    disabled && 'mj-tile--disabled',
    className,
  );
  const content = (
    <>
      {meta.assetFilename ? (
        <img
          alt=""
          aria-hidden="true"
          className="mj-tile__face-img"
          src={`/tiles/fluffystuff/regular/${meta.assetFilename}`}
        />
      ) : null}
      {marker ? <span className="mj-tile__marker">{marker}</span> : null}
      <span className="mj-tile__rank">{meta.label}</span>
      {meta.suitLabel ? <span className="mj-tile__suit">{meta.suitLabel}</span> : null}
      {count ? <span className="mj-tile__count">{count}</span> : null}
    </>
  );

  if (onClick) {
    return (
      <button
        aria-label={ariaLabel ?? meta.ariaLabel}
        aria-pressed={selected}
        className={tileClass}
        disabled={disabled}
        type="button"
        onClick={onClick}
        {...props}
      >
        {content}
      </button>
    );
  }

  const isAriaHidden = props['aria-hidden'] === true || props['aria-hidden'] === 'true';

  return (
    <span
      aria-label={isAriaHidden ? undefined : ariaLabel ?? meta.ariaLabel}
      className={tileClass}
      role={isAriaHidden ? undefined : 'img'}
      {...props}
    >
      {content}
    </span>
  );
}

export interface TileStripProps extends HTMLAttributes<HTMLDivElement> {
  tiles: string[];
  label?: ReactNode;
  emptyLabel?: ReactNode;
  maxSlots?: number;
  highlightLast?: boolean;
  highlightIndex?: number | null;
  selectionMarker?: ReactNode;
  onTileClick?: (index: number) => void;
  tileActionLabel?: (index: number, tileLabel: string) => string;
  onRemove?: (index: number) => void;
  tileSize?: MahjongTileProps['size'];
}

export function TileStrip({
  tiles,
  label,
  emptyLabel = '尚未选择牌',
  maxSlots,
  highlightLast = false,
  highlightIndex,
  selectionMarker = '和',
  onTileClick,
  tileActionLabel,
  onRemove,
  tileSize = 'md',
  className,
  ...props
}: TileStripProps) {
  const emptySlots = maxSlots ? Math.max(0, maxSlots - tiles.length) : 0;
  const selectedIndex = highlightIndex ?? (highlightLast ? tiles.length - 1 : null);

  return (
    <div className={cx('mj-tile-strip', className)} {...props}>
      {label ? <div className="mj-tile-strip__label">{label}</div> : null}
      <div className="mj-tile-strip__row">
        {tiles.length === 0 && emptyLabel ? <span className="mj-tile-strip__empty">{emptyLabel}</span> : null}
        {tiles.map((tile, index) => {
          const meta = tileCodeToMeta(tile);
          const isSelected = index === selectedIndex;
          const handleTileClick = onTileClick ?? onRemove;
          return (
            <MahjongTile
              key={`${tile}-${index}`}
              ariaLabel={
                onTileClick
                  ? (tileActionLabel?.(index, meta.ariaLabel) ?? `选择第 ${index + 1} 张${meta.ariaLabel}`)
                  : onRemove
                    ? `移除第 ${index + 1} 张${meta.ariaLabel}`
                    : meta.ariaLabel
              }
              className={isSelected ? 'mj-tile--winning' : undefined}
              code={tile}
              marker={isSelected ? selectionMarker : undefined}
              onClick={handleTileClick ? () => handleTileClick(index) : undefined}
              selected={isSelected}
              size={tileSize}
            />
          );
        })}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <span key={`empty-${index}`} aria-hidden="true" className={cx('mj-tile', `mj-tile--${tileSize}`, 'mj-tile--empty')} />
        ))}
      </div>
    </div>
  );
}

export interface TileSuitDefinition {
  id: TileSuitId;
  label: string;
  shortLabel?: string;
}

const defaultTileSuits: TileSuitDefinition[] = [
  { id: 'm', label: '万子', shortLabel: '万' },
  { id: 'p', label: '筒子', shortLabel: '筒' },
  { id: 's', label: '索子', shortLabel: '索' },
  { id: 'z', label: '字牌', shortLabel: '字' },
];

function buildTileGrid(suit: TileSuitId, allowRedFives: boolean) {
  if (suit === 'z') {
    return [1, 2, 3, 4, 5, 6, 7].map((rank) => `z${rank}`);
  }

  const ranks = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((rank) => `${suit}${rank}`);
  if (!allowRedFives) {
    return ranks;
  }

  return [...ranks.slice(0, 5), `${suit}5r`, ...ranks.slice(5)];
}

export interface TileKeyboardProps {
  open: boolean;
  tiles: string[];
  onChange: (tiles: string[]) => void;
  onDone: () => void;
  onClose?: () => void;
  maxTiles?: number;
  title?: ReactNode;
  subtitle?: ReactNode;
  previewLabel?: ReactNode;
  previewHighlightLast?: boolean;
  previewHighlightIndex?: number | null;
  onPreviewTileSelect?: (index: number) => void;
  doneLabel?: ReactNode;
  allowRedFives?: boolean;
  suits?: TileSuitDefinition[];
  isTileDisabled?: (tile: string, currentTiles: string[]) => boolean;
}

export function TileKeyboard({
  open,
  tiles,
  onChange,
  onDone,
  onClose,
  maxTiles = 14,
  title = '选择手牌',
  subtitle,
  previewLabel = '手牌预览',
  previewHighlightLast = true,
  previewHighlightIndex,
  onPreviewTileSelect,
  doneLabel = '完成',
  allowRedFives = true,
  suits = defaultTileSuits,
  isTileDisabled,
}: TileKeyboardProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const [activeSuit, setActiveSuit] = useState<TileSuitId>(suits[0]?.id ?? 'm');
  const currentSuit = suits.some((suit) => suit.id === activeSuit) ? activeSuit : suits[0]?.id ?? 'm';
  const gridTiles = useMemo(() => buildTileGrid(currentSuit, allowRedFives), [allowRedFives, currentSuit]);
  const atLimit = tiles.length >= maxTiles;

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;

    const focusableSelector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const focusFirst = () => {
      const first = dialog?.querySelector<HTMLElement>(focusableSelector);
      first?.focus();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
        return;
      }

      if (event.key !== 'Tab' || !dialog) return;

      const focusable = [...dialog.querySelectorAll<HTMLElement>(focusableSelector)].filter(
        (element) => element.offsetParent !== null,
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.setTimeout(focusFirst, 0);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const hasHeaderText = Boolean(title || subtitle);
  const dialogLabelProps = title ? { 'aria-labelledby': titleId } : { 'aria-label': '牌面键盘' };

  const addTile = (tile: string) => {
    if (tiles.length >= maxTiles || isTileDisabled?.(tile, tiles)) {
      return;
    }
    onChange([...tiles, tile]);
  };

  const deleteIndex =
    onPreviewTileSelect && typeof previewHighlightIndex === 'number'
      ? previewHighlightIndex
      : tiles.length - 1;
  const deleteSelectedTile = () => {
    if (deleteIndex < 0) return;
    onChange(tiles.filter((_, currentIndex) => currentIndex !== deleteIndex));
  };

  return (
    <div className="mj-keyboard-layer">
      {onClose ? (
        <button
          aria-label="关闭牌键盘"
          className="mj-keyboard-layer__backdrop"
          type="button"
          onClick={onClose}
        />
      ) : (
        <div aria-hidden="true" className="mj-keyboard-layer__backdrop" />
      )}
      <section ref={dialogRef} {...dialogLabelProps} aria-modal="true" className="mj-tile-keyboard" role="dialog">
        <div className="mj-tile-keyboard__handle" aria-hidden="true" />
        {hasHeaderText || onClose ? (
          <div className={cx('mj-tile-keyboard__header', !hasHeaderText && 'mj-tile-keyboard__header--icon-only')}>
            {hasHeaderText ? (
              <div>
                {title ? <h2 id={titleId}>{title}</h2> : null}
                {subtitle ? <p>{subtitle}</p> : null}
              </div>
            ) : null}
            {onClose ? (
              <IconButton ariaLabel="关闭牌键盘" icon={<X aria-hidden="true" />} onClick={onClose} variant="surface" />
            ) : null}
          </div>
        ) : null}

        <TileStrip
          className="mj-keyboard-preview-strip"
          emptyLabel={null}
          highlightIndex={previewHighlightIndex}
          highlightLast={previewHighlightLast}
          label={
            <span>
              {previewLabel}
              <strong>
                {tiles.length}/{maxTiles}
              </strong>
            </span>
          }
          maxSlots={Math.min(maxTiles, 14)}
          tiles={tiles}
          tileActionLabel={(index, tileLabel) => `选择第 ${index + 1} 张${tileLabel}为和牌`}
          tileSize="xs"
          onRemove={
            onPreviewTileSelect
              ? undefined
              : (index) => onChange(tiles.filter((_, currentIndex) => currentIndex !== index))
          }
          onTileClick={onPreviewTileSelect}
        />

        <div aria-label="选择花色" className="mj-suit-tabs" role="group">
          {suits.map((suit) => (
            <button
              key={suit.id}
              aria-pressed={suit.id === currentSuit}
              className={cx('mj-suit-tabs__item', suit.id === currentSuit && 'mj-suit-tabs__item--selected')}
              type="button"
              onClick={() => setActiveSuit(suit.id)}
            >
              {suit.label}
            </button>
          ))}
        </div>

        <div aria-label="牌面选择" className="mj-tile-keyboard__grid">
          {gridTiles.map((tile) => {
            const meta = tileCodeToMeta(tile);
            const disabled = atLimit || Boolean(isTileDisabled?.(tile, tiles));
            return (
              <MahjongTile
                key={tile}
                ariaLabel={`加入${meta.ariaLabel}`}
                code={tile}
                disabled={disabled}
                onClick={() => addTile(tile)}
                size="lg"
              />
            );
          })}
        </div>

        <div className="mj-tile-keyboard__actions">
          <ActionButton
            disabled={tiles.length === 0}
            icon={<Trash2 aria-hidden="true" />}
            variant="ghost"
            onClick={deleteSelectedTile}
          >
            删除
          </ActionButton>
          <ActionButton
            className="mj-keyboard-clear-action"
            disabled={tiles.length === 0}
            icon={<RotateCcw aria-hidden="true" />}
            variant="ghost"
            onClick={() => onChange([])}
          >
            清空
          </ActionButton>
          <ActionButton fullWidth icon={<Check aria-hidden="true" />} onClick={onDone}>
            {doneLabel}
          </ActionButton>
        </div>
      </section>
    </div>
  );
}

export interface HanFuSelectorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  han: number;
  fu: number;
  onHanChange: (han: number) => void;
  onFuChange: (fu: number) => void;
  hanOptions?: number[];
  fuOptions?: number[];
  disabledFuValues?: number[];
  title?: ReactNode;
}

const defaultHanOptions = Array.from({ length: 13 }, (_, index) => index + 1);
const defaultFuOptions = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110];

export function HanFuSelector({
  han,
  fu,
  onHanChange,
  onFuChange,
  hanOptions = defaultHanOptions,
  fuOptions = defaultFuOptions,
  disabledFuValues = [],
  title = '番符选择',
  className,
  ...props
}: HanFuSelectorProps) {
  return (
    <div className={cx('mj-han-fu-selector', className)} {...props}>
      {title ? <h3>{title}</h3> : null}
      <div className="mj-han-fu-selector__group">
        <span>番数</span>
        <div aria-label="选择番数" className="mj-han-fu-selector__options" role="group">
          {hanOptions.map((value) => (
            <Chip key={value} selected={value === han} size="sm" onClick={() => onHanChange(value)}>
              {value}番
            </Chip>
          ))}
        </div>
      </div>
      <div className="mj-han-fu-selector__group">
        <span>符数</span>
        <div aria-label="选择符数" className="mj-han-fu-selector__options" role="group">
          {fuOptions.map((value) => (
            <Chip
              key={value}
              disabled={disabledFuValues.includes(value)}
              selected={value === fu}
              size="sm"
              onClick={() => onFuChange(value)}
            >
              {value}符
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

export interface StatListItem {
  id: string;
  label: ReactNode;
  value: ReactNode;
  caption?: ReactNode;
  tone?: Tone;
}

export interface StatListProps extends HTMLAttributes<HTMLDListElement> {
  items: StatListItem[];
  dividers?: 'none' | 'between';
}

export function StatList({ items, dividers = 'none', className, ...props }: StatListProps) {
  return (
    <dl
      className={cx('mj-stat-list', dividers === 'between' && 'mj-stat-list--divided', className)}
      {...props}
    >
      {items.map((item) => (
        <div key={item.id} className={cx('mj-stat-list__item', `mj-stat-list__item--${item.tone ?? 'default'}`)}>
          <dt className="mj-stat-list__copy">
            <strong>{item.label}</strong>
            {item.caption ? <small>{item.caption}</small> : null}
          </dt>
          <dd className="mj-stat-list__value">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

interface ActionListItemBase {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  badge?: ReactNode;
  icon?: ReactNode;
}

export type ActionListItem =
  | (ActionListItemBase & { kind: 'link'; href: string; onClick?: never; disabled?: never })
  | (ActionListItemBase & { kind: 'button'; onClick: () => void; disabled?: boolean; href?: never })
  | (ActionListItemBase & { kind: 'static'; href?: never; onClick?: never; disabled?: never });

export interface ActionListProps extends Omit<HTMLAttributes<HTMLUListElement>, 'children'> {
  items: ActionListItem[];
  dividers?: 'none' | 'between';
}

export function ActionList({ items, dividers = 'none', className, ...props }: ActionListProps) {
  const renderContent = (item: ActionListItem) => (
    <>
      {item.icon ? <span className="mj-action-list__icon">{item.icon}</span> : null}
      <span className="mj-action-list__copy">
        <strong>{item.title}</strong>
        {item.meta ? <span>{item.meta}</span> : null}
        {item.description ? <small>{item.description}</small> : null}
      </span>
      {item.badge ? <span className="mj-action-list__badge">{item.badge}</span> : null}
    </>
  );

  return (
    <ul
      className={cx('mj-action-list', dividers === 'between' && 'mj-action-list--divided', className)}
      {...props}
    >
      {items.map((item) => (
        <li
          key={item.id}
          className={cx('mj-action-list__item', item.icon != null && 'mj-action-list__item--with-icon')}
        >
          {item.kind === 'link' ? (
            <a className="mj-action-list__control" href={item.href}>{renderContent(item)}</a>
          ) : item.kind === 'button' ? (
            <button className="mj-action-list__control" disabled={item.disabled} type="button" onClick={item.onClick}>
              {renderContent(item)}
            </button>
          ) : (
            <div className="mj-action-list__control mj-action-list__control--static">{renderContent(item)}</div>
          )}
        </li>
      ))}
    </ul>
  );
}

export interface DataTableColumn<T extends Record<string, unknown>> {
  id: string;
  header: ReactNode;
  accessor?: keyof T | ((row: T) => ReactNode);
  render?: (row: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T extends Record<string, unknown>> extends HTMLAttributes<HTMLDivElement> {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  rowKey?: (row: T, index: number) => string;
  emptyText?: ReactNode;
}

function readCell<T extends Record<string, unknown>>(row: T, column: DataTableColumn<T>) {
  if (column.render) {
    return column.render(row);
  }

  if (typeof column.accessor === 'function') {
    return column.accessor(row);
  }

  const key = column.accessor ?? column.id;
  return row[key as keyof T] as ReactNode;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  rowKey,
  emptyText = '暂无数据',
  className,
  ...props
}: DataTableProps<T>) {
  return (
    <div className={cx('mj-data-table', className)} {...props}>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.id} className={column.align ? `mj-align-${column.align}` : undefined}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>{emptyText}</td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowKey ? rowKey(row, rowIndex) : rowIndex}>
                {columns.map((column) => (
                  <td key={column.id} className={column.align ? `mj-align-${column.align}` : undefined}>
                    {readCell(row, column)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export interface PracticeAnswerPanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  status: 'idle' | 'correct' | 'wrong';
  title?: ReactNode;
  streak?: number;
  userAnswer?: ReactNode;
  correctAnswer?: ReactNode;
  breakdown?: ReactNode;
  actions?: ReactNode;
}

export function PracticeAnswerPanel({
  status,
  title,
  streak,
  userAnswer,
  correctAnswer,
  breakdown,
  actions,
  children,
  className,
  ...props
}: PracticeAnswerPanelProps) {
  const statusMeta = {
    idle: { label: '等待作答', icon: <Clipboard aria-hidden="true" /> },
    correct: { label: '回答正确', icon: <Check aria-hidden="true" /> },
    wrong: { label: '需要复盘', icon: <X aria-hidden="true" /> },
  }[status];
  const surfaceTone: SurfaceTone = status === 'correct' ? 'success' : status === 'wrong' ? 'danger' : 'neutral';

  return (
    <SurfacePanel
      aria-live="polite"
      actions={streak !== undefined ? <span className="mj-practice-panel__streak">{streak} 连正</span> : null}
      className={cx('mj-practice-panel', `mj-practice-panel--${status}`, className)}
      role="status"
      title={
        <span className="mj-practice-panel__title">
          {statusMeta.icon}
          {title ?? statusMeta.label}
        </span>
      }
      tone={surfaceTone}
      {...props}
    >
      {children ? <div className="mj-practice-panel__body">{children}</div> : null}
      {(userAnswer !== undefined || correctAnswer !== undefined) ? (
        <dl className="mj-practice-panel__answers">
          {userAnswer !== undefined ? (
            <div>
              <dt>您的答案</dt>
              <dd>{userAnswer}</dd>
            </div>
          ) : null}
          {correctAnswer !== undefined ? (
            <div>
              <dt>标准答案</dt>
              <dd>{correctAnswer}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      {breakdown ? <div className="mj-practice-panel__breakdown">{breakdown}</div> : null}
      {actions ? <div className="mj-practice-panel__actions">{actions}</div> : null}
    </SurfacePanel>
  );
}

export interface PlaceholderPanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  description?: ReactNode;
  statusLabel?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
}

export function PlaceholderPanel({
  title = '页面不可用',
  description = '当前入口没有绑定到可用页面，请返回快速算分继续使用。',
  statusLabel = 'Later Scope',
  icon = <Wrench aria-hidden="true" />,
  actions,
  className,
  ...props
}: PlaceholderPanelProps) {
  return (
    <SurfacePanel
      aria-label={typeof title === 'string' ? title : undefined}
      className={cx('mj-placeholder-panel', className)}
      role="status"
      tone="warning"
      {...props}
    >
      <span className="mj-placeholder-panel__icon">{icon}</span>
      <span className="mj-placeholder-panel__status">{statusLabel}</span>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {actions ? <div className="mj-placeholder-panel__actions">{actions}</div> : null}
    </SurfacePanel>
  );
}

export interface ContactSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'onSubmit'> {
  title?: ReactNode;
  description?: ReactNode;
  methods?: ActionListItem[];
  feedbackValue?: string;
  feedbackPlaceholder?: string;
  onFeedbackChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  submitLabel?: ReactNode;
}

export function ContactSection({
  title = '联系反馈',
  description = '遇到规则疑问、页面问题或想补充资料，都可以从这里反馈。',
  methods = [],
  feedbackValue = '',
  feedbackPlaceholder = '写下你遇到的问题或建议',
  onFeedbackChange,
  onSubmit,
  submitLabel = '提交反馈',
  className,
  ...props
}: ContactSectionProps) {
  const textareaId = useId();
  const [draftFeedback, setDraftFeedback] = useState(feedbackValue);
  const isControlled = onFeedbackChange !== undefined;
  const currentFeedback = isControlled ? feedbackValue : draftFeedback;
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.(currentFeedback);
  };

  return (
    <ContentSection className={cx('mj-contact-section', className)} description={description} title={title} {...props}>
      {methods.length > 0 ? (
        <ActionList
          items={methods.map((method) => ({
            ...method,
            icon: method.icon ?? <Mail aria-hidden="true" />,
          }))}
        />
      ) : null}

      {onFeedbackChange || onSubmit ? (
        <form className="mj-contact-section__form" onSubmit={handleSubmit}>
          <FieldGroup density="compact" legend="反馈内容" legendVisibility="sr-only">
            <textarea
              aria-label="反馈内容"
              id={textareaId}
              placeholder={feedbackPlaceholder}
              value={currentFeedback}
              onChange={(event) => {
                if (isControlled) {
                  onFeedbackChange?.(event.target.value);
                  return;
                }
                setDraftFeedback(event.target.value);
              }}
            />
            <ActionButton disabled={!currentFeedback.trim()} icon={<Send aria-hidden="true" />} type="submit">
              {submitLabel}
            </ActionButton>
          </FieldGroup>
        </form>
      ) : null}
    </ContentSection>
  );
}

export interface ShareAction {
  id: string;
  label: ReactNode;
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
  variant?: ButtonVariant;
}

export interface ShareBarProps extends HTMLAttributes<HTMLDivElement> {
  actions: ShareAction[];
  label?: ReactNode;
  size?: ButtonSize;
}

export function ShareBar({
  actions,
  label = '分享与保存',
  size = 'sm',
  className,
  ...props
}: ShareBarProps) {
  return (
    <div className={cx('mj-share-bar', className)} {...props}>
      {label ? <span className="mj-share-bar__label">{label}</span> : null}
      <div className="mj-share-bar__actions" data-action-count={actions.length}>
        {actions.map((action) => (
          <ActionButton
            key={action.id}
            aria-label={action.ariaLabel}
            disabled={action.disabled}
            icon={action.icon ?? defaultShareIcon(action.id)}
            size={size}
            variant={action.variant ?? 'secondary'}
            onClick={action.onClick}
          >
            {action.label}
          </ActionButton>
        ))}
      </div>
    </div>
  );
}

function defaultShareIcon(id: string) {
  if (id.includes('copy')) {
    return <Copy aria-hidden="true" />;
  }
  if (id.includes('save')) {
    return <Clipboard aria-hidden="true" />;
  }
  return <Share2 aria-hidden="true" />;
}
