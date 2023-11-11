// facelocker.js by katahiromz
// License: MIT
let facelocker_initialized = false;
let facelocker_canvas = null;
let facelocker_camvas = null;
let facelocker_dets = null;
let facelocker_image = null;
let facelocker_target = -1;
let facelocker_target_candidate = -1;
let facelocker_update_memory = null;
let facefinder_classify_region = null;
let facelocker_side = 'user';

function facelocker_rgba_to_grayscale(rgba, nrows, ncols) {
	let gray = new Uint8Array(nrows*ncols);
	for(let r = 0; r < nrows; ++r)
		for(let c = 0; c < ncols; ++c)
			// gray = 0.2*red + 0.7*green + 0.1*blue
			gray[r*ncols + c] = (2*rgba[r*4*ncols+4*c+0]+7*rgba[r*4*ncols+4*c+1]+1*rgba[r*4*ncols+4*c+2])/10;
	return gray;
}

const facelocker_draw_detect = function(ctx, det, color, type){
	let x = det[1], y = det[0], radius = det[2] / 2;
	ctx.beginPath();
	ctx.rect(x - radius, y - radius, radius * 2, radius * 2);
	ctx.lineWidth = 5;
	ctx.strokeStyle = 'black';
	ctx.stroke();
	ctx.lineWidth = 3;
	ctx.strokeStyle = color;
	ctx.stroke();
	if(type == "locked"){
		ctx.font = "bold 20px san-serif";
		ctx.fillStyle = "#f99";
		ctx.textAlign = "center";
		ctx.fillText("LOCKED ON", x, y - radius);

		let value = (new Date().getTime() % 1000) / 1000;
		let cx = x + radius * Math.cos(value * (2 * Math.PI));
		let cy = y + radius * Math.sin(value * (2 * Math.PI));
		ctx.beginPath();
		ctx.arc(cx, cy, 10, 0, 2 * Math.PI, false);
		ctx.fillStyle = "red";
		ctx.fill();
		return;
	}
	if(type == "lock-ready"){
		ctx.font = "bold 20px san-serif";
		ctx.fillStyle = "#ff0";
		ctx.textAlign = "center";
		ctx.fillText("LOCK ON?", x, y - radius);
		return;
	}
}

const facelocker_draw_detections = function(ctx, dets){
	if(!dets)
		return;
	if(facelocker_target >= 0){
		let i = facelocker_target;
		if (i < dets.length){
			facelocker_draw_detect(ctx, dets[i], "red", "locked");
			return;
		}
	}
	if(facelocker_target_candidate >= 0){
		let i = facelocker_target_candidate;
		if (i < dets.length){
			facelocker_draw_detect(ctx, dets[i], "cyan", "lock-ready");
			return;
		}
	}
	for(let i = 0; i < dets.length; ++i) {
		if(dets[i][3] > 50.0){
			facelocker_draw_detect(ctx, dets[i], "lightgreen", "not ready");
		}
	}
}

const facelocker_detection = function(rgba, width, height){
	if (!facefinder_classify_region)
		return;

	let image = {
		"pixels": facelocker_rgba_to_grayscale(rgba, height, width),
		"nrows": height,
		"ncols": width,
		"ldim": width
	}
	let params = {
		"shiftfactor": 0.1, // move the detection window by 10% of its size
		"minsize": 25,     // minimum size of a face
		"maxsize": 1000,    // maximum size of a face
		"scalefactor": 1.1  // for multiscale processing: resize the detection window by 10% when moving to the higher scale
	}

	// run the cascade over the frame and cluster the obtained detections
	// dets is an array that contains (r, c, s, q) quadruplets
	// (representing row, column, scale and detection score)
	let dets = pico.run_cascade(image, facefinder_classify_region, params);
	dets = facelocker_update_memory(dets);
	dets = pico.cluster_detections(dets, 0.2); // set IoU threshold to 0.2
	return dets;
}

const facelocker_init = function(canvas){
	if(typeof canvas == 'string')
		canvas = document.getElementById(canvas);
	facelocker_canvas = canvas;

	sai_id_button_lock_on.disabled = true;

	if(facelocker_initialized)
		return;

	// Initialize pico.js face detector
	facelocker_update_memory = pico.instantiate_detection_memory(5); // we will use the detecions of the last 5 frames
	let cascadeurl = 'https://raw.githubusercontent.com/nenadmarkus/pico/c2e81f9d23cc11d1a612fd21e4f9de0921a5d0d9/rnt/cascades/facefinder';
	fetch(cascadeurl).then(function(response) {
		response.arrayBuffer().then(function(buffer) {
			let bytes = new Int8Array(buffer);
			facefinder_classify_region = pico.unpack_cascade(bytes);
			console.log('* facefinder loaded');
		})
	})

	// Get the drawing context on the canvas and define a function to transform an RGBA image to grayscale
	let ctx = facelocker_canvas.getContext('2d', {
		willReadFrequently: true,
		antialias: false,
		alpha: false,
	});

	// This function is called each time a video frame becomes available
	let processfn = function(video, dt) {
		// The canvas size
		ctx.canvas.width = window.innerWidth;
		ctx.canvas.height = window.innerHeight;
		let width = ctx.canvas.width, height = ctx.canvas.height;

		if (facelocker_target >= 0) {
			ctx.putImageData(facelocker_image, 0, 0);
			facelocker_draw_detections(ctx, facelocker_dets, true);
			return;
		}

		ctx.drawImage(video, 0, 0, width, height);
		facelocker_image = ctx.getImageData(0, 0, width, height);
		facelocker_dets = facelocker_detection(facelocker_image.data, width, height);
		facelocker_draw_detections(ctx, facelocker_dets, false);

		if (facelocker_target_candidate != -1 && facelocker_target_candidate >= facelocker_dets.length){
			facelocker_target_candidate = -1;
			facelocker_target = -1;
		}

		ctx.font = "bold 20px san-serif";
		if (facelocker_target_candidate == -1){
			ctx.fillStyle = "red";
			ctx.textAlign = "center";
			ctx.fillText("Please tap on the target", width / 2, height - 20 / 2);
			ctx.fillText("Face recognition", width / 2, + 20);
		}else{
			ctx.fillStyle = "#f0f";
			ctx.textAlign = "center";
			ctx.fillText("Ready to lock on", width / 2, height - 20 / 2);
		}
	}

	// Instantiate camera handling (see https://github.com/cbrandolino/camvas)
	let side = (facelocker_side == 'user' ? 'user' : {exact: 'environment'});
	facelocker_camvas = new camvas(ctx, processfn, side);

	facelocker_initialized = true;
}

const facelocker_stop = function(){
	if(!facelocker_initialized)
		return;

	facelocker_camvas.cancelAnimation();
}

const facelocker_resume = function(){
	if(!facelocker_initialized)
		return;

	facelocker_camvas.requestAnimation();
}

const facelocker_lock_unlock = function(){
	if(!facelocker_initialized)
		return;

	if(facelocker_target >= 0){
		facelocker_target = -1;
		sai_id_button_lock_on.innerText = "Lock on";
	}else{
		if(facelocker_target_candidate >= 0){
			facelocker_target = facelocker_target_candidate;
			sai_id_button_lock_on.disabled = false;
			sai_id_button_lock_on.innerText = "Unlock";
		}else{
			sai_id_button_lock_on.disabled = true;
			sai_id_button_lock_on.innerText = "Lock on";
		}
	}
}

const facelocker_on_click = function(e){
	if(facelocker_target != -1)
		return;
	facelocker_target_candidate = -1;
	sai_id_button_lock_on.disabled = true;

	let pageX = e.pageX, pageY = e.pageY;
	let dets = facelocker_dets;
	if(!dets)
		return;

	for(let i = 0; i < dets.length; ++i) {
		let x = dets[i][1], y = dets[i][0], radius = dets[i][2];
		let rect = {x: x - radius/2, y: y - radius/2, width: radius, height: radius};
		if (pageX < rect.x || pageY < rect.y)
			continue;
		if (rect.x + rect.width < pageX || rect.y + rect.height < pageY)
			continue;
		facelocker_target_candidate = i;
		sai_id_button_lock_on.disabled = false;
		sai_id_button_lock_on.innerText = "Lock on";
		break;
	}
}

const facelocker_set_side = function(side){
	if(side)
		facelocker_side = side;
	else if(facelocker_side == 'user')
		facelocker_side = 'environment';
	else
		facelocker_side = 'user';

	facelocker_camvas.cancelAnimation();
	if(facelocker_camvas.streamContainer){
		facelocker_camvas.streamContainer.parentNode.removeChild(facelocker_camvas.streamContainer);
		facelocker_camvas.streamContainer = null;
		facelocker_camvas.video = null;
	}

	facelocker_initialized = false;
	facelocker_init(sai_id_canvas_1);
}
