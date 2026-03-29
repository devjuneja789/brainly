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

const USER_JWT_SECRET = process.env.USER_JWT_SECRET as string;
connectDB();
console.log(process.env.MONGO_URL);

app.use((req, res, next) => {
    console.log('Time: ', new Date().toLocaleString(), ' Method: ', req.method);
    next();
});

app.post("/api/v1/signup", async function (req, res) {

    const requireBody = z.object({   // input validation
        username: z.string().min(3).max(10),
        password: z.string().regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)
    })
    const safeParse = requireBody.safeParse(req.body);

    if (!safeParse.success) {
        res.json({
            message: "Incorrect Format",
            error: safeParse.error
        })
        return // return to stop the function
    }
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 5);
    console.log(hashedPassword);
    await UsersModel.create({
        username: username,
        password: hashedPassword
    })
    res.json({
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
    const { type, link, title, tags } = req.body;

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
        type,
        link,
        title,
        tags,
        userId: user._id
    });

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

    const result = await ContentModel.deleteOne({
        userId: req.userId
    });

    if (result.deletedCount === 0) {
        return res.status(404).json({
            message: "No content found for this user"
        });
    }

    res.status(200).json({
        message: "One content deleted successfully"
    });
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