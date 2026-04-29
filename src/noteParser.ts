// ── Typy ────────────────────────────────────────────────────────────────────

export type NoteLevel = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'goals';

export interface DailyNoteInfo {
	level: 'daily';
	year: number;
	month: number; // 1–12
	day: number;
}

export interface WeeklyNoteInfo {
	level: 'weekly';
	year: number;
	week: number;
}

export interface MonthlyNoteInfo {
	level: 'monthly';
	year: number;
	month: number; // 1–12
}

export interface YearlyNoteInfo {
	level: 'yearly';
	year: number;
}

export interface GoalsNoteInfo {
	level: 'goals';
	name: string;
}

export type NoteInfo =
	| DailyNoteInfo
	| WeeklyNoteInfo
	| MonthlyNoteInfo
	| YearlyNoteInfo
	| GoalsNoteInfo;

// ── Wzorce nazw plików ───────────────────────────────────────────────────────

const DAILY_PATTERN   = /^(\d{4})-(\d{2})-(\d{2})$/;
const WEEKLY_PATTERN  = /^(\d{4})-W(\d{1,2})$/;
const MONTHLY_PATTERN = /^(\d{4})-(\d{2})$/;
const YEARLY_PATTERN  = /^(\d{4})$/;

// ── Parsowanie nazwy pliku ───────────────────────────────────────────────────

/**
 * Wykrywa poziom notatki na podstawie nazwy pliku (bez rozszerzenia).
 * Kolejność sprawdzania jest ważna: daily przed monthly (oba mają YYYY-MM).
 */
export function parseNoteName(basename: string): NoteInfo | null {
	let m: RegExpMatchArray | null;

	m = basename.match(DAILY_PATTERN);
	if (m) {
		return { level: 'daily', year: +m[1], month: +m[2], day: +m[3] };
	}

	m = basename.match(WEEKLY_PATTERN);
	if (m) {
		return { level: 'weekly', year: +m[1], week: +m[2] };
	}

	m = basename.match(MONTHLY_PATTERN);
	if (m) {
		return { level: 'monthly', year: +m[1], month: +m[2] };
	}

	m = basename.match(YEARLY_PATTERN);
	if (m) {
		return { level: 'yearly', year: +m[1] };
	}

	return null;
}

// ── Ścieżki notatek ──────────────────────────────────────────────────────────

const ROOT = '00 Planer';

export function getDailyNotePath(year: number, month: number, day: number): string {
	const mm = String(month).padStart(2, '0');
	const dd = String(day).padStart(2, '0');
	return `${ROOT}/01 Dziennik/${year}-${mm}-${dd}`;
}

export function getWeeklyNotePath(year: number, week: number): string {
	return `${ROOT}/02 Tygodnie/${year}-W${String(week).padStart(2, '0')}`;
}

export function getMonthlyNotePath(year: number, month: number): string {
	const mm = String(month).padStart(2, '0');
	return `${ROOT}/03 Miesiące/${year}-${mm}`;
}

export function getYearlyNotePath(year: number): string {
	return `${ROOT}/04 Lata/${year}`;
}

export function getGoalsNotePath(name: string): string {
	return `${ROOT}/08 Cele/${name}`;
}

export const YEARLY_FOLDER = `${ROOT}/04 Lata/`;
export const GOALS_FOLDER  = `${ROOT}/08 Cele/`;

// ── ISO numer tygodnia ───────────────────────────────────────────────────────

/**
 * Zwraca ISO rok i numer tygodnia dla podanej daty.
 * Tydzień ISO 1 = tydzień zawierający pierwszy czwartek roku.
 */
export function getISOWeek(year: number, month: number, day: number): { year: number; week: number } {
	const d = new Date(Date.UTC(year, month - 1, day));
	const dayNum = d.getUTCDay() || 7; // Pon=1 … Nie=7
	d.setUTCDate(d.getUTCDate() + 4 - dayNum); // najbliższy czwartek
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
	return { year: d.getUTCFullYear(), week };
}

// ── Powiązania między poziomami ──────────────────────────────────────────────

/** Poniedziałek danego tygodnia ISO (UTC). */
function mondayOfISOWeek(year: number, week: number): Date {
	// 4 stycznia zawsze jest w tygodniu 1
	const jan4 = new Date(Date.UTC(year, 0, 4));
	const dow = jan4.getUTCDay() || 7; // Pon=1
	const monday = new Date(jan4);
	monday.setUTCDate(jan4.getUTCDate() - dow + 1 + (week - 1) * 7);
	return monday;
}

/** Zwraca 7 dni (pon–nie) należących do podanego tygodnia ISO. */
export function getDaysInWeek(
	year: number,
	week: number
): DailyNoteInfo[] {
	const monday = mondayOfISOWeek(year, week);
	const days: DailyNoteInfo[] = [];
	for (let i = 0; i < 7; i++) {
		const d = new Date(monday);
		d.setUTCDate(monday.getUTCDate() + i);
		days.push({
			level: 'daily',
			year: d.getUTCFullYear(),
			month: d.getUTCMonth() + 1,
			day: d.getUTCDate(),
		});
	}
	return days;
}

/** Zwraca unikalne tygodnie ISO, które przecinają się z danym miesiącem. */
export function getWeeksInMonth(
	year: number,
	month: number
): WeeklyNoteInfo[] {
	const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
	const seen = new Set<string>();
	const weeks: WeeklyNoteInfo[] = [];
	for (let day = 1; day <= daysInMonth; day++) {
		const { year: wy, week } = getISOWeek(year, month, day);
		const key = `${wy}-W${String(week).padStart(2, '0')}`;
		if (!seen.has(key)) {
			seen.add(key);
			weeks.push({ level: 'weekly', year: wy, week });
		}
	}
	return weeks;
}

/** Zwraca 12 miesięcy danego roku. */
export function getMonthsInYear(year: number): MonthlyNoteInfo[] {
	return Array.from({ length: 12 }, (_, i) => ({
		level: 'monthly',
		year,
		month: i + 1,
	}));
}

// ── Nawigacja w górę hierarchii ──────────────────────────────────────────────

/** Tydzień ISO zawierający podany dzień. */
export function getWeekForDay(info: DailyNoteInfo): WeeklyNoteInfo {
	const { year, week } = getISOWeek(info.year, info.month, info.day);
	return { level: 'weekly', year, week };
}

/** Miesiąc zawierający podany dzień. */
export function getMonthForDay(info: DailyNoteInfo): MonthlyNoteInfo {
	return { level: 'monthly', year: info.year, month: info.month };
}

/** Rok zawierający podany miesiąc lub tydzień. */
export function getYearForMonth(info: MonthlyNoteInfo): YearlyNoteInfo {
	return { level: 'yearly', year: info.year };
}

/** Rok zawierający większość dni danego tygodnia (rok ISO tygodnia). */
export function getYearForWeek(info: WeeklyNoteInfo): YearlyNoteInfo {
	return { level: 'yearly', year: info.year };
}

/** Dzień poprzedzający podany. */
export function getDayBefore(info: DailyNoteInfo): DailyNoteInfo {
	const d = new Date(Date.UTC(info.year, info.month - 1, info.day));
	d.setUTCDate(d.getUTCDate() - 1);
	return { level: 'daily', year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** Dzień następny po podanym. */
export function getDayAfter(info: DailyNoteInfo): DailyNoteInfo {
	const d = new Date(Date.UTC(info.year, info.month - 1, info.day));
	d.setUTCDate(d.getUTCDate() + 1);
	return { level: 'daily', year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** Tydzień poprzedzający podany. */
export function getWeekBefore(info: WeeklyNoteInfo): WeeklyNoteInfo {
	const monday = mondayOfISOWeek(info.year, info.week);
	monday.setUTCDate(monday.getUTCDate() - 7);
	const { year, week } = getISOWeek(monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate());
	return { level: 'weekly', year, week };
}

/** Tydzień następny po podanym. */
export function getWeekAfter(info: WeeklyNoteInfo): WeeklyNoteInfo {
	const monday = mondayOfISOWeek(info.year, info.week);
	monday.setUTCDate(monday.getUTCDate() + 7);
	const { year, week } = getISOWeek(monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate());
	return { level: 'weekly', year, week };
}

/** Miesiąc poprzedzający podany. */
export function getMonthBefore(info: MonthlyNoteInfo): MonthlyNoteInfo {
	const d = new Date(Date.UTC(info.year, info.month - 2, 1));
	return { level: 'monthly', year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

/** Miesiąc następny po podanym. */
export function getMonthAfter(info: MonthlyNoteInfo): MonthlyNoteInfo {
	const d = new Date(Date.UTC(info.year, info.month, 1));
	return { level: 'monthly', year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}
