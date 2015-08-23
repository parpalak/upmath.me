#S2 LaTeX Renderer

Source of the [LaTeX equations for web](http://tex.s2cms.com) service.

##Requirements

1. [TeX Live](https://www.tug.org/texlive/quickinstall.html).
1. `npm`, `bower`, `grunt-cli`. Make the following symlink on Debian: `root:/usr/bin# ln -s nodejs node`.
1. `ghostscript` (used internally in `dvisvgm`).
1. Utilities: `rsvg-convert`, `optipng`, `pngout`. Install or modify the code to disable PNG support.

##Installation

Deploy files:
```
git clone git@github.com:parpalak/tex.s2cms.ru.git
npm install
composer install
bower install
grunt
```

Create site config:
```
cp config.php.dist config.php
mcedit config.php # specify the LaTeX bin dir and other paths
```

Set up the host:
```
sudo cp nginx.conf.dist /etc/nginx/sites-available/tex.s2cms.ru
sudo mcedit /etc/nginx/sites-available/tex.s2cms.ru
```
