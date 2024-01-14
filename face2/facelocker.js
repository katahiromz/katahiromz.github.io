// facelocker.js by katahiromz
// License: MIT

const intersect_rectangle = function(rect1, rect2){
	if(rect1.width <= 0 || rect1.height <= 0 || rect2.width <= 0 || rect2.height <= 0)
		return false;
	let x0 = Math.max(rect1.x, rect2.x);
	let y0 = Math.max(rect1.y, rect2.y);
	let x1 = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
	let y1 = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);
	let width = x1 - x0, height = y1 - y0;
	if(width <= 0 || height <= 0)
		return false;
	return {x:x0, y:y0, width:width, height:height};
};

const is_same_target = function(target1, target2){
	let rect1 = {
		x: target1.x - target1.radius,
		y: target1.y - target1.radius,
		width: 2 * target1.radius,
		height: 2 * target1.radius
	};
	let rect2 = {
		x: target2.x - target2.radius,
		y: target2.y - target2.radius,
		width: 2 * target2.radius,
		height: 2 * target2.radius
	};
	return intersect_rectangle(rect1, rect2);
};

const rgba_to_grayscale = function(rgba, nrows, ncols){
	let gray = new Uint8Array(nrows * ncols);
	for(let r = 0; r < nrows; ++r){
		for(let c = 0; c < ncols; ++c){
			// gray = 0.2*red + 0.7*green + 0.1*blue
			gray[r*ncols + c] = (2 * rgba[r*4*ncols + 4*c + 0] +
			                     7 * rgba[r*4*ncols + 4*c + 1] +
			                     1 * rgba[r*4*ncols + 4*c + 2]) / 10;
		}
	}
	return gray;
};

const facelocker = function(canvas, video, on_lock){
	this.initialized = false;
	this.canvas = null;
	this.video = null;
	this.dets = null;
	this.imageData = null;
	this.target = null;
	this.target_candidate = null;
	this.update_memory = null;
	this.classify_region = null;
	this.threshold = 10.0;
	let self = this;
	let anime = null;
	let isFrontCamera = false;

	// カメラの制約を取得する関数。
	const getCameraConstraints = () => {
		if (isFrontCamera) {
			return {
				video: {
					facingMode: 'user',
				},
				audio: false,
			};
		} else {
			return {
				video: {
					facingMode: { exact: 'environment' },
				},
				audio: false,
			};
		}
	};

	// カメラストリームを取得するメソッド
	const getCameraStream = async () => {
		return navigator.mediaDevices.getUserMedia(getCameraConstraints());
	};

	this.draw_target = function(ctx, target, status){
		let x = target.x, y = target.y, radius = target.radius;
		ctx.beginPath();
		ctx.rect(x - radius, y - radius, radius * 2, radius * 2);
		ctx.lineWidth = 5;
		ctx.strokeStyle = 'black';
		ctx.stroke();
		ctx.lineWidth = 3;
		ctx.strokeStyle = 'green';
		ctx.stroke();
	};

	this.draw_detections = function(ctx, dets){
		if(!dets){
			return;
		}
		for(let det of dets){
			if(det[3] <= self.threshold)
				continue;

			let x = det[1], y = det[0], radius = det[2] / 2;
			let target = {x: x, y: y, radius: radius};
			self.draw_target(ctx, target, 0);
		}
	};

	this.track_candidate = function(dets){
	};

	this.get_detections = function(rgba, width, height){
		if (!self.classify_region || !self.update_memory){
			return;
		}

		let image = {
			pixels: rgba_to_grayscale(rgba, height, width),
			nrows: height,
			ncols: width,
			ldim: width
		};

		let params = {
			shiftfactor: 0.1, // move the detection window by 10% of its size
			minsize: 25,     // minimum size of a face
			maxsize: 1000,    // maximum size of a face
			scalefactor: 1.1  // for multiscale processing: resize the detection window by 10% when moving to the higher scale
		};

		let dets = pico.run_cascade(image, classify_region, params);
		dets = self.update_memory(dets);
		dets = pico.cluster_detections(dets, 0.2); // set IoU threshold to 0.2
		return dets;
	};

	this.stop = function(){
	};

	this.resume = function(){
	};

	this.lock_unlock = function(do_lock){
	};

	this.on_click = function(e){
	};

	this.found_face = function(){
	};

	this.set_side = function(side = null){
	};

	const get_detections = function(rgba, width, height){
		if (!self.classify_region || !self.update_memory){
			return;
		}

		let image = {
			pixels: rgba_to_grayscale(rgba, height, width),
			nrows: height,
			ncols: width,
			ldim: width
		};

		let params = {
			shiftfactor: 0.1, // move the detection window by 10% of its size
			minsize: 25,     // minimum size of a face
			maxsize: 1000,    // maximum size of a face
			scalefactor: 1.1  // for multiscale processing: resize the detection window by 10% when moving to the higher scale
		};

		let dets = pico.run_cascade(image, self.classify_region, params);
		dets = self.update_memory(dets);
		dets = pico.cluster_detections(dets, 0.2); // set IoU threshold to 0.2
		return dets;
	};

	// 顔認識。
	const detectFaces = (ctx) => {
		// pico.js を使用して顔認識を行う
		let imageData = ctx.getImageData(0, 0, self.canvas.width, self.canvas.height);
		let dets = get_detections(imageData.data, self.canvas.width, self.canvas.height);
		self.draw_detections(ctx, dets);
	};

	// カメラ映像を加工するメソッド
	const processVideo = () => {
		self.ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

		// ここに加工処理を追加
		detectFaces(self.ctx);

		// 加工された映像を表示
		if (anime)
			anime = requestAnimationFrame(processVideo);
	};

	// カメラが取得できたときの処理。
	const gotCamera = (stream) => {
		video.srcObject = stream;
		video.addEventListener('loadedmetadata', () => {
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			anime = requestAnimationFrame(processVideo);
		});
	};

	const initCamera = async () => {
		try {
			const stream = await getCameraStream();
			gotCamera(stream);
		} catch (error) {
			console.log('Error accessing the camera:', error);
			try {
				isFrontCamera = !isFrontCamera;
				const stream = await getCameraStream();
				gotCamera(stream);
			} catch (error) {
				console.error('Error accessing the camera:', error);
			}
		}
	};

	this.init = function(canvas, video, on_lock){
		self.on_lock = on_lock;
		if(typeof canvas == 'string')
			canvas = document.getElementById(canvas);
		self.canvas = canvas;
		if(typeof video == 'string')
			video = document.getElementById(video);
		self.video = video;

		let saiminCameraSide = localStorage.getItem('saiminCameraSide');
		if(saiminCameraSide){
			self.side = saiminCameraSide;
		}else{
			self.side = 'user';
		}

		if(self.initialized)
			return;

		self.ctx = canvas.getContext('2d', {
			alpha: false,
			antialias: false,
			willReadFrequently: true,
		});

		initCamera();

		// Initialize pico.js face detector
		self.update_memory = pico.instantiate_detection_memory(5); // we will use the detecions of the last 5 frames
		let cascadeurl = 'https://katahiromz.github.io/face2/facefinder';
		self.classify_region = null;
		fetch(cascadeurl).then(function(response){
			response.arrayBuffer().then(function(buffer){
				let bytes = new Int8Array(buffer);
				self.classify_region = pico.unpack_cascade(bytes);
				console.log('* facefinder loaded');
			})
		})
	};

	this.init(canvas, video, on_lock);
};
