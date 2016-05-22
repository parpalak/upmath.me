# Math Online Editor

This editor is designed for writing math texts for the web. It converts the Markdown syntax extended with latex equations support into HTML code you can use anywhere in the web.

![Latex](//tex.s2cms.ru/i/latex.jpg)

## Markdown

Definition from [Wikipedia](https://en.wikipedia.org/wiki/Markdown):

> Markdown is a lightweight markup language with plain text formatting syntax designed so that it can be converted to HTML and many other formats using a tool by the same name. Markdown is often used to format readme files, for writing messages in online discussion forums, and to create rich text using a plain text editor.

The main idea of Markdown is to use simple plain text markup. It's ~~hard~~ easy to __make__ **bold** _or_ *italic* text. Simple equations can be formatted with subscripts and superscripts: *E*~0~=*mc*^2^. I have added the LaTeX syntax support: $$E_0=mc^2$$.

Among Markdown features are:

* code: `untouched equation source is *E*~0~=*mc*^2^`
* images (see above);
* links: [service main page](/ "link title");
* unordered lists--when a line starts with `+`, `-`, or `*`;
  1. sub-lists
  1. and ordered lists;
* direct use <nobr>of HTML</nobr>&ndash;for <span style="color: red">anything else</span>. 

Also the editor supports typographic replacements: (c) (r) (tm) (p) +- !!!!!! ???? ,,  -- ---

## LaTeX

The editor converts LaTeX equations in double-dollars `$$`: $$ax^2+bx+c=0$$. All equations are rendered as block equations. If you need inline ones, you can add the prefix `\inline`: $$\inline p={1\over q}$$. But it is a good practice to place big equations on separate lines:

$$x_{1,2} = {-b\pm\sqrt{b^2 - 4ac} \over 2a}.$$

In this case the LaTeX syntax will be highlighted in the source code. You can even add equation numbers (unfortunately there is no automatic numbering and refs support):

$$|\vec{A}|=\sqrt{A_x^2 + A_y^2 + A_z^2}.$$(1)

It is possible to write Cyrillic symbols in `\text` command: $$Q_\text{плавления}>0$$.

One can use matrices:

$$T^{\mu\nu}=\begin{pmatrix}
\varepsilon&0&0&0\\
0&\varepsilon/3&0&0\\
0&0&\varepsilon/3&0\\
0&0&0&\varepsilon/3
\end{pmatrix},$$

integrals:

$$P_\omega={n_\omega\over 2}\hbar\omega\,{1+R\over 1-v^2}\int\limits_{-1}^{1}dx\,(x-v)|x-v|.$$

cool tikz-pictures:

$$\usetikzlibrary{decorations.pathmorphing}
\begin{tikzpicture}[line width=0.2mm,scale=1.0545]\small
\tikzset{>=stealth}
\tikzset{snake it/.style={->,semithick,
decoration={snake,amplitude=.3mm,segment length=2.5mm,post length=0.9mm},decorate}}
\def\h{3}
\def\d{0.2}
\def\ww{1.4}
\def\w{1+\ww}
\def\p{1.5}
\def\r{0.7}
\coordinate[label=below:$A_1$] (A1) at (\ww,\p);
\coordinate[label=above:$B_1$] (B1) at (\ww,\p+\h);
\coordinate[label=below:$A_2$] (A2) at (\w,\p);
\coordinate[label=above:$B_2$] (B2) at (\w,\p+\h);
\coordinate[label=left:$C$] (C1) at (0,0);
\coordinate[label=left:$D$] (D) at (0,\h);
\draw[fill=blue!14](A2)--(B2)-- ++(\d,0)-- ++(0,-\h)--cycle;
\draw[gray,thin](C1)-- +(\w+\d,0);
\draw[dashed,gray,fill=blue!5](A1)-- (B1)-- ++(\d,0)-- ++(0,-\h)-- cycle;
\draw[dashed,line width=0.14mm](A1)--(C1)--(D)--(B1);
\draw[snake it](C1)--(A2) node[pos=0.6,below] {$c\Delta t$};
\draw[->,semithick](\ww,\p+0.44*\h)-- +(\w-\ww,0) node[pos=0.6,above] {$v\Delta t$};
\draw[snake it](D)--(B2);
\draw[thin](\r,0) arc (0:atan2(\p,\w):\r) node[midway,right,yshift=0.06cm] {$\theta$};
\draw[opacity=0](-0.40,-0.14)-- ++(0,5.06);
\end{tikzpicture}$$

graphs:

$$\begin{tikzpicture}\small
\def\aa{1.5}
\def\ab{0.3}
\def\ac{-0.5}
\begin{axis}[legend pos=south east,mark size=1,samples=2,
	restrict y to domain=-8:8,
	width=12cm, height=250pt,
	xmin=-10.5, xmax=10.5,
	ytick={-6,-3,...,6},
	xtick={-9.4247,-3.1416,...,10},
	xticklabels={$-{3\pi}$,$-{\pi}$,${\pi}$,${3\pi}$},
	axis x line=center,
	axis y line=center,
	xlabel=$k$]
\addplot[blue!70!black,domain=-9.4247:9.4247,semithick,samples=802]{tan(deg(x/2))};
\addplot[red]{\aa*x};
\addplot[green!70!black,domain=-9.4247:9.4247]{\ab*x};
\addplot[olive,domain=-9.4247:9.4247]{\ac*x};
\addplot[mark=*] coordinates {(2.65,3.97)} node[anchor=west]{$A$};
\addplot[mark=*] coordinates {(8.69,2.61)} node[anchor=west]{$B$};
\addplot[mark=*] coordinates {(4.06,-2.03)} node[anchor=west]{$C$};
\legend{$\tan k/2$,$\aa\,k$,$\ab\,k$,$\ac\,k$}
\end{axis}
\end{tikzpicture}$$

and [the rest of LaTeX features](https://en.wikibooks.org/wiki/LaTeX/Mathematics).

## About MarkDown & LaTeX Online Editor

It works in browsers, except equations rendered on the server. The editor stores your text in browser to prevent the loss of your work in case of software or hardware failures.

I have designed and developed this lightweight editor and the service for converting LaTeX equations into svg-pictures to make publishing math texts on the web easy. I consider client-side rendering, the rival technique implemented in [MathJax](https://www.mathjax.org/), to be too limited and resource-consuming, especially on mobile devices.

The source code is [published at Github](https://github.com/parpalak/tex.s2cms.ru) under MIT license.

***

Now you can erase this instruction and start writing a scientific post. If you want to see the instruction again, open the editor in a private tab, different browser or download and clear your post and refresh the page.

Have a nice day :)

[Roman Parpalak](https://written.ru/), web developer.