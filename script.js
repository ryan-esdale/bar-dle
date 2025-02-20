const GAMEMODES = {
    NAME: 'name',
    SPEC: 'spec'
}

let cocktails = [];
let cocktailOfTheDay = undefined;
let revealedIngredients = [];
let revealedIngredientCount = 0;
let gameMode = GAMEMODES.NAME;
let gameWin = false;
let guesses = []; // for ingredient mode
let incorrectGuesses = [];
const ctcSpecs = '21stAmendmentCocktails.json';
const ibaSpecs = 'iba-cocktails-web.json';
const randSeed = 32198732154983;
let currectSpec = ibaSpecs;

function loadCocktails(name) {
    fetch(name)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            cocktails = data;
            // Now that the cocktails are loaded, you can initialize your game
            initGame();
            const t = document.getElementById('mode-description-details')
            if (currectSpec === ctcSpecs) {
                t.textContent = 'Drink recipies are formatted using CTC Specs'
            } else if (currectSpec === ibaSpecs) {
                t.textContent = 'Drink recipies are formatted using IBA Specs'
            }
        })
        .catch(error => console.error('Error loading cocktails:', error));
}
document.addEventListener('DOMContentLoaded', loadCocktails(currectSpec));

function makePopup(title, text, showShareButton) {
    document.getElementById('popup-title').textContent = title
    document.getElementById('popup-body').textContent = text
    document.getElementById('popup-container').style.visibility = 'visible';
    document.getElementById('share-results-button').style.visibility = showShareButton ? 'visible' : 'hidden';
}

// Modified Fisher-Yates shuffle from Mike Bostok: https://bost.ocks.org/mike/shuffle/
function shuffle(array) {
    var m = array.length, t, i;

    // While there remain elements to shuffle…
    while (m) {

        // Pick a remaining element…
        i = Math.floor(random(randSeed) * m--);

        // And swap it with the current element.
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }

    return array;
}

// Random based on seed: https://decode.sh/seeded-random-number-generator-in-js/
function random(seed) {
    var m = 2 ** 35 - 31;
    var a = 185852;
    var s = seed % m;

    return function () {
        return (s = (s * a) % m) / m;
    };
}

// Function to select the cocktail of the day based on the day of the year
function selectDailyCocktail() {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const shuffledList = shuffle(cocktails)
    return shuffledList[dayOfYear % cocktails.length];
}

function selectRandomCocktail() {
    const rand = Math.floor(Math.random() * cocktails.length);
    return cocktails[rand];
}

// Set game mode functions
function setNameMode() {
    gameMode = GAMEMODES.NAME;
    initGame();
}

function setIngredientMode() {
    gameMode = GAMEMODES.SPEC;
    initGame();
}

// Initialize the game
function initGame(random) {
    // Reset input, messages, and guessed ingredients
    document.getElementById('guess-input').disabled = false;
    document.getElementById('message').textContent = '';
    document.getElementById('drink-name').textContent = '';
    document.getElementById('hints').innerHTML = ''; // Clear previous hints
    document.getElementById('drink-name').style.display = 'none';
    guesses = [];
    incorrectGuesses = [];
    revealedIngredients = [];
    gameWin = false;
    // Choose a cocktail (here using random selection)
    if (random) {

        cocktailOfTheDay = selectRandomCocktail();
    } else {

        cocktailOfTheDay = selectDailyCocktail();
    }

    // Reset revealed ingredients count:
    // In name mode, start by showing one hint.
    // In ingredient mode, start with zero revealed ingredients.
    revealedIngredientCount = (gameMode === GAMEMODES.NAME) ? 1 : 0;

    // If in ingredient mode, show the cocktail name immediately.
    if (gameMode === GAMEMODES.SPEC) {
        document.getElementById('drink-name').textContent = cocktailOfTheDay.name;
    } else if (gameMode === GAMEMODES.NAME) {
        document.getElementById('mode-description').textContent =
            `Guess the name of this cocktail before all ingredients are revealed!\n(Each incorrect guess will reveal one additional ingredient.)`
    }
    updateHints();
}

// Update the hints display based on the game mode
function updateHints() {
    const hintsDiv = document.getElementById('hints');

    const mistakesDiv = document.getElementById('mistakes');
    mistakesDiv.innerHTML = '';
    if (incorrectGuesses.length > 0)
        mistakesDiv.innerHTML = 'Incorrect Guesses';

    incorrectGuesses.forEach((guess, index) => {
        const guessEl = document.createElement('div')
        guessEl.textContent = guess
        mistakesDiv.appendChild(guessEl)
    })

    // In name mode, show the revealed ingredients.
    if (gameMode === GAMEMODES.NAME) {
        // if (revealedIngredientCount > cocktailOfTheDay.ingredients.length)
        //     return
        // const ingredient = cocktailOfTheDay.ingredients[revealedIngredientCount - 1];
        // if (ingredient == cocktailOfTheDay.ingredients[cocktailOfTheDay.ingredients.length - 1] && (!revealedIngredientCount == cocktailOfTheDay.ingredients.length))
        //     return
        console.log(typeof (revealedIngredients))
        cocktailOfTheDay.ingredients.forEach((ingredient, index) => {
            if (index >= revealedIngredientCount || revealedIngredients.includes(ingredient))
                return

            const ingredientEl = document.createElement('div');
            ingredientEl.id = 'hint-text'
            ingredientEl.textContent = `${ingredient.quantity} ${ingredient.unit} of ${ingredient.ingredient}`;
            hintsDiv.appendChild(ingredientEl);
            revealedIngredients.push(ingredient)
        })
        // });
    } else if (gameMode === GAMEMODES.SPEC) {
        // In ingredient mode, show the cocktail name (already displayed) and
        // list each ingredient. For each ingredient, if it has been guessed or its index is less than revealedIngredients,
        // show its details; otherwise show "???"
        cocktailOfTheDay.ingredients.forEach((ingredient, index) => {
            const ingredientEl = document.createElement('div');
            // Check if this ingredient has been guessed or has been revealed
            if (guesses.includes(ingredient.ingredient) || index < revealedIngredients) {
                ingredientEl.textContent = `${ingredient.quantity} ${ingredient.unit} of ${ingredient.ingredient}`;
            } else {
                ingredientEl.textContent = "???";
            }
            hintsDiv.appendChild(ingredientEl);
        });
    }
}

// Called when the user clicks the guess button or hits Enter
function makeGuess() {
    if (gameMode === GAMEMODES.NAME) {
        guessDrink();
    } else if (gameMode === GAMEMODES.SPEC) {
        guessIngredient();
    }
}

// Existing function: guessing the cocktail name ("name mode")
function guessDrink() {
    const guessInput = document.getElementById('guess-input');
    const guess = guessInput.value.trim().toLowerCase();
    const messageDiv = document.getElementById('message');

    if (!guess) return;

    if (guess === cocktailOfTheDay.name.toLowerCase()) {
        // messageDiv.textContent = "Congratulations! You guessed the cocktail name correctly.";
        makePopup("Congratulations!", `This was the spec for a${['a', 'e', 'i', 'o', 'u'].includes(cocktailOfTheDay.name[0].toLowerCase()) ? 'n' : ''} ${cocktailOfTheDay.name}.
        \r\nYou got it in ${revealedIngredientCount} guess${revealedIngredientCount == 1 ? '' : 'es'}.`, true);
        gameWin = true;
        giveUp(); // reveal all details
    } else {
        messageDiv.textContent = "Incorrect guess. Try again!";
        incorrectGuesses.push(guess)
        // Reveal one more ingredient if available
        if (revealedIngredientCount < cocktailOfTheDay.ingredients.length - 1) {
            //Pulled out the ++
        } else if (revealedIngredientCount == cocktailOfTheDay.ingredients.length - 1) {
            makePopup("Last chance!", `That's all the ingredients, one guess remaining...`)
        } else {
            makePopup("Better luck next time", `This was the spec for a${['a', 'e', 'i', 'o', 'u'].includes(cocktailOfTheDay.name[0].toLowerCase()) ? 'n' : ''} ${cocktailOfTheDay.name}`, true);
            giveUp();
        }
        revealedIngredientCount++;
        updateHints();
    }
    guesses.push(guess)
    guessInput.value = "";
}

// New function: guessing an ingredient ("ingredient mode")
function guessIngredient() {
    const guessInput = document.getElementById('guess-input');
    const guess = guessInput.value.trim().toLowerCase();
    const messageDiv = document.getElementById('message');

    if (!guess) return;

    // Check if the guessed ingredient is one of the cocktail's ingredients (compare by name)
    let found = false;
    cocktailOfTheDay.ingredients.forEach(ingredient => {
        if (ingredient.ingredient.toLowerCase() === guess || ingredient.ingredient.toLowerCase().includes(guess)) {
            found = true;
            // If not already guessed, add to guessedIngredients
            if (!guesses.includes(ingredient.ingredient)) {
                guesses.push(ingredient.ingredient);
            }
        }
    });

    if (found) {
        messageDiv.textContent = `Correct! ${guess} is an ingredient.`;
    } else {
        messageDiv.textContent = "Incorrect ingredient. Try again!";
        // On a failed guess, reveal one more ingredient (if not already all revealed)
        incorrectGuesses.push(guess)
        if (revealedIngredientCount < cocktailOfTheDay.ingredients.length) {
            // revealedIngredients++;
        } else {
            messageDiv.textContent += " You've seen all the hints.";
        }
    }

    updateHints();
    guessInput.value = "";

    // Check if the player has now guessed (or revealed) all ingredients
    const allRevealed = cocktailOfTheDay.ingredients.every((ingredient, index) => {
        return guesses.includes(ingredient.ingredient.toLowerCase()) || index < revealedIngredientCount;
    });
    if (allRevealed) {
        messageDiv.textContent = "Congratulations! You've identified all the ingredients.";
        giveUp();
    }
}

// Give up function: reveal full details
function giveUp() {
    document.getElementById('guess-input').disabled = true;
    document.getElementById('drink-name').textContent = cocktailOfTheDay.name;
    document.getElementById('drink-name').style.display = 'block';
    revealedIngredientCount = cocktailOfTheDay.ingredients.length + 1;
    updateHints();
}

function swapSpecs() {
    const b = document.getElementById('switch-spec-list-button');
    if (currectSpec == ctcSpecs) {
        currectSpec = ibaSpecs;
        b.textContent = 'Swap to CTC Specs'
    } else {
        currectSpec = ctcSpecs;
        b.textContent = 'Swap to IBA Specs'
    }
    loadCocktails(currectSpec);
    initGame();
}

async function copyResultsToClipboard() {
    let t = `Bar-dle ${guesses.length}/?\n`;
    Array(guesses.length - 1).fill(1).forEach(() => t = t + "🟨\n")
    t = t + (gameWin ? "🟩" : "🟥")

    if (navigator.share) {
        try {
            await navigator.share({ url: 'https://ryan-esdale.github.io/bar-dle/', text: t, title: 'Today\'s Bar-dle score!' });
        } catch (err) {
            console.error('Error sharing content:', err);
        }
    } else {
        // Fallback for browsers that do not support the Web Share API
        alert('Sharing is not supported on this device. Results copied to clipboard.');
        navigator.clipboard.writeText(t);
    }
}

// Event listeners
document.getElementById('submit-guess').addEventListener('click', makeGuess);
document.getElementById('guess-input').addEventListener('keyup', (event) => {
    console.log(window.getComputedStyle(document.getElementById('popup-container')).getPropertyValue('visibility'))
    if (event.key === 'Enter') {
        if (window.getComputedStyle(document.getElementById('popup-container')).getPropertyValue('visibility') == 'visible') {
            document.getElementById('popup-confirmation').click();
        }
        document.getElementById('submit-guess').click();
    }
});
document.getElementById('give-up-button').addEventListener('click', giveUp);
document.getElementById('refresh-game').addEventListener('click', () => initGame(true));

document.getElementById('name-mode-button').addEventListener('click', setNameMode);
document.getElementById('ingredient-mode-button').addEventListener('click', setIngredientMode);

document.getElementById('switch-spec-list-button').addEventListener('click', swapSpecs);

document.getElementById('popup-confirmation').addEventListener('click', (event) => {
    document.getElementById('share-results-button').style.visibility = 'hidden';
    document.getElementById('popup-container').style.visibility = 'hidden';
});
document.getElementById('share-results-button').addEventListener('click', copyResultsToClipboard)