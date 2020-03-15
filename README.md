# Castaphone

A pure JavaScript in-browser dictaphone / screen caster.

## Quickstart

```js
<script>
  import {Castaphone} from "https://defeo.lu/castaphone/castaphone.js";
  let cast = new Castaphone();
</script>
```

## Demo

<https://defeo.lu/castaphone>.

## Keys

- `Ctrl+L`: start capture.
- `Shift+Ctrl+M`: open recording monitor.
- `F1`: record (dictaphone mode).
- `F2`: record (toggle mode).
- `Ctrl+Space`: playback last recorded sound.
- `Ctrl+Shift+Space`: playback last recorded sound and video.
- `Ctrl+Backspace`: Move last recorded chunk to thrash.
- `Shift+Ctrl+Backspace`: Recover last chunk from thrash
- `Ctrl+S`: download all recorded chunks as a tarball.
- `Shift+Ctrl+L`: stop capture.
