# Obsidian Planner Plugin - Plan implementacji

## Struktura plików (potwierdzona)

| Folder                    | Poziom  | Nazewnictwo   | Przykład     |
|---------------------------|---------|---------------|--------------|
| `00 Planer/01 Dziennik/`  | Dzień   | `YYYY-MM-DD`  | `2024-01-15` |
| `00 Planer/02 Tygodnie/`  | Tydzień | `YYYY-W{n}`   | `2024-W3`    |
| `00 Planer/03 Miesiące/`  | Miesiąc | `YYYY-MM`     | `2024-01`    |
| `00 Planer/04 Lata/`      | Rok     | `YYYY`        | `2024`       |
| `00 Planer/08 Cele/`      | Cele    | `3 poziomy`   | (może się zmienić) |

## UI

- **Panel boczny** (sidebar) — dedykowany widok nawigacyjny
- Wtyczka **tworzy notatki**, jeśli nie istnieją

## Funkcje do zaimplementowania

### 1. Panel boczny (PlannerNavigatorView)
- Widok hierarchiczny aktualnie otwartej notatki
- Pokazuje kontekst: np. jeśli otwarta jest notatka tygodniowa, pokazuje dni tego tygodnia
- Linki do notatek na poziomie wyżej i niżej w hierarchii

### 2. Szybka nawigacja
- Przycisk **"Dzisiaj"** — otwiera/tworzy dzisiejszą notatkę dzienną
- Przycisk **"Poprzedni dzień"** — otwiera/tworzy notatkę z wczoraj

### 3. Logika dat i nazw plików
- Parsowanie nazwy pliku → wykrywanie poziomu (dzień/tydzień/miesiąc/rok)
- Obliczanie powiązanych notatek (np. które dni należą do danego tygodnia)
- Generowanie ścieżek do notatek na każdym poziomie

### 4. Tworzenie notatek
- Jeśli notatka nie istnieje — utwórz ją (opcjonalnie z szablonem)

## Etapy implementacji

- [x] **Etap 1** — Szkielet wtyczki (TypeScript, manifest, główna klasa pluginu)
- [x] **Etap 2** — Logika parsowania dat i wykrywania poziomu notatki (`src/noteParser.ts`)
  - `parseNoteName(basename)` → NoteInfo (daily/weekly/monthly/yearly)
  - `getISOWeek`, `getDaysInWeek`, `getWeeksInMonth`, `getMonthsInYear`
  - `getDailyNotePath`, `getWeeklyNotePath`, `getMonthlyNotePath`, `getYearlyNotePath`
  - Nawigacja w górę: `getWeekForDay`, `getMonthForDay`, `getYearForMonth`, `getYearForWeek`
- [x] **Etap 3** — Panel boczny (`PlannerNavigatorView`)
  - Rejestracja widoku w sidebarze
  - Nasłuchiwanie na zmianę aktywnego pliku (`workspace.on('active-leaf-change')`)
  - `parseNoteName` → wykrycie poziomu → wyrenderowanie listy powiązanych notatek
  - Klik w link → `getDailyNotePath` / `getWeeklyNotePath` / ... → otwarcie pliku
- [ ] **Etap 4** — Przyciski "Dzisiaj" i "Poprzedni dzień"
  - Ribbon icon lub przyciski w panelu bocznym
  - Obliczenie daty → `getDailyNotePath` → otwarcie/utworzenie notatki
- [ ] **Etap 5** — Tworzenie notatek na żądanie
  - Jeśli plik nie istnieje → `vault.create(path, '')` (opcjonalnie z szablonem)
- [ ] **Etap 6** — Testy i dopracowanie UX
