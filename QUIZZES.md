# Quizzes

The hub is `raw/quizzes.qmd`. Each quiz has a student page at
`raw/quizzes/<quiz>/index.qmd`; the website render glob
includes these pages automatically. Add a hub entry when adding a quiz.

## First quiz

The original `lecture01_arch` package was copied from the course working
folder on 2026-10-28. The source folder was preserved.
There are 15 questions in four sections, worth 20 points in total.

Only `index.qmd` and `student_test.md` are public materials. The copied
`Code.gs`, `questions.json`, answer keys, original README and validation
record are local instructor files excluded by `.gitignore`. Do not add the
quiz directory as a wildcard resource: that would publish the answer keys.
The original instructor package remains available in the source course folder.

## Google Form

Run the local `Code.gs` in Google Apps Script using `createQuiz`. It creates
an unpublished draft; a repeated run reuses the saved form. Configure grade
release and respondent access in the form editor, then publish it. The quiz page contains the respondent link and an
iframe using that link plus `?embedded=true`. Never put the editor URL on
the student page. Use a descriptive iframe title and keep a separate link.

## Verification

Run `quarto render`, then `python3 scripts/check-quiz-publication.py`.
With the private instructor package present, also run
`node scripts/check-quiz-source.cjs` to check question sync and the Apps Script
logic using simulated Google services.
Serve `_site` over HTTP and check the hub and quiz page on desktop and mobile.
For a live form, check a correct attempt (20/20), an attempt with only A02
wrong (18/20), required questions, and access without the owner's session.
Local checks do not replace real submissions in Google Forms.
The publish workflow runs the publication check after every render.

Quiz titles are in English; the first quiz’s questions remain in Russian.
Source references in the private question bank are relative to
`raw/lectures/01_intro/`, as in the original package.

The Apps Script copy removes `TextItem.setPoints(0)`: the new text field
already has zero points, and Google rejected that update during the live run.
`createQuiz` can resume the known empty draft (one optional name field and no
responses); other incomplete forms are left untouched. New forms have their
title explicitly set, as well as their Drive document name.

Google Apps Script project: https://script.google.com/u/1/home/projects/1WTMzzLoJnLvQ4isVm_x6maGk7HXKpw_TIJgp2G3QLi-SkJxMlSZCr1UZ/edit
Form editor: https://docs.google.com/forms/d/1azsDJM3o4W5yD-w-3KmP32dRg9xZq5D3mxclvyBBtZY/edit

## Live verification — 2026-10-28

The form is published under `ras.unlucky@gmail.com` with immediate score
release. The respondent URL is embedded in the quiz page:
https://docs.google.com/forms/d/e/1FAIpQLSdpW8TvmXLKHuP-r5G5RvIpVHiIo8YDE94x2nI_2dUtKKjJCg/viewform

Verified in the real Google Forms respondent UI:

- Empty required questions block the Next button with a validation message.
- `QA — all correct`: 20/20, with answer explanations.
- `QA — A02 incorrect`: 18/20, with the incorrect answer identified.
- All four sections can be completed and responses submitted.
- Both QA responses remain in the form and should be excluded from student statistics.
- The optional zero-point name field is not automatically graded; Google shows
  a “final result not yet known” tooltip alongside the correct numeric total.
  The 15 multiple-choice questions are graded automatically.

A cookie-free HTTP request returns 200 and the question form without redirecting
to sign-in. The embedded form loads on the course page. Desktop and mobile
layouts have no horizontal overflow; the page has no browser console errors.
Full Quarto rendering, source validation, publication checks and whitespace
checks pass.
