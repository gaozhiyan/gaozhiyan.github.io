const csvFilePath = 'type2.csv';
let currentQuestionIndex = 0; // Tracks the current question index
let questionsData = []; // Will hold the fetched questions data
let userAnswers = [];  // Array to store user answers
const BASE_AUDIO_PATH = "type2/"

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the quiz
    fetchAndCreateQuestions();

    // Event listeners for navigation buttons
    document.getElementById('prev-button').addEventListener('click', function() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion(currentQuestionIndex);
        }
    });

    document.getElementById('next-button').addEventListener('click', validateAndProceed);

    document.getElementById('submit-button').addEventListener('click', validateAndProceed);
});


function shuffleArray(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function parseCSVToJSON(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
        const data = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!data) return null;  // Skip empty lines

        // Remove quotes and unnecessary whitespace from each field
        const cleanedData = data.map(field => field.replace(/^"|"$/g, '').trim());
        const [answer, audio, id, ...options] = cleanedData;
        const text = cleanedData[cleanedData.length - 1];

        return {
            answer: answer,
            audio: audio,
            id: id,
            options: options.slice(0, 4),  // Assumes there are 4 options per question
            text: text
        };
    }).filter(question => question);  // Filter out null items
}

function validateAndProceed() {
    const currentChoices = document.querySelectorAll(`input[name="question_${currentQuestionIndex}"]:checked`);

    // Check if an option is selected for the current question
    if (currentChoices.length === 0) {
        alert('Please select an option before moving on.');
        return;
    }

    // Save the selected answer for the current question.
    userAnswers[currentQuestionIndex] = currentChoices[0].value;

    // If it passes validation, move to the next question or process the final submission
    if (currentQuestionIndex < questionsData.length - 1) {
        // Go to the next question
        currentQuestionIndex++;
        displayQuestion(currentQuestionIndex);  // This function should show the next question
    } else {
        // This is the last question, submit all answers
        submitAnswers();
    }
}

function updateButtonVisibility(index) {
    const totalQuestions = questionsData.length;
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const submitButton = document.getElementById('submit-button');

    // Update visibility of the 'Previous' button
    if (index > 0) {
        prevButton.style.display = 'inline-block';
    } else {
        // Hide if it is the first question
        prevButton.style.display = 'none';
    }

    // Update visibility of the 'Next' button
    if (index < totalQuestions - 1) {
        nextButton.style.display = 'inline-block';
        submitButton.style.display = 'none'; // Hide submit button for questions before the last one
    } else {
        nextButton.style.display = 'none'; // Hide on the last question
        submitButton.style.display = 'inline-block'; // Show submit button on the last question
    }
}

function updateProgressBar(currentIndex, totalQuestions) {
    const progressPercentage = (currentIndex / (totalQuestions - 1)) * 100;
    document.getElementById('progress-bar').style.width = progressPercentage + '%';
}


async function fetchAndCreateQuestions() {
    try {
        const response = await fetch(csvFilePath);

        const csvText = await response.text();
        questionsData = parseCSVToJSON(csvText);
        userAnswers = new Array(questionsData.length).fill(null); // Initialize userAnswers with null
        //questionsData = await response.json();

        //userAnswers = questionsData.map(() => null);

        // Create HTML for each question
        questionsData.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.classList.add('question-container');
            questionDiv.id = 'question-' + index;

            // Question text and speaker icon
            const questionTextDiv = document.createElement('div');
            questionTextDiv.classList.add('question-text-audio');

            const textElement = document.createElement('span');
            textElement.classList.add('question-text');
            textElement.textContent = question.text;
            questionTextDiv.appendChild(textElement);

            // Speaker icon using Font Awesome
            const speakerIcon = document.createElement('i');
            speakerIcon.classList.add('fas', 'fa-volume-up', 'speaker-icon');
            speakerIcon.setAttribute('aria-hidden', 'true');

            // Hidden audio element
            const audioPlayer = document.createElement('audio');
            audioPlayer.src = BASE_AUDIO_PATH + question.audio;
            speakerIcon.addEventListener('click', () => {
                audioPlayer.play();
            });

            questionTextDiv.appendChild(speakerIcon);
            questionDiv.appendChild(questionTextDiv);
            questionDiv.appendChild(audioPlayer);

            // Options
            const optionsContainer = document.createElement('div');
            optionsContainer.classList.add('options-container');

            const shuffledOptions = shuffleArray(question.options);


            shuffledOptions.forEach((option, optionIndex) => {
                const optionID = `question${index}_option${optionIndex}`;
                const radioInput = document.createElement('input');
                radioInput.type = 'radio';
                radioInput.id = optionID;
                radioInput.name = `question_${index}`;
                radioInput.value = option;

                const label = document.createElement('label');
                label.setAttribute('for', optionID);
                label.textContent = option; // Adding "A, B, C, D" before options

                optionsContainer.appendChild(radioInput);
                optionsContainer.appendChild(label);

                radioInput.addEventListener('change', (event) => {
                    userAnswers[index] = event.target.value;
                });
            });

            questionDiv.appendChild(optionsContainer);

            // Append question to the form container
            document.getElementById('question-container').appendChild(questionDiv);
        });

        // Initially display the first question
        displayQuestion(currentQuestionIndex);
    } catch (error) {
        console.error('Error fetching or processing JSON data:', error);
    }
}

function displayQuestion(index) {


    // Hide all question containers
    const allQuestions = document.querySelectorAll('.question-container');
    allQuestions.forEach(question => question.style.display = 'none');

    // Show the current question container
    const currentQuestion = document.getElementById('question-' + index);
    currentQuestion.style.display = 'block';

    // Pre-select the previously chosen answer if available
    if (userAnswers[index] !== null) {
        const previouslySelectedAnswer = document.querySelector(`input[name="question_${index}"][value="${userAnswers[index]}"]`);
        if (previouslySelectedAnswer) {
            previouslySelectedAnswer.checked = true;
        }
    }
    updateProgressBar(index, questionsData.length);

    // Update navigation button visibility
    updateButtonVisibility(index);
}


function displayScore(score, totalQuestions) {
    // Hide the questionnaire
    document.querySelector('.survey-container').style.display = 'none';
    
    // Create a div to show the score
    const scoreDiv = document.createElement('div');
    scoreDiv.classList.add('score-display');
    scoreDiv.innerHTML = `<h1>得分: ${score} / ${totalQuestions}</h1>`; // Customize this message as desired
    
    // Append score div to the body or a specific container
    document.body.appendChild(scoreDiv);
}


async function submitAnswers() {
      const answersData = {
        answers: questionsData.map((question, index) => {
            return {
                id: question.id,
                answer: userAnswers[index] || ""
            };
        })
    };

    let score = 0; // Initialize score
    
    // Calculate score by comparing submitted answers to the correct ones
    for (let i = 0; i < questionsData.length; i++) {
        if (userAnswers[i] === questionsData[i].answer) {
            score++;
        }
    }
    
    // Create a score display
    const scorePercentage = (score / questionsData.length) * 100;
    
    // Now, instead of just logging answers, we can show the score
    console.log(`Final Score: ${score} out of ${questionsData.length}, which is ${scorePercentage.toFixed(2)}%`);
    
    // Call a function to display the score to the user
    displayScore(score, questionsData.length);


    console.log(answersData);

    try {
        const response = await fetch('save_data.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(answersData)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const responseData = await response.json();
        console.log(responseData);
        alert('Thank you for submitting your answers!');
    } catch (error) {
        console.error('Error submitting answers:', error);
        alert('There was a problem submitting your answers. Please try again.');
    }
}