#S2 LaTeX Renderer

Service for generating nice [SVG pictures from LaTeX equations](https://tex.s2cms.com) for web and [Markdown & LaTeX Online Editor](https://tex.s2cms.ru/page/).

##Requirements

1. [TeX Live](https://www.tug.org/texlive/quickinstall.html). I prefer full installation andd write18 disabled.
1. `nginx` web server with [ngx_http_lua_module](https://github.com/openresty/lua-nginx-module) (for example, [nginx-extras Debian package](https://packages.debian.org/search?searchon=names&keywords=nginx-extras)).
1. `php-fpm`. Add the TeX bin directory (e.g. '/home/tex/tl-2016/bin/x86_64-linux') to the PHP PATH environment variable. Otherwise there can be floating bugs with generating font files.
1. Node.js and frontend building tools: `npm`, `bower`, `grunt-cli`. Make the following symlink on Debian: `root:/usr/bin# ln -s nodejs node`.
1. `ghostscript` (used internally by `dvisvgm` TeX component).
1. Utilities: `rsvg-convert`, `optipng`, `pngout`. Install them or modify the code to disable PNG support.

##Installation

Deploy files:
```
git clone git@github.com:parpalak/tex.s2cms.ru.git
cd tex.s2cms.ru
npm install
composer install
bower install
grunt
```

Create the site config file:
```
cp config.php.dist config.php
mcedit config.php # specify the LaTeX bin dir and other paths
```

Set up the host:
```
sudo cp nginx.conf.dist /etc/nginx/sites-available/tex.s2cms.ru
sudo mcedit /etc/nginx/sites-available/tex.s2cms.ru
```
