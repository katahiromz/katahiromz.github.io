document.addEventListener('DOMContentLoaded', () => {
	let sai_face_getter = null; // 顔認識。

	sai_face_getter = new facelocker(sai_id_canvas_1, sai_id_video_1, function(status){
	});

	sai_face_getter.resume();
});
