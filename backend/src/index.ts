import 'dotenv/config';
import jwt from "jsonwebtoken";
import express = require('express');
import connectDB from "./db";
import z = require("zod");
import { UsersModel } from './model/User';
import bcrypt from "bcryptjs";
const app = express();
import { ContentModel } from "./model/Content";
app.use(express.json());
import { authMiddleware } from './middlewares/authMiddleware';
import { LinkModel } from "./model/Link"
import cors from "cors";
import { AiServiceError, answerFromContext } from './services/ai';
import { deleteContentEmbeddings, initVectorStore, searchUserKnowledge, upsertContentEmbeddings } from './services/vectorStore';
app.use(cors());

const USER_JWT_SECRET = process.env.USER_JWT_SECRET as string;
connectDB();
initVectorStore().catch((error) => {
    console.error("Vector store setup failed:", error.message);
});
console.log(process.env.MONGO_URL);

app.use((req, res, next) => {
    console.log('Time: ', new Date().toLocaleString(), ' Method: ', req.method);
    next();
});

app.post("/api/v1/signup", async function (req, res) {

    const requireBody = z.object({   // input validation
        username: z.string().min(3).max(30),
        password: z.string().min(8)
    })
    const safeParse = requireBody.safeParse(req.body);

    if (!safeParse.success) {
        res.status(400).json({
            message: "Username must be 3-30 characters and password must be at least 8 characters.",
            error: safeParse.error
        })
        return // return to stop the function
    }
    const { username, password } = safeParse.data;
    const existingUser = await UsersModel.findOne({ username });

    if (existingUser) {
        res.status(409).json({
            message: "Username already exists"
        });
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 5);
    await UsersModel.create({
        username: username,
        password: hashedPassword
    })
    res.status(201).json({
        message: "You are signed up as user"
    })

})


app.post("/api/v1/signin", async function (req, res) {
    const { username, password } = req.body;


    const user = await UsersModel.findOne({
        username: username
    })
    if (!user) {
        return res.status(403).json({ message: "Incorrect credentials" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);


    if (passwordMatch) {
        const token = jwt.sign({
            id: user._id.toString()
        }, USER_JWT_SECRET);
        res.json({
            token: token
        })
    } else {
        res.status(403).send({
            message: "Incorrect credentials"
        })
    }

});


app.post("/api/v1/content", authMiddleware, async function (req, res) {
    const requireBody = z.object({
        contentType: z.enum(["twitter", "youtube", "note", "link"]),
        link: z.string().url().optional().or(z.literal("")),
        title: z.string().min(1),
        body: z.string().optional(),
        tags: z.array(z.string()).optional()
    });
    const safeParse = requireBody.safeParse(req.body);

    if (!safeParse.success) {
        return res.status(400).json({
            message: "Incorrect format",
            error: safeParse.error
        });
    }

    const { contentType, link, title, body, tags } = safeParse.data;

    if (!req.userId) {
        return res.status(403).json({
            message: "Unauthorized"
        });
    }

    const user = await UsersModel.findById(req.userId);

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    const content = await ContentModel.create({
        contentType,
        link,
        body,
        title,
        tags,
        userId: user._id
    });

    try {
        await upsertContentEmbeddings(content);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown indexing error";
        console.warn(`Content saved, but AI indexing was skipped: ${message}`);
    }

    res.status(201).json({
        message: "Content added successfully",
        content
    });
});



app.get("/api/v1/content", authMiddleware, async function (req, res) {
    if (!req.userId) {
        return res.status(403).json({
            message: "Unauthorized"
        });
    }

    const userId = req.userId;
    const content = await ContentModel.find({
        userId
    });
    res.status(201).json({
        message: "Content displayed successfully",
        content
    })

});

app.delete("/api/v1/content", authMiddleware, async function (req, res) {
    const contentId = req.body.contentId;
    const deleteQuery = contentId ? { _id: contentId, userId: req.userId } : { userId: req.userId };

    const deletedContent = await ContentModel.findOne(deleteQuery);
    const result = await ContentModel.deleteOne(deleteQuery);

    if (result.deletedCount === 0) {
        return res.status(404).json({
            message: "No content found for this user"
        });
    }

    if (deletedContent) {
        try {
            await deleteContentEmbeddings(deletedContent._id.toString());
        } catch (error) {
            console.error("Content embedding delete failed:", error);
        }
    }

    res.status(200).json({
        message: "One content deleted successfully"
    });
});

app.post("/api/v1/content/:id/reindex", authMiddleware, async function (req, res) {
    const content = await ContentModel.findOne({
        _id: req.params.id,
        userId: req.userId
    });

    if (!content) {
        return res.status(404).json({
            message: "Content not found"
        });
    }

    try {
        await upsertContentEmbeddings(content);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to index content";
        return res.status(error instanceof AiServiceError ? error.statusCode : 500).json({
            message
        });
    }

    res.status(200).json({
        message: "Content indexed successfully"
    });
});

app.post("/api/v1/brain/chat", authMiddleware, async function (req, res) {
    const requireBody = z.object({
        question: z.string().min(1).max(1000)
    });
    const safeParse = requireBody.safeParse(req.body);

    if (!safeParse.success) {
        return res.status(400).json({
            message: "Question is required",
            error: safeParse.error
        });
    }

    if (!req.userId) {
        return res.status(403).json({
            message: "Unauthorized"
        });
    }

    try {
        const matches = await searchUserKnowledge(req.userId, safeParse.data.question);
        const answer = await answerFromContext(safeParse.data.question, matches);

        res.status(200).json({
            answer,
            sources: matches.map(({ title, link, contentId, similarity }) => ({
                title,
                link,
                contentId,
                similarity
            }))
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to answer right now";
        const statusCode = error instanceof AiServiceError ? error.statusCode : 500;

        res.status(statusCode).json({
            message
        });
    }
});

app.post("/api/v1/brain/share", authMiddleware, async function (req, res) {
    function random(len: number) {
        let options = "abcdefghijklmnopqrstuvwxyz1234567890";
        let ans = "";

        for (let i = 0; i < len; i++) {
            ans += options[Math.floor(Math.random() * options.length)];
        }

        return ans;
    }
    const { share } = req.body;
    if (share) {
        const existingLink = await LinkModel.findOne({
            userId: req.userId
        });

        if (existingLink) {
            return res.status(200).json({
                link: `/api/v1/brain/${existingLink.hash}`
            });
        }

        const hash = random(10);

        await LinkModel.create({
            userId: req.userId,
            hash: hash
        });

        return res.status(200).json({
            link: `/api/v1/brain/${hash}`
        });
    }
    else {
        // Remove the shareable link if share is false.
        await LinkModel.deleteOne({ userId: req.userId });
        res.json({ message: "Removed link" }); // Send success response.
    }
});

app.get("/api/v1/brain/:shareLink", async function (req, res) {

    const link = req.params.shareLink;

    const existingLink = await LinkModel.findOne({
        hash: link
    });
    const userId = existingLink!.userId;
    const content = await ContentModel.find({
        userId
    });
    const user = await UsersModel.findById(userId);
    const username = user!.username;
    res.status(200).json({
        message: "Content displayed successfully",
        username,
        content

    })


});


app.listen(3000, () => console.log("Server running on port 3000"));
