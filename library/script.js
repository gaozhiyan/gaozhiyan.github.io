document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search');
    const booksGrid = document.getElementById('books-grid');
    const categoriesList = document.getElementById('categories');

    // 读取 CSV 文件
    fetch('/mnt/data/藏书.csv')
        .then(response => response.text())
        .then(data => {
            const books = parseCSV(data);
            displayBooks(books);
            displayCategories(books);

            searchInput.addEventListener('input', function () {
                const query = searchInput.value.toLowerCase();
                const filteredBooks = books.filter(book =>
                    book['书架分类'].toLowerCase().includes(query) ||
                    book['藏书名称'].toLowerCase().includes(query) ||
                    book['作者'].toLowerCase().includes(query) ||
                    book['出版社'].toLowerCase().includes(query) ||
                    book['ISBN'].toLowerCase().includes(query)
                );
                displayBooks(filteredBooks);
            });
        });

    // 解析 CSV 数据
    function parseCSV(data) {
        const lines = data.split('\n');
        const headers = lines[0].split(',');
        const books = lines.slice(1).map(line => {
            const values = line.split(',');
            const book = {};
            headers.forEach((header, index) => {
                book[header] = values[index];
            });
            return book;
        });
        return books;
    }

    // 显示书籍数据
    function displayBooks(books) {
        booksGrid.innerHTML = '';
        books.forEach(book => {
            const bookElement = document.createElement('div');
            bookElement.classList.add('book');
            const coverImage = `http://covers.openlibrary.org/b/isbn/${book['ISBN']}-M.jpg`;

            bookElement.innerHTML = `
                <img src="${coverImage}" alt="${book['藏书名称']}">
                <h3>${book['藏书名称']}</h3>
                <p>${book['作者']}</p>
                <p>${book['出版社']}</p>
                <p>ISBN: ${book['ISBN']}</p>
            `;

            booksGrid.appendChild(bookElement);
        });
    }

    // 显示书架分类
    function displayCategories(books) {
        const categories = [...new Set(books.map(book => book['书架分类']))];
        categories.forEach(category => {
            const categoryElement = document.createElement('li');
            categoryElement.innerHTML = `<a href="#" onclick="filterByCategory('${category}')">${category}</a>`;
            categoriesList.appendChild(categoryElement);
        });
    }

    // 按分类过滤
    window.filterByCategory = function (category) {
        searchInput.value = category;
        searchInput.dispatchEvent(new Event('input'));
    };
});
