// 三次元タートルグラフィックス。
function Turtle3D(scene) {
    this.scene = scene;
    this.position = new THREE.Vector3();
    this.enable_pen = true;
    this.line_width = 0.25;
    //this.line_color = 0xFFFFFF; // 廃止。
    //this.fill_color = 0xFFFFFF; // 廃止。
    this.gyro = new THREE.Matrix3();
    this.geometry = new THREE.Geometry();

    // ラジアンから度へ変換する関数。
    this.rad2deg = function(rad) {
        return rad * 180.0 / Math.PI;
    }
    // 度からラジアンへ変換する関数。
    this.deg2rad = function(degree) {
        return degree * Math.PI / 180.0;
    }

    // 位置をリセットする関数。
    this.reset_pos = function() {
        this.position = new THREE.Vector3();
    };
    // X軸の方向を見る関数。
    this.look_x = function() {
        this.gyro.set(
            1, 0, 0,
            0, 0, 1,
            0, 1, 0);
    };
    // Y軸の方向を見る関数。
    this.look_y = function() {
        this.gyro.set(
            0, 1, 0,
            1, 0, 0,
            0, 0, 1);
    };
    // Z軸の方向を見る関数。
    this.look_z = function() {
        this.gyro.set(
            0, -1, 0,
            0, 0, 1,
            1, 0, 0);
    };

    // リセットする関数。
    this.reset = function() {
        this.reset_pos();
        this.look_y();
        //this.line_color = 0xFFFFFF; // 廃止。
        //this.fill_color = 0xFFFFFF; // 廃止。
        this.line_width = 0.25;
    };
    this.reset();

    // 位置を取得・セットする関数。
    this.get_pos = function() {
        return this.position.clone();
    }
    this.set_pos = function(x, y, z) {
        this.position = new THREE.Vector3(x, y, z);
    }

    // 向きを取得する関数。
    this.get_dir = function() {
        return new THREE.Vector3(
            this.gyro.elements[0],
            this.gyro.elements[1],
            this.gyro.elements[2]);
    }
    // ジャイロを取得する関数。
    this.get_gyro = function() {
        return this.gyro.clone();
    }

    // 位置とジャイロを取得・セットする関数。
    this.get_pg = function() {
        return [this.get_pos(), this.get_gyro()];
    }
    this.set_pg = function(pg) {
        this.position = pg[0].clone();
        this.gyro = pg[1].clone();
    }

    // 線を追加する関数。
    this.add_line = function(pos0, pos1, line_width = this.line_width) {
        if (0) {
            var curve = new THREE.LineCurve3(pos0, pos1);
            var geometry = new THREE.TubeGeometry(curve, 1, line_width, 6, false);
            var line = new THREE.Mesh(geometry);
            this.geometry.mergeMesh(line);
        } else {
            var direction = new THREE.Vector3().subVectors(pos1, pos0);
            var orientation = new THREE.Matrix4();
            orientation.lookAt(pos0, pos1, new THREE.Object3D().up);
            orientation.multiply(new THREE.Matrix4().set(
                1, 0, 0, 0,
                0, 0, 1, 0,
                0, -1, 0, 0,
                0, 0, 0, 1));
            var geometry = new THREE.CylinderGeometry(line_width, line_width, direction.length(), 6, 1);
            //var material = new THREE.MeshBasicMaterial({ color: line_color });
            //var line = new THREE.Mesh(geometry, material);
            var line = new THREE.Mesh(geometry);
            line.applyMatrix4(orientation);
            line.position.x = (pos0.x + pos1.x) / 2;
            line.position.y = (pos0.y + pos1.y) / 2;
            line.position.z = (pos0.z + pos1.z) / 2;
            //this.scene.add(line);
            this.geometry.mergeMesh(line);
        }
    }
    // 円の図形を返す。
    this.get_circle = function(radius, segments = 6) {
        var circle = new THREE.Shape();
        for (var i = 0; i < segments; i++) {
            var theta = (i + 1) * (Math.PI * 2 / segments);
            var x = radius * Math.cos(theta);
            var y = radius * Math.sin(theta);
            if (i == 0) {
                circle.moveTo(x, y);
            } else {
                circle.lineTo(x, y);
            }
        }
        return circle;
    }
    // 曲線を追加する関数。
    this.add_curve = function(curve, line_width = this.line_width) {
        var shape = this.get_circle(line_width, 6);
        var extrudeSettings = {
            extrudePath: curve,
            steps: 5,
            depth: 16,
            bevelEnabled: false,
        };
        var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        var mesh = new THREE.Mesh(geometry);
        this.geometry.mergeMesh(mesh);
    }
    // 三角形を追加する関数。
    this.add_triangle = function(pos0, pos1, pos2) {
        var geometry = new THREE.Geometry();
        geometry.vertices.push(pos0);
        geometry.vertices.push(pos1);
        geometry.vertices.push(pos2);
        geometry.faces.push(new THREE.Face3(0, 1, 2));
        //var material = new THREE.MeshBasicMaterial({color: fill_color});
        //var triangle = new THREE.Mesh(geometry, material);
        var triangle = new THREE.Mesh(geometry);
        //this.scene.add(triangle);
        this.geometry.mergeMesh(triangle);
    }
    // 球体を追加する関数。
    this.add_sphere = function(radius, pos = this.get_pos()) {
        var geometry = new THREE.SphereGeometry(radius, 5, 5);
        //var material = new THREE.MeshBasicMaterial({color: fill_color});
        //var sphere = new THREE.Mesh(geometry, material);
        var sphere = new THREE.Mesh(geometry);
        sphere.position.add(pos);
        //this.scene.add(sphere);
        this.geometry.mergeMesh(sphere);
    }

    // 長さdistanceだけ前進する。enable_penがtrueなら線を描画する。
    this.walk = function(distance, enable_pen = this.enable_pen) {
        var dir = this.get_dir();
        if (enable_pen) {
            var pos0 = this.get_pos();
            this.position.addScaledVector(dir, distance);
            var pos1 = this.get_pos();
            this.add_line(pos0, pos1);
        } else {
            this.position.addScaledVector(dir, distance);
        }
    }

    // 亀の右手方向にangle度曲がる関数。マイナスは左手方向。
    this.turn = function(angle) {
        var rad = this.deg2rad(angle);
        var rot = new THREE.Matrix3();
        rot.set(
            Math.cos(rad), -Math.sin(rad), 0,
            Math.sin(rad), Math.cos(rad), 0,
            0, 0, 1);
        this.gyro.multiply(rot);
    }

    // 亀の進行方向を軸として反時計回りにangle度曲がる関数。マイナスは時計回り。
    this.spin = function(angle) {
        var rad = this.deg2rad(angle);
        var rot = new THREE.Matrix3();
        rot.set(
            1, 0, 0,
            0, Math.cos(rad), -Math.sin(rad),
            0, Math.sin(rad), Math.cos(rad));
        this.gyro.multiply(rot);
    }

    // 亀のお辞儀方向にangle度曲がる関数。
    this.pitch = function(angle) {
        var rad = this.deg2rad(angle);
        var rot = new THREE.Matrix3();
        rot.set(
            Math.cos(rad), 0, Math.sin(rad),
            0, 1, 0,
            -Math.sin(rad), 0, Math.cos(rad));
        this.gyro.multiply(rot);
    }
}
