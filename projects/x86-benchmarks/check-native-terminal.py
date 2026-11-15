"""Independent retained-data audit; no producer import, emulator or guest replay."""
import copy, hashlib, json, math, re
from pathlib import Path
ROOT = Path(__file__).parent / 'results' / 'v3'

def audit(candidate, baseline, top, oracle):
    expected_image = 'f7003e37da058b1a41b8520b010c9791aafa10fa8a9cb11a4c0998055936b8ac'
    expected_media = '8942cff96b59a8cdf3300a1990bcb8a71b921f8e'
    for run in (candidate, baseline):
        assert run['success'] is True
        assert run['benchmarkSha256'] == expected_image
        assert run['runner']['mediaLabCommit'] == expected_media
        assert run['backend'].startswith('native i80386 core')
        conf = run['configuration']
        assert all(conf[k] is None for k in ('dosImage', 'biosImage', 'extender'))
        assert conf['fpu'] == 'absent'
        state = run['semantic']
        assert state['status'] == 'pass' and state['error'] is None
        assert state['result']['terminated'] and state['result']['exitCode'] == 0
        assert not state['result']['exhausted'] and not state['dos']['unsupported']
        assert state['guestInstructions'] == 24021261
        assert state['machineCycles'] == 144127566
        rows = [line.split() for line in state['stdout'].splitlines() if re.match(r'^\s*\d+\s+\d+\s+\d+\s+', line)]
        reference = [line.split() for line in oracle.splitlines() if re.match(r'^\s*\d+\s+\d+\s+\d+\s+', line)]
        assert len(rows) == len(reference) == 10
        values = [[float(value) for value in row] for row in rows]
        assert all(len(row) == 7 and all(math.isfinite(v) for v in row) for row in values)
        assert values == [[float(value) for value in row] for row in reference]
        assert 'Duration: 23 sec.' in state['stdout']
        assert 'Whetstones: 4.3 KIPS' in state['stdout']
        assert [x['handle'] for x in state['handledServices']] == [0, 1, 2, 1]
    assert candidate['emulatorCommit'] == 'fa26a41a21f3d948d49612ee2cdb26824334a53a'
    assert baseline['emulatorCommit'] == 'd19b5e4d2b8aa0f025fd7a3512db3252e470433d'
    for key in ('semantic', 'runner', 'configuration', 'benchmarkScore', 'assetProof'):
        assert candidate[key] == baseline[key], key
    assert top['success'] is False
    state = top['semantic']
    assert state['status'] == 'terminal-unqualified' and state['error'] is None
    assert state['result']['terminated'] and state['result']['exitCode'] == 4
    assert state['guestInstructions'] == 2222281 and state['machineCycles'] == 13933440
    assert [(x['int'], x['ah'], x['count']) for x in state['dos']['unsupported']] == [(16,17,1),(16,26,2),(16,18,2)]
    assert state['stdout'] == ''
    text = '\n'.join(state['screen'])
    expected = {'Score':19, 'Memory':923, 'Effective addressing':393, 'Opcode exercise':420,
                'Vid adapter speed':340, '3DGame opcode exercise':444}
    found = {name:int(value) for name,value in re.findall(r'^(Score|Memory|Effective addressing|Opcode exercise|Vid adapter speed|3DGame opcode exercise):\s*(\d+)', text, re.M)}
    assert found == expected
    return found

def main():
    inventory = json.loads((ROOT/'inventory.json').read_text())
    for name, item in inventory.items():
        data = (ROOT/name).read_bytes()
        assert len(data) == item['bytes'] and hashlib.sha256(data).hexdigest() == item['sha256'], name
    load = lambda name: json.loads((ROOT/name).read_text())
    c,b,t = (load(name) for name in ('whetstone-native-candidate.json','whetstone-native-baseline.json','topbench-native-terminal.json'))
    oracle = (ROOT/'whetstone-host-oracle.txt').read_text()
    scores = audit(c,b,t,oracle)
    for mutate in ('instructions','unsupported','nonfinite','different-image','top-pass'):
        cc,bb,tt = copy.deepcopy((c,b,t))
        if mutate == 'instructions': cc['semantic']['guestInstructions'] += 1
        elif mutate == 'unsupported': cc['semantic']['dos']['unsupported'] = [{'int':33,'ah':68,'count':1}]
        elif mutate == 'nonfinite': cc['semantic']['stdout'] = cc['semantic']['stdout'].replace('1.0000e+00','nan',1)
        elif mutate == 'different-image': bb['benchmarkSha256'] = '0'*64
        else: tt['success'] = True
        try: audit(cc,bb,tt,oracle)
        except (AssertionError, ValueError): pass
        else: raise AssertionError('negative control accepted: '+mutate)
    print('Native retained-data PASS: Whetstone terminal validation, same-image baseline, full captured state equal; five negative controls')
    print('TOPBENCH terminal-unqualified: exit4, screen observations '+json.dumps(scores)+'; unsupported INT10 AH11/1A/12 retained')
    print('Single observations only; no optimization, physical CPU/FPU or general timing claim')

if __name__ == '__main__': main()
