// ドキュメントの読み込みが完了（DOMContentLoaded）されたら無名関数が呼び出される。
document.addEventListener('DOMContentLoaded', function(){
	const main = function(){
		const argc = arguments.length, argv = arguments;
		facelocker_init(sai_id_canvas_1);

		sai_id_canvas_1.addEventListener('click', function(e){
			facelocker_on_click(e);
		});

		sai_id_button_lock_on.addEventListener('click', function(e){
			facelocker_lock_unlock();
		});

		sai_id_button_close.addEventListener('click', function(e){
			if(facelocker_camvas.animation)
				facelocker_stop();
			else
				facelocker_resume();
		});
	}
	main();
});
