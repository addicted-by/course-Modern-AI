# Course project pages

Slides 16–17 of `../course_structure.qmd` link to these static pages. The pages open
directly from disk or from the same web server as the deck. Each page links back to
the appropriate catalog slide and includes 1–2 local research illustrations.

Edit `projects.json` for project content, `template.html` for markup and
`projects.css` for appearance. Image files and attribution manifests are in
`../assets/projects/`. Captions describe reference research, not student results.

Rebuild from the repository root:

```sh
python3 raw/lectures/01_intro/project_pages/build.py
quarto render
```

GitHub Actions runs the same generator before Quarto. Run it again after changing
the template, project content, or registration configuration.

Keep `project_pages/`, `assets/projects/`, `vendor/katex/`, and the deck's generated
`course_structure_files/` directory together when distributing the presentation.
README and notebook links appear only when the corresponding files exist under
`raw/lectures/projects/<project-id>/`.

## Project registration

One Google Form serves all ten projects. Each generated page has an English
registration button and a form collapsed by default. Clicking **Sign up for this
project** expands the form and scrolls to it. The **Project registration** heading
also toggles the form. The expanded section includes the embedded form and a link
to open the same prefilled form in a new tab. The project dropdown uses the exact `title` values in
`projects.json`; keep the form choices synchronized when renaming a project.
Prefilling does not lock the dropdown: students may change their selection.

### Google Form setup

Create the form in the course owner's Google account:

1. Name it **Modern AI — Project Registration**.
2. Add four required questions: **Project** (dropdown with the ten project titles
   from `projects.json`), **First name**, **Last name**, and **Telegram** (short answers).
   Add the hint `Example: @username` to Telegram.
3. Under response settings, turn off email collection and the one-response limit.
   Do not require Google sign-in or restrict access to an organization.
4. Under presentation settings, keep the response summary hidden and set the
   confirmation message to **Your application has been received. Contact the
   instructor if you have any questions about participation.**
5. In Responses, link a new Google Sheet. Keep both the editor access and the
   response spreadsheet restricted to the course owner; do not publish the sheet.
6. Publish the form for anyone with its responder link. Use the form menu's
   prefill action, select one project, and obtain the prefilled responder URL.

Only the public responder URL and the project field identifier belong in
`registration.json`:

```json
{
  "enabled": true,
  "form_url": "https://docs.google.com/forms/d/e/PUBLIC_FORM_ID/viewform",
  "project_entry_id": "entry.PROJECT_FIELD_NUMBER"
}
```

Replace the example values with those from the real prefilled URL. The
`entry.<digits>` query parameter that contains the selected project is the
project field identifier. Use the full responder URL, without its query string,
not a shortened URL or an editor URL. The generator adds the prefilled project,
`hl=en` to request the English Google Forms interface, and the iframe embedding
option, with proper URL and HTML escaping.
Google may still localize its built-in controls according to the respondent's
browser or account language; `hl=en` does not override every locale setting.

When `enabled` is `false`, pages contain no registration button or iframe. This
allows normal course builds before the live form is ready. When enabled, invalid
configuration stops the build. To require registration explicitly before release:

```sh
python3 raw/lectures/01_intro/project_pages/build.py --require-registration
quarto render
```

Verify the form without Google sign-in, check the project selection on all ten
pages, and submit one clearly marked test application. Confirm it arrives in the
private response sheet and that respondents cannot see others' answers. Check
the embedded form and confirmation on both desktop and mobile. This version
collects applications; capacity and duplicate applications are reviewed manually.

Never put student responses, private spreadsheet links, credentials, or the form
editor URL in this repository. Changes to Google questions, permissions, or form
publication happen in Google Forms and are not controlled by Quarto.
