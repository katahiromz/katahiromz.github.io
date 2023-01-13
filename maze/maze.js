// バージョン情報。
const MAZE_VERSION = '0.0.5';
const DEBUGGING = true;

// マップの構成要素。
const MAP_BLANK = ' '; // 通路。
const MAP_WALL  = '#'; // 壁。
const MAP_ROOTE = '.'; // ゴールまでの道。
const MAP_INVALID = '@';

// メルセンヌツイスター乱数生成器。
let mt = new MersenneTwister();

// マップの幅。
function getMapWidth(map)
{
    return map[0].length;
}

// マップの高さ。
function getMapHeight(map)
{
    return map.length;
}

// マップのセルの文字を取得する。
function getMapCell(map, x, y)
{
    return map[y][x];
}
function getMapCellWithCheck(map, x, y)
{
    if (0 <= x && x < getMapWidth(map) && 0 <= y && y < getMapHeight(map))
        return getMapCell(map, x, y);
    return MAP_INVALID;
}

// マップのセルの文字をセットする。
function setMapCell(map, x, y, ch)
{
    map[y][x] = ch;
}

// コーナー。
const CORNER_UPPER_LEFT = 1;
const CORNER_UPPER_RIGHT = 2;
const CORNER_LOWER_LEFT = 3;
const CORNER_LOWER_RIGHT = 4;
const CORNER_LEFT_UPPER = 5;
const CORNER_LEFT_LOWER = 6;
const CORNER_RIGHT_UPPER = 7;
const CORNER_RIGHT_LOWER = 8;
function getCorner(map, corner)
{
    switch (corner)
    {
    case CORNER_UPPER_LEFT:
        return [1, 1];
    case CORNER_UPPER_RIGHT:
        return [getMapWidth(map) - 2, 1];
    case CORNER_LOWER_LEFT:
        return [1, getMapHeight(map) - 2];
    case CORNER_LOWER_RIGHT:
        return [getMapWidth(map) - 2, getMapHeight(map) - 2];
    case CORNER_LEFT_UPPER:
        return [1, 1];
    case CORNER_LEFT_LOWER:
        return [1, getMapHeight(map) - 2];
    case CORNER_RIGHT_UPPER:
        return [getMapWidth(map) - 2, 1];
    case CORNER_RIGHT_LOWER:
        return [getMapWidth(map) - 2, getMapHeight(map) - 2];
    default:
        alert('cornerの値が不正です。');
    }
}

// ドアの位置を返す。
function getDoor(map, corner)
{
    const [x, y] = getCorner(map, corner);
    switch (corner)
    {
    case CORNER_UPPER_LEFT: return [x, y - 1];
    case CORNER_UPPER_RIGHT: return [x, y - 1];
    case CORNER_LOWER_LEFT: return [x, y + 1];
    case CORNER_LOWER_RIGHT: return [x, y + 1];
    case CORNER_LEFT_UPPER: return [x - 1, y];
    case CORNER_LEFT_LOWER: return [x - 1, y];
    case CORNER_RIGHT_UPPER: return [x + 1, y];
    case CORNER_RIGHT_LOWER: return [x + 1, y];
    default:
        alert('cornerの値が不正です。');
    }
}

// ドアを開く。
function openDoor(map, corner, close = false)
{
    const [x, y] = getDoor(map, corner);
    setMapCell(map, x, y, close ? MAP_WALL : MAP_ROOTE);
}

// min以上max未満の整数乱数を取得する。
function getRandomInt(min, max)
{
    return mt.nextInt(min, max);
}

// 生成チェック。
function checkMap(map)
{
    if (getMapHeight(map) <= 2 || getMapWidth(map) <= 2)
        return false;
    if ((getMapHeight(map) & 1) == 0 || (getMapWidth(map) & 1) == 0)
        return false;
    return true;
}

// 穴掘り。
function digMap(map, x, y)
{
    if (!checkMap(map))
        return;

    let random = getRandomInt(0, 100000), counter = 0;
    let dx, dy;
    while (counter < 4)
    {
        switch ((random + counter) & 3)
        {
        case 0: dx = -2; dy = 0; break;
        case 1: dx = 0; dy = -2; break;
        case 2: dx = 2; dy = 0; break;
        case 3: dx = 0; dy = 2; break;
        default: dx = 0; dy = 0; break;
        }
        if (x + dx <= 0 ||
            y + dy <= 0 ||
            x + dx >= getMapWidth(map) - 1 ||
            y + dy >= getMapHeight(map) - 1 ||
            getMapCell(map, x + dx, y + dy) == MAP_BLANK)
        {
            ++counter;
        }
        else if (getMapCell(map, x + dx, y + dy) == MAP_WALL)
        {
            setMapCell(map, x + (dx >> 1), y + (dy >> 1), MAP_BLANK);
            setMapCell(map, x + dx, y + dy, MAP_BLANK);
            x += dx;
            y += dy;
            counter = 0;
            random = getRandomInt(0, 100000);
        }
    }
}

// 経路探索の再帰関数。
function routeLoop(map, x, y, endx, endy, b)
{
    setMapCell(map, x, y, MAP_ROOTE);

    if (x == endx && y == endy)
    {
        b.value = false;
        return;
    }

    if (b.value && getMapCell(map, x, y - 1) == MAP_BLANK)
        routeLoop(map, x, y - 1, endx, endy, b);

    if (b.value && getMapCell(map, x, y + 1) == MAP_BLANK)
        routeLoop(map, x, y + 1, endx, endy, b);

    if (b.value && getMapCell(map, x - 1, y) == MAP_BLANK)
        routeLoop(map, x - 1, y, endx, endy, b);

    if (b.value && getMapCell(map, x + 1, y) == MAP_BLANK)
        routeLoop(map, x + 1, y, endx, endy, b);

    if (b.value)
        setMapCell(map, x, y, MAP_BLANK);
}

// 経路を検索する。
function getRoute(map, startx, starty, endx, endy)
{
    if (!checkMap(map)) return;
    let b = { value: true };
    routeLoop(map, startx, starty, endx, endy, b);
}

// マップを生成する再帰関数。
function makeMapLoop(map, select_x, select_y)
{
    let ii = 0;
    const y_max = getMapHeight(map) - 1;
    const x_max = getMapWidth(map) - 1;

    for (let y = 1; y < y_max; y += 2)
    {
        for (let x = 1; x < x_max; x += 2)
        {
            if (getMapCell(map, x, y) != MAP_BLANK)
                continue;

            if ((x >= 2 && getMapCell(map, x - 2, y) == MAP_WALL) ||
                (y >= 2 && getMapCell(map, x, y - 2) == MAP_WALL))
            {
                select_x[ii] = x;
                select_y[ii] = y;
                ++ii;
            }
            else if ((x + 2 < getMapWidth(map) && getMapCell(map, x + 2, y) == MAP_WALL) ||
                     (y + 2 < getMapHeight(map) && getMapCell(map, x, y + 2) == MAP_WALL))
            {
                select_x[ii] = x;
                select_y[ii] = y;
                ++ii;
            }
        }
    }

    return ii;
}

// 迷路マップ生成のためのヘルパー関数。
function makeMap(map)
{
    if (!checkMap(map))
        return;

    let a, ii;
    let select_x = new Array(getMapHeight(map) * getMapWidth(map)).fill(0);
    let select_y = new Array(getMapHeight(map) * getMapWidth(map)).fill(0);

    while (true)
    {
        ii = makeMapLoop(map, select_x, select_y);
        if (ii == 0) break;
        a = getRandomInt(0, 100000) % ii;
        digMap(map, select_x[a], select_y[a]);
    }
}

// マップを文字列化。
function stringOfMap(map)
{
    let ret = '';
    for (const row of map)
    {
        for (const ch of row)
            ret += ch;
        ret += '\n';
    }
    return ret;
}

// 迷路マップを生成。
function createMazeMap(x, y, start = CORNER_UPPER_LEFT, end = CORNER_LOWER_RIGHT)
{
    if (x <= 3)
    {
        alert('xが小さすぎます。');
        return null;
    }
    if (y <= 3)
    {
        alert('yが小さすぎます。');
        return null;
    }
    if ((x & 1) == 0)
    {
        alert('xは奇数でなければなりません。');
        return null;
    }
    if ((y & 1) == 0)
    {
        alert('yは奇数でなければなりません。');
        return null;
    }

    // すべてカベにする。
    let map = new Array();
    for (let i = 0; i < y; ++i)
    {
        map.push(new Array(x).fill(MAP_WALL));
    }

    // 始点。
    const [startx, starty] = getCorner(map, start);
    setMapCell(map, startx, starty, MAP_BLANK);

    // 終点。
    const [endx, endy] = getCorner(map, end);

    // 迷路を生成。
    makeMap(map);

    // 経路探索。
    getRoute(map, startx, starty, endx, endy);

    // ドアを開く。
    openDoor(map, start);
    openDoor(map, end);

    return map;
}

// 経路の長さ。
function getRouteLength(map)
{
    let length = 0;
    for (const row of map)
    {
        for (const ch of row)
        {
            if (ch == MAP_ROOTE)
                ++length;
        }
    }
    return length;
}

// 経路の広がり。
function getRouteExtent(map)
{
    let min_x = getMapWidth(map);
    let min_y = getMapHeight(map);
    let max_x = -1;
    let max_y = -1;

    for (let y = 0; y < getMapHeight(map); ++y)
    {
        for (let x = 0; x < getMapWidth(map); ++x)
        {
            const ch = getMapCell(map, x, y);
            if (ch == MAP_ROOTE)
            {
                if (x < min_x) min_x = x;
                if (y < min_y) min_y = y;
                if (x > max_x) max_x = x;
                if (y > max_y) max_y = y;
            }
        }
    }

    return [max_x - min_x, max_y - min_y];
}

// 経路の曲がり角の個数。
function getRouteTurns(map)
{
    let turns = 0;

    for (let y = 0; y < getMapHeight(map) - 1; ++y)
    {
        for (let x = 0; x < getMapWidth(map) - 1; ++x)
        {
            const ch1 = getMapCell(map, x, y);
            const ch2 = getMapCell(map, x + 1, y);
            const ch3 = getMapCell(map, x + 1, y + 1);
            const ch4 = getMapCell(map, x, y + 1);
            const sum = (ch1 == MAP_ROOTE) + (ch2 == MAP_ROOTE) +
                        (ch3 == MAP_ROOTE) + (ch4 == MAP_ROOTE);
            if (sum == 1)
                turns += 1;
        }
    }

    return turns;
}

function main()
{
    let stage = 0;

    if (!DEBUGGING){
        // コンテキストメニューを無効化。
        window.addEventListener("contextmenu", function(e){
            e.preventDefault();
            e.stopPropagation();
            return false;
        }, { passive: false });
    }
    // タッチ操作を無効にする。
    contents.addEventListener('touchstart', function(e){
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, { passive: false });
    contents.addEventListener('touchend', function(e){
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, { passive: false });

    let self_ix, self_iy; // 自機の位置。
    let self_dx, self_dy; // 自機の移動方向。
    let ctx; // 描画対象。
    let inner_x, inner_y, inner_width, inner_height; // 内側のピクセルサイズと位置。
    let map_width, map_height; // マップのピクセルサイズ。
    const margin = 4; // マージン。
    let corner_start = CORNER_UPPER_LEFT, corner_end = CORNER_LOWER_RIGHT;
    let wall_color, border_color;

    // 新しいステージ。
    function new_stage(){
        ++stage;
        mt.setSeed(stage);
        switch (corner_end){
        case CORNER_LOWER_LEFT:
            corner_start = CORNER_UPPER_LEFT;
            corner_end = CORNER_LOWER_RIGHT;
            break;
        case CORNER_LOWER_RIGHT:
            corner_start = CORNER_UPPER_RIGHT;
            corner_end = CORNER_LOWER_LEFT;
            break;
        }
        wall_color = `rgb(91, ${getRandomInt(0, 200)}, ${getRandomInt(100, 191)})`;
        border_color = `rgb(191, ${getRandomInt(0, 191)}, 0)`;
        let cx = 9 + Math.floor(stage / 10) * 2;
        let cy = 9 + Math.floor(stage / 10) * 2;
        do{
            map = createMazeMap(cx, cy, corner_start, corner_end);
        } while (getRouteTurns(map) < 5 || getRouteLength(map) < (cx + cy) * 1.5);

        [self_ix, self_iy] = getCorner(map, corner_start);
        self_dx = self_dy = 0;

        ctx = game_screen.getContext('2d');
        game_screen_resize();
    }

    let screen_width, screen_height; // スクリーンのサイズ。
    let map = null; // 地図。
    let cell_width = null, cell_height = null; // セルのサイズ。

    // スクリーンのサイズが変わった。
    function game_screen_resize(){
        screen_width = game_screen.width = game_screen.offsetWidth;
        screen_height = game_screen.height = game_screen.offsetHeight;

        let cx = getMapWidth(map), cy = getMapHeight(map);

        inner_x = margin;
        inner_y = margin;
        inner_width = screen_width - margin * 2;
        inner_height = screen_height - margin * 2;

        if (cx / cy < inner_width / inner_height){
            cell_width = cell_height = inner_height / cy;
        }else{
            cell_height = cell_width = inner_width / cx;
        }

        map_width = cx * cell_width;
        map_height = cy * cell_height;

        ctx = game_screen.getContext('2d');
    }
    window.addEventListener('resize', game_screen_resize, false);

    new_stage();

    function translate(ix, iy){
        let x = inner_x + (inner_width - map_width) / 2 + cell_width * ix;
        let y = inner_y + (inner_height - map_height) / 2 + cell_height * iy;
        return [x, y];
    }

    // 自機。
    let self_up = new Image();
    let self_down = new Image();
    let self_left = new Image();
    let self_right = new Image();
    let self = self_down;
    self_up.src = 'img/self_up.png';
    self_down.src = 'img/self_down.png';
    self_left.src = 'img/self_left.png';
    self_right.src = 'img/self_right.png';

    // 自機の移動。
    const self_speed = 0.005;
    const self_locked = false;
    up_button.addEventListener('mousedown', function(e){
        if (self_locked) return;
        self_dy = -1;
        self = self_up;
    }, false);
    up_button.addEventListener('mouseup', function(e){
        if (self_locked) return;
        self_dy = 0;
    }, false);

    down_button.addEventListener('mousedown', function(e){
        if (self_locked) return;
        self_dy = +1;
        self = self_down;
    }, false);
    down_button.addEventListener('mouseup', function(e){
        if (self_locked) return;
        self_dy = 0;
    }, false);

    left_button.addEventListener('mousedown', function(e){
        if (self_locked) return;
        self_dx = -1;
        self = self_left;
    }, false);
    left_button.addEventListener('mouseup', function(e){
        if (self_locked) return;
        self_dx = 0;
    }, false);

    right_button.addEventListener('mousedown', function(e){
        if (self_locked) return;
        self_dx = +1;
        self = self_right;
    }, false);
    right_button.addEventListener('mouseup', function(e){
        if (self_locked) return;
        self_dx = 0;
    }, false);

    up_button.addEventListener('touchstart', function(e){
        if (self_locked) return;
        self_dy = -1;
        self = self_up;
        e.preventDefault();
    }, { passive: false });
    up_button.addEventListener('touchend', function(e){
        if (self_locked) return;
        self_dy = 0;
    }, { passive: false });

    down_button.addEventListener('touchstart', function(e){
        if (self_locked) return;
        self_dy = +1;
        self = self_down;
        e.preventDefault();
    }, { passive: false });
    down_button.addEventListener('touchend', function(e){
        if (self_locked) return;
        self_dy = 0;
    }, { passive: false });

    left_button.addEventListener('touchstart', function(e){
        if (self_locked) return;
        self_dx = -1;
        self = self_left;
        e.preventDefault();
    }, { passive: false });
    left_button.addEventListener('touchend', function(e){
        if (self_locked) return;
        self_dx = 0;
    }, { passive: false });

    right_button.addEventListener('touchstart', function(e){
        if (self_locked) return;
        self_dx = +1;
        self = self_right;
        e.preventDefault();
    }, { passive: false });
    right_button.addEventListener('touchend', function(e){
        if (self_locked) return;
        self_dx = 0;
    }, { passive: false });

    window.addEventListener("keydown", function(e){
        if (e.defaultPrevented)
            return;
        if (self_locked) return;
        let handled = false;
        switch (e.keyCode){
        case 38: // up:
            self_dy = -1;
            self = self_up;
            handled = true;
            break;
        case 40: // down:
            self_dy = +1;
            self = self_down;
            handled = true;
            break;
        case 37: // left
            self_dx = -1;
            self = self_left;
            handled = true;
            break;
        case 39: // right
            self_dx = +1;
            self = self_right;
            handled = true;
            break;
        }

        if (handled){
            e.preventDefault();
        }
    }, false);
    window.addEventListener("keyup", function(e){
        if (self_locked) return;
        self_dx = 0;
        self_dy = 0;
    }, false);

    // 時間。
    let old_date = new Date();
    let new_date = new Date();

    function animationCallback(){
        new_date = new Date();

        ctx.fillStyle = 'rgba(0, 0, 0)';
        ctx.fillRect(0, 0, game_screen.width, game_screen.height);

        ctx.fillStyle = wall_color;
        ctx.strokeStyle = border_color;
        ctx.lineWidth = 2;

        if (map){
            let iy = 0;
            for (const row of map){
                let ix = 0;
                for (const ch of row){
                    if (ch == MAP_WALL){
                        const [x, y] = translate(ix, iy);
                        ctx.fillRect(x, y, cell_width, cell_height);
                        ctx.strokeRect(x, y, cell_width, cell_height);
                    }
                    ++ix;
                }
                ++iy;
            }
        }

        let self_width = cell_width * 1.5;
        let self_height = cell_height * 1.5;
        [x, y] = translate(self_ix, self_iy);
        ctx.drawImage(self, x - (self_width - cell_width) / 2, y - (self_height - cell_height) / 2, self_width, self_height);

        let delta_time = (new_date - old_date);
        let delta_ix = delta_time * self_dx * self_speed;
        let delta_iy = delta_time * self_dy * self_speed;
        if (self_dx != 0 || self_dy != 0){
            let new_ix = Math.floor(self_ix + delta_ix + 0.5);
            let new_iy = Math.floor(self_iy + delta_iy + 0.5);
            let ch = getMapCellWithCheck(map, new_ix, new_iy);
            if (ch == MAP_INVALID || ch == MAP_WALL){
                delta_ix = 0;
                delta_iy = 0;
            }
        }
        self_ix += delta_ix;
        self_iy += delta_iy;

        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.font = 'bold 7vw san-serif';
        ctx.fillText("Stage " + stage, inner_x, inner_y + inner_height, inner_width);

        if (map){
            let [goal_ix, goal_iy] = getDoor(map, corner_end);
            if (goal_ix == Math.floor(self_ix + 0.5) && goal_iy == Math.floor(self_iy + 0.5)){
                new_stage();
            }
        }

        old_date = new_date;

        window.requestAnimationFrame(animationCallback);
    }

    animationCallback();
}

document.addEventListener('DOMContentLoaded', function(){
    main();
});
