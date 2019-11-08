$(function() {
    // サービス呼び出し
    let aps = new AppService();

    /* ------------------------------------------------------------
    ページ共通
    --------------------------------------------------------------- */
    // コンテンツ表示エリア
    let $content = $('#content');
    // キャンバスのID
    let canvasId = "appCanvas";
    let $canvas = $("#"+canvasId);

    // 現在のページ
    let currentPage = 1;

    // ボタン位置を調整
    let btnCssSet = function() {
        let restartWidth = $content.width() * 0.18;
        let restartHeight = restartWidth / 221  *  68;
        $('.restart').height(restartHeight).width(restartWidth);

        let arrowBtnWidth = $content.width() * 0.04;
        let arrowBtnHeight = arrowBtnWidth / 44  * 58;
        $('.arrowBtn').height(arrowBtnHeight).width(arrowBtnWidth);
    };
    btnCssSet();    // 初期実行

    // ページDOM
    let $page1 = $('#page1');
    let $page2 = $('#page2');

    /**
     * 右矢印ボタンのクリック時処理
     */
    $('#nextPage').click(function () {
        currentPage = 2;
        $page1.hide();
        $page2.show();
    });

    /**
     * 左矢印ボタンのクリック時処理
     */
    $('#beforePage').click(function () {
        currentPage = 1;
        $page1.show();
        $page2.hide();
    });

    // 現在のページをURLから取得
    let urlVars = aps.getUrlVars();
    if ('2' === urlVars['page']) {
        $('#nextPage').click();
    }

    /* ------------------------------------------------------------
    ページ1
    --------------------------------------------------------------- */
    // キャンバス情報
    let canvas = document.getElementById(canvasId);
    let ctx = canvas.getContext("2d");
    let canvasPosition = canvas.getBoundingClientRect();
    // キャンバスのサイズを再設定
    canvas.width  = canvasPosition.width;
    canvas.height = canvasPosition.height;

    // 黒板の画像
    let blackBoardImg = new Image();
    blackBoardImg.src = "./img/blackboard.png";

    // カードの画像
    let cardImgs = [];
    for (let i = 1; i < aps.cardTotal+1; i++) {
        cardImgs[i] = new Image();
        cardImgs[i].src = "./img/card"+i+".png";
    }

    // カード初期描画
    let cards = [];
    let cardAreaTop = canvasPosition.height * 0.15;
    let cardAreaLeft = canvasPosition.width * 0.26;
    let cardTop = cardAreaTop;
    let cardLeft = cardAreaLeft;
    for (let i = 1; i < aps.cardTotal+1; i++) {
        cards[i] = [];
        cards[i][0] = cardLeft + canvasPosition.width * aps.cardPosition[i][0];
        cards[i][1] = cardTop + canvasPosition.height * aps.cardPosition[i][1];
        if (i % 7 === 0) {
            cardTop = cardAreaTop;
            cardLeft += canvasPosition.width * (aps.cartWidth + 0.02);
        } else {
            cardTop += canvasPosition.width * aps.cartWidth / aps.cardImgWidth * aps.cardImgHeight;
        }
    }

    /**
     * 図形の描画
     */
    let drawShapes = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (1 === currentPage) {
            // 黒板の描画
            let blackBoardWidth = canvasPosition.width * 0.9;
            let blackBoardHeight = blackBoardWidth / 971 * 558;
            ctx.drawImage(blackBoardImg, canvasPosition.width * 0.05, canvasPosition.height * 0.03, blackBoardWidth, blackBoardHeight);

            // カード描画
            let cardWidth = canvasPosition.width * aps.cartWidth;
            let cardHeight = cardWidth / aps.cardImgWidth * aps.cardImgHeight;
            for (let i = 1; i < aps.cardTotal+1; i++) {
                ctx.drawImage(cardImgs[i], cards[i][0], cards[i][1], cardWidth, cardHeight);
            }
        }
    };

    /**
     * レンダリング処理
     * （「切る」モードや「移動」モード時のみレンダリングを実行する）
     */
    let renderAnimation = null;
    let render = function() {
        drawShapes();
        renderAnimation = window.requestAnimationFrame(render);
    };
    render();

    // マウスダウン（orタッチ）中かどうか
    let touched = false;
    // 移動時のタッチ座標
    let touchX = 0;
    let touchY = 0;
    // タッチ中のカードインデックス
    let touchCardIdx = null;

    /**
     * マウスダウン（orタッチ）開始時の処理
     * @param e 操作イベント
     */
    let onMouseDown = function (e) {
        if (1 === currentPage) {
            e.preventDefault(); // デフォルトイベントをキャンセル
            touched = true; // マウスダウン（orタッチ）中

            // 移動座標計算用にタッチ開始時の座標を設定
            let downPoint = aps.getTouchPoint(e, canvasPosition.top, canvasPosition.left);   // マウスダウン（orタッチ）座標
            touchX = downPoint[0];
            touchY = downPoint[1];

            // カードをタッチしたかどうかチェック
            touchCardIdx = aps.getTouchCardIdx(downPoint, cards, canvasPosition.width);
        }
    };
    canvas.addEventListener('mousedown', onMouseDown, false);
    canvas.addEventListener('touchstart', onMouseDown, false);

    /**
     * マウスダウン（タッチ移動）中の処理
     * @param e
     */
    let onMouseMove = function (e) {
        if (1 === currentPage) {
            e.preventDefault(); // デフォルトイベントをキャンセル

            if (touched) {
                // 移動後の座標
                let downPoint = aps.getTouchPoint(e, canvasPosition.top, canvasPosition.left);   // マウスダウン（orタッチ）座標
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

                if (touchCardIdx !== null) {
                    cards[touchCardIdx][0] += dx;
                    cards[touchCardIdx][1] += dy;
                }

                // マウスダウン（タッチ）開始座標を更新
                touchX = currentX;
                touchY = currentY;
            }
        }
    };
    canvas.addEventListener('mousemove', onMouseMove, false);
    canvas.addEventListener('touchmove', onMouseMove, false);

    /**
     * マウスアップ（タッチ終了）時の処理
     * @param e 操作イベント
     */
    let onMouseUp = function (e) {
        if (1 === currentPage) {
            touched = false; // マウスダウン（orタッチ）中を解除
            touchCardIdx = null; // タッチ中のカードインデックス初期化
        }
    };
    $(document).on('mouseup', onMouseUp);
    $(document).on('touchend', onMouseUp);


    /**
     * 「やりなおし」ボタンのクリック時処理
     */
    $('#restartPage1').click(function () {
        location.href = 'index.html';
    });

    /* ------------------------------------------------------------
    ページ2
    --------------------------------------------------------------- */
    // スライダーの数
    let sliderTotal = 4;

    // 各スライダーのイベント定義
    for (let i = 1; i < sliderTotal+1; i++) {
        (function(){
            let $slider = $("#slider_"+i);
            $slider.slider({
                classes: {
                    "ui-slider-range": "ui-corner-all slider-back"
                },
                orientation: "vertical",    // スライダーの縦横向き
                min: 0,         // スライダーの最小値
                max: 10,        // スライダーの最大値
                step: 1,       // 最小から最大までの1ステップの間隔
                range: "min",   // 最小値からのスライド
                value: 0, // スライダーの値（初期値）
                slide: function(event, ui) {
                    let value = ui.value;
                    if (0 === value) {
                       $slider.find('.slider-back').css({
                           'border-top': 'none',
                           'border-left': 'none',
                           'border-right': 'none',
                       });
                   } else {
                        $slider.find('.slider-back').css({
                           'border-top': 'solid 1px #000000',
                           'border-left': 'solid 1px #000000',
                           'border-right': 'solid 1px #000000',
                       });
                   }
                }
            });
        })();
    }

    /**
     * 「やりなおし」ボタンのクリック時処理
     */
    $('#restartPage2').click(function () {
        location.href = 'index.html?page=2';
    });

    /* ------------------------------------------------------------
    リサイズ処理
    --------------------------------------------------------------- */
    $(window).resize(function () {
        // 元のキャンバスの高さを取得
        let originCanvasHeight = canvasPosition.height;
        // キャンバスの位置、サイズを再取得
        canvasPosition = canvas.getBoundingClientRect();
        // キャンバスのサイズを再設定
        canvas.width  = canvasPosition.width;
        canvas.height = canvasPosition.height;

        // ボタンサイズのリサイズ
        btnCssSet();

        // カードの座標を再計算
        let scale = canvasPosition.height / originCanvasHeight;
        for (let i = 1; i < aps.cardTotal+1; i++) {
            cards[i][0] = cards[i][0] * scale;
            cards[i][1] = cards[i][1] * scale;
        }
    });
});

