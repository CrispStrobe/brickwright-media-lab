"""Read committed observations only; no producer imports or guest execution."""
import copy
import hashlib
import json
import math
from pathlib import Path
import statistics
import sys

ROOT = Path(__file__).resolve().parent
METRICS = ['cpuSeconds', 'wallSeconds', 'executionCpuSeconds', 'executionWallSeconds']
OUTPUT = 'NATIVE386 SIEVE n=8192 passes=20 primes=1028 sum=3908641\n'


def verify_native(rows, summary, raw_bytes):
    raw = json.loads(raw_bytes)
    assert summary['baseline'] == 'd19b5e4d2b8aa0f025fd7a3512db3252e470433d'
    assert summary['candidate'] == 'fa26a41a21f3d948d49612ee2cdb26824334a53a'
    assert summary['media'] == 'cb3649e73726b09f199dfac9f8c158e5e7589dcd'
    assert raw['emulatorCommit'] == summary['candidate']
    assert raw['runner']['mediaLabCommit'] == summary['media']
    assert raw['success'] and raw['semantic']['stdout'] == OUTPUT
    assert raw['semantic']['guestInstructions'] == 2075296
    assert raw['semantic']['machineCycles'] == 12451776
    assert raw['configuration']['loadAddress'] == raw['configuration']['entry'] == 0x10000
    assert raw['configuration']['fpu'] == 'absent'
    assert all(raw['configuration'][k] is None for k in ['dosImage', 'biosImage', 'extender'])
    state_hash = hashlib.sha256(json.dumps(raw['semantic'], sort_keys=True,
                                           separators=(',', ':')).encode()).hexdigest()
    assert len(rows) == 18
    assert {(r['pair'], r['arm']) for r in rows} == {
        (i, arm) for i in range(9) for arm in ['baseline', 'candidate']}
    for row in rows:
        assert row['measured'] == (row['pair'] >= 2) and row['exitCode'] == 0
        assert row['stdout'] == OUTPUT and row['capturedStateSha256'] == state_hash
        assert row['guestInstructions'] == 2075296 and row['machineCycles'] == 12451776
        assert row['emulatorCommit'] == summary[row['arm']]
        assert all(math.isfinite(row[k]) and row[k] > 0 for k in METRICS)
        if row['pair'] == 2 and row['arm'] == 'candidate':
            assert row['originalRecordSha256'] == hashlib.sha256(raw_bytes).hexdigest()
    observed = summary['nativeSieve']
    assert observed['warmupPairs'] == 2 and observed['measuredPairs'] == 7
    assert observed['children'] == 18 and observed['guestEquality']
    for metric in METRICS:
        means = {arm: statistics.mean(r[metric] for r in rows if r['measured'] and r['arm'] == arm)
                 for arm in ['baseline', 'candidate']}
        for arm, value in means.items():
            assert math.isclose(value, observed['means'][arm][metric], rel_tol=1e-12)
        ratio = means['candidate'] / means['baseline']
        assert math.isclose(ratio, observed['ratios'][metric], rel_tol=1e-12)
        favorable = sum(next(r[metric] for r in rows if r['pair'] == i and r['arm'] == 'candidate') <
                        next(r[metric] for r in rows if r['pair'] == i and r['arm'] == 'baseline')
                        for i in range(2, 9))
        assert favorable == observed['favorablePairs'][metric]
    assert math.isclose(observed['ratios']['cpuSeconds'], 1.009895448247507, rel_tol=1e-12)
    assert math.isclose(observed['ratios']['wallSeconds'], 1.0132271135574673, rel_tol=1e-12)
    assert observed['ratios']['cpuSeconds'] > 1 and observed['ratios']['wallSeconds'] > 1


def main():
    summary = json.loads((ROOT / 'results/v2/independent-summary.json').read_text())
    rows = json.loads((ROOT / 'results/v2/raw-pair-outputs.json').read_text())
    raw_bytes = (ROOT / 'results/v2/native-candidate-raw.json').read_bytes()
    verify_native(rows, summary, raw_bytes)
    asset = json.loads((ROOT / 'native-sieve/assets.json').read_text())
    assert json.loads(raw_bytes)['benchmarkSha256'] == asset['files']['SIEVE.BIN']['sha256']
    for benchmark in ['topbench', 'whetstone']:
        for variant in ['80386', '80286', '80186', '8086']:
            record = json.loads((ROOT / f'results/v1/{benchmark}-{variant}.json').read_text())
            assert not record['success'] and record['semantic']['status'] == 'incomplete'
            assert record['semantic']['result']['exhausted']
            assert record['semantic']['result']['steps'] == 20000000
            assert record['semantic']['dos']['unsupported'] and record['benchmarkScore'] == {}
    if '--self-test' in sys.argv:
        for field, value in [('cpuSeconds', 999), ('guestInstructions', 0),
                             ('stdout', 'changed'), ('capturedStateSha256', 'changed')]:
            changed = copy.deepcopy(rows)
            changed[4][field] = value
            try:
                verify_native(changed, summary, raw_bytes)
            except AssertionError:
                continue
            raise AssertionError('reader admitted changed ' + field)
        print('Four timing/instruction/output/state negative controls PASS')
    print('Recorded native Sieve: 18 matching captured states; CPU 1.009895 / wall 1.013227; NO speedup')
    print('Recorded TOPBENCH/Whetstone: INCOMPLETE on all four cores; no valid scores')
    print('Data-reader checks only; no benchmark was run')


if __name__ == '__main__':
    main()
