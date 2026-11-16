# Adafruit CAD Parts previews

These previews supplement folders in the Adafruit CAD Parts archive that have no standalone JPG, PNG or GIF. The manifest binds each image to the exact SHA-256 and length of its source file in the immutable original archive. The source archive corresponds to Adafruit revision `9f2a89f3d5c3491886d58cb7fe83385417563cf4`, mirrored at revision `fb6c7632c50e9a1d58ab57167d6d3f9f9365ae73`. Original files are MIT licensed, copyright Adafruit Industries; see the original [licence](https://github.com/adafruit/Adafruit_CAD_Parts/blob/9f2a89f3d5c3491886d58cb7fe83385417563cf4/LICENSE).

STEP and STL previews are rendered from tessellated source geometry using a fixed isometric camera and neutral shading. The two Fusion-only previews are the embedded `FusionAssetName[Active]/Previews/small.png` assets extracted from the source F3D archives. The images are illustrative views; they do not establish units or mechanical suitability. The manifest records any source folders for which no preview could be generated.

To regenerate, create a Python 3.11 environment with `cadquery-ocp==7.8.1.1`, `numpy==2.4.6` and `pillow==13.0.0`; then run from repository root:

```sh
python scripts/generate-adafruit-previews.py
python scripts/generate-adafruit-extra-previews.py
```

The scripts download original files from the pinned mirror, verify their length and SHA-256 before processing, and write the preview PNGs and manifest. STEP conversion uses a per-source time limit and reports failures. Render output may vary between platforms and library builds; the committed images are identified by their own SHA-256 hashes.
