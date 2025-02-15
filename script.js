
let cocktails = []
let cocktailOfTheDay = undefined;
let revealedIngredients = undefined;

function loadCocktails() {
    fetch('cocktails.json')
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
    const rand = Math.floor(Math.random() * cocktails.length)
    return cocktails[rand]
}


// Initialize the game
function initGame() {
    document.getElementById('guess-input').disabled = false;
    document.getElementById('message').textContent = '';
    document.getElementById('drink-name').textContent = '';
    cocktailOfTheDay = selectRandomCocktail();
    revealedIngredients = 1
    updateHints();
}

function updateHints() {
    const hintsDiv = document.getElementById('hints');
    hintsDiv.innerHTML = ''; // Clear previous hints

    const serveEl = document.createElement('div');
    serveEl.id = 'serve-text'
    serveEl.textContent = `Served in: ${cocktailOfTheDay.glass}`
    hintsDiv.appendChild(serveEl);

    // Display the ingredients up to the current revealed count
    cocktailOfTheDay.ingredients.slice(0, revealedIngredients).forEach(ingredient => {
        const ingredientEl = document.createElement('div');
        ingredientEl.textContent = `${ingredient.quantity} of ${ingredient.name}`;
        hintsDiv.appendChild(ingredientEl);
    });
}

function guessDrink() {
    const guessInput = document.getElementById('guess-input');
    const guess = guessInput.value.trim().toLowerCase();
    const messageDiv = document.getElementById('message');

    if (!guess) return;

    if (guess === cocktailOfTheDay.name.toLowerCase()) {
        messageDiv.textContent = "Congratulations! You guessed correctly.";
        giveUp();
        // Optionally disable input or add a replay option here
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

    // Clear the input field for the next guess
    guessInput.value = "";
}

function giveUp() {
    document.getElementById('guess-input').disabled = true;
    document.getElementById('drink-name').textContent = cocktailOfTheDay.name;
    revealedIngredients = cocktailOfTheDay.ingredients.length;
    updateHints();
}

document.getElementById('submit-guess').addEventListener('click', guessDrink);
document.getElementById('guess-input').addEventListener('keyup', (event) => {
    event.preventDefault();
    if (event.key == 'Enter') {
        document.getElementById('submit-guess').click();

    }
})

document.getElementById('give-up-button').addEventListener('click', giveUp);
document.getElementById('refresh-game').addEventListener('click', initGame);

