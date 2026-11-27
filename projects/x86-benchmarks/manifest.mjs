// MIT. Shared execution-route checks for the cache consumer and direct runner.
export function benchmarkRunnerKind(manifest, variant, runtimeBuild = null) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest))
    throw Error('unsupported benchmark consumer manifest');
  const raw = manifest.kind === 'native-i80386-raw';
  const nativeDos = manifest.kind === 'native-i80386-dos-shim';
  if (raw) {
    if (manifest.machine !== 'i80386-experimental' || manifest.format !== 'raw32' || manifest.fpu !== 'absent')
      throw Error('unsupported native benchmark manifest');
    if (variant !== '80386') throw Error('raw native i80386 image cannot run on the DOS path');
    if (runtimeBuild) throw Error('raw native images do not use the DOS build path');
    return 'native-i80386-raw';
  }
  if (nativeDos) {
    const program = manifest.program, slots = manifest.slots;
    if (manifest.machine !== 'i80386-experimental' || manifest.format !== 'mz' || manifest.fpu !== 'absent' ||
        program?.kind !== 'dos' || program.tool !== 'x86-benchmark' || program.variant !== '80386' ||
        !slots || Object.keys(slots).length !== 1 || typeof slots.exe !== 'string' || !slots.exe.trim())
      throw Error('unsupported native DOS benchmark manifest');
    if (variant !== '80386') throw Error('native DOS shim requires the native 80386 runner');
    if (runtimeBuild) throw Error('qualified native DOS images do not use the DOS build path');
    return 'native-i80386-dos-shim';
  }
  if (manifest.kind != null || manifest.program?.kind !== 'dos' || manifest.program?.tool !== 'run-dos')
    throw Error('unsupported benchmark consumer manifest');
  return variant === '80386' ? 'native-i80386-dos-shim' : 'dos';
}
