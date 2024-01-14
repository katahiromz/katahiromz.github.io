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

document.addEventListener('DOMContentLoaded', () => {
	const video = document.getElementById('sai_id_video_1');
	const canvas = document.getElementById('sai_id_canvas_1');
	const ctx = canvas.getContext('2d', {
		alpha: false,
		antialias: false,
		willReadFrequently: true,
	});
	let isAudioEnabled = false;
	let isFrontCamera = false;
	let anime = null;
	const threshold = 10.0;

	// Initialize pico.js face detector
	let update_memory = pico.instantiate_detection_memory(5); // we will use the detecions of the last 5 frames
	let cascadeurl = 'https://katahiromz.github.io/face2/facefinder';
	let classify_region = null;
	fetch(cascadeurl).then(function(response){
		response.arrayBuffer().then(function(buffer){
			let bytes = new Int8Array(buffer);
			classify_region = pico.unpack_cascade(bytes);
			console.log('* facefinder loaded');
		})
	})

	// カメラの制約を取得する関数。
	const getCameraConstraints = () => {
		if (isFrontCamera) {
			return {
				video: {
					facingMode: 'user',
				},
				audio: isAudioEnabled,
			};
		} else {
			return {
				video: {
					facingMode: { exact: 'environment' },
				},
				audio: isAudioEnabled,
			};
		}
	};

	// カメラストリームを取得するメソッド
	const getCameraStream = async () => {
		return navigator.mediaDevices.getUserMedia(getCameraConstraints());
	};

	// カメラ映像を加工するメソッド
	const processVideo = () => {
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

		// ここに加工処理を追加
		detectFaces(ctx);

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

	const get_detections = function(rgba, width, height){
		if (!classify_region || !update_memory){
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
		dets = update_memory(dets);
		dets = pico.cluster_detections(dets, 0.2); // set IoU threshold to 0.2
		return dets;
	};

	const draw_target = function(ctx, target, status){
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

	const draw_detections = function(ctx, dets){
		if(!dets){
			return;
		}
		for(let det of dets){
			if(det[3] <= threshold)
				continue;

			let x = det[1], y = det[0], radius = det[2] / 2;
			let target = {x: x, y: y, radius: radius};
			draw_target(ctx, target, 0);
		}
	};

	// 顔認識。
	const detectFaces = (ctx) => {
		// pico.js を使用して顔認識を行う
		let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		let dets = get_detections(imageData.data, canvas.width, canvas.height);
		draw_detections(ctx, dets);
	};

	// 前面・背面カメラの切り替えボタン。
	sai_id_button_side.addEventListener('click', () => {
		if (anime) {
			cancelAnimationFrame(anime);
			anime = null;
		}
		if(video.srcObject){
			video.srcObject.getVideoTracks().forEach(function(track){
				track.stop();
			});
			video.srcObject = null;
		}
		isFrontCamera = !isFrontCamera;
		initCamera();
	});

	// カメラの初期化
	initCamera();
});
