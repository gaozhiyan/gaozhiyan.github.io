document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search');
    const booksGrid = document.getElementById('books-grid');
    const searchResults = document.getElementById('search-results');
    const numBooksElem = document.getElementById('num-books');
    const numPublishersElem = document.getElementById('num-publishers');
    const booksChart = document.getElementById('booksChart').getContext('2d');

    // Function to fetch book cover
    const fetchBookCover = (isbn) => {
        if (!isbn) {
            return '';
        }
        return `https://covers.openlibrary.org/b/isbn/${isbn}-S.jpg`;
    };

    // Function to display random books on the front page
    const displayBooks = async (booksToDisplay, gridElement) => {
        gridElement.innerHTML = '';
        for (const book of booksToDisplay) {
            const coverImage = fetchBookCover(book.ISBN);
            const bookDiv = document.createElement('div');
            bookDiv.className = 'book';
            bookDiv.innerHTML = `
                <img src="${coverImage}" alt="${book['藏书名称']}">
                <h3>${book['藏书名称']}</h3>
                <p>${book['作者']}</p>
                <p>${book['出版社']}</p>
            `;
            gridElement.appendChild(bookDiv);
        }
    };

    // Function to display search results
    const displaySearchResults = (books) => {
        if (books.length === 0) {
            searchResults.style.display = 'none';
            return;
        }

        searchResults.style.display = 'block';
        searchResults.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Cover</th>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Publisher</th>
                        <th>ISBN</th>
                    </tr>
                </thead>
                <tbody>
                    ${books.map(book => `
                        <tr>
                            <td><img src="${fetchBookCover(book.ISBN)}" alt="${book['藏书名称']}" style="max-width: 50px;"></td>
                            <td>${book['藏书名称']}</td>
                            <td>${book['作者']}</td>
                            <td>${book['出版社']}</td>
                            <td>${book['ISBN']}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    };

    // Function to update statistics
    const updateStatistics = (books) => {
        const numBooks = books.length;
        const publishers = new Set(books.map(book => book['category']));

        numBooksElem.textContent = numBooks;
        numPublishersElem.textContent = publishers.size;

        // Create chart data
        const publisherCounts = {};
        publishers.forEach(publisher => publisherCounts[publisher] = 0);
        books.forEach(book => {
            if (publisherCounts[book['category']] !== undefined) {
                publisherCounts[book['category']]++;
            }
        });

        // Update chart
        new Chart(booksChart, {
            type: 'bar',
            data: {
                labels: Object.keys(publisherCounts),
                datasets: [{
                    label: '# of Books',
                    data: Object.values(publisherCounts),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    };

    // Fetch book data from the JSON file
    fetch('books_updated.json')
        .then(response => response.json())
        .then(async (books) => {
            // Display 10 random books
            const shuffledBooks = books.sort(() => 0.5 - Math.random());
            const randomBooks = shuffledBooks.slice(0, 10);
            await displayBooks(randomBooks, booksGrid);

            // Update statistics
            updateStatistics(books);

            // Search functionality
            searchInput.addEventListener('input', () => {
                const query = searchInput.value.toLowerCase();
                if (!query) {
                    searchResults.style.display = 'none';
                    return;
                }

                const filteredBooks = books.filter(book =>
                    book['藏书名称'].toLowerCase().includes(query) ||
                    book['作者'].toLowerCase().includes(query) ||
                    String(book['ISBN']).toLowerCase().includes(query) ||
                    book['出版社'].toLowerCase().includes(query)
                );

                displaySearchResults(filteredBooks);
            });
        })
        .catch(error => console.error('Error fetching book data:', error));
});
