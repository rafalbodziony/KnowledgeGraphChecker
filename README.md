# KnowledgeGraphChecker

# !! Wersja deweloperska - nie działa na produkcji !!

Aplikacja do wizualizacji grafów z plików JSON, wykorzystująca biblioteki [Sigma.js](https://www.sigmajs.org/) oraz [Graphology](https://graphology.github.io/).

## Funkcje

- **Automatyczne pobieranie plików** z katalogu `sources` i generowanie wizualizacji w katalogu `graphs`. Przetworzone pliki są zapisywane w mini bazie danych (`processed.txt`), aby nie były przetwarzane ponownie.
- **Wyświetlanie węzłów i krawędzi niepołączonych** – umożliwia wizualną weryfikację poprawności grafu.
- **Filtrowanie węzłów i krawędzi** na podstawie właściwości (np. typ węzła, waga krawędzi).
- **Manipulacja widokiem grafu**: zoomowanie, przesuwanie, obracanie, drag'n'drop.
- **Podświetlanie powiązań** po kliknięciu na węzeł.
- **Konfigurowalny wygląd grafu** – stylowanie kolorami, rozmiarami, etykietami poprzez plik konfiguracyjny.
- **Performance showcase** – wybór liczby węzłów, krawędzi, klastrów.

## Instalacja

1. Sklonuj repozytorium.
2. Zainstaluj zależności:
   ```
   npm install
   ```
3. Umieść pliki grafów w katalogu `sources`.

## Uruchomienie

1. Uruchom aplikację:
   ```
   npm start
   ```
2. Wynikowe pliki HTML znajdziesz w katalogu `graphs`.

## Przykładowy plik

W katalogu `sources` znajduje się przykładowy plik `kreatyna-final.json`. Wymaga on niestandardowego mapowania węzłów i krawędzi – szczegóły znajdziesz w dokumentacji projektu.

## Dokumentacja

- [Sigma.js docs](https://www.sigmajs.org/docs/)
- [Graphology docs](https://graphology.github.io/docs/)

## Licencja
