import { GameEngine } from './GameEngine';

//inicjalizacja silnika (obiektu)
const engine = new GameEngine();

//uruchomienie silnika (w przypadku błedu wyświetlana jest informacja o błędzie)
engine.init().catch(err => {
    console.error('\x1b[31m  Silnik padł:\x1b[0m', err);
    process.exit(1);
});