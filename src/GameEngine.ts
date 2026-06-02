//importy wykorzystanych bilbiotek
import * as fs   from 'fs';
import * as path from 'path';
import * as rl   from 'readline';

//importy naszych enumów/interfaców
import { Scene }        from './interfaces/Scene';
import { PlayerChoice } from './interfaces/PlayerChoice';
import { Item }         from './interfaces/Item';
import { Ending }       from './interfaces/Ending';
import { Player }       from './interfaces/Player';
import { PlayerState }  from './enums/PlayerState';
import { ItemType }     from './enums/ItemType';

// ─── Typy wewnętrzne silnika ──────────────────────────────────────────────────

//interface ze stanem gry
interface GameState {
    player:        Player;
    points:        number;
    visitedScenes: number[];
    sceneHistory:  number[];
    usedChoices:     number[];
}

//intareface z wynikiem gry
interface LeaderboardEntry {
    name:         string;
    points:       number;
    endingTitle:  string;
    date:         string;
}

// ─── ANSI ─────────────────────────────────────────────────────────────────────

//stała tablica kolorów dla gry
const C = {
    reset:   '\x1b[0m',
    bold:    '\x1b[1m',
    dim:     '\x1b[2m',
    cyan:    '\x1b[36m',
    yellow:  '\x1b[33m',
    green:   '\x1b[32m',
    red:     '\x1b[31m',
    magenta: '\x1b[35m',
    gray:    '\x1b[90m',
} as const;

// ─── Ścieżki ──────────────────────────────────────────────────────────────────

const DATA_DIR        = path.join(__dirname, '.', 'gameData');
const SAVES_DIR       = path.join(process.cwd(), 'saves');
const SAVE_FILE       = path.join(SAVES_DIR, 'save.json');
const LEADERBOARD_FILE = path.join(SAVES_DIR, 'leaderboard.json');

// ─── Punktacja ────────────────────────────────────────────────────────────────

const PTS = {
    NEW_SCENE:    10,
    ITEM_PICKUP:  25,
    STATE_EFFECT:  5,
    ENDING_WIN:  100,
    ENDING_LOSE:  50,
    ENDING_OTHER: 75,
} as const;

// ─── Klasa silnika ────────────────────────────────────────────────────────────

export class GameEngine {

    private scenes:  Scene[]        = [];
    private choices: PlayerChoice[] = [];
    private items:   Item[]         = [];
    private endings: Ending[]       = [];
    private state!:  GameState;
    private io!:     rl.Interface; //zmienna z modułem czytania linii

    // ── Inicjalizacja ──────────────────────────────────────────────────────────

    async init(): Promise<void> {
        this.loadData(); //załadowanie danych z folderu gameData
        this.ensureDir(SAVES_DIR); //sprawdza czy jest plik z zapisem stanu gry
        this.io = rl.createInterface({ input: process.stdin, output: process.stdout }); //tworzymy interface w zmiennej io
        this.banner(); //poprostu wypisujemy baner w konsoli
        await this.mainMenu(); // wypisujemy główne menu i pytamy użytkownika o wybór
    }

    private loadData(): void {
        const read = (f: string) =>
            JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8')); // funkcja zczytująca pliki .json
        this.scenes  = read('availableScenes.json');
        this.choices = read('availableChoices.json');
        this.items   = read('availableItems.json');
        this.endings = read('availableEndings.json');
    }

    // ── Menu główne ────────────────────────────────────────────────────────────

    private async mainMenu(): Promise<void> {
        this.hr('═');
        this.line(`${C.cyan}${C.bold}  ZAWADA 22-400 – PRZYGODA TEKSTOWA${C.reset}`);
        this.hr('═');
        this.line('');
        this.line(`  ${C.yellow}1${C.reset}  Nowa gra`);
        this.line(`  ${C.yellow}2${C.reset}  Wczytaj zapis`);
        this.line(`  ${C.yellow}3${C.reset}  Tabela wyników`);
        this.line(`  ${C.yellow}4${C.reset}  Wyjście`);
        this.line('');

        const input = await this.ask('  Wybór: ');
        switch (input.trim()) {
            case '1': await this.newGame();               break; //jeśli użytkownik wprowadził 1 - nowa gra
            case '2': await this.loadGame();              break; //jeśli użytkownik wprowadził 2 - ładuje gre z pliku save.json
            case '3': this.showLeaderboard();
                await this.mainMenu();                    break; //jeśli użytkownik wprowadził 3 - wypisuje tabele wyników i na nowo wypisuje mainMenu
            case '4': this.quit();                        break; //jeśli użytkownik wprowadził 4 - wychodzimy z gry
            default:
                this.err('Niepoprawny wybór.');             // dla niepoprawnego wyboru wyświetlana jest wiadomość i na nowo wypisywane jest mainMenu
                await this.mainMenu();
        }
    }

    // ── Metoda tworząca nową grę ───────────────────────────────────────────────────────────────

    private async newGame(): Promise<void> {
        const raw  = await this.ask('\n  Jak masz na imię, miastowy? ');
        const name = raw.trim() || 'Nieznajomy';

        this.state = {
            player: {
                name,
                states:        [PlayerState.NORMAL],
                inventory:     [],
                currentSceneId: 1,
            },
            points:        0,
            visitedScenes: [],
            sceneHistory:  [],
            usedChoices:   [],
        };

        this.line(`\n${C.green}  Witaj, ${name}. Zawada nie będzie szczęśliwa z tego powodu.${C.reset}\n`);
        await this.navigateToScene(1);
    }

    // ── Zapis / odczyt ─────────────────────────────────────────────────────────

    private save(): void {
        fs.writeFileSync(SAVE_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
        this.line(`\n${C.green}  ✓ Gra zapisana.${C.reset}`);
    }

    private async loadGame(): Promise<void> {
        if (!fs.existsSync(SAVE_FILE)) {
            this.err('Brak zapisanej gry.');
            await this.mainMenu();
            return;
        }
        try {
            this.state = JSON.parse(fs.readFileSync(SAVE_FILE, 'utf-8'));
            this.line(`\n${C.green}  Gra wczytana. Witaj z powrotem, ${this.state.player.name}.${C.reset}\n`);
            await this.navigateToScene(this.state.player.currentSceneId);
        } catch {
            this.err('Plik zapisu jest uszkodzony.');
            await this.mainMenu();
        }
    }

    // ── Główna funkcja rekurencyjna ────────────────────────────────────────────
    //
    //  navigateToScene jest sercem silnika.
    //  Wywołuje się rekurencyjnie przy każdym ruchu gracza:
    //    - przy nowym wyborze   → navigateToScene(choice.nextSceneId)
    //    - przy cofaniu         → navigateToScene(poprzednia scena z historii)
    //    - przy błędnym wejściu → navigateToScene(ta sama scena)
    //
    //  Rekurencja kończy się tylko gdy scene.isEnding === true.

    private async navigateToScene(sceneId: number): Promise<void> {
        const scene = this.scenes.find(s => s.id === sceneId);

        if (!scene) {
            this.err(`Scena ${sceneId} nie istnieje w danych.`);
            return;
        }

        // Aktualizuj pozycję gracza
        this.state.player.currentSceneId = sceneId;

        // Punkty za nową, nieodwiedzoną scenę
        if (!this.state.visitedScenes.includes(sceneId)) {
            this.state.visitedScenes.push(sceneId);
            this.state.points += PTS.NEW_SCENE;
        }

        this.printScene(scene);

        // Jeśli scena jest zakończeniem – koniec rekurencji
        if (scene.isEnding) {
            await this.handleEnding(scene);
            return;
        }

        // Filtruj dostępne wybory na podstawie ekwipunku / stanu gracza
        const available = this.filterChoices(scene);

        if (available.length === 0) {
            this.line(`\n${C.red}  Nie masz tego czego potrzeba, żeby tu działać.${C.reset}`);
            this.line(`${C.gray}  Wpisz [w] żeby się cofnąć lub [i] żeby sprawdzić ekwipunek.${C.reset}`);
        } else {
            this.printChoices(available);
        }

        this.printCommands();

        const input = (await this.ask('\n  > ')).trim().toLowerCase();

        // Obsłuż wejście – tu może nastąpić kolejne wywołanie rekurencyjne
        await this.handleInput(input, sceneId, available);
    }

    // ── Obsługa wejścia gracza ─────────────────────────────────────────────────

    private async handleInput(
        input:     string,
        sceneId:   number,
        available: PlayerChoice[],
    ): Promise<void> {

        // Komendy systemowe
        if (['w', 'wstecz', 'back'].includes(input)) {
            await this.goBack(sceneId);
            return;
        }
        if (['s', 'save', 'zapisz'].includes(input)) {
            this.save();
            await this.navigateToScene(sceneId);   // powrót do tej samej sceny
            return;
        }
        if (['i', 'inv', 'ekwipunek'].includes(input)) {
            this.showInventory();
            await this.navigateToScene(sceneId);
            return;
        }
        if (['l', 'lista', 'wyniki'].includes(input)) {
            this.showLeaderboard();
            await this.navigateToScene(sceneId);
            return;
        }
        if (['q', 'quit', 'wyjdz', 'wyjdź'].includes(input)) {
            this.quit();
            return;
        }

        // Wybór numeryczny
        const num = parseInt(input, 10);

        if (isNaN(num) || num < 1 || num > available.length) {
            this.err(
                available.length > 0
                    ? `Wpisz liczbę od 1 do ${available.length} albo komendę.`
                    : `Wpisz komendę (np. [w] żeby wróćić).`,
            );
            // Rekurencja – ta sama scena, kolejna szansa na input
            await this.navigateToScene(sceneId);
            return;
        }

        const choice = available[num - 1];
        this.applyEffects(choice);

        if (choice.nextSceneId != null) {
            this.state.sceneHistory.push(sceneId);
            // Rekurencja – przechodzimy do następnej sceny
            await this.navigateToScene(choice.nextSceneId);
        } else {
            this.err('Ten wybór nie prowadzi nigdzie (brak nextSceneId).');
            await this.navigateToScene(sceneId);
        }
    }

    // ── Cofanie się ────────────────────────────────────────────────────────────

    private async goBack(currentSceneId: number): Promise<void> {
        if (this.state.sceneHistory.length === 0) {
            this.line(`\n${C.gray}  Nie ma dokąd wracać. Tu się zaczęła Twoja gehenna.${C.reset}`);
            await this.navigateToScene(currentSceneId);
            return;
        }
        const prev = this.state.sceneHistory.pop()!;
        this.line(`\n${C.gray}  Cofasz się...${C.reset}`);
        // Rekurencja – wróć do poprzedniej sceny z historii
        await this.navigateToScene(prev);
    }

    // ── Efekty wyboru ──────────────────────────────────────────────────────────

    private applyEffects(choice: PlayerChoice): void {
        const { player } = this.state;

        if (choice.itemReward && !this.state.usedChoices.includes(choice.id)) {
            const pool = this.items.filter(
                i => i.type === choice.itemReward && !player.inventory.includes(i.id),
            );
            if (pool.length > 0) {
                const item = pool[Math.floor(Math.random() * pool.length)];
                player.inventory.push(item.id);
                this.state.points += PTS.ITEM_PICKUP;
                this.line(`\n${C.green}  + Zdobyto: ${C.bold}${item.name}${C.reset}${C.green}  [${item.type}] +${PTS.ITEM_PICKUP} pkt${C.reset}`);
            }
            this.state.usedChoices.push(choice.id);   // ← oznacz jako użyty
        }

        if (choice.stateEffect && !player.states.includes(choice.stateEffect)) {
            player.states.push(choice.stateEffect);
            this.state.points += PTS.STATE_EFFECT;
            this.line(`\n${C.magenta}  ◆ Nowy stan: ${C.bold}${this.stateLabel(choice.stateEffect)}${C.reset}`);
        }
    }

    // ── Filtrowanie dostępnych wyborów ─────────────────────────────────────────

    private filterChoices(scene: Scene): PlayerChoice[] {
        return scene.choices
            .map(id => this.choices.find(c => c.id === id))
            .filter((c): c is PlayerChoice => c !== undefined)
            .filter(c => {
                // Wymagane typy itemów
                if (c.requiredItems?.length) {
                    const ok = c.requiredItems.every(reqType =>
                        this.state.player.inventory.some(id => {
                            const item = this.items.find(i => i.id === id);
                            return item?.type === reqType;
                        }),
                    );
                    if (!ok) return false;
                }
                // Wymagane stany gracza
                if (c.requiredState?.length) {
                    const ok = c.requiredState.some(s =>
                        this.state.player.states.includes(s),
                    );
                    if (!ok) return false;
                }
                return true;
            });
    }

    // ── Zakończenie gry ────────────────────────────────────────────────────────

    private async handleEnding(scene: Scene): Promise<void> {
        // Bonus punktów zależny od sceny-zakończenia
        const bonusMap: Record<number, number> = { 9: PTS.ENDING_WIN, 10: PTS.ENDING_LOSE };
        this.state.points += bonusMap[scene.id] ?? PTS.ENDING_OTHER;

        // Dobierz pasujące zakończenie z endings.json
        const matched = this.endings.find(e => {
            const stateOk = !e.requiredState?.length ||
                e.requiredState.some(s => this.state.player.states.includes(s));
            const itemOk = !e.requiredItems?.length ||
                e.requiredItems.every(t =>
                    this.state.player.inventory.some(id => {
                        const item = this.items.find(i => i.id === id);
                        return item?.type === t;
                    }),
                );
            return stateOk && itemOk;
        });

        this.line('');
        this.hr('═');
        this.line(`${C.cyan}${C.bold}  KONIEC GRY${C.reset}`);
        this.hr('═');
        this.line('');
        this.line(`${C.bold}  ${matched?.title ?? scene.title}${C.reset}`);
        this.line('');
        this.line(`  ${matched?.description ?? scene.description}`);
        this.line('');
        this.line(`${C.yellow}  Punkty końcowe: ${C.bold}${this.state.points}${C.reset}`);
        this.line('');

        this.addToLeaderboard(matched?.title ?? scene.title);

        // Usuń zapis po ukończeniu
        if (fs.existsSync(SAVE_FILE)) fs.unlinkSync(SAVE_FILE);

        const again = await this.ask('  Zagrać ponownie? (t/n): ');
        if (again.trim().toLowerCase() === 't') {
            await this.mainMenu();
        } else {
            this.line(`\n${C.gray}  Zawada zostanie w pamięci.${C.reset}\n`);
            this.io.close();
            process.exit(0);
        }
    }

    // ── Tabela wyników ─────────────────────────────────────────────────────────

    private addToLeaderboard(endingTitle: string): void {
        let board: LeaderboardEntry[] = [];
        if (fs.existsSync(LEADERBOARD_FILE)) {
            try { board = JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf-8')); } catch { /* */ }
        }
        board.push({
            name: this.state.player.name,
            points: this.state.points,
            endingTitle,
            date: new Date().toLocaleDateString('pl-PL'),
        });
        board.sort((a, b) => b.points - a.points);
        board = board.slice(0, 10);
        fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(board, null, 2), 'utf-8');
    }

    private showLeaderboard(): void {
        this.line('');
        this.hr('─');
        this.line(`${C.cyan}${C.bold}  TABELA WYNIKÓW – TOP 10${C.reset}`);
        this.hr('─');
        this.line('');

        if (!fs.existsSync(LEADERBOARD_FILE)) {
            this.line(`  ${C.gray}Brak wyników. Zagraj i wróć.${C.reset}\n`);
            return;
        }
        try {
            const board: LeaderboardEntry[] =
                JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf-8'));
            if (!board.length) {
                this.line(`  ${C.gray}Brak wyników.${C.reset}\n`);
                return;
            }
            const medals = ['1.', '2.', '3.'];
            board.forEach((e, i) => {
                const rank = medals[i] ?? `${i + 1}.`;
                this.line(
                    `  ${C.bold}${rank.padEnd(4)}${e.name.padEnd(16)}${C.reset}` +
                    `${C.yellow}${String(e.points).padStart(5)} pkt${C.reset}` +
                    `  ${C.gray}${e.endingTitle}  ${e.date}${C.reset}`,
                );
            });
        } catch {
            this.err('Błąd odczytu tabeli.');
        }
        this.line('');
    }

    // ── Ekwipunek ──────────────────────────────────────────────────────────────

    private showInventory(): void {
        const { player } = this.state;
        this.line('');
        this.hr('─');
        this.line(`${C.green}${C.bold}  EKWIPUNEK${C.reset}`);
        this.hr('─');

        if (!player.inventory.length) {
            this.line(`  ${C.gray}Pusto. Typowy start w Zawadzie.${C.reset}`);
        } else {
            player.inventory.forEach(id => {
                const item = this.items.find(i => i.id === id);
                if (!item) return;
                this.line(`  ${C.green}▸ ${C.bold}${item.name}${C.reset}  ${C.gray}[${item.type}]${C.reset}`);
                this.line(`    ${C.dim}${item.description}${C.reset}`);
            });
        }

        this.line('');
        this.line(`${C.magenta}${C.bold}  STANY${C.reset}`);
        player.states.forEach(s => this.line(`  ${C.magenta}◆${C.reset} ${this.stateLabel(s)}`));
        this.line(`\n  ${C.yellow}Punkty: ${C.bold}${this.state.points}${C.reset}\n`);
    }

    // ── Formatowanie konsoli ───────────────────────────────────────────────────

    private banner(): void {
        console.clear();
        this.line(`\n${C.cyan}${C.bold}`);
        this.line('  ╔══════════════════════════════════════╗');
        this.line('  ║   Z A W A D A  –  2 2 - 4 0 0       ║');
        this.line('  ║   Przygoda tekstowa. Gnój wliczony.  ║');
        this.line('  ╚══════════════════════════════════════╝');
        this.line(`${C.reset}`);
    }

    private printScene(scene: Scene): void {
        this.line('');
        this.hr('─');
        this.line(`${C.bold}  ${scene.title}${C.reset}  ${C.gray}[${scene.location}]${C.reset}`);
        this.hr('─');
        this.line('');
        // Zawijanie tekstu opisu co ~80 znaków
        this.wrap(scene.description, 80).forEach(l => this.line(`  ${l}`));
        this.line('');
    }

    private printChoices(available: PlayerChoice[]): void {
        this.line(`${C.yellow}  Co robisz?${C.reset}\n`);
        available.forEach((c, i) => {
            const tags: string[] = [];
            if (c.itemReward)  tags.push(`${C.green}+${c.itemReward}${C.reset}`);
            if (c.stateEffect) tags.push(`${C.magenta}→${c.stateEffect}${C.reset}`);
            const tagStr = tags.length
                ? `  ${C.gray}[${tags.join('  ')}]${C.reset}`
                : '';
            this.line(`  ${C.yellow}${i + 1}${C.reset}. ${c.description}${tagStr}`);
        });
    }

    private printCommands(): void {
        this.line(
            `\n  ${C.gray}Komendy: ` +
            `[w] wstecz  [i] ekwipunek  [s] zapisz  [l] wyniki  [q] wyjdź${C.reset}`,
        );
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private stateLabel(state: PlayerState): string {
        const map: Partial<Record<PlayerState, string>> = {
            [PlayerState.NORMAL]:     `${C.green}Normalny${C.reset}`,
            [PlayerState.INJURED]:    `${C.red}Ranny${C.reset}`,
            [PlayerState.CORRUPTED]:  `${C.yellow}Skażony${C.reset}`,
            [PlayerState.CURSED]:     `${C.magenta}Przeklęty${C.reset}`,
            [PlayerState.DETERMINED]: `${C.cyan}Zdeterminowany${C.reset}`,
        };
        return map[state] ?? String(state);
    }

    /** Proste zawijanie tekstu bez łamania słów */
    private wrap(text: string, maxLen: number): string[] {
        const words = text.split(' ');
        const lines: string[] = [];
        let current = '';
        for (const word of words) {
            if ((current + ' ' + word).trim().length > maxLen) {
                if (current) lines.push(current);
                current = word;
            } else {
                current = (current + ' ' + word).trim();
            }
        }
        if (current) lines.push(current);
        return lines;
    }

    private hr(char: string): void {
        this.line(`  ${C.gray}${char.repeat(48)}${C.reset}`);
    }

    private line(text: string): void {
        console.log(text);
    }

    private err(msg: string): void {
        this.line(`\n${C.red}  ✗ ${msg}${C.reset}`);
    }

    private ensureDir(dir: string): void {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    //metoda która wypisuje pytanie w konsoli i pozwala na wprowadzenie wartości
    private ask(question: string): Promise<string> {
        return new Promise(resolve => this.io.question(question, resolve));
    }

    private quit(): void {
        this.line(`\n${C.gray}  Zawada patrzy za Tobą z pretensją.${C.reset}\n`);
        this.io.close();
        process.exit(0);
    }
}