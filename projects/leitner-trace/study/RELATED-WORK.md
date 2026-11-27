# Same answers, different calendars

Suppose a learner presses **Good** half the time. How many reviews will the scheduler assign in 60 days? In this lab, knowing “half” isn't enough. On the default ladder, repeating **GGGAAA** gives 20 reviews; repeating **GAGAGA** gives 40. Both scripts contain three **Good** and three **Again** responses. Consecutive successes let the card reach a longer interval before a reset. Alternating successes and failures keep the card near the bottom of the ladder.

## What the comparison establishes

The experiment enumerates all 64 ordered six-answer scripts over **Again** and **Good**, repeats each script from its first answer, and replays it on three ladders: **1/2/4/9/21 days**, **1/2/4/8/16 days**, and a **fixed four-day interval**. Each run starts with a new card on day 0. Each review happens exactly when scheduled. The workload count includes days 0 through 59; the second outcome is the day the next review falls due after answer 12.

Across the 64 scripts, the shorter five-box ladder produced more reviews than the default in 15 cases and the same number in 49. The fixed interval produced exactly 15 reviews in every case. These are exhaustive counts for this deliberately narrow input space: the 192 rows are not 192 people. The experiment does not model a daily review cap, missed days, learning, or changes in a learner's answer when an interval changes.

## Where this fits

| Reference | Question it answers | What is different here |
|---|---|---|
| [Wozniak's original SM-2 algorithm](https://super-memory.com/english/ol/sm2.htm) | How do quality scores and an item-specific ease factor determine its next interval? | Trace uses explicit box transitions and fixed interval ladders. None of its three policies implements SM-2. |
| [Anki manual: FSRS and desired retention](https://docs.ankiweb.net/manual/deck-options) | How does a target probability of recall affect scheduling and simulated workload? | Anki already explores the workload–retention tradeoff. Trace follows the dates produced by supplied answers; it never estimates recall probability. |
| [Open Spaced Repetition: SRS Benchmark](https://github.com/open-spaced-repetition/srs-benchmark) | How well do algorithms predict observed recall? The benchmark reports log loss, binned RMSE and AUC. | There are no observed learner outcomes in this study, so those metrics cannot rank the three ladders here. |
| [Cepeda et al., *Spacing Effects in Learning* (2008)](https://digitalcommons.usf.edu/psy_facpub/1766/) | In a controlled fact-learning study, how does spacing interact with the time until a final test? | A calendar date is not a measured memory outcome. Showing retention benefits would require actual test outcomes at a specified delay. |

## Replicate or challenge a result

From the project directory, run `node study/workload.js` for all 192 rows or `node study/workload.js --summary` for the three policy summaries. Compare the outputs with the committed `study/workload.csv` and `study/summary.csv`. To reproduce the opening example, select the two named scripts under `default5` and inspect `reviews_d0_d59`. A good counterexample report identifies the script, ladder, horizon, and first date where the expected and recorded traces diverge.

The project software and accompanying documentation may be reused under its MIT license; preserve the copyright and permission notice in copies or substantial portions. No outside dataset or personal review history is needed. You can reproduce the dates under the stated rules; these results neither guarantee learning gains nor recommend one ladder for a particular learner.
