# Bad Apple on the Ben Eater 6502

Upstream: <https://github.com/NormalLuser/Ben-Eater-Bad-Apple> (GPL-3.0)

The unmodified `BadApple37FPS` player, streaming its SD image through a
bit-banged VIA SPI card — SPI clock on the VIA's CA2 read-handshake
pulse ("USE CA2 as clock to save more cycles!!!"), video painted into
the world's-worst-video-card window at $2000.

Machine facts (encoded in the manifest):
- 5 MHz clock; RAM $0000-$3FFF; player ORG $1800 (RAM program)
- SD: CS=PB5, MOSI=PB3, SCK=CA2 pulse, MISO=PA0
- framebuffer window $2000-$3FFF (100x64 in 128-byte rows)
- bench precondition: DDRB=$FF (the real build inherits it from the
  loader session; the player never writes it)

Note: the Bad Apple animation is a fan work with its own upstream
rights history; this project therefore FETCHES from the author's repo
rather than re-hosting the data. Steamboat Willie next door is the
public-domain-film variant of the same rig.
