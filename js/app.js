let expTable = {};


// ==========================================
// 初期値
// ==========================================

const DEFAULT_SETTINGS = {

    currentLevel: 86,

    currentExp: 10,

    targetLevel: 90,

    expPerHour: 1.38,

    hoursPerDay: 24,

    targetDate: "2026-09-30"

};


// ==========================================
// 初期値を画面に設定
// ==========================================

function setDefaultValues() {

    document.getElementById("currentLevel").value =
        DEFAULT_SETTINGS.currentLevel;

    document.getElementById("currentExp").value =
        DEFAULT_SETTINGS.currentExp;

    document.getElementById("targetLevel").value =
        DEFAULT_SETTINGS.targetLevel;

    document.getElementById("expPerHour").value =
        DEFAULT_SETTINGS.expPerHour;

    document.getElementById("hoursPerDay").value =
        DEFAULT_SETTINGS.hoursPerDay;

    document.getElementById("targetDate").value =
        DEFAULT_SETTINGS.targetDate;

}


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

    }

    catch (error) {

        console.error(error);

        document
            .getElementById("dataStatus")
            .textContent =
            "経験値データの読み込みに失敗しました。";

    }

}


// ==========================================
// 100%経験値取得
// ==========================================

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


// ==========================================
// 数値フォーマット
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
            document.getElementById("currentLevel").value
        );

    const currentExp =
        Number(
            document.getElementById("currentExp").value
        );

    const targetLevel =
        Number(
            document.getElementById("targetLevel").value
        );

    const expPerHourPercent =
        Number(
            document.getElementById("expPerHour").value
        );

    const hoursPerDay =
        Number(
            document.getElementById("hoursPerDay").value
        );

    const targetDateValue =
        document.getElementById("targetDate").value;


    const result =
        document.getElementById("result");

    const resultContent =
        document.getElementById("resultContent");


    const levelSummary =
        document.getElementById("levelSummary");

    const levelSummaryBody =
        document.getElementById("levelSummaryBody");


    const futureLevel =
        document.getElementById("futureLevel");

    const futureTargetDate =
        document.getElementById("futureTargetDate");

    const futureMaxLevel =
        document.getElementById("futureMaxLevel");

    const futureLevelStatus =
        document.getElementById("futureLevelStatus");

    const futureAvailableExp =
        document.getElementById("futureAvailableExp");


    result.hidden = false;
    levelSummary.hidden = true;
    futureLevel.hidden = true;


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
    // 現在レベルの経験値
    // ==========================================

    const currentLevelExp =
        getExp100(currentLevel);


    if (currentLevelExp === null) {

        resultContent.innerHTML =
            `
            <div class="warning">

                <strong>
                    現在レベルの経験値データがありません。
                </strong>

                <p>
                    Lv${currentLevel} の経験値データを追加してください。
                </p>

            </div>
            `;

        return;

    }


    // ==========================================
    // 現在の%/h → 実EXP/h
    // ==========================================

    const actualExpPerHour =
        currentLevelExp *
        (
            expPerHourPercent / 100
        );


    // ==========================================
    // 目標レベルまでのデータ確認
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
                .map(level => `Lv${level}`)
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
    // シミュレーション
    // ==========================================

    let remainingExp =
        currentLevelExp *
        (
            1 -
            currentExp / 100
        );


    let totalHours = 0;


    const simulationRows = [];


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


        const startPercent =
            level === currentLevel
                ? currentExp
                : 0;


        const expNeeded =
            remainingExp;


        const hoursNeeded =
            expNeeded /
            actualExpPerHour;


        totalHours +=
            hoursNeeded;


        simulationRows.push({

            level,

            startPercent,

            expNeeded,

            percentPerHour:
                levelPercentPerHour,

            hoursNeeded,

            totalHours

        });


        remainingExp =
            level < targetLevel - 1
                ? getExp100(level + 1)
                : 0;

    }


    // ==========================================
    // 必要日数
    // ==========================================

    const requiredDays =
        totalHours /
        hoursPerDay;


    // ==========================================
    // 現在日時
    // ==========================================

    const today =
        new Date();


    // ==========================================
    // 目標到達予定日
    // ==========================================

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


    // ==========================================
    // 目標日までの日数
    // ==========================================

    const remainingDays =
        (
            targetDate.getTime() -
            today.getTime()
        ) /
        (
            24 *
            60 *
            60 *
            1000
        );


    // ==========================================
    // 目標日までに狩りできる時間
    // ==========================================

    const availableHours =
        Math.max(
            0,
            remainingDays
        ) *
        hoursPerDay;


    // ==========================================
    // 目標日までに必要な実EXP/h
    // ==========================================

    const totalTargetExp =
        simulationRows.reduce(
            (total, row) =>
                total +
                row.expNeeded,
            0
        );


    const requiredActualExpPerHour =
        availableHours > 0
            ? totalTargetExp /
              availableHours
            : Infinity;


    const requiredPercentPerHour =
        requiredActualExpPerHour /
        currentLevelExp *
        100;


    // ==========================================
    // 目標レベル到達判定
    // ==========================================

    const canReach =
        requiredDays <= remainingDays;


    const statusHTML =
        canReach

            ? `
                <div class="result-highlight">

                    <div class="status-ok">
                        🟢 目標日までに到達可能
                    </div>

                </div>
              `

            : `
                <div class="result-highlight">

                    <div class="status-ng">
                        🔴 現在のペースでは間に合いません
                    </div>

                </div>
              `;


    // ==========================================
    // レベルアップシミュレーション表
    // ==========================================

    let simulationTable = "";


    for (
        const row of simulationRows
    ) {

        simulationTable +=
            `
            <tr>

                <td>
                    Lv${row.level}
                </td>

                <td>
                    ${row.startPercent.toFixed(2)}%
                </td>

                <td>
                    ${formatExp(row.expNeeded)}
                </td>

                <td>
                    ${row.percentPerHour.toFixed(2)}%
                </td>

                <td>
                    ${row.hoursNeeded.toFixed(1)}
                </td>

            </tr>
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
                ${formatExp(totalTargetExp)}
                EXP
            </strong>
        </div>


        <div class="result-item">
            必要狩り時間：
            <strong>
                ${totalHours.toFixed(1)}
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
                ${
                    isFinite(
                        requiredPercentPerHour
                    )
                        ? requiredPercentPerHour.toFixed(2)
                        : "計算不可"
                }
                % / 時間
            </strong>
        </div>


        ${statusHTML}


        <hr>


        <h4>
            レベルアップシミュレーション
        </h4>


        <p class="input-note">
            現在の実EXP効率を維持した場合のシミュレーションです。
            レベルアップすると、同じEXP/hでも%/hは低下します。
        </p>


        <div class="table-wrapper">

            <table class="level-table">

                <thead>

                    <tr>

                        <th>レベル</th>

                        <th>開始EXP</th>

                        <th>必要EXP</th>

                        <th>%/h</th>

                        <th>必要時間</th>

                    </tr>

                </thead>


                <tbody>

                    ${simulationTable}

                </tbody>

            </table>

        </div>

        `;


    // ==========================================
    // 到達レベル別一覧
    // ==========================================

    levelSummary.hidden = false;


    let summaryHTML = "";


    for (
        let summaryTargetLevel = currentLevel + 1;
        summaryTargetLevel <= targetLevel;
        summaryTargetLevel++
    ) {

        let totalSummaryExp = 0;

        let targetHours = 0;

        let canCalculate = true;


        // --------------------------------------
        // 現在Lvから目標Lvまで
        // --------------------------------------

        for (
            let level = currentLevel;
            level < summaryTargetLevel;
            level++
        ) {

            const levelExp =
                getExp100(level);


            if (levelExp === null) {

                canCalculate = false;

                break;

            }


            const requiredExp =
                level === currentLevel

                    ? levelExp *
                      (
                          1 -
                          currentExp / 100
                      )

                    : levelExp;


            const levelHours =
                requiredExp /
                actualExpPerHour;


            totalSummaryExp +=
                requiredExp;


            targetHours +=
                levelHours;

        }


        if (!canCalculate) {

            summaryHTML +=
                `
                <tr>

                    <td>
                        <strong>
                            Lv${summaryTargetLevel}
                        </strong>
                    </td>

                    <td colspan="5">
                        🔴 データ不足
                    </td>

                </tr>
                `;

            continue;

        }


        const targetDays =
            targetHours /
            hoursPerDay;


        const summaryArrivalDate =
            new Date(today);


        summaryArrivalDate.setTime(

            summaryArrivalDate.getTime() +

            targetDays *
            24 *
            60 *
            60 *
            1000

        );


        const status =
            targetDays <= remainingDays
                ? "🟢"
                : "🔴";


        summaryHTML +=
            `
            <tr>

                <td>
                    <strong>
                        Lv${summaryTargetLevel}
                    </strong>
                </td>

                <td>
                    ${formatExp(totalSummaryExp)}
                </td>

                <td>
                    ${targetHours.toFixed(1)}
                    h
                </td>

                <td>
                    ${targetDays.toFixed(2)}
                    日
                </td>

                <td>
                    ${formatDate(summaryArrivalDate)}
                </td>

                <td>
                    ${status}
                </td>

            </tr>
            `;

    }


    levelSummaryBody.innerHTML =
        summaryHTML;


    // ==========================================
    // 目標日までの完全シミュレーション
    // ==========================================

    futureLevel.hidden = false;


    let remainingSimulationHours =
        Math.max(
            0,
            remainingDays
        ) *
        hoursPerDay;


    let simulatedLevel =
        currentLevel;


    let simulatedPercent =
        currentExp;


    let totalSimulationExp = 0;


    // ==========================================
    // 目標日まで順番にレベルアップ
    // ==========================================

    while (
        remainingSimulationHours > 0
    ) {

        const levelExp =
            getExp100(simulatedLevel);


        // データがない場合は終了
        if (levelExp === null) {

            break;

        }


        // --------------------------------------
        // 現在レベルで残っているEXP
        // --------------------------------------

        const requiredExp =
            levelExp *
            (
                1 -
                simulatedPercent / 100
            );


        // --------------------------------------
        // 現在の実EXP/hで必要な時間
        // --------------------------------------

        const requiredHours =
            requiredExp /
            actualExpPerHour;


        // --------------------------------------
        // 次のLvへ到達できる
        // --------------------------------------

        if (
            remainingSimulationHours >=
            requiredHours
        ) {

            remainingSimulationHours -=
                requiredHours;


            totalSimulationExp +=
                requiredExp;


            simulatedLevel++;

            simulatedPercent = 0;

        }


        // --------------------------------------
        // 次のLvへ到達できない
        // --------------------------------------

        else {

            const gainedExp =
                remainingSimulationHours *
                actualExpPerHour;


            totalSimulationExp +=
                gainedExp;


            simulatedPercent +=
                (
                    gainedExp /
                    levelExp
                ) *
                100;


            remainingSimulationHours = 0;

        }

    }


    // ==========================================
    // 目標日表示
    // ==========================================

    futureTargetDate.textContent =
        formatDate(targetDate);


    // ==========================================
    // 予想到達レベル
    // ==========================================

    futureMaxLevel.textContent =
        `Lv${simulatedLevel}`;


    // ==========================================
    // 目標日までに実際に獲得できるEXP
    // ==========================================

    futureAvailableExp.textContent =
        formatExp(totalSimulationExp) +
        " EXP";


    // ==========================================
    // ステータス
    // ==========================================

    if (
        simulatedLevel >=
        targetLevel
    ) {

        futureLevelStatus.textContent =
            "🟢 目標レベルに到達可能です。";

        futureLevelStatus.className =
            "future-level-status success";

    }

    else {

        futureLevelStatus.textContent =
            `🔴 目標日までにLv${targetLevel}へ到達するには、現在の効率では不足しています。`;

        futureLevelStatus.className =
            "future-level-status danger";

    }

}


// ==========================================
// 計算ボタン
// ==========================================

document
    .getElementById("calculateButton")
    .addEventListener(
        "click",
        calculateRequiredExp
    );


// ==========================================
// 初期処理
// ==========================================

setDefaultValues();

loadExpTable();