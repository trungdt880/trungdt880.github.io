# CLAUDE.md

Guidance for Claude Code when working in this repo.

## Project

Personal academic site for Trung Dao (https://trung-dt.com, CNAME `trung-dt.com`). Jekyll, GitHub-Pages-compatible. Showcases publications, news, CV, and a small blog. Visual identity is a **neovim/terminal aesthetic** — Catppuccin-Mocha (default) + Catppuccin-Latte palettes, JetBrains Mono everywhere, fake nvim chrome (titlebar, bufferline, gutter, statusline, cmdline).

## Commands

```bash
make build   # bundle exec jekyll build -d ./html
make serve   # bundle exec jekyll serve  (local preview)
make clean   # bundle exec jekyll clean
make push    # rsync ./html → root@192.168.50.242:/var/www/  (deploy)
make bpush   # build + push in one shot
make shell   # ssh into deploy host
```

First-time setup: `bundle install` (Gemfile pins `github-pages` + `webrick ~> 1.8`). Build output goes to `./html/` (gitignored), not the default `_site/`. Deploy is rsync-to-server, NOT GitHub Pages auto-publish — `make push` is canonical.

## Architecture

### Data-driven content

- `_data/publications.yml` — papers. Each entry references author IDs (not names) and asset filenames in `images/`. Order in YAML = display order. Add a publication by dropping image+mp4 into `images/`, appending entry, adding any missing authors. No Markdown file needed.
- `_data/authors.yml` — author registry keyed by ID. `is_me: true` marks the author whose name should be highlighted (pink).
- `_data/news.yml` — news feed. Date strings are free-form (`"Jan 2026"`) and rendered verbatim; do NOT pass through a `date:` filter.

### Site config

`_config.yml` holds site title, bio (`description`), social links (`site.links` map: each entry has `URL`, `icon`, `label`). The about-section social chips iterate `site.links`. To add/remove a chip, edit the map.

### Layouts

- `_layouts/home.html` — landing page. Hero is an **nvim window** rendering `whoami.lua` with hand-styled syntax tokens (`tk-kw`, `tk-fn`, `tk-str`, `tk-num`, `tk-com`, `tk-op`, `tk-prop`, `tk-tag`, `tk-type`, `tk-bi`, `tk-em`, `tk-mu`, `tk-br`). Gutter line numbers are static — if you add/remove a `<div class="line">` you MUST update the gutter `<span>` count and the `cur` line number, and update `#status-pos` (and the `posEl.textContent` fallback in `nvim.js`) so they don't drift. Sections below: `cat about.txt`, `tail -f changelog.md` (news), `grep -r '@inproceedings'` (publications), `cat contact.json`. Cmdline is fixed at viewport bottom.
- `_layouts/blog.html` — Telescope-style file picker. Lists posts as `YYYY-MM-DD-slug.md` rows with date + read-time + title/excerpt.
- `_layouts/post.html` — single article wrapped in nvim buffer chrome (traffic lights, `.md` filename, read-time). Renders `{{ content }}` inside `.prose`. Adds prev/next pill nav.
- `_layouts/category-post.html` — thin wrapper that delegates to `post`. Existing `_posts/` use `layout: category-post`; new posts can use either.
- `_layouts/default.html` — header + main + footer for static pages.
- `_layouts/redirect.html` — used by `cv.md` (`/cv/` → `cv.pdf`) and `gallery.md` (`/gallery/` → Flickr).

### Styles

`_sass/` compiles via `assets/style.scss` into `assets/style.css`.

- `_variables.scss` — full Catppuccin Mocha palette (`$base`, `$mantle`, `$mauve`, `$peach`, `$blue`, etc.) + Latte palette (`$l-*` prefix, e.g. `$l-base`, `$l-mauve`). Adding a token? Add to both palettes.
- `_theme.scss` — imports variables + binds legacy color names (`$color-primary-link`, `$hl-keyword`, etc.).
- `_base.scss` — resets, fonts, body bg gradient, scrollbar.
- `_components.scss` — all visual components: `.nvim-window`, `.nvim-titlebar`, `.nvim-tabline`, `.nvim-tab`, `.nvim-gutter`, `.nvim-content`, `.nvim-statusline`, `.nvim-cmdline`, `.nvim-help`, `.nvim-toast`, `.section`, `.news-log`, `.pub-card`, `.about-blurb`, `.contact-pre`, `.picker-*` (blog), `.post-*` (post), syntax tokens, `.prose` (markdown), latte overrides under `body.theme-latte { ... }`. **When adding a new component, add a corresponding latte override block** — otherwise dark colors leak through in light mode.
- `_utilities.scss` — minimal helpers retained for blog/legacy templates + Rouge syntax theme.

### Interactive layer

`assets/nvim.js` (loaded via `defer` from `home.html`):

- **Cmdline commands** (`COMMANDS` object): `:help :about :news :pubs :contact :cv :gh :scholar :linkedin :gallery :goodreads :email :blog :theme [mocha|latte] :wq :q :sudo :clear` etc. Add new commands as `name: (arg) => { ... }` and document in the `:help` overlay table inside `home.html`.
- **Keymaps**: `:` focus cmdline, `?` help, `gg`/`G` top/bottom, `j`/`k` scroll, `1`–`5` jump tabs, `Esc` blur/close help. Konami code → matrix rain canvas.
- **Theme**: `applyTheme(name)` toggles `body.theme-{mocha|latte}`. `THEMES` is a flat allowlist `['mocha','latte']`. Theme persists via `localStorage['nvim-theme']`. Adding a theme requires a new palette in `_variables.scss` + matching `body.theme-X` block in `_components.scss`.
- **Statusline**: `setMode()` swaps the mode segment color/text; `pulsePos()` updates `#status-pos` based on scroll.

### Includes

- `head.html` — meta, OG tags, JetBrainsMono + Inter from Google Fonts, MathJax (for blog posts), GA (`G-DKBTE2MRYH`), FontAwesome kit. The legacy jQuery hover-swap script for publication videos has been removed; pub-card video swap is now pure CSS (`.pub-card:hover .pub-thumb video { opacity: 1 }`).
- `header.html` — minimal mono nav for non-home pages (`/home /blog /cv /gallery`). Home does NOT include this; it has its own bufferline tabs.
- `footer.html` — single line. Home page overrides with its own footer.
- `previous-next*.html` — legacy partials, no longer wired into post layouts (post.html has its own prev/next nav).

### Mobile

Two breakpoints in `_components.scss`: `@media (max-width: 720px)` and `@media (max-width: 420px)`. The 720 block: hides the gutter (line numbers desync once content wraps), trims statusline to mode + pos, hides hint in cmdline, stacks pub thumb. The 420 block: stacks news rows vertically, drops pub thumb to 16:9.

## Conventions

- Don't put inline `style="color:#..."` in HTML — it bypasses the latte theme. Use a class (e.g. `.hl`, `.me-name`, `.dim`) and define both mocha + latte variants in `_components.scss`.
- When you remove or add lines from the hero `whoami.lua` buffer, update gutter span count + `cur` line + `#status-pos` + `nvim.js` `pulsePos()` fallback together (currently 16 visible lines, cursor at `16,11`).
- Nerd Font glyphs render as tofu without Nerd Font installed — use FontAwesome (already loaded) for icons in chrome.
- Posts live in `_posts/` with frontmatter `layout: category-post` and `categories: <name>`. Permalink format is `/<category>/YYYY/MM/DD/slug.html` (Jekyll default).
- CV file: `cv.pdf` at root. `cv.md` redirect page carries `last_updated` in frontmatter — bump it whenever you re-export the PDF; the home-page CV chip pulls this for the hover tooltip.

## Files Not To Touch Without Reason

- `assets/particles.js/`, `assets/typewrite.js`, `_sass/_utilities.scss` Rouge highlight section — legacy, but referenced in places.
- `_includes/particles.html`, `_includes/bg.html` — legacy, no longer included by any active layout.
- `_layouts/home.html.bak` — original pre-redesign home, kept for reference.
