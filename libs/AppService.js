const AppService = function() {
    // カードの総数
    this.cardTotal = 28;

    // カードの横幅（canvasの横幅に対する割合）
    this.cartWidth = 0.1;

    // カード画像のサイズ
    this.cardImgWidth = 105;
    this.cardImgHeight = 47;

    // カードの初期位置（黒板の大きさに対する倍率で基本位置からのズレを指定）
    this.cardPosition = {
        // 1列目
        1: [0, 0],
        2: [-0.01, 0],
        3: [0.01, 0],
        4: [0, -0.01],
        5: [-0.02, 0],
        6: [0, 0],
        7: [-0.01, 0],
        // ２列目
        8: [0, 0],
        9: [0, 0],
        10: [0.02, 0],
        11: [0, 0],
        12: [-0.02, 0],
        13: [0.01, 0],
        14: [-0.005, 0],
        // 3列目
        15: [0, 0],
        16: [0.015, 0],
        17: [0.02, 0],
        18: [0, 0],
        19: [0.005, 0],
        20: [0.01, 0],
        21: [0, 0],
        // 4列目
        22: [0.02, 0],
        23: [0.01, 0],
        24: [0.04, 0],
        25: [0.025, 0],
        26: [0, 0],
        27: [0.02, 0],
        28: [0.015, 0],
    };
};
(function(){
    /**
     *  GETパラメータを配列にして返す
     *  @return     パラメータのObject
     */
    AppService.prototype.getUrlVars = function () {
        let vars = {};
        let param = location.search.substring(1).split('&');
        for(let i = 0; i < param.length; i++) {
            let keySearch = param[i].search(/=/);
            let key = '';
            if (keySearch !== -1) key = param[i].slice(0, keySearch);
            let val = param[i].slice(param[i].indexOf('=', 0) + 1);
            if (key !== '') vars[key] = decodeURI(val);
        }
        return vars;
    };

    /**
     * マウスダウン（orタッチ）座標を取得する
     * @param evt
     * @param touchAreaTop
     * @param touchAreaLeft
     * @return array    マウスダウン（orタッチ）座標 x, yの配列
     */
    AppService.prototype.getTouchPoint = function (evt, touchAreaTop, touchAreaLeft) {
        let touchX = 0;
        let touchY = 0;
        if (evt.type === 'touchstart' || evt.type === 'touchmove' || evt.type === 'touchend') {
            // タッチデバイスの場合
            let touchObject = evt.changedTouches[0] ;
            touchX = touchObject.pageX - touchAreaLeft;
            touchY = touchObject.pageY - touchAreaTop;
        } else {
            // マウス操作の場合
            touchX = evt.clientX - touchAreaLeft;
            touchY = evt.clientY - touchAreaTop;
        }
        return [touchX, touchY];   // マウスダウン（orタッチ）座標
    };

    /**
     * クリックした場所にあるカードのインデックスを取得
     * @param point
     * @param shapes
     * @return {null|number}
     */
    AppService.prototype.getTouchCardIdx = function (point, cards, canvasWidth) {
        // カードの横幅
        let cardWidth = canvasWidth * this.cartWidth;
        // カードの横幅
        let cardHeight = cardWidth / this.cardImgWidth * this.cardImgHeight;

        let resultIdx = -1;
        for (let j = 1; j < this.cardTotal+1; j++) {
            let innerJudge = this.judgeInnerShapePoint(point, cards[j], cardWidth, cardHeight);
            if (innerJudge) {
                resultIdx = j;
            }
        }

        if (resultIdx === -1) {
            return null;
        } else {
            return resultIdx;
        }
    };

    /**
     * 指定ポイントが図形内に存在する点か判定する
     * @param point
     * @param shape
     * @return {boolean}
     */
    AppService.prototype.judgeInnerShapePoint = function(point, card, cardWidth, cardHeight) {
        // ある２次元上の点が多角形の内部にあるかどうかを判定するには、判定点からX軸に水平な半直線を描き、
        // 多角形の各線分との交点の個数が奇数ならば、内部の点と判断すればよい
        let intersectCount = 0;
        let cardMatrix = [
            [card[0], card[1]],
            [card[0], card[1]+cardHeight],
            [card[0]+cardWidth, card[1]+cardHeight],
            [card[0]+cardWidth, card[1]],
        ];
        for (let i = 0; i < cardMatrix.length; i++) {
            let nextIdx = i + 1;
            if (i === cardMatrix.length - 1) {
                // 最終頂点は始点と結ぶ線分にする
                nextIdx = 0;
            }

            // 対象点より+x軸方向に辺の頂点のどちらかがある場合のみ交差する
            if (point[0] < cardMatrix[i][0] || point[0] < cardMatrix[nextIdx][0]) {
                let targetPointEnd = [cardMatrix[i][0], point[1]];
                if (cardMatrix[i][0] < cardMatrix[nextIdx][0]) {
                    targetPointEnd[0] = cardMatrix[nextIdx][0];
                }

                // 辺と対象点（指定点と辺の最長y座標を結ぶ平行線）の交点を取得
                let crossP = this.getIntersectPoint(point, targetPointEnd, cardMatrix[i], cardMatrix[nextIdx]);
                if (null !== crossP) {
                    intersectCount++;
                }
            }
        }

        if (intersectCount % 2 === 1) {
            return true;
        } else {
            return false;
        }
    };

    /**
     * 2つの線分（線分ABと線分CD）の交点を求める（交点がない場合はnullが返る）
     * @param pointA
     * @param pointB
     * @param pointC
     * @param pointD
     * @return {null|number[]}
     */
    AppService.prototype.getIntersectPoint = function(pointA, pointB, pointC, pointD) {
        // 外積が0のとき平行
        let vectorAB = [pointB[0] - pointA[0], pointB[1] - pointA[1]]; // ベクトルAB
        let vectorCD = [pointD[0] - pointC[0], pointD[1] - pointC[1]]; // ベクトルCD
        // 2次元ベクトルA(ax, ay)とB(bx, by)の外積A×B : A×B = ax*by - ay*bx
        let crossProductAB2CD = vectorAB[0] * vectorCD[1] - vectorAB[1] * vectorCD[0];    // ABとCDの外積
        if (crossProductAB2CD === 0) {
            // ベクトルABとCDが平行のとき交点は存在しない
            return null;
        }

        let crossP = [0, 0];
        let s1 = ((pointD[0] - pointC[0]) * (pointA[1] - pointC[1]) - (pointD[1] - pointC[1]) * (pointA[0] - pointC[0])) / 2;
        let s2 = ((pointD[0] - pointC[0]) * (pointC[1] - pointB[1]) - (pointD[1] - pointC[1]) * (pointC[0] - pointB[0])) / 2;

        // 2直線の交点を求める
        crossP[0] = pointA[0] + (pointB[0] - pointA[0]) * s1 / (s1 + s2);
        crossP[1] = pointA[1] + (pointB[1] - pointA[1]) * s1 / (s1 + s2);

        let ACx = pointC[0] - pointA[0];
        let ACy = pointC[1] - pointA[1];
        let tmp = (pointB[0] - pointA[0]) * (pointD[1] - pointC[1]) - (pointB[1] - pointA[1]) * (pointD[0] - pointC[0]);

        let r = ((pointD[1] - pointC[1]) * ACx - (pointD[0] - pointC[0]) * ACy) / tmp;
        let s = ((pointB[1] - pointA[1]) * ACx - (pointB[0] - pointA[0]) * ACy) / tmp;

        // 2直線上にあるかどうか
        if (0 <= r && r <=1 && 0 <= s && s <= 1) {
            return crossP;
        } else {
            return null;
        }
    };
}());
