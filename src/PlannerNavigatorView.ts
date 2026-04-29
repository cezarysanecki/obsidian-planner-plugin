import { ItemView, WorkspaceLeaf } from 'obsidian';
import {
	parseNoteName,
	NoteInfo,
	DailyNoteInfo,
	WeeklyNoteInfo,
	MonthlyNoteInfo,
	YearlyNoteInfo,
	GoalsNoteInfo,
	getDailyNotePath,
	getWeeklyNotePath,
	getMonthlyNotePath,
	getYearlyNotePath,
	getDaysInWeek,
	getWeeksInMonth,
	getMonthsInYear,
	getWeekForDay,
	getYearForMonth,
	getDayBefore,
	getDayAfter,
	getWeekBefore,
	getWeekAfter,
	getMonthBefore,
	getMonthAfter,
	YEARLY_FOLDER,
	GOALS_FOLDER,
} from './noteParser';

export const PLANNER_VIEW_TYPE = 'planner-navigator';

const WEEKDAY_NAMES = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
const MONTH_NAMES = [
	'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
	'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];

export class PlannerNavigatorView extends ItemView {

	getViewType(): string {
		return PLANNER_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Planner';
	}

	getIcon(): string {
		return 'calendar-days';
	}

	async onOpen(): Promise<void> {
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => this.refresh())
		);
		this.refresh();
	}

	async onClose(): Promise<void> {}

	private refresh(): void {
		const file = this.app.workspace.getActiveFile();
		if (!file) { this.render(null); return; }

		if (file.path.startsWith(GOALS_FOLDER)) {
			this.render({ level: 'goals', name: file.basename });
			return;
		}

		this.render(parseNoteName(file.basename));
	}

	private render(info: NoteInfo | null): void {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();

		if (!info) {
			container.createEl('p', {
				text: 'Otwórz notatkę planera.',
				cls: 'planner-empty',
			});
			return;
		}

		switch (info.level) {
			case 'goals':   this.renderGoals(container, info);   break;
			case 'daily':   this.renderDaily(container, info);   break;
			case 'weekly':  this.renderWeekly(container, info);  break;
			case 'monthly': this.renderMonthly(container, info); break;
			case 'yearly':  this.renderYearly(container, info);  break;
		}
	}

	// ── Goals ────────────────────────────────────────────────────────────────

	private renderGoals(el: HTMLElement, _info: GoalsNoteInfo): void {
		const years = this.app.vault.getFiles()
			.filter(f => f.path.startsWith(YEARLY_FOLDER))
			.map(f => parseNoteName(f.basename))
			.filter((i): i is import('./noteParser').YearlyNoteInfo => i?.level === 'yearly')
			.sort((a, b) => a.year - b.year);

		this.renderSection(el, 'Lata',
			years.map(y => ({
				label: String(y.year),
				path: getYearlyNotePath(y.year),
			}))
		);
	}

	// ── Daily ────────────────────────────────────────────────────────────────

	private renderDaily(el: HTMLElement, info: DailyNoteInfo): void {
		const week = getWeekForDay(info);
		const prev = getDayBefore(info);
		const next = getDayAfter(info);

		const fmt = (d: DailyNoteInfo) =>
			`${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;

		this.renderSection(el, 'Tydzień', [
			{
				label: `${week.year}-W${String(week.week).padStart(2, '0')}`,
				path: getWeeklyNotePath(week.year, week.week),
			},
		]);

		this.renderSection(el, 'Sąsiednie dni', [
			{ label: `← ${fmt(prev)}`, path: getDailyNotePath(prev.year, prev.month, prev.day) },
			{ label: `→ ${fmt(next)}`, path: getDailyNotePath(next.year, next.month, next.day) },
		]);
	}

	// ── Weekly ───────────────────────────────────────────────────────────────

	private renderWeekly(el: HTMLElement, info: WeeklyNoteInfo): void {
		const days = getDaysInWeek(info.year, info.week);
		const prev = getWeekBefore(info);
		const next = getWeekAfter(info);

		const months = [...new Map(
			days.map(d => [`${d.year}-${d.month}`, d])
		).values()];

		this.renderSection(el, 'Miesiąc',
			months.map(d => ({
				label: `${MONTH_NAMES[d.month - 1]} ${d.year}`,
				path: getMonthlyNotePath(d.year, d.month),
			}))
		);

		const fmtW = (w: WeeklyNoteInfo) =>
			`${w.year}-W${String(w.week).padStart(2, '0')}`;

		this.renderSection(el, 'Sąsiednie tygodnie', [
			{ label: `← ${fmtW(prev)}`, path: getWeeklyNotePath(prev.year, prev.week) },
			{ label: `→ ${fmtW(next)}`, path: getWeeklyNotePath(next.year, next.week) },
		]);

		this.renderSection(
			el,
			'Dni tygodnia',
			days.map((d, i) => ({
				label: `${WEEKDAY_NAMES[i]}  ${d.day}.${String(d.month).padStart(2, '0')}`,
				path: getDailyNotePath(d.year, d.month, d.day),
			}))
		);
	}

	// ── Monthly ──────────────────────────────────────────────────────────────

	private renderMonthly(el: HTMLElement, info: MonthlyNoteInfo): void {
		const year  = getYearForMonth(info);
		const weeks = getWeeksInMonth(info.year, info.month);
		const prev  = getMonthBefore(info);
		const next  = getMonthAfter(info);

		this.renderSection(el, 'Rok', [
			{ label: String(year.year), path: getYearlyNotePath(year.year) },
		]);

		this.renderSection(el, 'Sąsiednie miesiące', [
			{ label: `← ${MONTH_NAMES[prev.month - 1]} ${prev.year}`, path: getMonthlyNotePath(prev.year, prev.month) },
			{ label: `→ ${MONTH_NAMES[next.month - 1]} ${next.year}`, path: getMonthlyNotePath(next.year, next.month) },
		]);

		this.renderSection(
			el,
			'Tygodnie',
			weeks.map(w => ({
				label: `${w.year}-W${String(w.week).padStart(2, '0')}`,
				path: getWeeklyNotePath(w.year, w.week),
			}))
		);
	}

	// ── Yearly ───────────────────────────────────────────────────────────────

	private renderYearly(el: HTMLElement, info: YearlyNoteInfo): void {
		const goalsFiles = this.app.vault.getFiles()
			.filter(f => f.path.startsWith(GOALS_FOLDER))
			.sort((a, b) => a.basename.localeCompare(b.basename));

		if (goalsFiles.length > 0) {
			this.renderSection(el, 'Cele',
				goalsFiles.map(f => ({
					label: f.basename,
					path: f.path.replace(/\.md$/, ''),
				}))
			);
		}

		const months = getMonthsInYear(info.year);

		this.renderSection(
			el,
			'Miesiące',
			months.map(m => ({
				label: MONTH_NAMES[m.month - 1],
				path: getMonthlyNotePath(m.year, m.month),
			}))
		);
	}

	// ── Helpers ──────────────────────────────────────────────────────────────

	private renderSection(
		el: HTMLElement,
		title: string,
		items: { label: string; path: string }[]
	): void {
		el.createEl('h4', { text: title, cls: 'planner-section-title' });
		const list = el.createEl('ul', { cls: 'planner-list' });

		for (const item of items) {
			const li = list.createEl('li');
			const a  = li.createEl('a', { text: item.label, cls: 'planner-link' });
			a.addEventListener('mousedown', (e) => {
				e.preventDefault();
				this.app.workspace.openLinkText(item.path, '', false);
			});
		}
	}
}
