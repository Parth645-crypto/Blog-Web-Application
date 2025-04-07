import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;
var userName = "";
var authorName = "";
var blogName = "";
var password = "";

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.get("/", (req, res) => {
    res.render("index.ejs");
});

app.get("/signUp", (req, res) => {
    res.render("signUp.ejs");
})

app.post("/signUp", (req, res) => {
    userName = req.body["userName"];
    const pass = req.body["pass"];
    fs.readFile("./public/UserName.txt", "utf-8", (err, data) => {
        if(err) { throw err}
        else {
            const users = data.split("\n").map(user => user.trim());
            if(users.includes(userName)) {
               return res.redirect("/homepage");
            }
            else {
                fs.appendFile("./public/UserName.txt", `${userName}\n` , (err)=> {
                    if(err) throw err;
                });
                fs.appendFile("./public/Password.txt", `${pass}\n`, (err) => {
                    if(err) {throw err};
                });
                return res.redirect("/homepage");
            }
        }
    });
});


/*app.get("/logIn", (req, res)=> {
    res.render("logIn.ejs");
})*/

app.post("/logIn", (req, res) => {
    userName = req.body["userName"];
    password = req.body["pass"];
    fs.readFile("./public/UserName.txt", "utf-8", (err, data) => {
        if(err) { throw err}
        else {
            const users = data.split("\n").map(user => user.trim());
            if(users.includes(userName)) {
                fs.readFile("./public/Password.txt", 'utf-8', (err, data)=> {
                    if(err) throw err;
                    else {
                        const pw = data.split('\n').map(pw => pw.trim());
                        if(pw.includes(password)) {
                            return res.redirect("/homepage");
                        }
                        else {
                            return res.render("logIn.ejs");
                        }
                    }
                });
            }
            else {
                return res.render("logIn.ejs", {error: "Username not found"})
            }
        }
    });
});

app.get("/homepage", (req, res) => {
    res.render("homepage.ejs");
});

app.post("/homepage", (req, res)=> {
    res.redirect("/createBlog");
});

app.get("/createBlog", (req, res) => {
    res.render("createBlog.ejs");
});

app.post("/createBlog", (req, res) => {
    authorName = req.body["author"];
    blogName = req.body["blogName"];
    res.redirect("/writeBlog");
});

app.get("/writeBlog", (req, res)=> {
    res.render("writeBlog.ejs");
});

app.post("/writeBlog", (req, res)=> {
    const essay = req.body["essay"];
    const blogFileName = `${blogName}.txt`;
    const authorFolderPath = path.join(__dirname, 'blogs', authorName);
    const blogFilePath = path.join(authorFolderPath, blogFileName);

    fs.mkdir(authorFolderPath, {recursive: true}, (err) => {
        if(err) throw err;
        fs.writeFile(blogFilePath, essay, (err)=> {
            if(err) throw err;
            res.redirect("/homepage");
        });
    });
});

app.post("/blogs/:authorName/:blogName", (req, res)=> {
    const comment = req.body["comment"];
    const author = req.body["authorName"];
    const commFileName = `Comments.txt`;
    const authorFolderPath = path.join(__dirname, 'blogs', author);
    const commFilePath = path.join(authorFolderPath, commFileName);

    fs.mkdir(authorFolderPath, {recursive: true}, (err)=> {
        if(err) throw err;
        fs.appendFile(commFilePath, `${comment}\n`, (err)=> {
            if(err) throw err;
            res.redirect("/homepage");
        });
    });
});

app.get("/faqs", (req, res)=> {
    res.render("faqs.ejs");
});

app.get("/about", (req, res)=> {
    res.render("about.ejs");
});

app.get("/search", (req, res) => {
    const query = req.query["q"];
    const blogsDir = path.join(__dirname, 'blogs');
    let results = [];
    let authorsProcessed = 0;

    fs.readdir(blogsDir, (err, authors) => {
        if(err) throw err;

        if(authors.length === 0) {
            return res.render("searchResults.ejs", {results, query});
        }
        
        authors.forEach(authorName => {
            const authorDir = path.join(blogsDir, authorName);
            fs.readdir(authorDir, (err, files) => {
                if(err) throw err;

                files.forEach(blogName => {
                    if(blogName.includes(query)) {
                        const blogTitle = path.basename(blogName, path.extname(blogName));
                        results.push({authorName, blogTitle});
                        console.log(`Found blog: ${blogTitle} by ${authorName}`);
                    }
                });

                authorsProcessed++;
                if(authorsProcessed === authors.length) {
                    res.render("searchResults.ejs", {results, query});
                }
            });
        });
    });
});

app.get("/authors", (req, res) => {
    const blogsDir = path.join(__dirname, 'blogs');

    fs.readdir(blogsDir, (err, authors) => {
        if (err) {
            return res.status(500).send("Error reading authors directory");
        }

        // Render a view that lists all authors
        res.render("authors.ejs", { authors });
    });
});

app.get("/authors/:authorName", (req, res) => {
    const authorName = req.params.authorName;
    const authorFolderPath = path.join(__dirname, 'blogs', authorName);

    fs.readdir(authorFolderPath, (err, files) => {
        if (err) {
            return res.status(404).send("Author not found");
        }

        const posts = files.map(file => {
            return {
                title: path.basename(file, path.extname(file)),
                fileName: file
            };
        });

        res.render("authorPosts.ejs", { authorName, posts });
    });
});

app.get("/blogs/:authorName/:blogName", (req, res) => {
    const { authorName, blogName } = req.params;
    const blogFilePath = path.join(__dirname, "blogs", authorName, blogName);

    fs.readFile(blogFilePath, 'utf-8', (err, data) => {
        if (err) {
            return res.status(404).send("Blog not found");
        }
        const blogTitle = path.basename(blogName, path.extname(blogName));
        res.render("blogView.ejs", { content: data, blogTitle, authorName });
    });
});

app.get("/blogs/:authorName/:blogName", (req, res)=> {
    const {authorName, blogName} = req.params;
    const blogFilePath = path.join(__dirname, "blogs", authorName, blogName);
    const blogTitle = path.basename(blogName, path.extname(blogName));
    fs.readFile(blogFilePath, 'utf-8', (err, data)=> {
        if(err) {
            return res.status(404).send("Blog not found");
        }
        res.render("blogView.ejs", {content: data, blogTitle, authorName});
    });
});

app.listen(port, ()=> {
    console.log(`Listening on port ${port}`);
});