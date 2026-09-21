#!/usr/bin/env bash
# Fetch ALICE: The Personal Pascal (1985) -- released as freeware under the Perl
# Artistic License by its author Brad Templeton. We pull the "small" build's
# runnable file set from the DosWorld/alicepascal mirror and verify each sha256.
set -euo pipefail
BASE="https://raw.githubusercontent.com/DosWorld/alicepascal/master/alice-binaries"
LIC="https://raw.githubusercontent.com/DosWorld/alicepascal/master/README.MD"

fetch () { curl -fL -o "$2" "$BASE/$1"; }
fetch alice.exe     alice.exe
fetch apin.exe      apin.exe
fetch ap.ini        ap.ini
fetch apbuilt.suf   apbuilt.suf
fetch aptempla.suf  aptempla.suf
fetch nlbegin.suf   nlbegin.suf
fetch helpfile.huf  helpfile.huf
curl -fL -o LICENSE.README.MD "$LIC"   # states: free under the Perl Artistic Licence

sha256sum -c - <<'SHA'
d272d038643c8f5a52d39722fc998a183a4adbb5ed470f1ea6d47315154c846c  alice.exe
5bbb217ecd9b3da7d0afe9acf865415e174461c0bbb1f42061628dbf87f599b7  apin.exe
8a1e6f89d0670a549d0b03c272ff0b3eb5559520a16698db06725e43ac971c9a  ap.ini
a29a19df2adbefb2672a662dda7809038075bc9abefcb2ec68704ef0c2b34e84  apbuilt.suf
f5528338640184bb7c6f0ca183bd26575dccdc2a3d5aa52aa9ab723130d326bd  aptempla.suf
72b8193a4f28a8f1bc040d5a8eca22bbe2c9bcf7c4ced920f78e1cd4f0c7dc11  nlbegin.suf
113af8abff901068bca1bbf6dd626f1fe2d31abd2b9a0fab9e92bb5b0558c1f6  helpfile.huf
SHA

echo "fetched ALICE Pascal (verified, Perl Artistic Licence / freeware). Put all"
echo "files in ONE directory on a BOOTED DOS (the free-386 FreeDOS, or an 8086"
echo "FreeDOS) and run 'alice'. It needs a real DOS: it self-locates its .suf"
echo "overlays via the DOS 3.0+ PSP program path, which run-dos's minimal service"
echo "lacks. On FreeDOS it reaches the ALICE main menu / editor."
