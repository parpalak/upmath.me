#S2 LaTeX Renderer

Source of the [LaTeX equations for web](http://tex.s2cms.com) service.

##Installation

1. Install [TeX Live](https://www.tug.org/texlive/quickinstall.html).
1. Install the following utilities: `rsvg-convert`, `optipng`, `pngout`. Or modify the code to disable PNG support.
1. Deploy files:
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
