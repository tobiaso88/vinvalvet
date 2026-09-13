# Winefinder

En privat, svensk vinkällare med visuella hyllor, flaskhistorik, etikettläsning och matmatchning. Byggd med Laravel 13, Inertia 3, React 19, TypeScript och Tailwind CSS 4. Vintyp, fyllighet, flaskstatus och händelsetyp använder PHP-enums.

## Lokal installation

Du behöver PHP 8.4 med PDO MySQL, GD och EXIF, Composer 2, Node.js 22 eller senare och MySQL 8. Laravel Boost ingår som utvecklingsberoende och installerades efter Laravel, före domän- och gränssnittsutvecklingen.

1. Kör `composer install` och `npm ci` i projektmappen.
2. Kopiera `.env.example` till `.env` om du inte redan har en miljöfil. Behåll befintlig `.env` vid uppdateringar.
3. Skapa en tom MySQL-databas `winefinder` med `utf8mb4` och konfigurera `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME` och `DB_PASSWORD` i `.env`.
4. Kör `php artisan key:generate` endast vid första installationen. Byt inte nyckel i en befintlig installation.
5. Kör `php artisan migrate --no-interaction`.
6. Boosts instruktioner finns i `AGENTS.md`, skills i `.agents/skills` och MCP-konfiguration i `.codex/config.toml`. Vid installation i en annan editor kan `php artisan boost:install` konfigurera dess anslutning. `php artisan boost:mcp` startar servern via stdio och väntar på editoranslutningen.
7. Skapa ditt konto med `php artisan winefinder:create-user`. Dialogen ber om namn, e-post och ett dolt lösenord på minst 12 tecken.
8. Starta med `composer run dev` och använd adressen som Laravel-servern skriver ut. Alternativt: kör `npm run build` och `php artisan serve` utan Vites utvecklingsserver.

Publik registrering och e-postbaserad lösenordsåterställning är avstängda. Driftansvarig återställer lösenord med `php artisan winefinder:reset-password`; befintliga databassessioner avslutas samtidigt.

## Demodata

`php artisan db:seed --class=WinefinderDemoSeeder --no-interaction` skapar ett separat demokonto med sex fiktiva viner, 19 flaskor och två hyllor. Det slumpade lösenordet visas en gång i terminalen. Om demokontot redan finns lämnas det oförändrat. Använd återställningskommandot om du behöver ett nytt lösenord. Seedern får bara köras lokalt eller i testmiljö.

## AI och privata bilder

Ange `OPENAI_API_KEY` i `.env` för etikettläsning och matmatchning. `OPENAI_MODEL` är konfigurerbar och har standardvärdet `gpt-5.4-mini`. Nyckeln används endast på servern. Kör `php artisan config:clear` om konfiguration tidigare har cachats.

Etikettläsning skickar bilden till OpenAI först när du väljer **Läs etiketten**. Resultatet måste granskas innan vinet sparas. Matmatchning skickar maträtten och metadata om ditt tillgängliga lager, inte etikettbilder. Båda använder Responses API, strikt JSON-schema, `store: false` och 30 sekunders timeout. Begränsningen är fem skanningar respektive tio matmatchningar per användare och minut. Anrop kan medföra kostnader hos OpenAI.

Utan API-nyckel fungerar den manuella lagerhanteringen fortfarande. AI-funktionerna ger då ett begripligt fel. Automatiska tester använder simulerade AI-svar; faktisk modellåtkomst och bildtolkning behöver även provas med din egen nyckel.

Bilder lagras privat under `storage/app/private` och nås via en ägarskapskontrollerad route. JPEG, PNG och WebP stöds, högst 10 MB; sparade bilder orienteras och skalas till högst 2048 px. Någon publik storage-länk behövs inte. Säkerhetskopiera databasen, den privata bildlagringen och `.env` tillsammans.

## Tester och kodkvalitet

Skapa en separat MySQL-databas `winefinder_test`. PHP-testerna använder detta namn via `phpunit.xml`, med anslutningsuppgifter från miljön. **Testdatabasen töms av testerna; använd den aldrig för ditt riktiga lager.**

```sh
php artisan test --compact
npm run check
npx eslint .
npm run format:check
vendor/bin/pint --format agent
```

`npm run check` kör TypeScript-kontroll, React-komponenttester och produktionsbygge. `npm run format` formaterar frontendkoden. Pint formaterar PHP. I ett Git-repository kan Pint begränsas till ändringar med `--dirty`.

Webbläsartesterna körs med `npm run test:browser` efter ett frontendbygge. De använder installerad Google Chrome, en separat server på port 8098 och den separata databasen `winefinder_browser_test`, som skapas och töms automatiskt. Den lokala MySQL-testanslutningen är för närvarande `root` utan lösenord på `127.0.0.1:3306`; anpassa testkonfigurationen vid annan anslutning. Kör inte flera webbläsartestsviter samtidigt mot samma databas. Testerna använder ingen OpenAI-nyckel.

Desktop- och mobilflödena kontrollerar inloggning, hyllor, placering, flytt, konsumtion, vinformulär, sökning, AI-felhantering, aktivitet och konto. Skärmbilder hamnar i `storage/app/testing`; Playwright sparar spår vid fel i `test-results`.

## Avgränsning

Varje konto äger sin privata samling. En plats rymmer en flaska; konsumerade och borttagna flaskor behålls i historiken men frigör sin plats. Delade hushåll, externa vinkataloger och produktionshosting ingår inte. Lokal drift behöver varken Redis eller köarbetare.
