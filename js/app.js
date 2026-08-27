let expTable = {};


// ==========================================
// 経験値テーブル読み込み
// ==========================================

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


// ==========================================
// Lv○○の100%経験値取得
// ==========================================

function getExp100(level) {

    const data =
        expTable[String(level)];


    if (data === undefined) {

        return null;

    }


    // 数値形式にも対応

    if (typeof data === "number") {

        return data;

    }


    // 現在使用している形式

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


// ==========================================
// 数値をEXP表記に変換
// ==========================================

function formatExp(value) {

    return Math.round(value)
        .toLocaleString("ja-JP");

}


// ==========================================
// 日付フォーマット
// ==========================================

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


// ==========================================
// メイン計算
// ==========================================

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


    const expPerHourPercent =
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


    // ==========================================
    // 入力チェック
    // ==========================================

    if (
        !Number.isFinite(currentLevel) ||
        !Number.isFinite(currentExp) ||
        !Number.isFinite(targetLevel) ||
        !Number.isFinite(expPerHourPercent) ||
        !Number.isFinite(hoursPerDay)
    ) {

        resultContent.innerHTML =
            `
            <div class="error">
                数値を正しく入力してください。
            </div>
            `;

        return;

    }


    if (
        currentExp < 0 ||
        currentExp >= 100
    ) {

        resultContent.innerHTML =
            `
            <div class="error">
                現在の経験値は0%以上100%未満で入力してください。
            </div>
            `;

        return;

    }


    if (targetLevel <= currentLevel) {

        resultContent.innerHTML =
            `
            <div class="error">
                目標レベルは現在レベルより高くしてください。
            </div>
            `;

        return;

    }


    if (expPerHourPercent <= 0) {

        resultContent.innerHTML =
            `
            <div class="error">
                現在の狩り効率は0より大きくしてください。
            </div>
            `;

        return;

    }


    if (
        hoursPerDay <= 0 ||
        hoursPerDay > 24
    ) {

        resultContent.innerHTML =
            `
            <div class="error">
                1日の狩り時間は0より大きく、
                24時間以下で入力してください。
            </div>
            `;

        return;

    }


    if (!targetDateValue) {

        resultContent.innerHTML =
            `
            <div class="error">
                目標日を入力してください。
            </div>
            `;

        return;

    }


    // ==========================================
    // 必要な経験値データを確認
    //
    // Lv86 → Lv90なら
    //
    // Lv86
    // Lv87
    // Lv88
    // Lv89
    //
    // が必要
    // ==========================================

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
            `
            <div class="warning">

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

            </div>
            `;

        return;

    }


    // ==========================================
    // 現在レベルの100%経験値
    // ==========================================

    const currentLevelExp =
        getExp100(currentLevel);


    // ==========================================
    // 現在の「%/h」を実EXP/hへ変換
    //
    // 例：
    //
    // Lv86
    // 586,175,459,470 EXP
    //
    // 1.38%/h
    //
    // ↓
    //
    // 約8.09億 EXP/h
    // ==========================================

    const actualExpPerHour =
        currentLevelExp *
        (
            expPerHourPercent / 100
        );


    // ==========================================
    // 必要経験値
    // ==========================================

    let requiredExp = 0;


    // 現在レベルの残り経験値

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


    // ==========================================
    // 必要狩り時間
    // ==========================================

    const requiredHours =
        requiredExp /
        actualExpPerHour;


    const requiredDays =
        requiredHours /
        hoursPerDay;


    // ==========================================
    // レベル別の予想効率
    // ==========================================

    let levelRows = "";


    for (
        let level = currentLevel;
        level < targetLevel;
        level++
    ) {

        const levelExp =
            getExp100(level);


        const levelPercentPerHour =
            actualExpPerHour /
            levelExp *
            100;


        levelRows +=
            `
            <tr>

                <td>
                    Lv${level}
                </td>

                <td>
                    ${formatExp(levelExp)}
                </td>

                <td>
                    ${levelPercentPerHour.toFixed(2)}%
                </td>

            </tr>
            `;

    }


    // ==========================================
    // 到達予定日
    //
    // 1日の狩り時間を考慮
    // ==========================================

    const today =
        new Date();


    const arrivalDate =
        new Date(today);


    arrivalDate.setTime(
        arrivalDate.getTime() +
        requiredDays *
        24 *
        60 *
        60 *
        1000
    );


    // ==========================================
    // 目標日
    // ==========================================

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


    // ==========================================
    // 目標日までに必要な実EXP/h
    // ==========================================

    const availableHours =
        Math.max(
            0,
            remainingDays
        ) *
        hoursPerDay;


    const requiredActualExpPerHour =
        availableHours > 0
            ? requiredExp / availableHours
            : Infinity;


    // ==========================================
    // 現在レベル基準の
    // 必要%/hへ変換
    // ==========================================

    const requiredPercentPerHour =
        requiredActualExpPerHour /
        currentLevelExp *
        100;


    // ==========================================
    // 到達判定
    // ==========================================

    const canReach =
        requiredDays <= remainingDays;


    let statusHTML;


    if (canReach) {

        statusHTML =
            `
            <div class="result-highlight">

                <div class="status-ok">
                    🟢 目標日までに到達可能
                </div>

            </div>
            `;

    } else {

        statusHTML =
            `
            <div class="result-highlight">

                <div class="status-ng">
                    🔴 現在のペースでは間に合いません
                </div>

            </div>
            `;

    }


    // ==========================================
    // 結果表示
    // ==========================================

    resultContent.innerHTML =
        `

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
            現在の実EXP効率：
        </div>


        <div class="result-value">
            ${formatExp(actualExpPerHour)}
            EXP / 時間
        </div>


        <div class="result-item">
            必要経験値：
            <strong>
                ${formatExp(requiredExp)}
                EXP
            </strong>
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
                ${expPerHourPercent.toFixed(2)}
                % / 時間
            </strong>
        </div>


        <div class="result-item">
            目標日までに必要な効率：
            <strong>
                ${isFinite(requiredPercentPerHour)
                    ? requiredPercentPerHour.toFixed(2)
                    : "計算不可"
                }
                % / 時間
            </strong>
        </div>


        ${statusHTML}


        <hr>


        <h4>
            レベル別の予想経験値効率
        </h4>


        <p class="input-note">
            現在の実EXP効率を維持した場合の、
            各レベルでの%/hです。
        </p>


        <table class="level-table">

            <thead>

                <tr>

                    <th>
                        レベル
                    </th>

                    <th>
                        100%経験値
                    </th>

                    <th>
                        予想効率
                    </th>

                </tr>

            </thead>


            <tbody>

                ${levelRows}

            </tbody>

        </table>

        `;

}


// ==========================================
// 計算ボタン
// ==========================================

document
    .getElementById(
        "calculateButton"
    )
    .addEventListener(
        "click",
        calculateRequiredExp
    );


// ==========================================
// 初期処理
// ==========================================

loadExpTable();