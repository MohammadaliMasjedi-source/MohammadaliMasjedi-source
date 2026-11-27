"""Build the double-click offline edition using only the Python standard library."""
import base64
import html
import re
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parent


def content(path):
    return (ROOT / path).read_text(encoding="utf-8")


def data_module(source):
    return "data:text/javascript;base64," + base64.b64encode(source.encode("utf-8")).decode("ascii")


def replace_once(source, old, new):
    if source.count(old) != 1:
        raise ValueError("Source format changed; expected one instance of " + old)
    return source.replace(old, new)


def build():
    trace = replace_once(content("trace.js"), "'./srs.js'", repr(data_module(content("srs.js"))))
    app = replace_once(content("app.js"), "'./trace.js'", repr(data_module(trace)))
    if re.search(r"</script", app, re.I):
        raise ValueError("Escape the closing script tag before embedding this module")
    page = replace_once(content("index.html"), '<link rel="stylesheet" href="style.css">',
                        '<style>' + content("style.css") + '</style>')
    page = replace_once(page, '<script type="module" src="app.js"></script>',
                        '<script type="module">' + app + '</script>')
    page = replace_once(page, '</body>', '<details style="margin:1rem"><summary>MIT license</summary><pre style="white-space:pre-wrap">'
                        + html.escape(content("LICENSE")) + '</pre></details></body>')
    out = ROOT / "download"
    out.mkdir(exist_ok=True)
    with ZipFile(out / "leitner-trace.zip", "w") as z:
        entry = ZipInfo("Leitner-Trace.html", date_time=(2026, 1, 1, 0, 0, 0))
        entry.create_system = 3
        entry.external_attr = 0o100644 << 16
        z.writestr(entry, page.encode(), compress_type=ZIP_DEFLATED, compresslevel=9)


if __name__ == "__main__":
    build()
