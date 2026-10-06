"""Read/write the bundled template without modifying its embedded resource manifest.
Usage: python3 scripts/template.py extract /tmp/template.html
       python3 scripts/template.py pack /tmp/template.html
The template contains existing client-side configuration. Keep extracted copies private.
"""
import json,re,pathlib,sys
root=pathlib.Path(__file__).resolve().parents[1]
p=next(root.glob('*.html'));s=p.read_text()
m=re.search(r'(<script type="__bundler/template">)\s*(.*?)\s*(</script>)',s,re.S)
if len(sys.argv)!=3 or sys.argv[1] not in ('extract','pack'): raise SystemExit(__doc__)
target=pathlib.Path(sys.argv[2])
if sys.argv[1]=='extract': target.write_text(json.loads(m[2]))
else:
 encoded=json.dumps(target.read_text()).replace('</','<\\/')
 p.write_text(s[:m.start(2)]+encoded+s[m.end(2):])
print('Template '+sys.argv[1]+' complete.')
