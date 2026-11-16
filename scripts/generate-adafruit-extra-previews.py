#!/usr/bin/env python3
# SPDX-License-Identifier: BSD-3-Clause
"""Supplement STEP renders with source-verified STL renders and Fusion embedded previews.
Run after generate-adafruit-previews.py. Requires Python 3.11, numpy, Pillow.
"""
import hashlib,io,json,re,struct,urllib.parse,urllib.request,zipfile
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]; PROJECT=ROOT/'projects/adafruit-previews'
c=json.loads((PROJECT/'sources.json').read_text()); manifest=json.loads((PROJECT/'manifest.json').read_text())
def digest(b):return hashlib.sha256(b).hexdigest()
def stl_render(data):
 if len(data)>=84 and 84+50*struct.unpack_from('<I',data,80)[0]==len(data):
  count=struct.unpack_from('<I',data,80)[0]; record=np.dtype([('normal','<f4',(3,)),('vertices','<f4',(3,3)),('attr','<u2')]); triangles=np.frombuffer(data,dtype=record,count=count,offset=84)['vertices'].astype(float)
 else:
  coords=re.findall(rb'\bvertex\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)',data,re.I); triangles=np.array(coords,dtype=float).reshape((-1,3,3))
 if not len(triangles) or len(triangles)>500000 or not np.isfinite(triangles).all():raise ValueError('invalid STL')
 right=np.array([0.70710678,-0.70710678,0.]); up=np.array([-0.40824829,-0.40824829,0.81649658]); view=np.cross(right,up);xy=triangles@np.stack((right,up),axis=1);lo=xy.min(axis=(0,1));hi=xy.max(axis=(0,1));span=max(hi-lo)
 if span<=0:raise ValueError('invalid STL bounds')
 xy=(xy-(lo+hi)/2)*(276/span);xy[:,:,0]+=160;xy[:,:,1]=160-xy[:,:,1];depth=(triangles@view).mean(axis=1);normals=np.cross(triangles[:,1]-triangles[:,0],triangles[:,2]-triangles[:,0]);normals/=np.maximum(np.linalg.norm(normals,axis=1)[:,None],1e-20);shade=np.abs(normals@np.array([0.4,-0.3,0.866]));image=Image.new('RGB',(320,320),(244,247,250));draw=ImageDraw.Draw(image)
 for i in np.argsort(depth):
  intensity=int(125+85*shade[i]);draw.polygon([tuple(p) for p in xy[i]],fill=(intensity-17,intensity-7,intensity))
 b=io.BytesIO();image.save(b,format='PNG',optimize=True);return b.getvalue()
for folder in c['folders']:
 if folder['name'] not in ('1602 CAP1188','355 MOSFET P-channel','2895 Relay Feather Wing','3429 Mini Arcade Button'):continue
 fusion=folder['name'] in ('2895 Relay Feather Wing','3429 Mini Arcade Button');src=next(x for x in folder['files'] if x['format']==('f3d' if fusion else 'stl'))
 url=c['baseUrl']+'/'.join(urllib.parse.quote(p,safe='') for p in src['path'].split('/'))
 with urllib.request.urlopen(url,timeout=60) as response:data=response.read(src['bytes']+1)
 assert len(data)==src['bytes'] and digest(data)==src['sha256']
 if fusion:
  with zipfile.ZipFile(io.BytesIO(data)) as z:img=z.read('FusionAssetName[Active]/Previews/small.png')
  with Image.open(io.BytesIO(img)) as im:im.verify()
 else:img=stl_render(data)
 name=digest(folder['name'].encode())[:24]+'.png';(PROJECT/'images'/name).write_bytes(img)
 manifest['entries']=[e for e in manifest['entries'] if e['folder']!=folder['name']];manifest['entries'].append({'folder':folder['name'],'image':{'path':'projects/adafruit-previews/images/'+name,'bytes':len(img),'sha256':digest(img),'format':'png'},'source':{k:src[k] for k in ('path','bytes','sha256','format')}})
 manifest['failures']=[e for e in manifest['failures'] if e['folder']!=folder['name']];print('OK',folder['name'])
manifest['renderer']='Open CASCADE STEP and STL tessellation with fixed isometric projection; Fusion embedded source previews'
(PROJECT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
