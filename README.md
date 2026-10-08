# webradio

Browser version of aautoradio. It plays the stations in `stations.tsv` on this machine and on other devices on the same network.

## Run

```bash
npm install
npm start
```

Vite prints a Network address, for example `http://192.168.1.20:5173`. Open that from a phone or another computer on the LAN. The tab keeps playing while it stays open.

Favorites, the last station, volume, theme, and the equalizer are saved in that browser. Edit `stations.tsv` (`name`, `url`, `genre`, `favorite` of `0` or `1`, separated by tabs) and refresh to change the list.

`npm test` checks the station list and the equalizer curve. `npm run build` then `npm run preview` serves the production build at `http://localhost:5173/`.

The public site is [https://josebaperu.github.io/radioWeb/](https://josebaperu.github.io/radioWeb/). `npm run build` writes the bundle into `assets/`. Commit that folder with your changes and push `main`. GitHub Pages serves those files.
