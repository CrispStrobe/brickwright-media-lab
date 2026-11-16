#!/usr/bin/env python3
# SPDX-License-Identifier: BSD-3-Clause
"""Render original Adafruit CAD geometry. Python 3.11; cadquery-ocp==7.8.1.1, numpy, Pillow.

Run from repository root: python scripts/generate-adafruit-previews.py
Source files are downloaded from an immutable, SHA-256-verified archive. Each
conversion runs in a subprocess with a bounded time; failures remain explicit.
"""
import hashlib, json, os, subprocess, sys, tempfile, urllib.parse, urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PROJECT=ROOT/'projects/adafruit-previews'

def digest(data): return hashlib.sha256(data).hexdigest()
def render(source, output):
 import numpy as np
 from PIL import Image, ImageDraw
 from OCP.STEPControl import STEPControl_Reader
 from OCP.IFSelect import IFSelect_RetDone
 from OCP.TopExp import TopExp_Explorer
 from OCP.TopAbs import TopAbs_FACE
 from OCP.TopoDS import TopoDS
 from OCP.BRep import BRep_Tool
 from OCP.BRepMesh import BRepMesh_IncrementalMesh
 from OCP.TopLoc import TopLoc_Location
 reader=STEPControl_Reader()
 if reader.ReadFile(source)!=IFSelect_RetDone: raise ValueError('STEP read failed')
 reader.TransferRoots(); shape=reader.OneShape()
 BRepMesh_IncrementalMesh(shape,0.15,False,0.3,True).Perform()
 faces=[]; exp=TopExp_Explorer(shape,TopAbs_FACE)
 while exp.More():
  face=TopoDS.Face_s(exp.Current()); loc=TopLoc_Location(); tri=BRep_Tool.Triangulation_s(face,loc)
  if tri:
   points=[]
   for i in range(1,tri.NbNodes()+1):
    p=tri.Node(i).Transformed(loc.Transformation()); points.append((p.X(),p.Y(),p.Z()))
   xyz=np.asarray(points); inds=np.array([tri.Triangle(i).Get() for i in range(1,tri.NbTriangles()+1)])-1
   if len(inds): faces.append(xyz[inds])
  exp.Next()
 if not faces: raise ValueError('no tessellated faces')
 triangles=np.concatenate(faces)
 if len(triangles)>500000: raise ValueError('too many triangles')
 # Fixed isometric camera, centered and scaled to all source geometry.
 right=np.array([0.70710678,-0.70710678,0.]); up=np.array([-0.40824829,-0.40824829,0.81649658]); view=np.cross(right,up)
 xy=triangles @ np.stack((right,up),axis=1); lo=xy.min(axis=(0,1)); hi=xy.max(axis=(0,1)); span=max(hi-lo)
 if not np.isfinite(span) or span<=0: raise ValueError('invalid geometry bounds')
 xy=(xy-(lo+hi)/2)*(276/span); xy[:,:,0]+=160; xy[:,:,1]=160-xy[:,:,1]
 depth=(triangles @ view).mean(axis=1); normals=np.cross(triangles[:,1]-triangles[:,0],triangles[:,2]-triangles[:,0]); lengths=np.linalg.norm(normals,axis=1); normals/=np.maximum(lengths[:,None],1e-20)
 light=np.array([0.4,-0.3,0.866]); shade=np.abs(normals@light); image=Image.new('RGB',(320,320),(244,247,250)); draw=ImageDraw.Draw(image)
 for i in np.argsort(depth):
  intensity=int(125+85*shade[i]); draw.polygon([tuple(p) for p in xy[i]],fill=(intensity-17,intensity-7,intensity))
 image.save(output,optimize=True)

if len(sys.argv)>1 and sys.argv[1]=='--render': render(sys.argv[2],sys.argv[3]);sys.exit()
config=json.loads((PROJECT/'sources.json').read_text());out=PROJECT/'images';out.mkdir(exist_ok=True)
entries=[]; failures=[]
for folder in config['folders']:
 candidates=sorted((f for f in folder['files'] if f['format'] in ('step','stp')),key=lambda x:x['bytes'])
 if not candidates: failures.append({'folder':folder['name'],'reason':'Archive root contains metadata, not a component' if folder['name']=='Adafruit archive files' else 'No STEP geometry available'});continue
 success=False
 for src in candidates:
  name=digest(folder['name'].encode())[:24]+'.png'; dest=out/name
  try:
   url=config['baseUrl']+'/'.join(urllib.parse.quote(p,safe='') for p in src['path'].split('/'))
   with urllib.request.urlopen(url,timeout=60) as response: data=response.read(src['bytes']+1)
   if len(data)!=src['bytes'] or digest(data)!=src['sha256']: raise ValueError('source identity mismatch')
   with tempfile.NamedTemporaryFile(suffix='.step') as original:
    original.write(data);original.flush()
    result=subprocess.run([sys.executable,__file__,'--render',original.name,str(dest)],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,timeout=60)
    if result.returncode: raise RuntimeError(result.stderr.decode(errors='replace')[-300:])
   img=dest.read_bytes(); entries.append({'folder':folder['name'],'image':{'path':'projects/adafruit-previews/images/'+name,'bytes':len(img),'sha256':digest(img),'format':'png'},'source':{k:src[k] for k in ('path','bytes','sha256','format')}});success=True;print('OK',folder['name'],flush=True);break
  except Exception as error:
   dest.unlink(missing_ok=True); print('FAIL',folder['name'],str(error)[:150],flush=True)
 if not success: failures.append({'folder':folder['name'],'reason':'STEP conversion failed or timed out'})
 manifest={'version':1,'upstreamCommit':config['upstreamCommit'],'archiveCommit':config['archiveCommit'],'licence':'MIT','licenceUrl':config['licenceUrl'],'attribution':'Adafruit Industries; generated from original Adafruit CAD geometry.','renderer':'Open CASCADE tessellation and fixed isometric projection','entries':entries,'failures':failures}
 (PROJECT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Generated',len(entries),'previews; failures',len(failures))
