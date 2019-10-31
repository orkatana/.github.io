$(function () {
    // 図形操作用サービス
    let sps = new ShapeService();
    // キャンバスのID
    let canvasId = "appCanvas";

    // キャンバス情報
    let canvas = document.getElementById(canvasId);
    let ctx = canvas.getContext("2d");
    let canvasPosition = canvas.getBoundingClientRect();
    // キャンバスのサイズを再設定
    canvas.width = canvasPosition.width;
    canvas.height = canvasPosition.height;

    // -------- 操作ボタンCSS設定 --------
    // 各ボタンDOM
    let $btns = $('.btn');
    let $restartBtns = $('.restart');    // 「やりなおし」ボタン

    // ボタン位置を調整
    let btnCssSet = function () {
        let btnWidth = canvasPosition.width * 0.164;
        let btnHeight = btnWidth / 221 * 68;
        $btns.height(btnHeight).width(btnWidth).css({ 'right': canvasPosition.width * 0.04 });
        $restartBtns.css({ 'bottom': canvasPosition.height * 0.1 });
    };
    btnCssSet();    // 初期実行

    // -------- 作図エリア --------
    let drawingArea = sps.setDrawingArea(canvasPosition);


    // -------- ページ個別設定値 --------
    // ベース図形
    let baseShapes = sps.setBaseShapes(canvasPosition, null);
    // -------- ページ個別設定値 --------
    // 図形データ
    let shapes = [

        {   // 図形１個分の情報
            'shapeType': [],     // 形の種類
            'center': [0, 0],       // 重心
            'crossPoint': [0, 0],   // 重心からの垂線と辺の交点
            'circle': [0, 0],        // 円（回転アイコン）の中心
            'initCircle': [0, 0],       // 初期の回転アイコンの中心
            'crossPoint2': [0, 0],   // 重心からの垂線と辺の交点
            'square': [0, 0],       // 円（回転アイコン）の中心
            'initSquare': [0, 0],       // 初期の回転アイコンの中心
            'rotate': 0,   // 回転角度
            'matrix': [],     // 各頂点の座標
            'origin': {     // 回転時の座標計算用に元座標を保存
                'crossPoint': [],
                'circle': [],
                'crossPoint2': [],
                'square': [],
                'matrix': [],
            },
        },
    ];
    // ページ表示時、初期図形の重心などを計算
    sps.calcCenterOfGravity(shapes[0]);     // 重心、重心からの垂線と辺の交点、円の中心を設定
    sps.setOriginShapeData(shapes[0]);      // 元座標情報を設定

    // 複製図形の移動時
    let selectShapeIdxs = [];
    let targetShapeIdxs = [];

    // 各設定値の初期化
    let init = function (page) {
        // ベース図形
        baseShapes[page] = sps.setBaseShapes(canvasPosition, page);

        //図形データ
        shapes[page] = [];

        // 図形用インデックス
        selectShapeIdxs[page] = null; //選択中の図形インデックス
        targetShapeIdxs[page] = null; //移動中の図形インデックス

    };
    for (let i = 0; i < 3; i++) {
        init(i);
    }

    // 画面リサイズ時（Canvasのレスポンシブ対応）
    let resize = function () {
        // 元のキャンバスの高さを取得
        let originCanvasHeight = canvasPosition.height;
        // キャンバスの位置、サイズを再取得
        canvasPosition = canvas.getBoundingClientRect();

        // キャンバスのサイズを再設定
        canvas.width = canvasPosition.width;
        canvas.height = canvasPosition.height;

        // ボタン位置を調整
        btnCssSet();

        // リサイズした作図エリアの座標を再計算する
        drawingArea = sps.setDrawingArea(canvasPosition);

        // リサイズした図形の座標を再計算する
        let scale = canvasPosition.height / originCanvasHeight;
        for (k = 0; k < 3; k++) {
            // 全てのページの図形座標を再計算
            for (let i = 0; i < baseShapes.length; i++) {
                // 図形の座標を再設定
                sps.recalculateBaseShape(scale, baseShapes[k][i]);

                // 図形の座標を再設定
                sps.recalculateMatrix(scale, baseShapes[k][i], currentPage);
            }
        }
    };
    $(window).resize(resize);

    // -------- 全ページ共通設定値 --------
    // 現在のページ
    let currentPage = 0;

    // マウスダウン（orタッチ）中かどうか
    let touched = false;
    // タッチ開始時の座標を記録
    let touchStartX = 0;
    let touchStartY = 0;

    // 回転用円画像タッチ開始どうか
    let circleTouched = false;
    // 移動時のタッチ座標
    let touchX = 0;
    let touchY = 0;

    // 回転用円画像の情報
    let circleRadius = 20;  // 半径
    // 回転用円画像のイメージオブジェクト
    let circleImg = new Image();
    circleImg.src = "./img/rotate.png";

    // 裏返し用画像の情報
    let turnOverImg = new Image();
    turnOverImg.src = "./img/turnOver.png";


    /**
     * 図形の描画
     */
    let drawShapes = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let k = 0; k < baseShapes[currentPage].length; k++) {

            ctx.lineJoin = "round";
            ctx.beginPath();

            for (let i = 0; i < baseShapes[currentPage][k]['matrix'].length; i++) {
                ctx.lineTo(baseShapes[currentPage][k]['matrix'][i][0], baseShapes[currentPage][k]['matrix'][i][1]);
            }

            ctx.closePath();
            ctx.lineWidth = sps.baseShapeLineWidth;
            ctx.strokeStyle = sps.baseShapeLineColor;
            ctx.stroke();
            ctx.fillStyle = baseShapes[currentPage][k]['color'];
            ctx.fill();
            
        }

        for (let k = 0; k < baseShapes[currentPage].length; k++) {
           
            if (k === selectShapeIdxs[currentPage]) {

                // 円の画像
                ctx.drawImage(circleImg, baseShapes[currentPage][k]['circle'][0]- circleRadius, baseShapes[currentPage][k]['circle'][1]- circleRadius, circleRadius * 2, circleRadius * 2);

                //反転用のボタン画像
                ctx.drawImage(turnOverImg, baseShapes[currentPage][k]['square'][0]-circleRadius, baseShapes[currentPage][k]['square'][1]-circleRadius, circleRadius * 2, circleRadius * 1.5);

                // 黒い帯
                ctx.beginPath();
                for (let i = 0; i < baseShapes[currentPage][k]['matrix'].length; i++) {
                    ctx.lineTo(baseShapes[currentPage][k]['matrix'][i][0], baseShapes[currentPage][k]['matrix'][i][1]);
                }
                ctx.closePath();
                ctx.lineWidth = 4;
                ctx.strokeStyle = "rgba(0, 0, 0, 1.0)";
                ctx.setLineDash([]);
                ctx.stroke();

            }
        }

    };
    /**
     * レンダリング処理
     * （「切る」モードや「移動」モード時のみレンダリングを実行する）
     */
    let renderAnimation = null;
    let render = function () {
        drawShapes();
        renderAnimation = window.requestAnimationFrame(render);
    };
    render();   // レンダリング処理を呼び出し


    /**
     * マウスダウン（orタッチ）開始時の処理
     * @param e 操作イベント
     */
    let onMouseDown = function (e) {
        e.preventDefault(); // デフォルトイベントをキャンセル
        touched = true; // マウスダウン（orタッチ）中

        // 移動座標計算用にタッチ開始時の座標を設定
        let downPoint = sps.getTouchPoint(e, canvasPosition.top, canvasPosition.left);   // マウスダウン（orタッチ）座標
        touchX = downPoint[0];
        touchY = downPoint[1];

        // タッチ開始時の座標を記録
        touchStartX = Math.floor(downPoint[0]);
        touchStartY = Math.floor(downPoint[1]);

       
        // 円の画像をタッチしているか判定
        if (selectShapeIdxs[currentPage] !== null && sps.judgeInnerCirclePoint(downPoint, baseShapes[currentPage][selectShapeIdxs[currentPage]]['circle'], circleRadius)) {
            circleTouched = true;   // 回転用円画像タッチ開始
        }//反転ボタンをタッチしているか判定
        else if (selectShapeIdxs[currentPage] !== null && sps.judgeInnerCirclePoint(downPoint, baseShapes[currentPage][selectShapeIdxs[currentPage]]['square'], circleRadius)) {
            turnOverTouched = true; // 図形の裏返し用画像のタッチかチェック
            if (turnOverTouched) {
                sps.flipAboutYAxis(baseShapes[currentPage][selectShapeIdxs[currentPage]]);
            }
        }
        else {
            targetShapeIdxs[currentPage] = sps.getSelectShapeIdx(downPoint, baseShapes[currentPage]);
        }
    };
    canvas.addEventListener('mousedown', onMouseDown, false);
    canvas.addEventListener('touchstart', onMouseDown, false);

    /**
     * マウスダウン（タッチ移動）中の処理
     * @param e
     */
    let onMouseMove = function (e) {
        e.preventDefault(); // デフォルトイベントをキャンセル

        if (touched) {
            if (!circleTouched) {
                // 円画像タッチ以外の場合、図形選択は解除
                selectShapeIdxs[currentPage] = null;
            }
            // 移動後の座標
            let downPoint = sps.getTouchPoint(e, canvasPosition.top, canvasPosition.left);   // マウスダウン（orタッチ）座標
            let currentX = downPoint[0];
            let currentY = downPoint[1];

            if (currentX < 0 || currentY < 0 || canvasPosition.width < currentX || canvasPosition.height < currentY) {
                // 範囲外にタッチ中の場合は強制マウスアップ扱い
                touched = false; // マウスダウン（orタッチ）中を解除
                touchCardIdx = null; // タッチ中のカードインデックス初期化
            }

            // 移動量を算出
            let dx = currentX - touchX;
            let dy = currentY - touchY;

            if (circleTouched) {
                // 図形回転の場合
                sps.rotateShape([currentX, currentY], baseShapes[currentPage][selectShapeIdxs[currentPage]]);
            } else if (null !== targetShapeIdxs[currentPage]) {
                // 図形移動の場合

                sps.moveShape(baseShapes[currentPage][targetShapeIdxs[currentPage]], dx, dy);


            }
            // マウスダウン（タッチ）開始座標を更新
            touchX = currentX;
            touchY = currentY;
        }
    };
    canvas.addEventListener('mousemove', onMouseMove, false);
    canvas.addEventListener('touchmove', onMouseMove, false);

    /**
     * マウスアップ（タッチ終了）時の処理
     * @param e 操作イベント
     */
    let onMouseUp = function (e) {
        e.preventDefault(); // デフォルトイベントをキャンセル


        touched = false; // マウスダウン（orタッチ）中を解除
        baseShapeTouched = false;   // ベース図形タッチを解除
        circleTouched = false;  // 回転用円画像タッチを解除

        let downPoint = sps.getTouchPoint(e, canvasPosition.top, canvasPosition.left);   // マウスダウン（orタッチ）座標
        let touchEndX = Math.floor(downPoint[0]);
        let touchEndY = Math.floor(downPoint[1]);

        if (Math.abs(touchStartX - touchEndX) < 3 && Math.abs(touchStartY - touchEndY) < 3) {
            // クリック判定（タッチ開始時座標と終了座標が僅差であればクリックとみなす）
            let selectIdx = sps.getSelectShapeIdx(downPoint, baseShapes[currentPage]);
            if (selectIdx !== null) {
                // 選択した図形が手前に描画されるよう図形データの配列順番を調整し、最後尾の選択図形のインデックスを取得
                selectShapeIdxs[currentPage] = sps.resortShapesForSelect(selectIdx, baseShapes[currentPage]);
            } else {
                selectShapeIdxs[currentPage] = null;  // 図形選択なし
            }
        } else {
            // クリックではなくドラッグ後のマウスアップ（タッチ終了）の場合
            if (targetShapeIdxs[currentPage] !== null) {
                // 移動終了の場合は移動後の座標を補正
                let dx = touchEndX - touchStartX;
                let dy = touchEndY - touchStartY;
                sps.moveNearestShape(targetShapeIdxs[currentPage], baseShapes[currentPage], dx, dy);
            }
        }

        targetShapeIdxs[currentPage] = null;  // 移動対象の図形設定を解除
    };
    canvas.addEventListener('mouseup', onMouseUp, false);
    canvas.addEventListener('touchend', onMouseUp, false);


    /**
     * 「やりなおし」ボタンのクリック時処理
     */
    $restartBtns.click(function () {
        init(currentPage);
    });

    /**
     * 矢印ボタンのクリック時処理
     */
    $('.arrowBtn').click(function () {
        let page = parseInt($(this).data('page'));
        $('.pageContent').hide();
        $('#page_' + page).show();
        currentPage = page;
    });
});

