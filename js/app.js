let expTable = {};


// ==========================================
// 初期値
// ==========================================

const DEFAULT_SETTINGS = {

    currentLevel: "",

    currentExp: "",

    targetLevel: "",

    expPerHour: "",

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

    } catch (error) {

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
// 日付計算
// ==========================================

function addHours(date, hours) {

    const result =
        new Date(date);

    result.setTime(
        result.getTime() +
        hours *
        60 *
        60 *
        1000
    );

    return result;

}


// ==========================================
// 目標日までのシミュレーション
//
// 現在の実EXP/hを維持し、
// レベルアップ後は%/hだけ低下する。
// ==========================================

function simulateUntilDate(
    currentLevel,
    currentExp,
    actualExpPerHour,
    availableHours,
    startDate
) {

    let level =
        currentLevel;

    let percent =
        currentExp;

    let remainingHours =
        availableHours;

    let totalExp =
        0;

    const levelResults = [];

    while (remainingHours > 0) {

        const levelExp =
            getExp100(level);

        // 経験値データがない場合は終了
        if (levelExp === null) {

            break;

        }

        const requiredExp =
            levelExp *
            (
                1 -
                percent / 100
            );

        const requiredHours =
            requiredExp /
            actualExpPerHour;


        // --------------------------------------
        // 次のLvまで到達できる
        // --------------------------------------

        if (
            remainingHours >=
            requiredHours
        ) {

            remainingHours -=
                requiredHours;

            totalExp +=
                requiredExp;

            const elapsedHours =
                availableHours -
                remainingHours;

            const arrivalDate =
                addHours(
                    startDate,
                    elapsedHours
                );

            level++;

            levelResults.push({

                level: level,

                arrivalDate:
                    arrivalDate,

                elapsedHours:
                    elapsedHours

            });

            percent = 0;

        }

        // --------------------------------------
        // 次のLvには届かない
        // --------------------------------------

        else {

            const gainedExp =
                remainingHours *
                actualExpPerHour;

            totalExp +=
                gainedExp;

            percent +=
                (
                    gainedExp /
                    levelExp
                ) *
                100;

            remainingHours = 0;

        }

    }

    return {

        level,

        percent,

        totalExp,

        levelResults

    };

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
    // 現在Lvのデータ確認
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
                    Lv${currentLevel}の経験値データを追加してください。
                </p>

            </div>
            `;

        return;

    }


    // ==========================================
    // 目標Lvまでのデータ確認
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
    // 現在の%/h → 実EXP/h
    // ==========================================

    const actualExpPerHour =
        currentLevelExp *
        (
            expPerHourPercent / 100
        );


    // ==========================================
    // 今日
    // ==========================================

    const today =
        new Date();


    // ==========================================
    // 目標Lvまでのシミュレーション
    // ==========================================

    let remainingExp =
        currentLevelExp *
        (
            1 -
            currentExp / 100
        );

    let totalHours =
        0;

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
    // 到達予定日
    // ==========================================

    const arrivalDate =
        addHours(
            today,
            totalHours
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
    // 目標日までの狩り可能時間
    // ==========================================

    const availableHours =
        Math.max(
            0,
            remainingDays
        ) *
        hoursPerDay;


    // ==========================================
    // 目標日までに必要な効率
    // ==========================================

    const totalTargetExp =
        simulationRows.reduce(
            (
                total,
                row
            ) =>
                total +
                (
                    row.level === currentLevel
                        ? currentLevelExp *
                          (
                              1 -
                              currentExp / 100
                          )
                        : getExp100(row.level)
                ),
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
    // 目標Lv到達判定
    // ==========================================

    const canReachTarget =
        requiredDays <=
        remainingDays;


    const statusHTML =
        canReachTarget

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
    // レベルアップシミュレーション
    //
    // ここでは「目標Lv」ではなく
    // 「目標日まで」を上限にする
    // ==========================================

    let simulationUntilDateResult =
        null;


    if (availableHours > 0) {

        simulationUntilDateResult =
            simulateUntilDate(
                currentLevel,
                currentExp,
                actualExpPerHour,
                availableHours,
                today
            );

    }
    else {

        simulationUntilDateResult = {

            level:
                currentLevel,

            percent:
                currentExp,

            totalExp:
                0,

            levelResults:
                []

        };

    }


    // ==========================================
    // レベルアップシミュレーション表
    // ==========================================

    let simulationTable =
        "";


    let simulationLevel =
        currentLevel;

    let simulationPercent =
        currentExp;


    let simulationRemainingHours =
        availableHours;


    while (
        simulationRemainingHours > 0
    ) {

        const levelExp =
            getExp100(
                simulationLevel
            );

        if (levelExp === null) {

            break;

        }

        const levelPercentPerHour =
            actualExpPerHour /
            levelExp *
            100;

        const startPercent =
            simulationPercent;

        const requiredExp =
            levelExp *
            (
                1 -
                simulationPercent / 100
            );

        const requiredHours =
            requiredExp /
            actualExpPerHour;


        // --------------------------------------
        // Lvアップできる
        // --------------------------------------

        if (
            simulationRemainingHours >=
            requiredHours
        ) {

            simulationTable +=
                `
                <tr>

                    <td>
                        Lv${simulationLevel}
                    </td>

                    <td>
                        ${startPercent.toFixed(2)}%
                    </td>

                    <td>
                        ${levelPercentPerHour.toFixed(2)}%
                    </td>

                    <td>
                        ${requiredHours.toFixed(1)} h
                    </td>

                </tr>
                `;

            simulationRemainingHours -=
                requiredHours;

            simulationLevel++;

            simulationPercent = 0;

        }

        // --------------------------------------
        // 途中まで
        // --------------------------------------

        else {

            const gainedExp =
                simulationRemainingHours *
                actualExpPerHour;

            const gainedPercent =
                gainedExp /
                levelExp *
                100;

            simulationTable +=
                `
                <tr>

                    <td>
                        Lv${simulationLevel}
                    </td>

                    <td>
                        ${startPercent.toFixed(2)}%
                    </td>

                    <td>
                        ${levelPercentPerHour.toFixed(2)}%
                    </td>

                    <td>
                        ${simulationRemainingHours.toFixed(1)} h
                    </td>

                </tr>
                `;

            simulationPercent +=
                gainedPercent;

            simulationRemainingHours = 0;

        }

    }


    // ==========================================
    // 到達レベル別一覧
    //
    // 目標Lvではなく、
    // 目標日までに到達可能なLvまで表示
    // ==========================================

    const levelSummary =
        document.getElementById(
            "levelSummary"
        );

    const levelSummaryBody =
        document.getElementById(
            "levelSummaryBody"
        );


    levelSummary.hidden = false;


    let summaryHTML =
        "";


    let summaryTargetLevel =
        currentLevel + 1;


    let summaryHours =
        0;


    let summaryLevel =
        currentLevel;

    let summaryPercent =
        currentExp;


    while (true) {

        const levelExp =
            getExp100(
                summaryLevel
            );

        // データがない場合は終了
        if (levelExp === null) {

            break;

        }


        const requiredExp =
            levelExp *
            (
                1 -
                summaryPercent / 100
            );


        const levelHours =
            requiredExp /
            actualExpPerHour;


        const nextTotalHours =
            summaryHours +
            levelHours;


        // --------------------------------------
        // 次Lvに到達可能
        // --------------------------------------

        if (
            nextTotalHours <=
            availableHours
        ) {

            summaryHours =
                nextTotalHours;

            const summaryDays =
                summaryHours /
                hoursPerDay;

            const summaryArrivalDate =
                addHours(
                    today,
                    summaryHours
                );

            summaryHTML +=
                `
                <tr>

                    <td>
                        <strong>
                            Lv${summaryTargetLevel}
                        </strong>
                    </td>

                    <td>
                        ${summaryHours.toFixed(1)} h
                    </td>

                    <td>
                        ${summaryDays.toFixed(2)} 日
                    </td>

                    <td>
                        ${formatDate(
                            summaryArrivalDate
                        )}
                    </td>

                    <td>
                        🟢
                    </td>

                </tr>
                `;


            summaryLevel++;

            summaryPercent = 0;

            summaryTargetLevel++;

        }

        // --------------------------------------
        // 次Lvには到達できない
        //
        // 現在のLvの途中までなので終了
        // --------------------------------------

        else {

            break;

        }

    }


    if (summaryHTML === "") {

        summaryHTML =
            `
            <tr>

                <td colspan="5">
                    目標日までに到達できるレベルはありません。
                </td>

            </tr>
            `;

    }


    levelSummaryBody.innerHTML =
        summaryHTML;


    // ==========================================
    // 目標日までの完全シミュレーション
    // ==========================================

    const futureLevel =
        document.getElementById(
            "futureLevel"
        );

    const futureTargetDate =
        document.getElementById(
            "futureTargetDate"
        );

    const futureMaxLevel =
        document.getElementById(
            "futureMaxLevel"
        );

    const futureLevelStatus =
        document.getElementById(
            "futureLevelStatus"
        );

    const futureAvailableExp =
        document.getElementById(
            "futureAvailableExp"
        );


    futureLevel.hidden = false;


    futureTargetDate.textContent =
        formatDate(targetDate);


    futureMaxLevel.textContent =
        `Lv${simulationUntilDateResult.level}`;


    // ==========================================
    // 目標日終了時の予想
    // ==========================================

    futureAvailableExp.textContent =
        `Lv${simulationUntilDateResult.level} ` +
        `${simulationUntilDateResult.percent.toFixed(2)}%`;


    // ==========================================
    // 目標Lv到達判定
    // ==========================================

    if (
        simulationUntilDateResult.level >=
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
            必要狩り時間
        </div>


        <div class="result-value">
            ${totalHours.toFixed(1)}
            時間
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

                        <th>
                            レベル
                        </th>

                        <th>
                            開始%
                        </th>

                        <th>
                            % / 時間
                        </th>

                        <th>
                            必要時間
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${simulationTable}

                </tbody>

            </table>

        </div>

        `;

}


// ==========================================
// ボタン
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

setDefaultValues();

loadExpTable();