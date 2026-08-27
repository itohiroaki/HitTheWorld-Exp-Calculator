let expTable = {};


// ==============================
// 経験値テーブル読み込み
// ==============================

async function loadExpTable() {

    try {

        const response =
            await fetch("data/exp_table.json");


        if (!response.ok) {

            throw new Error(
                "経験値テーブルを読み込めませんでした。"
            );

        }


        expTable =
            await response.json();


        const levels =
            Object.keys(expTable)
                .map(Number)
                .sort((a, b) => a - b);


        if (levels.length === 0) {

            throw new Error(
                "経験値データがありません。"
            );

        }


        document
            .getElementById("dataStatus")
            .textContent =
            `経験値データ：Lv${levels[0]} ～ Lv${levels[levels.length - 1]}（${levels.length}件）`;


    } catch (error) {

        console.error(error);


        document
            .getElementById("dataStatus")
            .textContent =
            "経験値データの読み込みに失敗しました。";

    }

}


// ==============================
// Lv○○の100%経験値取得
// ==============================

function getExp100(level) {

    const data =
        expTable[String(level)];


    if (data === undefined) {

        return null;

    }


    if (typeof data === "number") {

        return data;

    }


    if (
        typeof data === "object" &&
        data.exp_100_percent !== undefined
    ) {

        return Number(
            data.exp_100_percent
        );

    }


    return null;

}


// ==============================
// 日付フォーマット
// ==============================

function formatDate(date) {

    return date.toLocaleDateString(
        "ja-JP",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );

}


// ==============================
// 必要経験値計算
// ==============================

function calculateRequiredExp() {

    const currentLevel =
        Number(
            document.getElementById(
                "currentLevel"
            ).value
        );


    const currentExp =
        Number(
            document.getElementById(
                "currentExp"
            ).value
        );


    const targetLevel =
        Number(
            document.getElementById(
                "targetLevel"
            ).value
        );


    const expPerHour =
        Number(
            document.getElementById(
                "expPerHour"
            ).value
        );


    const hoursPerDay =
        Number(
            document.getElementById(
                "hoursPerDay"
            ).value
        );


    const targetDateValue =
        document.getElementById(
            "targetDate"
        ).value;


    const result =
        document.getElementById(
            "result"
        );


    const resultContent =
        document.getElementById(
            "resultContent"
        );


    result.hidden = false;


    // ==============================
    // 入力チェック
    // ==============================

    if (
        !Number.isFinite(currentLevel) ||
        !Number.isFinite(currentExp) ||
        !Number.isFinite(targetLevel) ||
        !Number.isFinite(expPerHour) ||
        !Number.isFinite(hoursPerDay)
    ) {

        resultContent.innerHTML =
            `<div class="error">
                数値を正しく入力してください。
            </div>`;

        return;

    }


    if (currentExp < 0 || currentExp >= 100) {

        resultContent.innerHTML =
            `<div class="error">
                現在の経験値は0%以上100%未満で入力してください。
            </div>`;

        return;

    }


    if (targetLevel <= currentLevel) {

        resultContent.innerHTML =
            `<div class="error">
                目標レベルは現在レベルより高くしてください。
            </div>`;

        return;

    }


    if (expPerHour <= 0) {

        resultContent.innerHTML =
            `<div class="error">
                現在の狩り効率は0より大きくしてください。
            </div>`;

        return;

    }


    if (
        hoursPerDay <= 0 ||
        hoursPerDay > 24
    ) {

        resultContent.innerHTML =
            `<div class="error">
                1日の狩り時間は0より大きく、24時間以下で入力してください。
            </div>`;

        return;

    }


    if (!targetDateValue) {

        resultContent.innerHTML =
            `<div class="error">
                目標日を入力してください。
            </div>`;

        return;

    }


    // ==============================
    // 経験値データ確認
    // ==============================

    const missingLevels = [];


    for (
        let level = currentLevel;
        level < targetLevel;
        level++
    ) {

        if (getExp100(level) === null) {

            missingLevels.push(level);

        }

    }


    if (missingLevels.length > 0) {

        const missingText =
            missingLevels
                .map(
                    level => `Lv${level}`
                )
                .join("、");


        resultContent.innerHTML =
            `<div class="warning">

                <strong>
                    計算に必要な経験値データが不足しています。
                </strong>

                <p>
                    以下のレベルのデータがありません。
                </p>

                <p>
                    ${missingText}
                </p>

                <p>
                    経験値データが追加されると、
                    計算できるようになります。
                </p>

            </div>`;

        return;

    }


    // ==============================
    // 必要経験値
    // ==============================

    let requiredExp = 0;


    // 現在レベルの残り

    const currentLevelExp =
        getExp100(currentLevel);


    requiredExp +=
        currentLevelExp *
        (
            1 -
            currentExp / 100
        );


    // 次レベル以降

    for (
        let level = currentLevel + 1;
        level < targetLevel;
        level++
    ) {

        requiredExp +=
            getExp100(level);

    }


    // ==============================
    // 現在レベルの実EXP/h
    // ==============================

    const expPerHourActual =
        (
            currentLevelExp / 100
        ) *
        expPerHour;


    // ==============================
    // 必要時間
    //
    // 現在の狩り効率を
    // 目標レベルまで維持する
    // ==============================

    const requiredHours =
        requiredExp /
        expPerHourActual;


    const requiredDays =
        requiredHours /
        hoursPerDay;


    // ==============================
    // 到達予定日
    // ==============================

    const today =
        new Date();


    const arrivalDate =
        new Date(today);


    arrivalDate.setTime(
        arrivalDate.getTime() +
        requiredHours *
        60 *
        60 *
        1000
    );


    // ==============================
    // 目標日
    // ==============================

    const targetDate =
        new Date(
            targetDateValue +
            "T23:59:59"
        );


    const remainingMilliseconds =
        targetDate.getTime() -
        today.getTime();


    const remainingDays =
        remainingMilliseconds /
        (
            24 *
            60 *
            60 *
            1000
        );


    // ==============================
    // 目標日までに必要な効率
    // ==============================

    const requiredExpPerHour =
        requiredExp /
        (
            (
                remainingDays *
                hoursPerDay
            ) *
            (
                currentLevelExp / 100
            )
        );


    // ==============================
    // 判定
    // ==============================

    const canReach =
        requiredDays <= remainingDays;


    let statusHTML;


    if (canReach) {

        statusHTML =
            `<div class="result-highlight">

                <div class="status-ok">
                    🟢 目標日までに到達可能
                </div>

            </div>`;

    } else {

        statusHTML =
            `<div class="result-highlight">

                <div class="status-ng">
                    🔴 現在のペースでは間に合いません
                </div>

            </div>`;

    }


    // ==============================
    // 結果表示
    // ==============================

    resultContent.innerHTML = `

        <div class="result-item">
            現在レベル：
            <strong>
                Lv${currentLevel}
            </strong>
        </div>


        <div class="result-item">
            現在経験値：
            <strong>
                ${currentExp}%
            </strong>
        </div>


        <div class="result-item">
            目標レベル：
            <strong>
                Lv${targetLevel}
            </strong>
        </div>


        <hr>


        <div class="result-item">
            必要経験値
        </div>


        <div class="result-value">
            ${requiredExp.toLocaleString()}
            EXP
        </div>


        <div class="result-item">
            必要狩り時間：
            <strong>
                ${requiredHours.toFixed(1)}
                時間
            </strong>
        </div>


        <div class="result-item">
            必要日数：
            <strong>
                ${requiredDays.toFixed(2)}
                日
            </strong>
        </div>


        <div class="result-item">
            到達予定日：
            <strong>
                ${formatDate(arrivalDate)}
            </strong>
        </div>


        <hr>


        <div class="result-item">
            目標日：
            <strong>
                ${formatDate(targetDate)}
            </strong>
        </div>


        <div class="result-item">
            目標日まで：
            <strong>
                ${Math.max(
                    0,
                    remainingDays
                ).toFixed(2)}
                日
            </strong>
        </div>


        <div class="result-item">
            現在の狩り効率：
            <strong>
                ${expPerHour.toFixed(2)}
                % / 時間
            </strong>
        </div>


        <div class="result-item">
            目標日までに必要な効率：
            <strong>
                ${requiredExpPerHour.toFixed(2)}
                % / 時間
            </strong>
        </div>


        ${statusHTML}

    `;

}


// ==============================
// ボタン
// ==============================

document
    .getElementById(
        "calculateButton"
    )
    .addEventListener(
        "click",
        calculateRequiredExp
    );


// ==============================
// 初期処理
// ==============================

loadExpTable();