"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function showSplashScreen() {
    // Kody ANSI do kolorowania konsoli w terminalu
    const red = "\x1b[31m";
    const dim = "\x1b[2m";
    const reset = "\x1b[0m";
    const bold = "\x1b[1m";
    console.clear();
    console.log(red + bold + `
    ███████╗ █████╗ ██╗    ██╗ █████╗ ██████╗  █████╗ 
    ╚══███╔╝██╔══██╗██║    ██║██╔══██╗██╔══██╗██╔══██╗
      ███╔╝ ███████║██║ █╗ ██║███████║██║  ██║███████║
     ███╔╝  ██╔══██║██║███╗██║██╔══██║██║  ██║██╔══██║
    ███████╗██║  ██║╚███╔███╔╝██║  ██║██████╔╝██║  ██║
    ╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝
` + reset);
    console.log(dim + "                          K O D   P O C Z T O W Y :   2 2 - 4 0 0\n" + reset);
    console.log(dim + "===============================================================================");
    console.log("   Prąd wysiadł o 21:03. Chwilę później umarły telefony.");
    console.log("   Sąsiedzi zamknęli drzwi na klucz, a psy przestały szczekać.");
    console.log("   Coś przyszło z Lasu Żaluże i zadomowiło się w ciemności.");
    console.log("   ");
    console.log("   Pamiętaj: Każda decyzja ma znaczenie. Niektóre błędy bolą tylko raz.");
    console.log("===============================================================================\n" + reset);
    console.log("Naciśnij [ENTER], aby otworzyć oczy...");
}
showSplashScreen();
