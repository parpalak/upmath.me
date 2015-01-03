<?php
/**
 * Equation samples for the main page.
 *
 * @copyright 2014-2015 Roman Parpalak
 * @license   http://www.opensource.org/licenses/mit-license.php MIT
 * @package   S2 Latex Service
 * @link      http://tex.s2cms.ru
 */

$samples = array();

$samples['integrals'] = <<<'TEX'
\boxed{
  \int\limits_{-\infty}^{\infty}
  e^{-x^2} \, dx = \sqrt{\pi}
}
TEX;

$samples['limits'] = <<<'TEX'
\gamma \overset{def}{=}
\lim\limits_{n \to \infty} \left(
  \sum\limits_{k=1}^n {1 \over k} - \ln n
\right) \approx 0.577
TEX;

$samples['chains'] = <<<'TEX'
e = 2 + \cfrac{1}{
  1 + \cfrac{1}{
    2 + \cfrac{2}{
      3 + \cfrac{3}{
        4 + \cfrac{4}{\ldots}
      }
    }
  }
}
TEX;

$samples['matrices'] = <<<'TEX'
A_{m,n} = \begin{pmatrix}
 a_{1,1} & a_{1,2} & \cdots & a_{1,n} \\
 a_{2,1} & a_{2,2} & \cdots & a_{2,n} \\
 \vdots  & \vdots  & \ddots & \vdots  \\
 a_{m,1} & a_{m,2} & \cdots & a_{m,n}
\end{pmatrix}
TEX;

$samples['align'] = <<<'TEX'
\begin{align*}
 y &= x^4 + 4 =\\
   &= (x^2+2)^2 - 4x^2 &\le\\
   &\le (x^2+2)^2
\end{align*}
TEX;

$samples['picture'] = <<<'TEX'
\begin{picture}(76,20)
\put(0,0){$A$}
\put(69,0){$B$}
\put(14,3){\line(1,0){50}}
\put(39,3){\vector(0,1){15}}
\put(14,3){\circle*{2}}
\put(64,3){\circle*{2}}
\end{picture}
TEX;

$samples['xy-pics'] = <<<'TEX'
\xymatrix{
  A \ar[r]^f \ar[d]_g &
  B \ar[d]^{g'} \\
  D \ar[r]_{f'} &
  C
}
TEX;

ob_start();
?>
<p>Магнитный момент $$\vec{\mathfrak{m}}$$, находящийся в начале координат, создает в точке $$\vec{R}_0$$ векторный потенциал</p>

<p><span style="float: right;">(1)</span>
$$\vec{A} = {\vec{\mathfrak{m}} \times \vec{R}_0 \over R_0^3}.$$</p>
<?php

$samples_embedding['ru'][] = ob_get_clean();

ob_start();
?>
<p>Placed in the origin, magnetic moment $$\vec{\mathfrak{m}}$$ produces at point $$\vec{R}_0$$ magnetic vector potential</p>

<p><span style="float: right;">(1)</span>
$$\vec{A} = {\vec{\mathfrak{m}} \times \vec{R}_0 \over R_0^3}.$$</p>
<?php

$samples_embedding['en'][] = ob_get_clean();
