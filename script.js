let cocktails = [];
let cocktailOfTheDay = undefined;
let revealedIngredients = undefined;
let gameMode = "name"; // "name" or "ingredients"
let guessedIngredients = []; // for ingredient mode

function loadCocktails() {
    fetch('21stAmendmentCocktails.json')
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
        })
        .catch(error => console.error('Error loading cocktails:', error));
}
document.addEventListener('DOMContentLoaded', loadCocktails);

// Function to select the cocktail of the day based on the day of the year
function selectDailyCocktail() {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return cocktails[dayOfYear % cocktails.length];
}

function selectRandomCocktail() {
    const rand = Math.floor(Math.random() * cocktails.length);
    return cocktails[rand];
}

// Set game mode functions
function setNameMode() {
    gameMode = "name";
    initGame();
}

function setIngredientMode() {
    gameMode = "ingredients";
    initGame();
}

// Initialize the game
function initGame() {
    // Reset input, messages, and guessed ingredients
    document.getElementById('guess-input').disabled = false;
    document.getElementById('message').textContent = '';
    document.getElementById('drink-name').textContent = '';
    guessedIngredients = [];
    
    // Choose a cocktail (here using random selection)
    cocktailOfTheDay = selectRandomCocktail();
    
    // Reset revealed ingredients count:
    // In name mode, start by showing one hint.
    // In ingredient mode, start with zero revealed ingredients.
    revealedIngredients = (gameMode === "name") ? 1 : 0;
    
    // If in ingredient mode, show the cocktail name immediately.
    if (gameMode === "ingredients") {
        document.getElementById('drink-name').textContent = cocktailOfTheDay.name;
    }
    updateHints();
}

// Update the hints display based on the game mode
function updateHints() {
    const hintsDiv = document.getElementById('hints');
    hintsDiv.innerHTML = ''; // Clear previous hints

    // In name mode, show the glass and revealed ingredients.
    if (gameMode === "name") {
        const serveEl = document.createElement('div');
        serveEl.id = 'serve-text';
        serveEl.textContent = `Served in: ${cocktailOfTheDay.glass}`;
        hintsDiv.appendChild(serveEl);
        
        cocktailOfTheDay.ingredients.slice(0, revealedIngredients).forEach(ingredient => {
            const ingredientEl = document.createElement('div');
            ingredientEl.textContent = `${ingredient.amount} ${ingredient.measurement} of ${ingredient.ingredient}`;
            hintsDiv.appendChild(ingredientEl);
        });
    } else if (gameMode === "ingredients") {
        // In ingredient mode, show the cocktail name (already displayed) and
        // list each ingredient. For each ingredient, if it has been guessed or its index is less than revealedIngredients,
        // show its details; otherwise show "???"
        cocktailOfTheDay.ingredients.forEach((ingredient, index) => {
            const ingredientEl = document.createElement('div');
            // Check if this ingredient has been guessed or has been revealed
            if (guessedIngredients.includes(ingredient.ingredient.toLowerCase()) || index < revealedIngredients) {
                ingredientEl.textContent = `${ingredient.amount} ${ingredient.measurement} of ${ingredient.ingredient}`;
            } else {
                ingredientEl.textContent = "???";
            }
            hintsDiv.appendChild(ingredientEl);
        });
    }
}

// Called when the user clicks the guess button or hits Enter
function makeGuess() {
    if (gameMode === "name") {
        guessDrink();
    } else if (gameMode === "ingredients") {
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
        messageDiv.textContent = "Congratulations! You guessed the cocktail name correctly.";
        giveUp(); // reveal all details
    } else {
        messageDiv.textContent = "Incorrect guess. Try again!";
        // Reveal one more ingredient if available
        if (revealedIngredients < cocktailOfTheDay.ingredients.length) {
            revealedIngredients++;
            updateHints();
        } else {
            messageDiv.textContent += " You've seen all the hints.";
        }
    }
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
        if (ingredient.ingredient.toLowerCase() === guess) {
            found = true;
            // If not already guessed, add to guessedIngredients
            if (!guessedIngredients.includes(guess)) {
                guessedIngredients.push(guess);
            }
        }
    });

    if (found) {
        messageDiv.textContent = `Correct! ${guess} is an ingredient.`;
    } else {
        messageDiv.textContent = "Incorrect ingredient. Try again!";
        // On a failed guess, reveal one more ingredient (if not already all revealed)
        if (revealedIngredients < cocktailOfTheDay.ingredients.length) {
            // revealedIngredients++;
        } else {
            messageDiv.textContent += " You've seen all the hints.";
        }
    }
    
    updateHints();
    guessInput.value = "";

    // Check if the player has now guessed (or revealed) all ingredients
    const allRevealed = cocktailOfTheDay.ingredients.every((ingredient, index) => {
        return guessedIngredients.includes(ingredient.ingredient.toLowerCase()) || index < revealedIngredients;
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
    revealedIngredients = cocktailOfTheDay.ingredients.length;
    updateHints();
}

// Event listeners
document.getElementById('submit-guess').addEventListener('click', makeGuess);
document.getElementById('guess-input').addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        document.getElementById('submit-guess').click();
    }
});
document.getElementById('give-up-button').addEventListener('click', giveUp);
document.getElementById('refresh-game').addEventListener('click', initGame);

document.getElementById('name-mode-button').addEventListener('click', setNameMode);
document.getElementById('ingredient-mode-button').addEventListener('click', setIngredientMode);
