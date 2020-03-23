# Castaphone

A pure JavaScript in-browser dictaphone / screencaster.

## Quickstart

```js
<script type="module">
  import {Castaphone} from "https://defeo.lu/castaphone/castaphone.js";
  let cast = new Castaphone();
</script>
```

## Demo

<https://defeo.lu/castaphone>

## Pre-set keys

- `Ctrl+Z`: start capture.
- `Shift+Ctrl+M`: open recording monitor.
- `F1`: record (dictaphone mode).
- `F2`: record (toggle mode).
- `Ctrl+Space`: playback last recorded sound.
- `Ctrl+Shift+Space`: playback last recorded sound and video.
- `Ctrl+Backspace`: Move last recorded chunk to thrash.
- `Shift+Ctrl+Backspace`: Recover last chunk from thrash
- `Ctrl+S`: download all recorded chunks as a tarball.
- `Shift+Ctrl+Z`: stop capture.

## Documentation

**Warning!** uBlock is known to block the opening of the monitor
window. Better turn off your ad blocker if you want to use Castaphone
for recording.

### Using Castaphone

Castaphone is based on a very simple concept: make a long screencast
by recording many small *chunks* individually. A chunk is recorded
while a key is held pressed (usually `F1`, but it can be configured).

After a chunk is recorded, you can immediately listen to it
(`Ctrl+Space`), and if you don't like it you can discard it
(`Ctrl+Backspace`) and start again.

A monitor (`Shifts+Ctrl+M`) lets you keep an eye on the status of
Castaphone, and on the list of the chunks you recorded and those you
discarded.

In the end, you have a long list of chunks, which you can download as
a tarball (`Ctrl+S`), and combine with your favorite video editing
program.

Castaphone was primarily developed for recording lectures with HTML
slides, interactive demos, and voice-over.  It was designed around my
way of recording lectures: taking many times the same sentence until
it is perfect, pausing to breathe between takes.  The tight
record-listen-erase-record loop used to save me a lot of time in
post-production!

I hope you will find Castaphone useful for your application. It is a
very small program (less than 12K of uncompressed JavaScript), and is
highly customizable: you can capture any window (not only your
browser), or the stream from a webcam, customize the keyboard
shortcuts, and integrate it in your web application.

### Customizing Castaphone

Castaphone is a single JavaScript file. To install it in your page,
import it as an ES6 module with (change the URL if you host the file
somewhere else):

```js
import {Castaphone} from "https://defeo.lu/castaphone/castaphone.js";
```

Then, create a Castaphone instance with

```js
new Castaphone(options);
```

`options` is an object that can contain the following fields:

- `constraints`: a constraint object as defined by the [MediaStream
  API](https://developer.mozilla.org/en-US/docs/Web/API/Media_Streams_API/Constraints);
- `recorder`: these options are passed to a
  [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/MediaRecorder)
  object used for recording;
- `keys`: a dictionary to customize the keyboard shortcuts, it is set by default to:
  
  ```js
  {
    onoff: 'KeyZ',
    dictate: 'F1',
    toggle: 'F2',
    thrash: 'Backspace',
    play: 'Space',
    monitor: 'KeyM',
    save: 'KeyS',
  }
  ```

A `Castaphone` object has the following properties:

- `state`: equals `"inactive"`, `"recording"` or `"paused"`.

And the following public methods:

- `run()`: Start the capture. This clears all buffers, it may loose
  unsaved data. (`Ctrl+Z`)

- `record()`: Start recording an audio/video chunk. (`F1`)

- `chunk()`: Stop recording, and save the chunk to the list. (`F1`)

- `toggle()`: Alternatively start/stop recording a chunk. (`F2`)

- `playLast(video=false)`: Play the last chunk. If `video=false`, only
  play audio; play both audio and video otherwise. (`(Shift)+Ctrl+Space`)

- `rewind()`: Put the latest chunk from the chunk list to the thrash
  can. (`Ctrl+Backspace`)

- `restore()`: Restore the latest chunk from the thrash can to the
  chunk list. (`Shift+Ctrl+Backspace`)

- `save()`: Download all chunks in the chunk list as a
  tarball. (`Ctrl+S`)

- `halt()`: Stop the capture. It is not possible anymore to record,
  but it is still possible to move chunks between the list and the
  thrash, and to download a tarball. (`Shift+Ctrl+Z`)


### Compatibility

Castaphone uses modern Web technologies such as WebRTC and ES6, it
thus requires a modern standard compliant browser.

For the moment, Castaphone has been tested only in Firefox 74 or
higher. More browsers will come if there is an interest.


## FAQ

#### How do I open the `.tar` archive?

On Linux, Mac and Windows 10 systems, you can decompress tar archives
using the GNU tar program from the command line:

```bash
tar xf file.tar
```

Alternatively, graphical programs such as
[7-Zip](https://www.7-zip.org/) can also open tar files.


#### How do I concatenate the chunks in one single video?

You can use any video editing program, or you can use
[FFmpeg](https://ffmpeg.org/) from the command line:

```bash
ls *.webm | xargs -n1 echo file > filelist.txt
ffmpeg -f concat -i filelist.txt -codec copy out.webm
```


#### Can I record PDF or PowerPoint presentations?

You can record anything you can show on your screen: the browser gives
you the choice between capturing a single window, or the entire
screen.

To record a PowerPoint presentation, open it, launch Castaphone and
point the browser to the PowerPoint window. **Warning:** to control
the recording, the focus needs to be on the browser window, otherwise
Castaphone will not receive the keystrokes.

It is easier to do this with a large screen or a dual screen setting,
where you can put the PowerPoint and the browser windows side-to-side.
But, even if your browser window partially covers the PowerPoint
window, Castaphone will still record exclusively what's on the
PowerPoint. So you can manage even on small screens.

Admittedly, this can be a bit annoying if you need to frequently
switch focus to advance the presentation and then come back to
Castaphone. For PDFs, you have an alternative option: load the PDF in
the same window as Castaphone using
<https://defeo.lu/castaphone/pdf/>.


#### I cannot start the recording

Check that your operating system is not blocking screen and microphone
sharing sharing.

In Windows 10, go to Start > Settings > Privacy > Camera.


#### How do I post-process the video?

You can use any video editing program of your liking. I personally
like [kdenlive](https://kdenlive.org/en/) and
[OpenShot](https://www.openshot.org/).


#### What format should I save the final video to?

This is a difficult question. If you are going to host your video on a
commercial platform (YouTube, Vimeo, etc.), just save it to a high
quality format, because the platform will do transcoding to its
preferred formats anyway.

If you inted to self-host your video, here's some useful info:

- Support for different formats varies among browsers. See this table:
  <https://en.wikipedia.org/wiki/HTML5_video#Browser_support>. In
  short, `.mp4` (h264) is the most supported format, followed closely
  by `.webm` (vp8 or vp9).

- Both h264 and vp8/9 can achieve impressive compression rates for
  videos that contain mostly still images (such as slideshows),
  however the default settings are usually not optimized for this use
  case. Reduce your framerate (12 fps is enough for slides), and
  experiment with various quality settings for the codec (in my
  experience, `crf=20` to `crf=30` is good for vp8/9).
  
  And do not forget that reducing resolution is the easiest way to
  save tons of bandwidth: do you really need it to be 1080p?

- If your audio only contains voice, the typical codec setting is way
  too high. 128 kbps is definitely enough for mp3, and 96 kbps is
  enough for aac and vorbis (the audio codecs used in `.mp4` and
  `.webm`, respectively). I find the opus codec at 96kbps gives the
  best results for voice recordings, and is compatible with `.webm`.


#### How do I make more complex recordings?

Castaphone is a very basic program, with one specific recording
routine in mind. If you need to record complex videos with multiple
video and audio sources, I recommend using a more powerful tool, such
as the amazing [OBS studio](https://obsproject.com/).
