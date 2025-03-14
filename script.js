const GAMEMODES = {
    NAME: 'name',
    SPEC: 'spec'
}

let cocktails = [];
let shuffledList = [];
let cocktailOfTheDay = undefined;
let revealedIngredients = [];
let revealedIngredientCount = 0;
let gameMode = GAMEMODES.SPEC;
let gameWin = false;
let guesses = []; // for ingredient mode
let incorrectGuesses = [];
let hardMode = true;
const ctcSpecs = '21stAmendmentCocktails.json';
const ibaSpecs = 'iba-cocktails-web.json';
const randSeed = 32198732154983;
let currectSpec = ibaSpecs;


function loadAndShuffle() {
    fetch(ctcSpecs)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            shuffledList = shuffle(data);
        })
        .catch(error => console.error('Error loading cocktails:', error));
}
document.addEventListener('DOMContentLoaded', loadAndShuffle());

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
    return cocktails[dayOfYear % cocktails.length]
}

function selectRandomCocktail() {
    const rand = Math.floor(Math.random() * cocktails.length);
    return cocktails[rand];
}

function selectCocktailFromURL() {
    const urlDrinkID = new URLSearchParams(window.location.search).get('id')
    return cocktails[urlDrinkID];
}

// Set game mode functions
function toggleGameMode() {

    if (gameMode == GAMEMODES.NAME) {
        gameMode = GAMEMODES.SPEC;
        document.getElementById('game-mode-button').innerText = 'Switch to Names'
        initGame(true);
    } else {
        gameMode = GAMEMODES.NAME;
        document.getElementById('game-mode-button').innerText = 'Switch to Specs'
        initGame();
    }
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
    } else if (new URLSearchParams(window.location.search).has('id')) {
        cocktailOfTheDay = selectCocktailFromURL()
    } else {
        cocktailOfTheDay = selectDailyCocktail();
    }

    // Reset revealed ingredients count:
    // In name mode, start by showing one hint.
    // In ingredient mode, start with zero revealed ingredients.
    revealedIngredientCount = (gameMode === GAMEMODES.NAME) ? 1 : 0;

    // If in ingredient mode, show the cocktail name immediately.
    if (gameMode === GAMEMODES.SPEC) {
        document.getElementById('mode-description').textContent =
            `Guess the ingrdients of this cocktail!\n${hardMode ? 'Hard Mode: measures are required' : 'Easy Mode: Just guess ingredients, no measures!'}`;

        document.getElementById('drink-name').style.display = 'block';
        document.getElementById('drink-name').textContent = cocktailOfTheDay.name;
    } else if (gameMode === GAMEMODES.NAME) {
        document.getElementById('mode-description').textContent =
            `Guess the name of this cocktail before all ingredients are revealed!\n(Each incorrect guess will reveal one additional ingredient.)`;
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
        // console.log(typeof (revealedIngredients))
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
        hintsDiv.innerHTML = ''
        // In ingredient mode, show the cocktail name (already displayed) and
        // list each ingredient. For each ingredient, if it has been guessed or its index is less than revealedIngredients,
        // show its details; otherwise show "???"
        console.log(guesses)
        cocktailOfTheDay.ingredients.forEach((ingredient, index) => {
            const ingredientEl = document.createElement('div');
            // Check if this ingredient has been guessed or has been revealed
            if (hardMode) {
                const matchedGuess = guesses.find((v) => { return (v.ingredient == ingredient.ingredient) })
                if (matchedGuess) {
                    if (matchedGuess.quantity == ingredient.quantity) {
                        ingredientEl.textContent = `${ingredient.quantity} ${ingredient.unit} of ${ingredient.ingredient}`;
                        // return
                    } else {
                        // hintsDiv.appendChild(ingredientEl);
                        ingredientEl.textContent = `??? ${ingredient.unit} of ${ingredient.ingredient}`;
                        // return
                    }
                } else {
                    // hintsDiv.appendChild(ingredientEl);
                    ingredientEl.textContent = "???";
                    // return
                }
            } else {

                if (guesses.includes(ingredient.ingredient) || index < revealedIngredients) {
                    // hintsDiv.appendChild(ingredientEl);
                    ingredientEl.textContent = `${ingredient.quantity} ${ingredient.unit} of ${ingredient.ingredient}`;
                    // return
                } else {
                    // hintsDiv.appendChild(ingredientEl);
                    ingredientEl.textContent = "???";
                    // return
                }
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
    const messageDiv = document.getElementById('message');
    let guess = guessInput.value.trim().toLowerCase();
    let guessMeasure = 0;

    if (!guess) return;

    if (hardMode) {

        console.log(guess)

        guessMeasure = guess.split(' ', 1)[0]
        if (!Number(guessMeasure)) {
            guessMeasure = 0
        } else {
            guess = guess.replace(guessMeasure + " ", "")
        }


    }

    // Check if the guessed ingredient is one of the cocktail's ingredients (compare by name)
    let found = false;
    cocktailOfTheDay.ingredients.forEach(ingredient => {
        if (ingredient.ingredient.toLowerCase() === guess || ingredient.ingredient.toLowerCase().includes(guess)) {

            if (hardMode) {

                if (ingredient.quantity == guessMeasure) {
                    console.log("measure guessed")
                    let g = guesses.find((v) => v.ingredient == ingredient.ingredient)
                    if (!g) {
                        guesses.push({ ingredient: ingredient.ingredient, quantity: ingredient.quantity });
                    } else {
                        g.quantity = ingredient.quantity
                    }
                } else {
                    console.log("correct ingredient, incorrect measure")
                    if (!guesses.find((v) => v.ingredient == ingredient.ingredient)) {
                        guesses.push({ ingredient: ingredient.ingredient, quantity: 0 });
                    }
                }

            } else {

                // If not already guessed, add to guessedIngredients
                if (!guesses.includes(ingredient.ingredient)) {
                    guesses.push(ingredient.ingredient);
                }
            }

            found = true;
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

    console.log(guesses);

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
    if (gameMode == GAMEMODES.NAME) {

        document.getElementById('guess-input').disabled = true;
        const dn = document.getElementById('drink-name')
        dn.textContent = cocktailOfTheDay.name;
        dn.style.display = 'block';
        const divider = document.createElement('div')
        divider.id = 'vertical-divider'
        dn.append(divider)
        scrollTo(0, 'smooth')
    }

    if (gameMode == GAMEMODES.SPEC) {
        guesses = [];
        cocktailOfTheDay.ingredients.map((v) => guesses.push(v));
        revealedIngredientCount = cocktailOfTheDay.ingredients.length + 1;
    }

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
    t = t + (gameWin ? "🟩\n" : "🟥\n")

    let urlStr = 'https://ryan-esdale.github.io/bar-dle/';
    if (cocktailOfTheDay != selectDailyCocktail()) {
        console.log(selectDailyCocktail())
        console.log(selectDailyCocktail())
        console.log(selectDailyCocktail())
        const id = cocktails.findIndex((v) => v.name == cocktailOfTheDay.name)
        urlStr = urlStr + '?id=' + (id)
    }

    if (navigator.share) {
        try {
            await navigator.share({ url: urlStr, text: t, title: 'Bar-dle score!' });
        } catch (err) {
            alert(err)
            console.error('Error sharing content:', err);
        }
    } else {
        // Fallback for browsers that do not support the Web Share API
        alert('Sharing is not supported on this device. Results copied to clipboard.');
        navigator.clipboard.writeText(t + urlStr);
    }
}

// Event listeners
document.getElementById('submit-guess').addEventListener('click', makeGuess);
document.getElementById('guess-input').addEventListener('keyup', (event) => {
    // console.log(window.getComputedStyle(document.getElementById('popup-container')).getPropertyValue('visibility'))
    if (event.key === 'Enter') {
        if (window.getComputedStyle(document.getElementById('popup-container')).getPropertyValue('visibility') == 'visible') {
            document.getElementById('popup-confirmation').click();
        }
        document.getElementById('submit-guess').click();
    }
});
document.getElementById('give-up-button').addEventListener('click', giveUp);
document.getElementById('refresh-game').addEventListener('click', () => initGame(true));

document.getElementById('game-mode-button').addEventListener('click', toggleGameMode);

document.getElementById('switch-spec-list-button').addEventListener('click', swapSpecs);

document.getElementById('popup-confirmation').addEventListener('click', (event) => {
    document.getElementById('share-results-button').style.visibility = 'hidden';
    document.getElementById('popup-container').style.visibility = 'hidden';
});
document.getElementById('share-results-button').addEventListener('click', copyResultsToClipboard)