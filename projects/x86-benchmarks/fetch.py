"""Fetch upstream content only on explicit invocation; verify every hash."""
import hashlib,io,json,sys,tarfile,urllib.request,zipfile
from pathlib import Path
root=Path(__file__).resolve().parent
project=root/sys.argv[1]
proof=json.loads((project/'assets.json').read_text())
sha=lambda b:hashlib.sha256(b).hexdigest()
def get(url,digest):
    data=urllib.request.urlopen(url,timeout=120).read()
    if sha(data)!=digest:raise ValueError('upstream digest mismatch: '+url)
    return data
if project.name=='topbench':
    release=get(proof['releaseUrl'],proof['releaseSha256'])
    source=get(proof['sourceUrl'],proof['sourceSha256'])
    with zipfile.ZipFile(io.BytesIO(release)) as z:
        for name in ['TOPBENCH.EXE','TOPBENCH.TXT','DATABASE.INI']:
            data=z.read(name)
            assert sha(data)==proof['files'][name]['sha256']
            (project/name).write_bytes(data)
    with tarfile.open(fileobj=io.BytesIO(source)) as t:
        for name,item in proof['files'].items():
            if not name.startswith('source/'):continue
            members=[m for m in t.getmembers() if '/'.join(Path(m.name).parts[1:])==name[len('source/'):]]
            assert len(members)==1
            data=t.extractfile(members[0]).read();assert sha(data)==item['sha256']
            (project/name).parent.mkdir(parents=True,exist_ok=True)
            (project/name).write_bytes(data)
else:
    data=get(proof['sourceUrl'],proof['sourceSha256'])
    (project/'source/whetstone.c').write_bytes(data)
for name,item in proof['files'].items():
    data=(project/name).read_bytes()
    assert len(data)==item['bytes'] and sha(data)==item['sha256'],name
print(project.name+': all asset hashes verified')
