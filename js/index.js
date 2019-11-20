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
    $btns.height(btnHeight).width(btnWidth).css({ 'right': canvasPosition.width * 0.05 });
    $restartBtns.css({ 'bottom': canvasPosition.height * 0.147 });
  };
  btnCssSet();    // 初期実行

  // -------- 作図エリア --------
  let drawingArea = sps.setDrawingArea(canvasPosition);

  // -------- ページ個別設定値 --------

  // 現在のページ
  let currentPage = 0;
  // ベース図形
  let baseShapes = sps.setBaseShapes(canvasPosition, null);
  let baseShapes2 = sps.setBaseShapes(canvasPosition, null);

  // 図形データ
  let pageShapes =
    [
      /*
      [   // 1ページ分の図形情報
          {   // 図形１個分の情報
              'marks': [],     // 各頂点のマーク（matrixの頂点順）
              'center': [0, 0],       // 重心
              'crossPoint': [0, 0],   // 重心からの垂線と辺の交点
              'circle': [0, 0],        // 円（回転アイコン）の中心
              'matrix': [],     // 各頂点の座標
              'markMatrix': [],     // 各頂点マークの座標
              'origin': {     // 回転時の座標計算用に元座標を保存
                  'crossPoint': [],
                  'circle': [],
                  'matrix': [],
                  'alphabetMatrix': [],
              },
          },
      ],
       */
    ];

  // 複製図形の移動時
  let selectShapeIdxs = [];
  let targetShapeIdxs = [];

  // 各設定値の初期化
  let init = function (page) {
    // ベース図形
    baseShapes[page] = sps.setBaseShapes(canvasPosition, page);
    // 図形データ
    //pageShapes[page].push($.extend(true, {}, baseShapes[page][0]));
    pageShapes[page] = [];

    // 複製図形の移動時
    selectShapeIdxs[page] = null;  // 選択中の図形インデックス
    targetShapeIdxs[page] = null; // 移動中の図形インデックス


  };


  for (let i = 0; i < 5; i++) {
    init(i);
  }

  // 画面リサイズ時（Canvasのレスポンシブ対応）
  let resize = function () {
    // 元のキャンバスの高さを取得
    let originCanvasHeight = canvasPosition.height;
    let originCanvasWidth = canvasPosition.width;
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

    for (let i = 0; i < 5; i++) {
      // ベース図形の座標を再設定
      sps.recalculateBaseShape(scale, baseShapes[i]);
    }
    for (let i = 0; i < pageShapes.length; i++) {
      // 図形の座標を再設定
      sps.recalculateMatrix(scale, pageShapes[i]);
    }
  };
  $(window).resize(resize);

  // -------- 全ページ共通設定値 --------
  // 現在のページ
  //let currentPage = 0;

  //ベース画像がbaseShapes配列の何番目か取得
  let index = null;

  // マウスダウン（orタッチ）中かどうか
  let touched = false;
  // タッチ開始時の座標を記録
  let touchStartX = 0;
  let touchStartY = 0;
  // ベース図形タッチ開始かどうか
  let baseShapeTouched = false;
  // 回転用円画像タッチ開始どうか
  let circleTouched = false;

  //let turnOverTouched = false;
  // 移動時のタッチ座標
  let touchX = 0;
  let touchY = 0;


  // 回転用円画像の情報
  let circleRadius = 20;  // 半径
  // 回転用円画像のイメージオブジェクト

  // 裏返し用画像の情報
  let turnOverImg = new Image();
  turnOverImg.src = "./img/inv.png";

  let circleImg = new Image();
  circleImg.src = "./img/rotate.png";

  // 背景の平行四辺形タイル
  let parallelogramImg = new Image();
  parallelogramImg.src = "./img/S5-7_frame.png";

  // 1ページ目の部品タイル
  let page1TileImg = new Image();
  page1TileImg.src = "./img/shape1.png";

  // 2ページ目の部品タイル
  let page2TileImg = new Image();
  page2TileImg.src = "./img/shape2.png";

  // 3ページ目の部品タイル
  let page3TileImg = new Image();
  page3TileImg.src = "./img/shape3.png";

  // 4ページ目の部品タイル
  let page4TileImg = new Image();
  page4TileImg.src = "./img/shape4.png";

  let markswidth = (canvasPosition.width * 32 / 1280);
  let marksheight = (canvasPosition.height * 32 / 960);

  /**
   * 図形の描画
   */
  let drawShapes = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);


    let sampleShapeWidth = (canvasPosition.width * 463 / 1280);
    let sampleShapeHeight = (canvasPosition.height * 669 / 960);
    //  console.log(sampleShapeWidth);
    //  console.log(sampleShapeHeight);
    // 問題ページ固定の図形の描画（レスポンシブ対応版）


    ctx.drawImage(
      parallelogramImg,
      50,
      75,
      sampleShapeWidth,
      sampleShapeHeight
    );

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



    // let ansShapeWidth = (canvasPosition.width * 303 / 1280);
    // let ansShapeHeight = (canvasPosition.height * 125 / 960);

    // ctx.drawImage(
    //   page1TileImg,
    //   500,
    //   140,
    //   ansShapeWidth,
    //   ansShapeHeight
    // );


    // let ansShapeWidth2 = (canvasPosition.width * 270 / 1280);
    // let ansShapeHeight2 = (canvasPosition.height * 241 / 960);

    // ctx.drawImage(
    //   page2TileImg,
    //   550,
    //   200,
    //   ansShapeWidth2,
    //   ansShapeHeight2
    // );


    // let ansShapeWidth3 = (canvasPosition.width * 328 / 1280);
    // let ansShapeHeight3 = (canvasPosition.height * 106 / 960);

    // ctx.drawImage(
    //   page3TileImg,
    //   400,
    //   200,
    //   ansShapeWidth3,
    //   ansShapeHeight3
    // );

    // let ansShapeWidth4 = (canvasPosition.width * 135 / 1280);
    // let ansShapeHeight4 = (canvasPosition.height * 275 / 960);

    // ctx.drawImage(
    //   page4TileImg,
    //   400,
    //   290,
    //   ansShapeWidth4,
    //   ansShapeHeight4
    // );


    // ひらがな記号の描画
    for (let k = 0; k < baseShapes[currentPage].length; k++) {

      var image = new Image();
      image.src = baseShapes[currentPage][k]['mark_img'];

      ctx.drawImage(
        image,
        baseShapes[currentPage][k]['center'][0] - markswidth / 2,
        baseShapes[currentPage][k]['center'][1] - marksheight / 2,
        markswidth,
        marksheight
      )
    }


    // 複製図形の描画
    for (let k = 0; k < baseShapes[currentPage].length; k++) {

      if (k === selectShapeIdxs[currentPage]) {
        // null以外の場合選択中の図形あり

        // 円の画像からの縦線
        ctx.lineJoin = "miter";
        ctx.beginPath();
        ctx.moveTo(baseShapes[currentPage][k]['circle'][0], baseShapes[currentPage][k]['circle'][1]);
        ctx.closePath();

        ctx.lineWidth = 1;
        ctx.strokeStyle = sps.baseShapeLineColor;
        ctx.stroke();

        // 円の画像
        ctx.drawImage(
          circleImg,
          baseShapes[currentPage][k]['circle'][0] - circleRadius,
          baseShapes[currentPage][k]['circle'][1] - circleRadius,
          circleRadius * 2,
          circleRadius * 2
        );


                //反転用のボタン画像
                ctx.drawImage(turnOverImg, baseShapes[currentPage][k]['square'][0] - circleRadius, baseShapes[currentPage][k]['square'][1] - circleRadius, circleRadius *2, circleRadius * 2);

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

    let downPoint = sps.getTouchPoint(e, canvasPosition.top, canvasPosition.left);   // マウスダウン（orタッチ）座標
    touchX = downPoint[0];
    touchY = downPoint[1];

    // タッチ開始時の座標を記録
    touchStartX = Math.floor(downPoint[0]);
    touchStartY = Math.floor(downPoint[1]);

    // 図形の回転用円画像のタッチかチェック
    if (selectShapeIdxs[currentPage] !== null && sps.judgeInnerCirclePoint(downPoint, baseShapes[currentPage][selectShapeIdxs[currentPage]]['circle'], circleRadius)) {
      circleTouched = true;   // 回転用円画像タッチ開始
    }
        //反転ボタンをタッチしているか判定
        else if (selectShapeIdxs[currentPage] !== null && sps.judgeInnerCirclePoint(downPoint, baseShapes[currentPage][selectShapeIdxs[currentPage]]['square'], circleRadius)) {
          turnOverTouched = true; // 図形の裏返し用画像のタッチかチェック
          if (turnOverTouched) {
              sps.flipAboutYAxis(baseShapes[currentPage][selectShapeIdxs[currentPage]]);
          }
      }
    else {
      // 複製図形をタッチしていないか
      targetShapeIdxs[currentPage] = sps.getSelectShapeIdx(downPoint, baseShapes[currentPage], currentPage);
      if (null === targetShapeIdxs[currentPage]) {
        //ベース画像がbaseShapes配列の何番目か取得->index
        index = sps.getSelectShapeIdx(downPoint, baseShapes[currentPage]);
        //ベース画像以外をタッチしているとindexにnullが入ってエラー出るので「null以外なら」（＝ベース画像を触っていたら）で処理
        if (index != null) {
          // 制限枚数までベース図形をタッチしたかどうかチェック
          baseShapeTouched = sps.judgeInnerShapePoint(downPoint, baseShapes[currentPage][index]);
        }
      }
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
        targetShapeIdxs[currentPage] = null; // タッチ中のカードインデックス初期化
      }

      // 移動量を算出
      let dx = currentX - touchX;
      let dy = currentY - touchY;

      if (null !== targetShapeIdxs[currentPage]) {
        // 複製図形移動の場合
        sps.moveShape(baseShapes[currentPage][targetShapeIdxs[currentPage]], dx, dy);
      } else if (circleTouched) {
        // 複製図形回転の場合
        sps.rotateShape([currentX, currentY], baseShapes[currentPage][selectShapeIdxs[currentPage]]);
      } else if (baseShapeTouched) {

        // ベース図形にタッチした場合、タッチしたベース図形の情報をコピーして複製図形配列に追加
        if (index == 1) {
          //let baseShapeCopyData = $.extend(true, {}, baseShapes[currentPage][index]);
          let baseShapeCopyData = $.extend(true, {}, baseShapes[currentPage][index]);
          baseShapes[currentPage].push(baseShapeCopyData);

          // 複製図形をタッチ中の図形に指定
          targetShapeIdxs[currentPage] = baseShapes[currentPage].length - 1;
          sps.moveShape(baseShapes[currentPage][targetShapeIdxs[currentPage]], dx, dy);
          // ベース定規タッチを解除
          baseShapeTouched = false;
        }
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
      let selectIdx = sps.getSelectShapeIdx(downPoint, baseShapes[currentPage], currentPage);
      if (selectIdx !== null) {
        // 選択した図形が手前に描画されるよう図形データの配列順番を調整し、最後尾の選択図形のインデックスを取得
        selectShapeIdxs[currentPage] = sps.resortShapesForSelect(selectIdx, baseShapes[currentPage]);
      } else {
        selectShapeIdxs[currentPage] = null;  // 図形選択なし
      }
    } else {
      // クリックではなくドラッグ後のマウスアップ（タッチ終了）の場合
      if (targetShapeIdxs[currentPage] !== null) {
        let selectIdx = sps.getSelectShapeIdx(downPoint, baseShapes[currentPage], currentPage);
        let cloneShapes = baseShapes[currentPage].concat();
        let beforePoint = [];

        cloneShapes.push(baseShapes[currentPage][0]);

        for (let i = 0; i < baseShapes[currentPage][selectIdx]['matrix'].length; i++) {
          beforePoint[i] = baseShapes[currentPage][selectIdx]['matrix'][i].concat();
        }
      }
    }
    targetShapeIdxs[currentPage] = null;  // 移動対象の図形設定を解除
  };
  canvas.addEventListener('mouseup', onMouseUp, false);
  canvas.addEventListener('touchend', onMouseUp, false);

  /**
* マウスオーバーの処理
* @param e
*/
  let onMouseOut = function (e) {

    console.log("onMouseOut");

    e.preventDefault(); // デフォルトイベントをキャンセル

    touched = false; // マウスダウン（orタッチ）中を解除
    targetShapeIdxs[currentPage] = null; // タッチ中のカードインデックス初期化

  };
  canvas.addEventListener('pointerout', onMouseOut, false);

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
