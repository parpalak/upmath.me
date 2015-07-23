\documentclass[11pt]{article}
\batchmode
\usepackage{amsmath}
\usepackage{amssymb}
\newcommand{\R}{\mathbb{R}}
<?php if (strpos($formula, '\\xymatrix') !== false || strpos($formula, '\\begin{xy}') !== false) {?>
\usepackage[all]{xy}
<?php } ?>
\pagestyle{empty}

\newsavebox{\mybox}

\setlength{\topskip}{0pt}
\setlength{\parindent}{0pt}
\setlength{\abovedisplayskip}{0pt}
\setlength{\belowdisplayskip}{0pt}

\begin{lrbox}{\mybox}
{$\displaystyle\special{dvisvgm:bbox new formula}\special{dvisvgm:raw<!--start {?x} {?y} -->}
<?php echo $formula; ?>

$\special{dvisvgm:raw<!--bbox {?bbox formula} -->}}
\end{lrbox}

\begin{document}
\usebox{\mybox}
\end{document}
