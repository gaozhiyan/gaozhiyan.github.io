document.addEventListener("DOMContentLoaded", function() {
    const categories = ["All", "Psychology", "Philosophy", "Religion", "Business","Economics","Mathematics", "Self-help", "Social aspects", "Spiritual life", "Science", "Health", "Parenting", "Education", "Linguistics", "Fiction", "Memoir", "Humor"];
    const categoryContainer = document.getElementById("category-buttons");
    const booksGrid = document.getElementById("books-grid");
    const searchInput = document.getElementById("search");
    const searchResults = document.getElementById("search-results");
    const numBooks = document.getElementById("num-books");
    const numPublishers = document.getElementById("num-publishers");
    const categoryChartElement = document.getElementById("categoryChart");

    let books = [];

    // Fetch data from JSON file
    fetch('books_with_douban_urls.json')
        .then(response => response.json())
        .then(data => {
            books = data;
            initializePage();
        })
        .catch(error => console.error('Error fetching data:', error));

    // Function to initialize the page
    function initializePage() {
        renderCategoryButtons();
        renderBooks(books);
        displayLibraryStatistics();
        renderCategoryChart();
    }

    // Function to render category buttons
    function renderCategoryButtons() {
        categories.forEach(category => {
            const button = document.createElement("button");
            button.className = "category-btn";
            button.textContent = category;
            button.dataset.category = category;
            button.addEventListener("click", function() {
                filterBooks(category);
            });
            categoryContainer.appendChild(button);
        });
    }

    // Function to check if an image file exists
    function checkImageExists(url, callback) {
        const img = new Image();
        img.onload = () => callback(true);
        img.onerror = () => callback(false);
        img.src = url;
    }

    // Function to get the cover image URL
    function getCoverImageUrl(isbn, callback) {
        const imgUrl = `img/${isbn}.jpg`;
        checkImageExists(imgUrl, (exists) => {
            if (exists) {
                callback(imgUrl);
            } else {
                callback('default-book-cover.jpg');
            }
        });
    }

    // Function to render books
    function renderBooks(filteredBooks) {
        booksGrid.innerHTML = "";
        filteredBooks.slice(0, 200).forEach(book => {
            const bookDiv = document.createElement("div");
            bookDiv.className = "book";
            bookDiv.dataset.category = book.Category;
            getCoverImageUrl(book.ISBN, (coverImageUrl) => {
                bookDiv.innerHTML = `
                    <a href="${book.douban_url}" target="_blank">
                        <img src="${coverImageUrl}" alt="${book.藏书名称}">
                    </a>
                    <h3>${book.藏书名称}</h3>
                    <p>${book.作者}</p>
                    <p>${book.出版社}</p>
                    <p>${book.ISBN}</p>
                `;
                booksGrid.appendChild(bookDiv);
            });
        });
    }

    // Function to filter books by category
    function filterBooks(category) {
        const filteredBooks = category === "All" ? books : books.filter(book => book.Category === category);
        renderBooks(filteredBooks);
    }

    // Function to search books
    function searchBooks(query) {
        const filteredBooks = books.filter(book => 
            book.藏书名称.includes(query) ||
            book.作者.includes(query) ||
            book.出版社.includes(query) ||
            book.ISBN.includes(query)
        );
        renderBooks(filteredBooks);
    }

    // Event listener for search input
    searchInput.addEventListener("input", function() {
        const query = searchInput.value.trim();
        if (query) {
            searchBooks(query);
            searchResults.style.display = "block";
        } else {
            searchResults.style.display = "none";
            renderBooks(books);
        }
    });

    // Function to calculate and display library statistics
    function displayLibraryStatistics() {
        const uniquePublishers = new Set(books.map(book => book.出版社)).size;
        numBooks.textContent = books.length;
        numPublishers.textContent = uniquePublishers;
    }

    // Function to render category chart using ECharts
    function renderCategoryChart() {
        const categoryCounts = categories.map(category => ({
            category,
            count: books.filter(book => book.Category === category).length
        })).filter(item => item.count > 0);

        // Sort the categories by count in descending order
        categoryCounts.sort((a, b) => b.count - a.count);

        const sortedCategories = categoryCounts.map(item => item.category);
        const sortedCounts = categoryCounts.map(item => item.count);

        const chart = echarts.init(categoryChartElement);
        const option = {
            title: {
                text: 'Number of Books by Category'
            },
            tooltip: {},
            xAxis: {
                type: 'category',
                data: sortedCategories
            },
            yAxis: {
                type: 'value'
            },
            series: [{
                name: 'Books',
                type: 'bar',
                data: sortedCounts,
                itemStyle: {
                    color: '#007BFF'
                }
            }]
        };
        chart.setOption(option);
    }
});
