# panel-lyric
## ⚠️ WARNING
Since I'm quite new to JavaScript, this fork is for experimental purpose only, which may contains some serious bugs.

Instead of displaying the lyric of playing songs on the desktop, it displays the lyric on the top panel.

>很多歌消失了。 —— *汪曾祺 《徙》*<br>
[![license]](/LICENSE)
<br>

![lyric](https://raw.githubusercontent.com/mechtifs/panel-lyric/main/assets/lyric.png)

## Installation

### Manual

The latest and supported version should only work on the most current stable version of GNOME Shell.

```bash
git clone https://github.com/tuberry/desktop-lyric.git && cd desktop-lyric
make && make install
# make LANG=your_language_code mergepo # for translation
```

For older versions, it's necessary to switch the git tag before `make`:

```bash
# git tag # to see available versions
git checkout your_gnome_shell_version
```

### E.G.O

[<img src="https://raw.githubusercontent.com/andyholmes/gnome-shell-extensions-badge/master/get-it-on-ego.svg?sanitize=true" alt="Get it on GNOME Extensions" height="100" align="middle">][EGO]


## Features

![settings](https://raw.githubusercontent.com/mechtifs/panel-lyric/main/assets/settings.png)


## Note

* Maybe less CPU usage;
* The missing lyrics will be downloaded from [NetEase];
* The lyric ([LRC] format) filename format is `Title-Artist1,Artist2.lrc`;
* Draw at an even pace so that exact synchronization with the song is impossible;

## Acknowledgements

* [lyrics-finder]: online lyrics
* [osdlyrics]: some names

[license]:https://img.shields.io/badge/license-GPLv3-green.svg
[LRC]:https://en.wikipedia.org/wiki/LRC_(file_format)
[NetEase]:http://music.163.com/
[lyrics-finder]:https://github.com/TheWeirdDev/lyrics-finder-gnome-ext
[osdlyrics]:https://github.com/osdlyrics/osdlyrics
[EGO]:https://extensions.gnome.org/extension/4006/desktop-lyric/
