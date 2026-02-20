import { ItemView, WorkspaceLeaf } from 'obsidian';
import {
	parseNoteName,
	NoteInfo,
	DailyNoteInfo,
	WeeklyNoteInfo,
	MonthlyNoteInfo,
	YearlyNoteInfo,
	getDailyNotePath,
	getWeeklyNotePath,
	getMonthlyNotePath,
	getYearlyNotePath,
	getDaysInWeek,
	getWeeksInMonth,
	getMonthsInYear,
	getWeekForDay,
	getMonthForDay,
	getYearForMonth,
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
		const info = file ? parseNoteName(file.basename) : null;
		this.render(info);
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
			case 'daily':   this.renderDaily(container, info);   break;
			case 'weekly':  this.renderWeekly(container, info);  break;
			case 'monthly': this.renderMonthly(container, info); break;
			case 'yearly':  this.renderYearly(container, info);  break;
		}
	}

	// ── Daily ────────────────────────────────────────────────────────────────

	private renderDaily(el: HTMLElement, info: DailyNoteInfo): void {
		const week  = getWeekForDay(info);
		const month = getMonthForDay(info);

		this.renderSection(el, 'Tydzień', [
			{
				label: `${week.year}-W${week.week}`,
				path: getWeeklyNotePath(week.year, week.week),
			},
		]);

		this.renderSection(el, 'Miesiąc', [
			{
				label: `${MONTH_NAMES[month.month - 1]} ${month.year}`,
				path: getMonthlyNotePath(month.year, month.month),
			},
		]);
	}

	// ── Weekly ───────────────────────────────────────────────────────────────

	private renderWeekly(el: HTMLElement, info: WeeklyNoteInfo): void {
		const days = getDaysInWeek(info.year, info.week);

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

		this.renderSection(el, 'Rok', [
			{ label: String(year.year), path: getYearlyNotePath(year.year) },
		]);

		this.renderSection(
			el,
			'Tygodnie',
			weeks.map(w => ({
				label: `${w.year}-W${w.week}`,
				path: getWeeklyNotePath(w.year, w.week),
			}))
		);
	}

	// ── Yearly ───────────────────────────────────────────────────────────────

	private renderYearly(el: HTMLElement, info: YearlyNoteInfo): void {
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
