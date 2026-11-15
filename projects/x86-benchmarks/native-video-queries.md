# Native CGA capability-query contract

The fixed `PCAT80386_EXPERIMENTAL` configuration carries a CGA chip, no VGA,
no EGA and no font ROM image. This adapter does not add those capabilities.
It implements only TOPBENCH's observed extension probes as **negative
capability responses**, preserving caller registers and saved FLAGS. Both
request and response are retained in `semantic.handledServices`.

- AX1130/BH00 is an EGA-or-later font-information extension. On this CGA-only
  BIOS contract the request returns unchanged, including ES:BP/CX/DX; it does
  not produce a font pointer or a valid font-height response. Other BH values
  remain unimplemented, as do font setters.
- AX1A00 normally signals support with AL1A. This CGA-only response preserves
  AL00 and BX, so the caller cannot infer VGA/MCGA support. AX1A01 is refused.
- AH12/BL10 preserves BX/CX for absent EGA. It never fabricates EGA memory or
  feature bits. All other AH12 subfunctions remain unimplemented.

The underlying owned BIOS source uses the same register-preserving default
for unimplemented video extensions: [fixed source table and v_exit](https://github.com/CrispStrobe/bw-board/blob/fa26a41a21f3d948d49612ee2cdb26824334a53a/rom/bios.asm#L1140).
The adapter implements the observed calls directly; it does not boot that ROM.
The contracts and absence checks are documented in the primary
[font-information interface](https://fd.lod.bz/rbil/interrup/video/101130.html),
[display-combination interface](https://fd.lod.bz/rbil/interrup/video/101a00.html)
and [EGA-information interface](https://fd.lod.bz/rbil/interrup/video/1012_bl10.html).

The terminal gate additionally requires the exact five observed query kinds
in order, explicit `absent-on-cga` outcomes and unchanged complete return
register tuples. Missing/extra calls or fabricated positive capabilities fail.
The existing zero-unsupported-service, exit4 and six finite-positive-screen-row
gates remain. Native instruction tests execute the real INT/return path;
negative controls cover other selectors, setters, subfunctions, a VGA profile,
protected mode and damaged query records. This is a bounded shim contract,
not general video BIOS compatibility or physical hardware qualification.
