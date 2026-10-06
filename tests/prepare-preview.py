"""Build an isolated browser fixture: test-only passcodes, no Supabase connection."""
import html,json,re,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
s=next(root.glob('*.html')).read_text()
match=re.search(r'<script type="__bundler/template">\s*(.*?)\s*</script>',s,re.S)
t=json.loads(match[1])
# Remove editor defaults and replace configured gate values only in the temporary fixture.
def config(m):
 data=json.loads(html.unescape(m[1]))
 for key,value in [('guestPasscode','TEST-INVITE'),('organiserPassword','TEST-ORGANISER'),('supabaseUrl',''),('supabaseAnonKey','')]:
  if key in data:
   if isinstance(data[key],dict): data[key]['default']=value
   else: data[key]=value
 return 'data-props="'+html.escape(json.dumps(data),quote=True)+'"'
# Inspect schema without printing credentials; export format uses data attributes.
attrs=re.findall(r'([\w-]+)="([^"]*)"',t[t.index('<script',t.index('</x-dc>')):t.index('const STORAGE_KEY')])
for attr,value in attrs:
 if 'guestPasscode' in html.unescape(value):
  data=json.loads(html.unescape(value))
  for key,replacement in [('guestPasscode','TEST-INVITE'),('organiserPassword','TEST-ORGANISER'),('supabaseUrl',''),('supabaseAnonKey','')]:
   if key in data:
    if isinstance(data[key],dict): data[key]['default']=replacement
    else: data[key]=replacement
  t=t.replace(attr+'="'+value+'"',attr+'="'+html.escape(json.dumps(data),quote=True)+'"')
# Both explicit props and defaults can be present in the export.
t=re.sub(r"(this.props.guestPasscode \|\| )'[^']*'",r"\1'TEST-INVITE'",t)
t=re.sub(r"(this.props.organiserPassword \|\| )'[^']*'",r"\1'TEST-ORGANISER'",t)
t=t.replace('return !!(this.props.supabaseUrl && this.props.supabaseAnonKey);','return false; // Isolated fixture only')
t=t.replace('const STORAGE_KEY', "window.InvitationAccess = {resolve: async code => ['engagement','wedding','both'].find(kind => code === 'TEST-' + kind.toUpperCase()) || null};\nconst STORAGE_KEY",1)
out=pathlib.Path('/tmp/wedding-preview');out.mkdir(exist_ok=True)
(out/'index.html').write_text(s[:match.start(1)]+json.dumps(t).replace('</','<\\/')+s[match.end(1):])
if not (out/'assets').exists(): (out/'assets').symlink_to(root/'assets',target_is_directory=True)
print('Isolated preview ready in /tmp/wedding-preview; credentials redacted, backend disabled.')
