#!/usr/bin/env python3
# SPDX-License-Identifier: BSD-3-Clause
"""Normalize original Adafruit images and existing verified geometry previews.

Python 3.11 + pillow==13.0.0. Run after checking out media commit f87d30a2.
Six workers at most; verify original identity before decoding, use GIF frame 0,
and preserve aspect ratio in a 256x192 neutral canvas. No conversion jobs run.
"""
import concurrent.futures, hashlib, io, json, urllib.parse, urllib.request
from pathlib import Path
from PIL import Image, ImageOps
ROOT=Path(__file__).resolve().parents[1];PROJECT=ROOT/'projects/adafruit-thumbnails';OUT=PROJECT/'images';OUT.mkdir(exist_ok=True)
config=json.loads((PROJECT/'sources.json').read_text()); previous=json.loads((ROOT/'projects/adafruit-previews/manifest.json').read_text())

def digest(b):return hashlib.sha256(b).hexdigest()
def normalise(data):
 with Image.open(io.BytesIO(data)) as original:
  original.seek(0); original.load(); im=ImageOps.exif_transpose(original).convert('RGBA');im.thumbnail((248,184),Image.Resampling.LANCZOS)
  canvas=Image.new('RGBA',(256,192),(244,247,250,255));canvas.alpha_composite(im,((256-im.width)//2,(192-im.height)//2));canvas=canvas.convert('RGB').quantize(colors=128,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.FLOYDSTEINBERG)
  out=io.BytesIO();canvas.save(out,format='PNG',optimize=True);return out.getvalue()
def save(folder,source,data,derivation):
 name=digest(folder.encode())[:24]+'.png';result=normalise(data);(OUT/name).write_bytes(result)
 return {'folder':folder,'image':{'path':'projects/adafruit-thumbnails/images/'+name,'bytes':len(result),'sha256':digest(result),'format':'png'},'source':source,'derivation':derivation}
def upstream(folder):
 failures=[]
 # Prefer full-color stills; fallback to other files when an image is invalid.
 candidates=sorted(folder['files'],key=lambda f:({'png':0,'jpg':1,'gif':2}[f['format']],-f['bytes'],f['path']))
 for f in candidates:
  try:
   url=config['baseUrl']+'/'.join(urllib.parse.quote(p,safe='') for p in f['path'].split('/'))
   with urllib.request.urlopen(url,timeout=60) as response:data=response.read(f['bytes']+1)
   if len(data)!=f['bytes'] or digest(data)!=f['sha256']:raise ValueError('source identity mismatch')
   return save(folder['name'],{k:f[k] for k in ('path','bytes','sha256','format')},data,{'kind':'upstream-image','frame':0,'operation':'EXIF orientation, aspect-fit 248x184 inside 256x192 neutral background; Lanczos, 128-color PNG'})
  except Exception as ex:failures.append(f['path']+': '+str(ex))
 raise RuntimeError(folder['name']+': '+str(failures))
def generated(e):
 image=e['image'];data=(ROOT/image['path']).read_bytes()
 if len(data)!=image['bytes'] or digest(data)!=image['sha256']:raise ValueError('preview identity mismatch')
 return save(e['folder'],e['source'],data,{'kind':'geometry-preview' if e['source']['format'] in ('step','stp','stl') else 'embedded-fusion-preview','inputCommit':'f87d30a2b36f4ffd42fdbf4035f29a6583221631','inputImage':image,'operation':'aspect-fit 248x184 inside 256x192 neutral background; Lanczos, 128-color PNG'})
entries=[generated(e) for e in previous['entries']]; failures=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 futures={pool.submit(upstream,f):f['name'] for f in config['folders']}
 for future in concurrent.futures.as_completed(futures):
  try:entries.append(future.result());print('OK',futures[future],flush=True)
  except Exception as exc:failures.append({'folder':futures[future],'reason':str(exc)});print('FAIL',str(exc),flush=True)
entries.sort(key=lambda x:x['folder']);manifest={'version':1,'upstreamCommit':config['upstreamCommit'],'archiveCommit':config['commit'],'licence':'MIT','licenceUrl':config['licenceUrl'],'attribution':'Adafruit Industries; previews from original Adafruit CAD Parts images and geometry.','canvas':{'width':256,'height':192,'background':'#f4f7fa'},'entries':entries,'failures':failures}
(PROJECT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print('Generated',len(entries),'failures',len(failures),flush=True)
if failures:raise SystemExit(1)
