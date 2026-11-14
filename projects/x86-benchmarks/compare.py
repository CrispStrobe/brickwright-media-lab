"""Alternating fresh-child pairs; scores and host throughput remain separate."""
import argparse,json,resource,statistics,subprocess,time
from pathlib import Path

def equivalent(a,b):
    if not a.get('success') or not b.get('success'):
        raise ValueError('a failed/incomplete guest cannot qualify a timing pair')
    for key in ['benchmarkSha256','variant','configuration','benchmarkScore','semantic']:
        if a[key]!=b[key]:raise ValueError('guest/configuration mismatch: '+key)

def main():
    p=argparse.ArgumentParser(description=__doc__)
    for k in ['baseline','candidate','project','output']:p.add_argument('--'+k,type=Path,required=True)
    p.add_argument('--variant',default='80386',choices=['8086','80186','80286','80386'])
    p.add_argument('--max',type=int,default=20000000);p.add_argument('--timeout',type=float,default=180)
    p.add_argument('--pairs',type=int,default=7);p.add_argument('--warmups',type=int,default=2)
    a=p.parse_args();assert a.pairs>=1 and a.warmups>=0 and a.max>0 and a.timeout>0
    a.output.mkdir(parents=True,exist_ok=False);samples=[];reference=None
    try:
        for i in range(a.warmups+a.pairs):
            pair={}
            for arm in (['baseline','candidate'] if i%2==0 else ['candidate','baseline']):
                cmd=['node',str(Path(__file__).with_name('run.mjs')),'--board',str(getattr(a,arm).resolve()),'--project',str(a.project.resolve()),'--variant',a.variant,'--max',str(a.max)]
                before=resource.getrusage(resource.RUSAGE_CHILDREN);start=time.monotonic()
                result=subprocess.run(cmd,capture_output=True,timeout=a.timeout)
                after=resource.getrusage(resource.RUSAGE_CHILDREN)
                base=a.output/f'pair-{i:02d}-{arm}'
                base.with_suffix('.stdout').write_bytes(result.stdout);base.with_suffix('.stderr').write_bytes(result.stderr)
                record=json.loads(result.stdout);base.with_suffix('.json').write_text(json.dumps(record,indent=2)+'\n')
                sample={'pair':i,'arm':arm,'measured':i>=a.warmups,'cpuSeconds':after.ru_utime+after.ru_stime-before.ru_utime-before.ru_stime,'wallSeconds':time.monotonic()-start,'exitCode':result.returncode,'emulatorCommit':record['emulatorCommit']}
                samples.append(sample);pair[arm]=record
                if not record['success']:raise ValueError('guest '+record['semantic']['status']+'; see retained raw output')
                if reference is None:reference=record
                equivalent(reference,record)
            equivalent(pair['baseline'],pair['candidate'])
        measured=[s for s in samples if s['measured']]
        means={arm:{k:statistics.mean(s[k] for s in measured if s['arm']==arm) for k in ['cpuSeconds','wallSeconds']} for arm in ['baseline','candidate']}
        out={'pass':True,'semanticEquality':True,'samples':samples,'means':means,'ratios':{k:means['candidate'][k]/means['baseline'][k] for k in ['cpuSeconds','wallSeconds']},'favorablePairs':{k:sum(next(s[k] for s in measured if s['pair']==i and s['arm']=='candidate')<next(s[k] for s in measured if s['pair']==i and s['arm']=='baseline') for i in range(a.warmups,a.warmups+a.pairs)) for k in ['cpuSeconds','wallSeconds']},'benchmarkScore':reference['benchmarkScore']}
    except Exception as e:
        out={'pass':False,'error':str(e),'completedChildren':len(samples),'samples':samples}
        (a.output/'result.json').write_text(json.dumps(out,indent=2)+'\n');raise
    (a.output/'result.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out))
if __name__=='__main__':main()
