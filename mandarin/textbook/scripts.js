document.addEventListener('DOMContentLoaded', function () {
    const lessonsList = document.getElementById('lessons-list');
    const vocabularyList = document.getElementById('vocabulary-list');
    const vocabularyItems = document.getElementById('vocabulary-items');

    // Populate lessons list
    if (lessonsList) {
        const lessons = 32;
        for (let i = 1; i <= lessons; i++) {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `lesson.html?lesson=${i}`;
            link.textContent = `Lesson ${i}`;
            listItem.appendChild(link);
            lessonsList.appendChild(listItem);
        }
    }

    // Populate vocabulary list
    if (vocabularyList) {
        const lessons = 32;
        for (let i = 1; i <= lessons; i++) {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `vocabulary-lesson.html?lesson=${i}`;
            link.textContent = `Vocabulary Lesson ${i}`;
            listItem.appendChild(link);
            vocabularyList.appendChild(listItem);
        }
    }

    // Populate vocabulary items with audio
    if (vocabularyItems) {
        const urlParams = new URLSearchParams(window.location.search);
        const lessonNumber = urlParams.get('lesson');

        if (lessonNumber) {
            document.getElementById('vocabulary-lesson-title').textContent = `Vocabulary Lesson ${lessonNumber}`;

            // Create a single audio player for the vocabulary audio file
            const audio = document.createElement('audio');
            audio.controls = true;
            const source = document.createElement('source');
            source.src = `audios/vocab_lesson${lessonNumber}.mp3`;
            source.type = 'audio/mpeg';
            audio.appendChild(source);
            vocabularyItems.appendChild(audio);
        }
    }

    // Populate lesson page with audio
    const lessonAudio = document.getElementById('lesson-audio');
    if (lessonAudio) {
        const urlParams = new URLSearchParams(window.location.search);
        const lessonNumber = urlParams.get('lesson');

        if (lessonNumber) {
            document.getElementById('lesson-title').textContent = `Lesson ${lessonNumber}`;
            lessonAudio.querySelector('source').src = `audios/lesson${lessonNumber}.mp3`;
            lessonAudio.load();
        }
    }
});
