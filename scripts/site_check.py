#!/usr/bin/env python3
"""Site checks for magnolia-gardens (static site, no build step).

    python3 scripts/site_check.py            # validate, exit 1 on any FAIL
    python3 scripts/site_check.py --fix-faq  # regenerate FAQPage JSON-LD from each page's visible FAQ, then validate

Checks:
  1. Every <script type="application/ld+json"> block on every page parses as JSON.
  2. FAQPage JSON-LD matches the visible FAQ (questions and answers, verbatim, in order).
  3. index.html: the static "Now booking" lines match SEASONS for the current month, and the
     <title> is the fall title only in fall (Sep-Nov).
  4. Meta descriptions are 160 characters or fewer. Titles over 70 characters are warned.
  5. Every site-relative href/src resolves to a file in the repo.
  6. sitemap.xml entries resolve to files whose canonical matches the <loc>; indexable pages
     missing from the sitemap are warned.

Standard library only. Run from anywhere; paths resolve relative to the repo root.
"""
import datetime
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://magnoliagardenslandscaping.com"

LD_BLOCK = re.compile(r'(<script type="application/ld\+json">)(.*?)(</script>)', re.S)
FAQ_ITEM = re.compile(r'<h3 class="faq-q">(.*?)</h3>\s*<div class="faq-a">(.*?)</div>\s*</div>', re.S)
TAG = re.compile(r"<[^>]+>")
WS = re.compile(r"\s+")

results = {"PASS": 0, "WARN": 0, "FAIL": 0}


def report(level, msg):
    results[level] += 1
    print(f"{level}: {msg}")


def pages():
    return sorted(p for p in ROOT.rglob("*.html") if ".git" not in p.parts)


def rel(p):
    return p.relative_to(ROOT).as_posix()


def text_of(fragment):
    """Visible text of an HTML fragment: tags stripped, entities decoded, whitespace collapsed."""
    return WS.sub(" ", html.unescape(TAG.sub("", fragment))).strip()


def norm(s):
    """Comparison form: whitespace collapsed, typographic apostrophes/quotes folded to ASCII."""
    return WS.sub(" ", s).strip().replace("\u2019", "'").replace("\u2018", "'").replace("\u201c", '"').replace("\u201d", '"')


def smart(s):
    """Typographic apostrophes for generated JSON-LD text (What's -> What\u2019s, days' -> days\u2019)."""
    return re.sub(r"(?<=\w)'", "\u2019", s)


# 1. JSON-LD parses -------------------------------------------------------------------------
def check_jsonld(page, src):
    ok = True
    for i, m in enumerate(LD_BLOCK.finditer(src), 1):
        try:
            json.loads(m.group(2))
        except json.JSONDecodeError as e:
            ok = False
            report("FAIL", f"{rel(page)}: JSON-LD block {i} does not parse ({e})")
    return ok


# 2. FAQ parity -----------------------------------------------------------------------------
def html_faq(src):
    if 'class="faq-q"' not in src:
        return None
    return [(text_of(q), text_of(a)) for q, a in FAQ_ITEM.findall(src)]


def faq_blocks(src):
    for m in LD_BLOCK.finditer(src):
        try:
            obj = json.loads(m.group(2))
        except json.JSONDecodeError:
            continue
        if obj.get("@type") == "FAQPage":
            yield m, obj


def check_faq(page, src):
    for m, obj in faq_blocks(src):
        visible = html_faq(src)
        if visible is None:
            report("FAIL", f"{rel(page)}: FAQPage JSON-LD present but no visible .faq-q items found")
            continue
        visible = [(norm(q), norm(a)) for q, a in visible]
        ld = [(norm(q.get("name", "")), norm(q.get("acceptedAnswer", {}).get("text", ""))) for q in obj.get("mainEntity", [])]
        if len(visible) != len(ld):
            report("FAIL", f"{rel(page)}: FAQ count differs, HTML has {len(visible)} items, JSON-LD has {len(ld)} (run --fix-faq)")
            continue
        bad = [(v[0], "question" if v[0] != l[0] else "answer") for v, l in zip(visible, ld) if v != l]
        if bad:
            for q, what in bad:
                report("FAIL", f"{rel(page)}: FAQ {what} differs from JSON-LD for \"{q[:60]}\" (run --fix-faq)")
        else:
            report("PASS", f"{rel(page)}: FAQ JSON-LD matches the visible FAQ ({len(ld)} items)")


def fix_faq(page, src):
    """Rewrite each FAQPage block so mainEntity mirrors the visible FAQ. Returns new source."""
    visible = html_faq(src)
    if visible is None:
        return src
    out = src
    for m, obj in list(faq_blocks(src)):
        obj["mainEntity"] = [
            {"@type": "Question", "name": smart(q), "acceptedAnswer": {"@type": "Answer", "text": smart(a)}} for q, a in visible
        ]
        body = m.group(2)
        first = next((ln for ln in body.splitlines() if ln.strip()), "")
        indent = first[: len(first) - len(first.lstrip())]
        dumped = json.dumps(obj, ensure_ascii=False, indent=2)
        new_body = "\n" + "\n".join(indent + ln for ln in dumped.splitlines()) + "\n" + indent
        out = out.replace(m.group(0), m.group(1) + new_body + m.group(3), 1)
    return out


# 3. Seasonal copy on index.html ------------------------------------------------------------
def season_for(month):  # month: 1-12, same boundaries as the seasonal script (Dec-Feb, Mar-Apr, May-Aug, Sep-Nov)
    m = month - 1
    if m == 11 or m <= 1:
        return "winter"
    if m <= 3:
        return "spring"
    if m <= 7:
        return "summer"
    return "fall"


def check_season(src, today):
    block = re.search(r"var SEASONS = \{(.*?)\};", src, re.S)
    if not block:
        report("FAIL", "index.html: SEASONS object not found in the seasonal script")
        return
    seasons = {}
    for key, val in re.findall(r"(\w+):\s*'(.*)'", block.group(1)):
        seasons[key] = val.replace("' + year + '", str(today.year))
    season = season_for(today.month)
    expected = seasons.get(season)
    lines = [text_of(t) for t in re.findall(r"<(?:p|span)\b[^>]*\sdata-season-line[^>]*>(.*?)</", src, re.S)]
    if len(lines) < 2:
        report("FAIL", f"index.html: expected 2 [data-season-line] elements, found {len(lines)}")
    for t in lines:
        if t == expected:
            report("PASS", f"index.html: static booking line matches the {season} SEASONS text")
        else:
            report("FAIL", f"index.html: static booking line is stale for {season}. Expected: \"{expected}\"  Found: \"{t}\"")
    title = text_of(re.search(r"<title>(.*?)</title>", src, re.S).group(1))
    if season == "fall" and not title.startswith("Fall"):
        report("WARN", f"index.html: it is {season} but the <title> is not the fall title: \"{title}\"")
    elif season != "fall" and title.startswith("Fall"):
        report("FAIL", f"index.html: it is {season} but the <title> is still the fall title. Revert per the comment above <title>.")
    else:
        report("PASS", f"index.html: <title> matches the season ({season})")


# 4. Meta lengths ---------------------------------------------------------------------------
def check_meta(page, src):
    m = re.search(r'<meta name="description" content="([^"]*)"', src)
    if m:
        d = html.unescape(m.group(1))
        if len(d) > 160:
            report("FAIL", f"{rel(page)}: meta description is {len(d)} chars (max 160)")
        else:
            report("PASS", f"{rel(page)}: meta description {len(d)} chars")
    t = re.search(r"<title>(.*?)</title>", src, re.S)
    if t:
        title = text_of(t.group(1))
        if len(title) > 70:
            report("WARN", f"{rel(page)}: title is {len(title)} chars, likely truncated in search results: \"{title}\"")


# 5. Internal links -------------------------------------------------------------------------
def resolve(path):
    path = path.split("#", 1)[0].split("?", 1)[0]
    if not path.startswith("/") or path.startswith("//"):
        return True
    target = ROOT / path.lstrip("/")
    if path.endswith("/"):
        return (target / "index.html").exists()
    return target.exists() or (target / "index.html").exists()


def check_links(page, src):
    refs = set(re.findall(r'(?:href|src|srcset)="(/[^"\s]*)', src))
    for m in re.finditer(r'srcset="([^"]*)"', src):
        refs.update(u.strip() for u in re.findall(r'(/[^\s,]+)', m.group(1)))
    broken = sorted(r for r in refs if not resolve(r))
    for r in broken:
        report("FAIL", f"{rel(page)}: broken site-relative link {r}")
    if not broken:
        report("PASS", f"{rel(page)}: {len(refs)} site-relative links resolve")


# 6. Sitemap --------------------------------------------------------------------------------
def check_sitemap(all_pages):
    sm = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    locs = re.findall(r"<loc>(.*?)</loc>", sm)
    listed = set()
    for loc in locs:
        if not loc.startswith(SITE):
            report("FAIL", f"sitemap.xml: {loc} is not under {SITE}")
            continue
        path = loc[len(SITE):] or "/"
        listed.add(path)
        if not resolve(path):
            report("FAIL", f"sitemap.xml: {loc} does not resolve to a page")
            continue
        file = ROOT / (path.lstrip("/") + "index.html") if path.endswith("/") else ROOT / path.lstrip("/")
        src = file.read_text(encoding="utf-8")
        c = re.search(r'<link rel="canonical" href="([^"]*)"', src)
        if not c:
            report("FAIL", f"{rel(file)}: listed in sitemap but has no canonical link")
        elif c.group(1) != loc:
            report("FAIL", f"{rel(file)}: canonical {c.group(1)} differs from sitemap loc {loc}")
        else:
            report("PASS", f"sitemap.xml: {path} resolves and canonical matches")
    for p in all_pages:
        if p.name != "index.html":
            continue
        path = "/" + rel(p)[: -len("index.html")]
        src = p.read_text(encoding="utf-8")
        if path not in listed and "noindex" not in src:
            report("WARN", f"{rel(p)}: indexable page not listed in sitemap.xml")


def main(argv):
    fix = "--fix-faq" in argv
    today = datetime.date.today()
    all_pages = pages()
    for page in all_pages:
        src = page.read_text(encoding="utf-8")
        if fix and "FAQPage" in src:
            new = fix_faq(page, src)
            if new != src:
                page.write_text(new, encoding="utf-8")
                print(f"FIXED: {rel(page)}: FAQPage JSON-LD regenerated from the visible FAQ")
                src = new
        if not check_jsonld(page, src):
            continue
        check_faq(page, src)
        check_meta(page, src)
        check_links(page, src)
        if rel(page) == "index.html":
            check_season(src, today)
    check_sitemap(all_pages)
    print(f"\n{results['PASS']} pass, {results['WARN']} warn, {results['FAIL']} fail")
    return 1 if results["FAIL"] else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
