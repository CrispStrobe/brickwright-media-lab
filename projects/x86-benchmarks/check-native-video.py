"""Read only the immutable native TOPBENCH record; no producer imports/replay."""
import copy,hashlib,json,math,re
from pathlib import Path
ROOT=Path(__file__).parent/'results'/'v4'

def audit(run):
    assert run['success'] is True
    assert run['emulatorCommit']=='fa26a41a21f3d948d49612ee2cdb26824334a53a'
    assert run['benchmarkSha256']=='c739a73c6955d9798cfeae2d7b0c46011fdc9f943071ecf2bb730ebf4eab52eb'
    assert run['runner']['mediaLabCommit']=='81b5cea56114c36cef7c1f85c693a4ff707a4606'
    assert run['runner']['sha256']=='0c63b55d9bb589e81e71570fb0bcf24067dd39daebaebd446f14bdcadd939901'
    assert run['runner']['dependencies']['native-dos.mjs']=='7063ae8094a3fcdaef281780e6c25ac8d7aa3f738aafc65c10bca286090e1afa'
    config=run['configuration']
    assert config['clockHz']==6000000 and config['fpu']=='absent'
    assert all(config[k] is None for k in ('dosImage','biosImage','extender'))
    assert any(c['kind']=='cga' for c in config['config']['chips'])
    assert not any(c['kind']=='vga' for c in config['config']['chips'])
    state=run['semantic']
    assert state['status']=='pass' and state['error'] is None and state['videoQueriesValid'] is True
    assert state['nativeStartup']['protocol']=='native-i80386-dos-startup-v3'
    assert state['result']['terminated'] and state['result']['exitCode']==4 and not state['result']['exhausted']
    assert state['guestInstructions']==2222281 and state['machineCycles']==13933440
    assert not state['dos']['unsupported'] and not state['dos']['stdoutTruncated']
    assert state['stdout']=='' and state['resultOutput']=='screen'
    text='\n'.join(state['screen'])
    fields=['Score','Memory','Effective addressing','Opcode exercise','Vid adapter speed','3DGame opcode exercise']
    scores={}
    for field in fields:
        match=re.search('^'+re.escape(field)+r':\s*([0-9]+)\b',text,re.M)
        assert match,field
        scores[field]=int(match[1]); assert math.isfinite(scores[field]) and scores[field]>0
    assert scores==dict(zip(fields,[19,923,393,420,340,444]))==run['benchmarkScore']
    video=[x for x in state['handledServices'] if x['int']==16]
    assert len(video)==5
    expected=[(0x1130,0xb1),(0x1a00,0x1fba),(0x12db,0x1f10),(0x1a00,0x213e),(0x12b5,0x2110)]
    for item,(ax,bx) in zip(video,expected):
        assert item['outcome']=='absent-on-cga'
        assert item['request']==item['response']
        assert item['request']['ax']==ax and item['request']['bx']==bx
        assert set(item['request'])=={'ax','bx','cx','dx','es','bp'}
    return scores

def main():
    inventory=json.loads((ROOT/'inventory.json').read_text())
    for name,info in inventory.items():
        data=(ROOT/name).read_bytes()
        assert len(data)==info['bytes'] and hashlib.sha256(data).hexdigest()==info['sha256']
    record=json.loads((ROOT/'topbench-native-terminal.json').read_text())
    scores=audit(record)
    for mutation in ('missing-query','positive-vga','positive-ega','unsupported','exit','score','instructions'):
        changed=copy.deepcopy(record);s=changed['semantic']
        if mutation=='missing-query':s['handledServices'].pop()
        elif mutation=='positive-vga':s['handledServices'][2]['response']['ax']=0x1a1a
        elif mutation=='positive-ega':s['handledServices'][3]['response']['bx']=0
        elif mutation=='unsupported':s['dos']['unsupported']=[{'int':16,'ah':17,'count':1}]
        elif mutation=='exit':s['result']['exitCode']=0
        elif mutation=='score':s['screen']=[line for line in s['screen'] if not line.startswith('Score:')]
        else:s['guestInstructions']+=1
        try:audit(changed)
        except (AssertionError,ValueError):pass
        else:raise AssertionError('accepted corrupted record: '+mutation)
    print('Native TOPBENCH functional terminal PASS; 2222281 retired, zero unsupported services, five explicit CGA-negative responses')
    print('Seven independent damaged-record controls PASS; scores '+json.dumps(scores))
    print('Functional CGA shim only; no optimization/general-386/physical timing claim')

if __name__=='__main__':main()
