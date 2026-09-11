/** @file src/lib/constants/boardCustomization.ts
 * Per-board visual customization (icon, accent color, background). Stored inside the
 * board's existing `settings` jsonb blob, so no DB migration or codegen is required.
 */

/** A curated set of board icons (emoji), Trello-style but tastier. */
export const ICON_PRESETS = [
	'📋',
	'🚀',
	'💼',
	'🎯',
	'🏠',
	'💡',
	'🔥',
	'⭐',
	'🎨',
	'📈',
	'🐛',
	'✅',
	'📅',
	'🎉',
	'🌱',
	'🛠️',
	'📚',
	'🎵',
	'🍕',
	'❤️'
] as const;

export interface ColorPreset {
	/** Stable id persisted in settings (also the accent hex value). */
	value: string;
	/** i18n key suffix under `board.color_*` for the swatch label. */
	labelKey: string;
}

/** Accent colors used for the board icon chip, header underline and switcher dots. */
export const COLOR_PRESETS: ColorPreset[] = [
	{ value: '#64748b', labelKey: 'slate' },
	{ value: '#ef4444', labelKey: 'red' },
	{ value: '#f97316', labelKey: 'orange' },
	{ value: '#f59e0b', labelKey: 'amber' },
	{ value: '#22c55e', labelKey: 'green' },
	{ value: '#14b8a6', labelKey: 'teal' },
	{ value: '#3b82f6', labelKey: 'blue' },
	{ value: '#6366f1', labelKey: 'indigo' },
	{ value: '#8b5cf6', labelKey: 'violet' },
	{ value: '#ec4899', labelKey: 'pink' }
];

export interface BackgroundPreset {
	/** Stable id persisted in settings. `none` means no custom background. */
	id: string;
	/** i18n key suffix under `board.bg_*` for the swatch label. */
	labelKey: string;
	/**
	 * CSS `background` value layered over the theme background. Translucent tints keep
	 * text and cards readable in both light and dark mode. Empty string = no background.
	 */
	style: string;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
	{ id: 'none', labelKey: 'none', style: '' },
	{
		id: 'ocean',
		labelKey: 'ocean',
		style: 'linear-gradient(135deg, rgba(59,130,246,0.10), rgba(20,184,166,0.10))'
	},
	{
		id: 'sunset',
		labelKey: 'sunset',
		style: 'linear-gradient(135deg, rgba(249,115,22,0.10), rgba(236,72,153,0.10))'
	},
	{
		id: 'forest',
		labelKey: 'forest',
		style: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(20,184,166,0.08))'
	},
	{
		id: 'lavender',
		labelKey: 'lavender',
		style: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(99,102,241,0.08))'
	},
	{
		id: 'rose',
		labelKey: 'rose',
		style: 'linear-gradient(135deg, rgba(236,72,153,0.10), rgba(239,68,68,0.08))'
	},
	{
		id: 'graphite',
		labelKey: 'graphite',
		style: 'linear-gradient(135deg, rgba(100,116,139,0.14), rgba(100,116,139,0.04))'
	}
];

/** Resolved, safe-to-render customization for a board. */
export interface BoardCustomization {
	icon: string;
	color: string;
	backgroundId: string;
	/** CSS `background` value, or '' when no custom background. */
	backgroundStyle: string;
}

export const DEFAULT_CUSTOMIZATION: BoardCustomization = {
	icon: '',
	color: '',
	backgroundId: 'none',
	backgroundStyle: ''
};

/** Anything with a `settings` field (jsonb, may be null / string / object). */
interface BoardLike {
	settings?: unknown;
}

/**
 * Parse a board's `settings` jsonb into a plain object, tolerating null, a JSON string,
 * or an already-parsed object. Returns `{}` for anything unusable.
 */
function parseSettings(settings: unknown): Record<string, unknown> {
	if (!settings) return {};
	if (typeof settings === 'string') {
		try {
			const parsed = JSON.parse(settings);
			return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
		} catch {
			return {};
		}
	}
	if (typeof settings === 'object') return settings as Record<string, unknown>;
	return {};
}

/**
 * Resolve a board's visual customization from its settings, validating each value
 * against the known presets and falling back to sensible defaults.
 */
export function getBoardCustomization(board: BoardLike | null | undefined): BoardCustomization {
	if (!board) return { ...DEFAULT_CUSTOMIZATION };

	const settings = parseSettings(board.settings);

	const rawIcon = settings.icon;
	const icon = typeof rawIcon === 'string' && rawIcon.trim() ? rawIcon.trim() : '';

	const rawColor = settings.color;
	const color =
		typeof rawColor === 'string' && COLOR_PRESETS.some((c) => c.value === rawColor) ? rawColor : '';

	const rawBg = settings.background;
	const bgPreset =
		typeof rawBg === 'string' ? BACKGROUND_PRESETS.find((b) => b.id === rawBg) : undefined;

	return {
		icon,
		color,
		backgroundId: bgPreset?.id ?? 'none',
		backgroundStyle: bgPreset?.style ?? ''
	};
}
