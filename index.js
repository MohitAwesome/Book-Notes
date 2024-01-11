import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

// Initialize Express
const app = express();
const port = 3000;
app.set('view engine', 'ejs');

// Initialize PostgreSQL client
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "books",
    password: "Mohit2003",
    port: 5432,
})

// Connect to the database
db.connect();

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Array to store books data
let books = [];

// Route to render the home page
app.get("/", async (req, res) => {
    try {
        // Fetch all books from the database and store them in the 'books' array
        const result = await db.query("SELECT * FROM books ORDER BY id ASC");
        books = result.rows;

        // Render the home page with the list of books
        res.render("index.ejs", {
            bookItems: books,
        });
    } catch (err) {
        console.log(err);
        
    }
});

// Route to handle adding a new book
app.post("/add", async (req, res) => {
    const { newTitle, newIsbn, newDescription, newRating } = req.body;

    // Validate input data
    if (!newTitle) {
        return res.status(400).send("Title is required.");
    }
    const parsedRating = parseFloat(newRating);
    if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
        return res.status(400).send("Rating must be a number between 0 and 5.");
    }

    try {
        // Insert the new book into the database
        await db.query("INSERT INTO books(title,isbn,description,rating) VALUES ($1,$2,$3,$4)", [newTitle, newIsbn, newDescription, newRating]);
        res.redirect("/");
    } catch (err) {
        console.log(err);
        res.status(500).send("The book already exists. Update/Edit option can be utilized.");
    }
});

// Routing: The code defines a route handler for the HTTP GET method at the "/edit" endpoint using app.get(). This endpoint is typically used to display a form for editing a book.

// Request Object: req is the request object that contains information about the HTTP request. req.query.isbn extracts the value of the "isbn" parameter from the query string of the URL.

// Database Query: The code uses the extracted ISBN to query the database for the book with that ISBN. It uses the db.query method, which is likely an abstraction for interacting with a PostgreSQL database. The query is a SELECT statement that retrieves all columns (*) from the "books" table where the ISBN matches the provided value.

// Rendering the Edit Form: If the database query is successful, the code retrieves the first result row (result.rows[0]) and assigns it to the variable bookToEdit. Then, it renders an EJS template named "edit.ejs" and passes the book data as an object { bookToEdit }. This allows the template to pre-fill the form fields with the existing book data.

// Error Handling: If an error occurs during the database query or rendering process, the code logs the error to the console (console.error(err)) and sends a 500 Internal Server Error response to the client.

// Route to render the edit form for a selected book
app.get("/edit", async (req, res) => {
    const isbnToEdit = req.query.isbn;

    try {
        // Fetch the book to edit from the database
        const result = await db.query("SELECT * FROM books WHERE isbn = $1", [isbnToEdit]);
        const bookToEdit = result.rows[0];

        // Render the edit form with the existing book data
        res.render("edit.ejs", { bookToEdit });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

// Route to handle updating a book's information
app.post("/update", async (req, res) => {
    const { updatedTitle, updatedIsbn, updatedDescription, updatedRating } = req.body;

    // Validate input data
    if (!updatedTitle) {
        return res.status(400).send("Title is required.");
    }
    
    const parsedRating = parseFloat(updatedRating);
    if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
        return res.status(400).send("Rating must be a number between 0 and 5.");
    }

    try {
        // Update the book information in the database
        await db.query("UPDATE books SET title = $1, description = $2, rating = $3 WHERE isbn = $4",
            [updatedTitle, updatedDescription, updatedRating, updatedIsbn]);

        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

// Route to handle deleting a book
app.post("/delete", async (req, res) => {
    const isbnToDelete = req.body.isbn;

    try {
        // Delete the book from the database
        await db.query("DELETE FROM books WHERE isbn = $1", [isbnToDelete]);
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
