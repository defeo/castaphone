export class Castaphone {
    constructor(opts) {
        this.options = Object.assign({}, {
            constraints: {
                audio: true,
                video: {
                    mediaSource: 'window',
                },
            },
            recorder: {
                mimeType: 'video/webm',
            },
        }, opts);
	this.keys = Object.assign({}, {
	    onoff: 'KeyZ',
	    dictate: 'F1',
	    toggle: 'F2',
	    thrash: 'Backspace',
	    play: 'Space',
	    monitor: 'KeyM',
	    save: 'KeyS',
	}, opts && opts.keys);
	
	this.stream = null;
	this.chunks = [];
	this.thrash = [];
        this.visu = null;
	this.video = document.createElement('video');
	document.body.appendChild(this.video);
	this.download = document.createElement('a');
	document.body.appendChild(this.download);
	this.video.style.display = this.download.style.display = 'none';
	
        this.keyboard();
	this.video.addEventListener('play', (e) => this.notifyVisu());
	this.video.addEventListener('pause', (e) => this.notifyVisu());
	
	window.addEventListener('message', (e) => {
            if (e.origin == window.origin && e.source === this.visu) {
		if (e.data.action == 'update')
                    this.notifyVisu();
            }
	});
	window.addEventListener('beforeunload', (e) => this.state != 'inactive' && e.preventDefault());
    }
    
    get state() {
	return this.stream === null
	    ? 'inactive'
	    : this.rec.state == 'recording'
	    ? 'recording'
	    : 'paused';
    }

    run() {
	if (this.state == 'inactive') {
            return navigator.mediaDevices.getUserMedia(this.options.constraints).then((stream) => {
		this.stream = stream;
		this.rec = new MediaRecorder(stream, this.options.recorder);
		this.buffer = [];
		this.chunks = [];
		this.thrash = [];
		this.download.download = this.options.fileName || (new Date()).toISOString() + '.tar';
		
		this.rec.ondataavailable = (e) => {
                    console.log('data');
                    this.buffer.push(e.data);
                    if (this.rec.state == 'inactive') {
			this.chunks.push({
			    time: new Date(),
			    data: new Blob(this.buffer, { type: this.rec.mimeType }),
			});
			this.buffer = [];
			this.notifyVisu();
                    }
		}
		this.rec.addEventListener('start', (e) => this.notifyVisu());
		this.rec.addEventListener('stop', (e) => this.notifyVisu());

		this.notifyVisu();
	    })
	} else {
	    return Promise.reject(new Error('Castaphone already running.'));
	}
    }

    halt() {
	if (this.state == 'recording') {
	    console.error('Stream is recording');
	} else if (this.state != 'inactive') {
	    let tracks = this.stream.getTracks()
	    for (let t of tracks) {
		t.stop();
		this.stream.removeTrack(t);
	    }
	    this.stream = null;
	    this.notifyVisu();
	}
    }

    record() {
        this.state == 'paused' && this.rec.start();
    }

    chunk() {
        this.state == 'recording' && this.rec.stop();
    }

    toggle() {
        if (this.state == 'paused')
	    this.record();
	else if (this.state == 'recording')
	    this.chunk();
    }

    rewind() {
        if (this.state != 'recording' && this.chunks.length) {
            this.thrash.push(this.chunks.pop());
            this.notifyVisu();
        }
    }

    restore() {
        if (this.state != 'recording' && this.thrash.length) {
            this.chunks.push(this.thrash.pop());
            this.notifyVisu();
        }
    }

    save() {
        if (this.state != 'recording' && this.chunks.length) {
	    let blob = this.tarball();
            this.download.href = URL.createObjectURL(blob);
            this.download.click();
        }
    }
    
    playLast(video=false) {
        if (this.state != 'recording' && this.video.paused && this.chunks.length) {
            this.video.src = URL.createObjectURL(this.chunks[this.chunks.length - 1].data);
            this.video.play();
            if (video) {
                this.video.requestFullscreen();
                this.video.style.display = 'block';
            }
        }
    }

    silence() {
        this.video.pause();
        this.video.style.display = 'none';
    }

    keyboard() {
        window.addEventListener('keydown', e => {
            switch (e.code) {
	    case this.keys.onoff:
		e.ctrlKey && (e.shiftKey ? this.halt() : this.run().catch(err=>console.log(err)));
		break;
            case this.keys.dictate:
                this.record();
                break;
            case this.keys.toggle:
                this.toggle();
                break;
            case this.keys.thrash:
                e.ctrlKey && (e.shiftKey ? this.restore() : this.rewind());
                break;
            case this.keys.play:
                e.ctrlKey && this.playLast(e.shiftKey);
                break;
            case this.keys.monitor:
                e.ctrlKey && e.shiftKey && this.visualisation();
                break;
            case this.keys.save:
                e.ctrlKey && this.save();
                break;
	    default:
		return;
            }
            e.preventDefault();
        });
        window.addEventListener('keyup', e => {
            switch (e.code) {
            case this.keys.dictate:
                this.chunk();
                break;
            case this.keys.play:
                this.silence();
                break;
            }
        });
    }

    notifyVisu() {
        if (this.visu && !this.visu.closed) {
            this.visu.postMessage({
                chunks: this.chunks && this.chunks.map((c) => c.data.size) || [],
                thrash: this.thrash && this.thrash.map((c) => c.data.size) || [],
                last: this.chunks && this.chunks[this.chunks.length - 1] || null,
		state: this.state,
                playing: !this.video.paused,
            }, window.origin);
        }
    }

    visualisation() {
	let doc = new Blob([
	    `<head>`,
	    ` <meta charset="utf-8"/>`,
	    ` <style id='stylesheet'></style>`,
	    ` <script type="module">`,
	    `  import { Monitor } from "${import.meta.url}";`,
	    `  const monitor = new Monitor();`,
	    ` </script>`,
	    `</head>`,
	], { type: 'text/html' })
	let url = URL.createObjectURL(doc);
        this.visu = window.open(url, 'CastaphoneMonitor', 'toolbar=0,menubar=0,location=0');
    }
    
    /* Create a tarball from all chunks */
    tarball() {
	// Create the POSIX tar headers
	let prefix = this.download.download.split('.')[0] + '/';
	let suffixlen = this.chunks.length.toString().length;
	let enc = new TextEncoder()
	this.chunks.forEach((c, i) => {
	    c.header = new ArrayBuffer(512);
	    let header = new Uint8Array(c.header);
	    let name = prefix + i.toString().padStart(suffixlen, '0');
	    let ext = c.data.type.split(';')[0].split('/')[1] || 'raw';
	    header.set(enc.encode(`${name}.${ext}`));// name
	    header.set(enc.encode('0000644'), 100);  // mode
	    // skip uid, gid
	    let size = c.data.size.toString(8).padStart(11, '0');
	    header.set(enc.encode(size), 124);       // size
	    let mtime = Math.round(c.time.getTime() / 1000).toString(8).padStart(11)
	    header.set(enc.encode(mtime), 136);      // mtime
	    header.set(enc.encode('        '), 148); // chksum 1
	    header[156] = '0'.charCodeAt(0);         // typeflag
	    header.set(enc.encode('ustar'), 257);    // magic
	    let chksum = (header.reduce((a,b)=>a+b, 0)).toString(8).padStart(6);
	    header.set(enc.encode(chksum), 148);     // chksum 2
	});

	// Construct tarball
	let data = [];
	for (let c of this.chunks) {
	    data.push(c.header);
	    data.push(c.data);
	    let rest = (512 - (c.data.size % 512)) % 512;
	    data.push(new ArrayBuffer(rest));
	}
	data.push(new ArrayBuffer(1024));
	return new Blob(data, { type: 'application/tar' });
    }
}

export class Monitor {
    constructor() {
        this.opener = window.opener;
        this.origin = window.origin;

	// Populate DOM
	let $ = (q) => document.querySelector(q);
	document.title = 'Castaphone monitor';
	$('#stylesheet').innerText = Monitor.stylesheet;
	document.body.innerHTML = Monitor.body;
        this.recordLed = $('#recording');
        this.playLed = $('#playing');
	this.waveform = $('#waveform');
	this.chunks = $('#chunks .blocks');
	this.thrash = $('#thrash .blocks');

        window.addEventListener('message', (e) => {
            if (e.origin == this.origin && e.source == this.opener)
                this.refresh(e.data);
        });
        this.opener.postMessage({ action: "update" }, this.origin);
    }

    refresh(data) {
        this.recordLed.classList.toggle('active', data.state == 'recording');
        this.playLed.classList.toggle('active', data.playing);

        if (data.last) {
            const ctx = new AudioContext();
            const f = new FileReader();
            f.readAsArrayBuffer(data.last.data);
            f.onload = () => ctx.decodeAudioData(f.result)
                .then(b => this.drawWave(b.getChannelData(0)));
        } else {
	    this.clearWave();
	}
        
        const blocks = (list) => {
            const tot = list.reduce((a,b) => a+b, 0);
            return list.reduce((p,s) => `${p}<span style="width:${s/tot*90}%"></span>`, '');
        }
        this.chunks.innerHTML = blocks(data.chunks);
        this.thrash.innerHTML = blocks(data.thrash);
        data.chunks.length && this.chunks.lastChild.classList.add('selected');
    }

    drawWave(data) {
        ((w, c) => {
            c.clearRect(0, 0, w.width, w.height);
            c.beginPath();
            c.moveTo(0, w.height/2);
            const step = Math.floor(data.length / w.width);
            for (let i = 0; i < data.length; i += step) {
                c.lineTo((i+1) * w.width / data.length, (2*data[i]+1)*w.height/2);
            }
            c.stroke();
        })(this.waveform, this.waveform.getContext("2d"));
    }
    
    clearWave() {
        ((w, c) => {
            c.clearRect(0, 0, w.width, w.height);
        })(this.waveform, this.waveform.getContext("2d"));
    }
}

Monitor.body = `
<div id="leds">
  <span id="recording"></span>
  <span id="playing"></span>
</div>

<canvas id="waveform" height="200" width="1000"></canvas>

<div id="chunks">
  <h3>Chunks</h3>
  <div class="blocks"></div>
</div>
<div id="thrash">
  <h3>Thrash</h3>
  <div class="blocks"></div>
</div>
`;

Monitor.stylesheet = `
body { font-family: sans; }

.blocks {
    height: 2em;
    margin: 0 4em;
}
.blocks span {
        display: inline-block;
        height: 2em;
        min-width: 1em;
        margin: 0 2px;
    }
.blocks span.selected {
        opacity: 0.5;
    }

#chunks span {
    background-color: green;
}
#thrash span {
    background-color: red;
}


#recording {
    --color: red;
}
#playing {
    --color: green;
}
#leds span {
        opacity: 0.1;
        display: inline-block;
        width: 4em;
        height: 4em;
        margin: 1em;
        border-radius: 2em;
        background: radial-gradient(var(--color) 30%, white 90%);
    }
#leds span.active {
        opacity: 1;
    }

canvas {
    display: block;
    width: 90vw;
    margin: auto;
    height: 18vw;
    background-color: #ddd;
}
`;
