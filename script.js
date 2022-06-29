// Author: github.com/apattar

// collect important dom elements
let settingsPane = document.getElementById("settings-pane");
let gamePane = document.getElementById("game-pane");

let studySetInputTextarea = document.getElementById("study-set-input");
let cardDelimiterInput = document.getElementById("card-delimiter");
let sideDelimiterInput = document.getElementById("side-delimiter");
let termRadio = document.getElementById("term-radio");
let shuffleCheckbox = document.getElementById("shuffle");
let monospaceRadio = document.getElementById("monospace");
let sansRadio = document.getElementById("sans");
let serifRadio = document.getElementById("serif");
let comicSansRadio = document.getElementById("comic-sans");
let inputValidationPara = document.getElementById("input-validation");
let goButton = document.getElementById("go");

let promptPara = document.getElementById("prompt");
let responseInput = document.getElementById("response");
let feedbackPara = document.getElementById("feedback");
let checkButton = document.getElementById("check");

let playCtnr = document.getElementById("play-container");
let resultsCtnr = document.getElementById("results-container");
let resultsHeading = document.getElementById("results-heading");
let roundScorePara = document.getElementById("round-score");
let resultsDiv = document.getElementById("results");
let continueButton = document.getElementById("continue");


let gameSettings = {
    answerWithTerm: false,
    shuffle: true,
    cardDelimiter: "\n",
    sideDelimiter: "\t",
    font: "monospace",
    feedbackTimeout: 1000, // TODO currently unchangeable by user

    correctIndicator: "✓",
    incorrectIndicator: "✗",
}
let gameState = {
    fullDeck: undefined,
    fullDeckWeights: undefined,

    cards: undefined,
    cardWeights: undefined,

    shuffleCards: function() {
        let j;
        for (let i = gameState.cards.length; i > 0; i--) {
            j = Math.floor(Math.random() * i);
            [gameState.cards[j], gameState.cards[i - 1]] =
                [gameState.cards[i - 1], gameState.cards[j]];
        }
    },

    gotIncorrect: undefined,
    currIdx: undefined,
    correctIdxs: undefined,
    round: undefined,

    startRound: function(round) {
        if (gameSettings.shuffle) gameState.shuffleCards();

        // initialize game state
        gameState.currIdx = 0;
        gameState.correctIdxs.clear();
        gameState.gotIncorrect = false;
        gameState.round = round;

        // show first card
        promptPara.innerHTML = gameState.cards[gameState.currIdx][0];
        responseInput.value = "";
        responseInput.focus();
    },

    feedbackTimeoutID: undefined,
}


goButton.onclick = function() {
    // input validation
    if (studySetInputTextarea.value === "") {
        inputValidationPara.innerHTML =
            "There can't be nothing in your study set! Please input something in the large text box.";
        return;
    }

    // gather settings
    gameSettings.answerWithTerm = termRadio.checked;
    gameSettings.shuffle = shuffleCheckbox.checked;
    gameSettings.cardDelimiter = cardDelimiterInput.value.replace("\\n", "\n").replace("\\t", "\t");
    gameSettings.sideDelimiter = sideDelimiterInput.value.replace("\\n", "\n").replace("\\t", "\t");
    if (monospaceRadio.checked) gameSettings.font = "monospace";
    else if (sansRadio.checked) gameSettings.font = "sans";
    else if (serifRadio.checked) gameSettings.font = "serif";
    else if (comicSansRadio.checked) gameSettings.font = "comic-sans";
    gamePane.classList.add(gameSettings.font);

    // set up cards based on settings and start the game
    let set = studySetInputTextarea.value
    gameState.fullDeck = set.split(gameSettings.cardDelimiter);
    gameState.fullDeck = gameState.fullDeck.map(s => s.split(gameSettings.sideDelimiter));
    if (gameSettings.answerWithTerm) gameState.fullDeck.map(arr => arr.reverse());
    gameState.cards = Array.from(gameState.fullDeck);
    gameState.correctIdxs = new Set();

    gameState.startRound(1);
    
    // TODO move to weights pane submit button
    gameState.fullDeckWeights = (new Array(gameState.cards.length)).fill(1);
    gameState.cardWeights = Array.from(gameState.fullDeckWeights);    // TODO temporary; instead get these from user

    // show the game pane
    settingsPane.classList.add("inactive");
    gamePane.classList.remove("inactive");
    
    responseInput.focus();
}


checkButton.onclick = function() {
    if (gameSettings.feedbackTimeout) window.clearTimeout(gameState.feedbackTimeoutID);

    let response = responseInput.value;
    if (response === gameState.cards[gameState.currIdx][1]) {
        // correct! show feedback and continue
        feedbackPara.style.color = "green";
        feedbackPara.innerHTML = "Correct!";
        if (gameSettings.feedbackTimeout) gameState.feedbackTimeoutID = window.setTimeout(function() { feedbackPara.innerHTML = ""; }, gameSettings.feedbackTimeout);

        if (!gameState.gotIncorrect) gameState.correctIdxs.add(gameState.currIdx);
        else gameState.gotIncorrect = false;

        // advance cards
        gameState.currIdx++;
        if (gameState.currIdx === gameState.cards.length) showResults();
        else {
            promptPara.innerHTML = gameState.cards[gameState.currIdx][0];
            responseInput.value = "";
        }
    } else {
        // incorrect! show feedback, and don't advance cards
        feedbackPara.style.color = "red";
        feedbackPara.innerHTML = "The correct answer is: " + gameState.cards[gameState.currIdx][1];
        gameState.gotIncorrect = true;
    }
}


function showResults() {
    feedbackPara.innerHTML = "";
    playCtnr.classList.add("inactive");
    resultsCtnr.classList.remove("inactive");

    // update the weights and (TODO) card stats based on which cards were correct this round
    for (let i = 0; i < gameState.cards.length; i++) {
        if (gameState.correctIdxs.has(i)) gameState.cardWeights[i]--;
    }

    // change heading and continue button, based on if finished or not
    if (gameState.cardWeights.every(x => x === 0)) {
        resultsHeading.innerHTML = "All finished, congratulations!"
        continueButton.innerHTML = "Restart"
    } else {
        resultsHeading.innerHTML = "Round " + gameState.round + " Results";
        continueButton.innerHTML = "Continue to Round " + (gameState.round + 1);
    }

    // show round score
    roundScorePara.innerHTML = "Score for this round: " +
        gameState.correctIdxs.size + "/" + gameState.cards.length;

    // clear out resultsDiv, & repopulate with feedback on round
    while (resultsDiv.childNodes.length > 0) resultsDiv.removeChild(resultsDiv.firstChild);
    gameState.cards.forEach(function(card, idx) {
        let newPara = document.createElement("p");
        if (gameState.correctIdxs.has(idx)) {
            newPara.style.color = "green";
            newPara.innerHTML = gameSettings.correctIndicator + " ";
        } else {
            newPara.style.color = "red";
            newPara.innerHTML = gameSettings.incorrectIndicator + " ";
        }
        newPara.innerHTML += card[0] + " – " + card[1];
        resultsDiv.appendChild(newPara);
    });

    continueButton.focus();
}
continueButton.onclick = function() {
    playCtnr.classList.remove("inactive");
    resultsCtnr.classList.add("inactive");

    if (gameState.cardWeights.every(x => x === 0)) {
        // finished, restart game
        gameState.cards = Array.from(gameState.fullDeck);
        gameState.cardWeights = Array.from(gameState.fullDeckWeights);
        gameState.startRound(1);
    } else {
        // initialize next round
        let newCards = [];
        let newWeights = [];
        for (let i = 0; i < gameState.cards.length; i++) {
            if (gameState.cardWeights[i] > 0) {
                newCards.push(gameState.cards[i]);
                newWeights.push(gameState.cardWeights[i])
            }
        }
        gameState.cards = newCards;
        gameState.cardWeights = newWeights;

        gameState.startRound(gameState.round + 1)
    }
}


// shortcut stuff
studySetInputTextarea.focus();
responseInput.onkeydown = function(e) {
    if (e.key === "Enter") {
        checkButton.click();
        e.preventDefault();
    }
}
