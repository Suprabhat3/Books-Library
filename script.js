const API_URL = 'https://api.freeapi.app/api/v1/public/books';
const booksContainer = document.getElementById('booksContainer');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const sortSelect = document.getElementById('sortSelect');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const gridViewButton = document.getElementById('gridView');
const listViewButton = document.getElementById('listView');

let currentPage = 1;
let currentQuery = 'javascript'; // Default search term
let currentSort = 'title_asc';
let isLoading = false;
let hasMore = true;
let booksData = []; // Store books globally

// View toggle functions
function switchView(viewType) {
    booksContainer.className = `books-${viewType}`;
    document.querySelectorAll('.view-toggle button').forEach(btn => 
        btn.classList.toggle('active', btn.id === `${viewType}View`));
}

// Sorting functions
function sortBooks(books) {
    return books.sort((a, b) => {
        switch(currentSort) {
            case 'title_asc': 
                return a.title.localeCompare(b.title);
            case 'title_desc': 
                return b.title.localeCompare(a.title);
            case 'date_asc':
                return new Date(a.publishedDate || '1970-01-01') - new Date(b.publishedDate || '1970-01-01');
            case 'date_desc':
                return new Date(b.publishedDate || '1970-01-01') - new Date(a.publishedDate || '1970-01-01');
            default: return 0;
        }
    });
}


// Fetch books from API
async function fetchBooks(query = '', page = 1) {
    if (isLoading || !hasMore) return;

    isLoading = true;
    loading.style.display = 'block';
    errorMessage.textContent = '';

    try {
        const response = await fetch(`${API_URL}?page=${page}&query=${currentQuery}`);
        const data = await response.json();

        if (!data?.data?.data || !Array.isArray(data.data.data) || data.data.data.length === 0) {
            showError('No books found');
            hasMore = false;
            return;
        }

            booksData = data.data.data.map(book => ({
            id: book.id,
            title: book.volumeInfo?.title || 'Unknown Title',
            authors: book.volumeInfo?.authors?.join(', ') || 'Unknown Author',
            publishedDate: book.volumeInfo?.publishedDate || 'Unknown Date',
            coverUrl: book.volumeInfo?.imageLinks?.thumbnail || 'https://via.placeholder.com/150x200?text=No+Cover',
            infoLink: book.selfLink || '#'
        }));

        displayBooks(booksData);
        hasMore = data.data.nextPage; // Use API response to determine if more pages exist
        currentPage = page;
    } catch (error) {
        showError('Failed to fetch books');
    } finally {
        isLoading = false;
        loading.style.display = 'none';
    }
}


// display books
function displayBooks(books) {
    books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        bookCard.dataset.id = book.id;
        
        bookCard.innerHTML = `
            <img src="${book.coverUrl}" class="book-cover" alt="${book.title}">
            <div class="book-details">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${book.authors}</p>
                <p>Published: ${book.publishedDate}</p>
            </div>
        `;
     
        if (book.infoLink!== '#') {
            bookCard.addEventListener('click', () => {
                window.open( `https://www.google.com/search?q=${encodeURIComponent(book.title)}`
                , '_blank');
            });
        }

        booksContainer.appendChild(bookCard);
    });
}


// Error handling
function showError(message) {
    errorMessage.textContent = message;
    booksContainer.innerHTML = '';
}

// Event Listeners
searchButton.addEventListener('click', () => {
    currentQuery = searchInput.value.trim();
    if (!currentQuery) return; // Prevent empty search
    currentPage = 1;
    booksContainer.innerHTML = ''; // Clear previous results
    hasMore = true;
    fetchBooks(currentQuery);
});


searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        currentQuery = searchInput.value.trim();
        currentPage = 1;
        booksContainer.innerHTML = ''; // Clear previous results
        hasMore = true;
        fetchBooks(currentQuery);
    }
});

sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    booksContainer.innerHTML = '';
    const sortedBooks = sortBooks([...booksData]);
    console.log("Sorted Books:", sortedBooks); // Debugging log
    
    displayBooks(sortedBooks);
});

window.addEventListener('scroll', () => {
    const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 500 && !isLoading && hasMore) {
        fetchBooks(currentQuery, currentPage + 1);
    }
});

// View toggle event listeners
gridViewButton.addEventListener('click', () => switchView('grid'));
listViewButton.addEventListener('click', () => switchView('list'));

// Initial setup
switchView('grid');
fetchBooks(currentQuery); // Initial search for "javascript"
