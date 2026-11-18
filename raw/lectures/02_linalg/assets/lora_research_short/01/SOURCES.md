# Primary materials in the opening chapter

| Slide | Exhibit and provenance |
|---|---|
| H01 | CSS matrix-shape illustration of [Hu et al., §4.1 Eq. (3)](https://arxiv.org/pdf/2106.09685v2#page=4). The arrangement depicts the factor dimensions, with the conceptual bound stated separately. |
| H02 | [Hu et al., Table 4](https://arxiv.org/pdf/2106.09685v2#page=8) supplies the trainable counts and WikiSQL validation scores. The ratio is computed from the reported counts, 175,255.8M ÷ 4.7M, and rounded. [Table 6](https://arxiv.org/pdf/2106.09685v2#page=10) separately supplies the rank-sweep values replotted in `h02-rank-sweep.svg`. |
| H03 | [Hu et al., §7.2 Fig. 3 and Eq. (4)](https://arxiv.org/pdf/2106.09685v2#page=11). Original V zoom, with a row axis and first-cell outline in HTML. |
| L01 | [Hu et al., Fig. 1 and §4.1](https://arxiv.org/pdf/2106.09685v2#page=1), reproduced as a crop. The accompanying gradient table follows by the chain rule. |
| L27 | Constructed scalar loss and gradient-flow diagram exhibiting the stationary factor origin discussed by [Mu and Klabjan, Eq. (7) and §4](https://arxiv.org/html/2512.18248v1#S3.SS2). |
| L02 | Constructed matrix compensation example with desktop and mobile exhibits following [Wang et al., Algorithm 1 line 10](https://arxiv.org/pdf/2407.05000v2#page=5). |
| L03 | [Meng et al., PiSSA Fig. 1(c) and §3 Eqs. (2)–(5)](https://arxiv.org/pdf/2404.02948v4#page=2), with a constructed rank-one decomposition of `diag(9,4)`. |
| L04 | [Meng et al., Fig. 4(a)](https://arxiv.org/pdf/2404.02948v4#page=7). The early-loss inset is cropped from the paper. A white margin masks a neighboring full-run trace outside the inset. |
| L08 | [Wang et al., NeurIPS Table 7](https://proceedings.neurips.cc/paper_files/paper/2024/file/62c4718cc334f6a0a62fb81c4a2095a1-Paper-Conference.pdf#page=10), typeset with the similarity fractions converted to percentages. |
| L10 | Constructed rank-one first-step calculation with a singular-axis diagram following the direction selection in [Wang et al., Theorem 3.1 and Algorithm 1](https://arxiv.org/pdf/2407.05000v2#page=5). |
| L14 | First-step SGD derivation adapted from [Kalajdzievski, Appendix A Eqs. (6), (8)](https://arxiv.org/pdf/2312.03732v1#page=8). |
| L15 | [Kalajdzievski, Fig. 3](https://arxiv.org/pdf/2312.03732v1#page=5), reproduced as a crop. |
| L16 | The two rank-2,048 curves from [Kalajdzievski, Fig. 2](https://arxiv.org/pdf/2312.03732v1#page=4) are replotted. The vector paths are recorded in `l16-paths.json`; `build_figures.py` renders the chart. |
| L17 | Constructed rank-one feature-change example with a two-dimensional vector plot following [Hayou, Ghosh and Yu, §4](https://arxiv.org/html/2402.12354v2#S4). |
| L18, L19 | Original MMLU and MNLI panels from [Hayou, Ghosh and Yu, Fig. 5](https://arxiv.org/html/2402.12354v2#S5.F5), with the reported cell values emphasized in the slide text. |
| L23 | Constructed scalar SGD example with a common linear axis for the two post-step products, following reciprocal rescaling in [Yen et al., §2.2 Eqs. (5)–(6)](https://arxiv.org/html/2410.20625v2#S2.SS2). |

## Archived paper-panel exhibits

[paper_assets_01.json](paper_assets_01.json) records the paper-panel revision of the 17-slide chapter. It remains the crop manifest for reproduced figures, with source and asset hashes, page indices, PDF-point rectangles, render scales, and licenses.

## Earlier lecture versions

This section documents files retained for earlier revisions of the lecture.


| Slides | Exhibit | Primary source and provenance |
|---|---|---|
| H01, L01, L38 | Weight-update schematic, first-step algebra, and illustrative placement grid | [Hu et al., LoRA, arXiv v2](https://arxiv.org/pdf/2106.09685v2), §1, §4.1, and §7.1 respectively. |
| H02, left | GPT-3 175B Full FT and 4.7M LoRA rows | [Hu et al., Table 4](https://arxiv.org/pdf/2106.09685v2#page=8). Trainable parameters in millions and matched-backbone validation accuracy on WikiSQL and MultiNLI-m. |
| H02, right | GPT-3 175B WikiSQL, Q + V rank sweep | [Hu et al., Table 6](https://arxiv.org/pdf/2106.09685v2#page=10). Ranks 1, 2, 4, 8, and 64. The original table values are labeled directly in h02-rank-sweep.svg on a logarithmic rank axis. |
| H03 | V projection zoom with color scale | [Hu et al., Fig. 3 and Eq. (4)](https://arxiv.org/pdf/2106.09685v2#page=11). PDF page index 10, crop box (386.5, 285, 500, 390.5) points at 8× resolution using PyMuPDF. The row axis and labels are restored in HTML. An outline marks the first cell. |
| L14, L15 | First-step scale algebra | [Kalajdzievski, rsLoRA](https://arxiv.org/html/2312.03732v1), §3 and Eqs. (6)–(9). |
| L16 | Rank-2048 LoRA and rsLoRA fine-tuning perplexity | [Kalajdzievski, Fig. 2](https://arxiv.org/html/2312.03732v1#S4.F2). The two verified source path records are preserved in l16-paths.json. The generator uses those records verbatim for the curves and redraws the labels and grid. © 2023 Tenyx. |
| L39 | GPT-3 175B WikiSQL, attention placement at 18M parameters | [Hu et al., Table 5](https://arxiv.org/pdf/2106.09685v2#page=10). Q, Q + V, and Q + K + V + O columns. |
| L50 | Two constructed rank-four spectra | Original example with singular values (1, 1, 1, 1) and (1, 0.1, 0.1, 0.1). |

Both papers are distributed under arXiv's perpetual nonexclusive license.

## Restored initialization and optimization exhibits

| Slides | Exhibit | Primary source and provenance |
|---|---|---|
| L01, L14 | Rank-one plain-SGD example | Constructed $2\times2$ worked case from the LoRA factor gradients. Both slides reuse the same dense gradient and rank-one row. |
| L27 | Stationary zero factors | Direct consequence of the chain rule. [Mu and Klabjan, §§3–4](https://arxiv.org/html/2512.18248#S3). |
| L02, L08, L10 | Compensation and gradient-guided initialization | [Wang et al., LoRA-GA](https://proceedings.neurips.cc/paper_files/paper/2024/file/62c4718cc334f6a0a62fb81c4a2095a1-Paper-Conference.pdf), §§3.1–3.4. L10 uses a constructed diagonal example. |
| L03, L04 | PiSSA decomposition and first 100 training steps | [Meng et al., PiSSA](https://proceedings.neurips.cc/paper_files/paper/2024/file/db36f4d603cc9e3a2a5e10b93e6428f2-Paper-Conference.pdf), §3 and §5.2 Fig. 4a. L04 reuses the original inset with direct curve labels from the archived release. |
| L17–L19 | Different factor learning rates and two separate task grids | [Hayou, Ghosh and Yu, LoRA+](https://arxiv.org/html/2402.12354v2#S5.F5), Fig. 5 left and right for L18 and L19. Both crops and their comparison marks come from the archived release. |
| L23 | Scalar factor-coordinate example | Constructed calculation motivated by [Yen et al., §§2.1–2.2](https://arxiv.org/html/2410.20625#S2.SS1). |

The feedback revision uses original constructed examples. The paired desktop and mobile SVGs are generated by `build_feedback_figures.py`. The expressions and numeric results are identical across layouts.

| Slide | Exhibit and values |
|---|---|
| L01 | The fixed row $(1,-1)$ and the first-step coefficients $(-2,1)^\top$ give the two rows $(-2,2)$ and $(1,-1)$. The constructed gradient has rows $(3,1)$ and $(1,2)$. |
| L27 | The scalar loss is $\tfrac12(w-2)^2$. Plain SGD with $\eta=1/4$ leaves the both-zero start at $w=0$ and moves the start with $A_0=1$ to $w=0.5$. The resulting losses are $2$ and $1.125$. |
| L02 | The rank-one contribution $C=[1,2]^\top[1,-1]$ is offset in the frozen matrix. The visual follows entry $(1,2)$ through the equality $2=3+(-1)$. |
| L03 | The constructed matrix $\operatorname{diag}(9,4)$ splits into $\operatorname{diag}(9,0)$ and $\operatorname{diag}(0,4)$. The first matrix is the outer product of $[3,0]^\top$ and $[3,0]$. |
| L08 | Two illustrative batches at identical starting weights yield $-G_X=\operatorname{diag}(-6,-2)$ and $-G_Y=\operatorname{diag}(-2,-6)$. These are dense reference directions for calibration. |
| L10 | The first right and second left singular directions of $G_X$ select two complementary terms. In the unit-factor example they are $\operatorname{diag}(6,0)$ and $\operatorname{diag}(0,2)$ before the common $-\eta s^2$ multiplier. |
| L14 | The unscaled first coefficient from L01 is $-2$. The area model groups identical contributions to a single coefficient. When $s=2$, the first scale gives $-4$ in $\delta B$ and the second gives $-8$ in $\delta W$. |
| L15 | The normalized analytic coefficient for the mean first SGD step is $s^2r/\alpha^2$. At rank four, four channels contribute $1/16$ each under LoRA and $1/4$ each under rsLoRA. Bar length encodes that coefficient. |
| L17 | The constructed input has $Ax=1$ and $B=(1,1)^\top$. Changing only $A$ doubles $Ax$, yielding $(2,2)^\top$. Changing only $B$ to $(2,0)^\top$ gives $(2,0)^\top$. The perturbations illustrate where the rate acts. |
| L23 | Starting pairs $(1,1)$ and $(10,0.1)$ both have $BA=1$. With simultaneous SGD at $\eta=0.01$, the first pair gains $(0.01,0.01)$ and the second $(0.001,0.1)$. Their new products are $1.0201$ and $2.0002$. |
