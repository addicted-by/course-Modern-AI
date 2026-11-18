# Merge exhibits

| Slide | Material and provenance |
|:--|:--|
| L91 | Task-vector definition from [Ilharco et al., §2](https://arxiv.org/pdf/2212.04089v1#page=2). The shared Llama-7B checkpoint and math and code training datasets are from [LoRA Soups, §§2–4](https://arxiv.org/pdf/2410.13025v2#page=4). |
| L92 | Shared-token copying rule from [Goddard and Fernandes Neto, §3.1](https://arxiv.org/pdf/2506.06607v1#page=3). The paper's Mistral NeMo → Qwen experiment is reported in [Table 4](https://arxiv.org/pdf/2506.06607v1#page=9). IDs come from the literal, whitespace-free entries in the pinned [Qwen 2.5 7B](https://huggingface.co/Qwen/Qwen2.5-7B/blob/d149729398750b98c0af14eb82c78cfe92750796/tokenizer.json) and [Mistral NeMo Base 2407](https://huggingface.co/mistralai/Mistral-Nemo-Base-2407/blob/a4477a2f977929a969745b69bbd62e03043551a5/tokenizer.json) vocabulary files. |
| L81, L84, L82 | Weighted updates, factor mixing, and concatenation follow [LoRA Soups, §3](https://arxiv.org/pdf/2410.13025v2#page=5). Two constructed rank-one adapters use factors with opposite signs and identical effective maps. The concatenation exhibit is a block multiplication diagram. |
| L85 | Original [TIES-Merging Fig. 4](https://arxiv.org/pdf/2306.01708v2#page=4). The slide rounds the first and last bars to about 2% and 30%. |
| L86 | Trim, elect, and disjoint mean follow [TIES-Merging, Algorithm 1 and §4.2](https://arxiv.org/pdf/2306.01708v2#page=5). The six entries and their masks are illustrative. |
| L88 | Original [KnOTS Fig. 2(b,c)](https://arxiv.org/pdf/2410.19735v1#page=5). CSS outlines mark the Cars–SVHN cell read by the callout in each panel. The mobile image stacks the original panels. |
| L89 | A constructed numerical SVD with two tasks, adapted from [KnOTS Fig. 1 and §§4–5](https://arxiv.org/pdf/2410.19735v1#page=2). |
| L93 | The label pair and deduplicated 748-label union come from [KnOTS §5.3](https://arxiv.org/pdf/2410.19735v1#page=9), and overall results for TIES and KnOTS-TIES come from [Table 4](https://arxiv.org/pdf/2410.19735v1#page=8). |
